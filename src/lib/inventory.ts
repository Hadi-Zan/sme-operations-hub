import type { InventoryMovementType } from "@/lib/supabase/database.types";

export const inventoryMovementTypes = [
  "stock_in",
  "stock_out",
  "adjustment",
] as const satisfies readonly InventoryMovementType[];

export const inventoryMovementTypeLabels: Record<InventoryMovementType, string> = {
  adjustment: "Adjustment",
  stock_in: "Stock in",
  stock_out: "Stock out",
};

export type InventoryFilters = {
  category: string | null;
  historyItemId: string | null;
  query: string;
  stock: "all" | "low";
};

export type InventoryListItem = {
  category: string | null;
  currentQuantity: number;
  id: string;
  isLowStock: boolean;
  lastMovementAt: string | null;
  movementCount: number;
  name: string;
  reorderThreshold: number;
  sku: string | null;
  unitOfMeasure: string;
};

export type InventoryMovementListItem = {
  createdAt: string;
  formattedCreatedAt: string;
  id: string;
  inventoryItemId: string;
  itemName: string;
  movementType: InventoryMovementType;
  note: string | null;
  quantityChange: number;
  recordedByName: string;
  unitOfMeasure: string;
};

export type InventoryPageSummary = {
  lowStock: number;
  outOfStock: number;
  total: number;
};

export type DashboardInventoryAlert = {
  currentQuantity: number;
  id: string;
  name: string;
  reorderThreshold: number;
  unitOfMeasure: string;
};

export type DashboardInventoryData = {
  alerts: DashboardInventoryAlert[];
  lowStock: number;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function firstSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseInventoryFilters(searchParams: {
  category?: string | string[];
  history?: string | string[];
  q?: string | string[];
  stock?: string | string[];
}): InventoryFilters {
  const query = (firstSearchValue(searchParams.q) ?? "").trim().slice(0, 100);
  const rawCategory = (firstSearchValue(searchParams.category) ?? "").trim().slice(0, 80);
  const rawHistory = (firstSearchValue(searchParams.history) ?? "").trim();
  const rawStock = firstSearchValue(searchParams.stock);

  return {
    category: rawCategory || null,
    historyItemId: uuidPattern.test(rawHistory) ? rawHistory : null,
    query,
    stock: rawStock === "low" ? "low" : "all",
  };
}

export function isInventoryMovementType(value: string): value is InventoryMovementType {
  return inventoryMovementTypes.some((movementType) => movementType === value);
}

export function formatInventoryQuantity(value: number) {
  return new Intl.NumberFormat("en-SG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(value);
}

const inventoryAttentionDetailPattern =
  /^(-?\d+(?:\.\d+)?)\s+(.+?)\s+remaining;\s+reorder at\s+(-?\d+(?:\.\d+)?)\s+(.+)$/;

export function formatInventoryAttentionDetail(detail: string) {
  const match = detail.match(inventoryAttentionDetailPattern);
  if (!match) return detail;

  const [, currentQuantity, currentUnit, reorderThreshold, thresholdUnit] = match;
  const currentValue = Number(currentQuantity);
  const thresholdValue = Number(reorderThreshold);

  if (!Number.isFinite(currentValue) || !Number.isFinite(thresholdValue)) {
    return detail;
  }

  return `${formatInventoryQuantity(currentValue)} ${currentUnit} remaining; reorder at ${formatInventoryQuantity(thresholdValue)} ${thresholdUnit}`;
}

export function formatInventoryMovementTime(timestamp: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-SG", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZone,
    year: "numeric",
  }).format(new Date(timestamp));
}

export function inventoryStockLabel(item: InventoryListItem) {
  if (item.currentQuantity <= 0) return "Out of stock";
  if (item.isLowStock) return "Low stock";
  return "In stock";
}

export function inventoryStockTone(item: InventoryListItem) {
  if (item.currentQuantity <= 0) {
    return "bg-rose-50 text-rose-700 ring-rose-600/10";
  }
  if (item.isLowStock) {
    return "bg-amber-50 text-amber-800 ring-amber-600/10";
  }
  return "bg-emerald-50 text-emerald-700 ring-emerald-600/10";
}

export function movementTone(movementType: InventoryMovementType) {
  const tones: Record<InventoryMovementType, string> = {
    adjustment: "bg-amber-50 text-amber-800 ring-amber-600/10",
    stock_in: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
    stock_out: "bg-sky-50 text-sky-700 ring-sky-600/10",
  };

  return tones[movementType];
}
