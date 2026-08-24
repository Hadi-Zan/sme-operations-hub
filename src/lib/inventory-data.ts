import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  formatInventoryMovementTime,
  type DashboardInventoryData,
  type InventoryFilters,
  type InventoryListItem,
  type InventoryMovementListItem,
  type InventoryPageSummary,
} from "@/lib/inventory";

const balanceColumns =
  "id, name, sku, category, unit_of_measure, reorder_threshold, current_quantity, movement_count, last_movement_at, is_low_stock";
const movementColumns =
  "id, inventory_item_id, movement_type, quantity_change, note, recorded_by, created_at";

function mapInventoryItem(row: {
  category: string | null;
  current_quantity: number;
  id: string;
  is_low_stock: boolean;
  last_movement_at: string | null;
  movement_count: number;
  name: string;
  reorder_threshold: number;
  sku: string | null;
  unit_of_measure: string;
}): InventoryListItem {
  return {
    category: row.category,
    currentQuantity: Number(row.current_quantity),
    id: row.id,
    isLowStock: row.is_low_stock,
    lastMovementAt: row.last_movement_at,
    movementCount: Number(row.movement_count),
    name: row.name,
    reorderThreshold: Number(row.reorder_threshold),
    sku: row.sku,
    unitOfMeasure: row.unit_of_measure,
  };
}

export async function getInventoryPageData(
  workspaceId: string,
  timeZone: string,
  filters: InventoryFilters,
) {
  const supabase = await createClient();
  const [balancesResult, membersResult] = await Promise.all([
    supabase
      .from("inventory_item_balances")
      .select(balanceColumns)
      .eq("workspace_id", workspaceId)
      .order("name"),
    supabase
      .from("workspace_members")
      .select("user_id, display_name")
      .eq("workspace_id", workspaceId),
  ]);

  if (balancesResult.error || membersResult.error) {
    throw new Error("Workspace inventory could not be loaded.");
  }

  const items = balancesResult.data.map(mapInventoryItem);
  const itemById = new Map(items.map((item) => [item.id, item]));
  const selectedHistoryItem = filters.historyItemId
    ? (itemById.get(filters.historyItemId) ?? null)
    : null;
  let movementsQuery = supabase
    .from("inventory_movements")
    .select(movementColumns)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (selectedHistoryItem) {
    movementsQuery = movementsQuery.eq("inventory_item_id", selectedHistoryItem.id);
  }

  const movementsResult = await movementsQuery;
  if (movementsResult.error) {
    throw new Error("Workspace inventory movement history could not be loaded.");
  }

  const memberNames = new Map(
    membersResult.data.map((member) => [member.user_id, member.display_name]),
  );
  const normalizedQuery = filters.query.toLocaleLowerCase("en");
  const filteredItems = items.filter((item) => {
    if (filters.stock === "low" && !item.isLowStock) return false;
    if (filters.category && item.category !== filters.category) return false;
    if (!normalizedQuery) return true;

    return `${item.name}\n${item.sku ?? ""}\n${item.category ?? ""}`
      .toLocaleLowerCase("en")
      .includes(normalizedQuery);
  });
  const categories = Array.from(
    new Set(items.flatMap((item) => (item.category ? [item.category] : []))),
  ).sort((left, right) => left.localeCompare(right));
  const summary: InventoryPageSummary = {
    lowStock: items.filter((item) => item.isLowStock).length,
    outOfStock: items.filter((item) => item.currentQuantity <= 0).length,
    total: items.length,
  };
  const movements: InventoryMovementListItem[] = movementsResult.data.map((movement) => {
    const item = itemById.get(movement.inventory_item_id);

    return {
      createdAt: movement.created_at,
      formattedCreatedAt: formatInventoryMovementTime(movement.created_at, timeZone),
      id: movement.id,
      inventoryItemId: movement.inventory_item_id,
      itemName: item?.name ?? "Inventory item",
      movementType: movement.movement_type,
      note: movement.note,
      quantityChange: Number(movement.quantity_change),
      recordedByName: memberNames.get(movement.recorded_by) ?? "Workspace member",
      unitOfMeasure: item?.unitOfMeasure ?? "units",
    };
  });
  return {
    categories,
    filteredItems,
    historyItems: items.map((item) => ({ id: item.id, name: item.name })),
    movements,
    selectedHistoryItem,
    summary,
  };
}

export async function getDashboardInventoryData(
  workspaceId: string,
): Promise<DashboardInventoryData> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_item_balances")
    .select("id, name, unit_of_measure, reorder_threshold, current_quantity, is_low_stock")
    .eq("workspace_id", workspaceId);

  if (error) {
    throw new Error("Dashboard inventory could not be loaded.");
  }

  const lowStockItems = data
    .filter((item) => item.is_low_stock)
    .map((item) => ({
      currentQuantity: Number(item.current_quantity),
      id: item.id,
      name: item.name,
      reorderThreshold: Number(item.reorder_threshold),
      unitOfMeasure: item.unit_of_measure,
    }))
    .sort((left, right) => {
      const leftGap = left.currentQuantity - left.reorderThreshold;
      const rightGap = right.currentQuantity - right.reorderThreshold;
      if (leftGap !== rightGap) return leftGap - rightGap;
      return left.name.localeCompare(right.name);
    });

  return {
    alerts: lowStockItems.slice(0, 4),
    lowStock: lowStockItems.length,
  };
}
