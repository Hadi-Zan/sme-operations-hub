"use server";

import { revalidatePath } from "next/cache";
import { requireAccountContext } from "@/lib/auth";
import { isInventoryMovementType } from "@/lib/inventory";
import { createClient } from "@/lib/supabase/server";
import type { InventoryMovementType } from "@/lib/supabase/database.types";

export type InventoryActionState = {
  message: string | null;
  status: "error" | "idle" | "success";
};

type InventoryItemInput = {
  category: string | null;
  name: string;
  openingStock: number;
  reorderThreshold: number;
  sku: string | null;
  unitOfMeasure: string;
};

type InventoryMovementInput = {
  movementType: InventoryMovementType;
  note: string | null;
  quantityChange: number;
};

type InputResult<T> = { input: T; message?: never } | { input?: never; message: string };

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const unsignedDecimalPattern = /^(?:0|[1-9]\d{0,10})(?:\.\d{1,3})?$/;
const signedDecimalPattern = /^-?(?:0|[1-9]\d{0,10})(?:\.\d{1,3})?$/;

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(formData: FormData, key: string) {
  const value = textValue(formData, key);
  return value || null;
}

function parseUnsignedDecimal(value: string, allowZero: boolean) {
  if (!unsignedDecimalPattern.test(value)) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || (!allowZero && parsed <= 0)) return null;
  return parsed;
}

function parseSignedDecimal(value: string) {
  if (!signedDecimalPattern.test(value)) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed === 0) return null;
  return parsed;
}

function parseInventoryItemInput(formData: FormData): InputResult<InventoryItemInput> {
  const name = textValue(formData, "name");
  const sku = optionalText(formData, "sku");
  const category = optionalText(formData, "category");
  const unitOfMeasure = textValue(formData, "unitOfMeasure");
  const rawReorderThreshold = textValue(formData, "reorderThreshold");
  const rawOpeningStock = textValue(formData, "openingStock") || "0";
  const reorderThreshold = parseUnsignedDecimal(rawReorderThreshold, true);
  const openingStock = parseUnsignedDecimal(rawOpeningStock, true);

  if (!name || name.length > 160) {
    return { message: "Item name must be between 1 and 160 characters." };
  }
  if (sku && sku.length > 80) {
    return { message: "SKU must be 80 characters or fewer." };
  }
  if (category && category.length > 80) {
    return { message: "Category must be 80 characters or fewer." };
  }
  if (!unitOfMeasure || unitOfMeasure.length > 40) {
    return { message: "Unit of measure must be between 1 and 40 characters." };
  }
  if (reorderThreshold === null) {
    return { message: "Reorder threshold must be a non-negative number with up to 3 decimals." };
  }
  if (openingStock === null) {
    return { message: "Opening stock must be a non-negative number with up to 3 decimals." };
  }

  return {
    input: {
      category,
      name,
      openingStock,
      reorderThreshold,
      sku,
      unitOfMeasure,
    },
  };
}

function parseInventoryMovementInput(
  formData: FormData,
): InputResult<InventoryMovementInput> {
  const rawMovementType = textValue(formData, "movementType");
  const rawQuantity = textValue(formData, "quantity");
  const note = optionalText(formData, "note");

  if (!isInventoryMovementType(rawMovementType)) {
    return { message: "Choose a valid movement type." };
  }

  let quantityChange: number | null;
  if (rawMovementType === "adjustment") {
    quantityChange = parseSignedDecimal(rawQuantity);
  } else {
    const magnitude = parseUnsignedDecimal(rawQuantity, false);
    quantityChange = magnitude === null
      ? null
      : rawMovementType === "stock_out"
        ? -magnitude
        : magnitude;
  }

  if (quantityChange === null) {
    return {
      message:
        rawMovementType === "adjustment"
          ? "Enter a non-zero signed adjustment with up to 3 decimals."
          : "Quantity must be greater than zero with up to 3 decimals.",
    };
  }
  if (note && note.length > 500) {
    return { message: "Movement note must be 500 characters or fewer." };
  }
  if (rawMovementType === "adjustment" && !note) {
    return { message: "Add a note explaining this adjustment." };
  }

  return {
    input: {
      movementType: rawMovementType,
      note,
      quantityChange,
    },
  };
}

async function getConfiguredContext() {
  const context = await requireAccountContext();
  return context.status === "configured" ? context : null;
}

function revalidateInventoryViews() {
  revalidatePath("/inventory");
  revalidatePath("/alerts");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
}

export async function createInventoryItem(
  _previousState: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  const parsed = parseInventoryItemInput(formData);
  if (!parsed.input) return { status: "error", message: parsed.message };

  const context = await getConfiguredContext();
  if (!context || context.role !== "owner") {
    return { status: "error", message: "Only the workspace owner can create inventory items." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_inventory_item_with_opening_stock", {
    item_category: parsed.input.category,
    item_name: parsed.input.name,
    item_reorder_threshold: parsed.input.reorderThreshold,
    item_sku: parsed.input.sku,
    item_unit_of_measure: parsed.input.unitOfMeasure,
    opening_quantity: parsed.input.openingStock,
    target_workspace_id: context.workspace.id,
  });

  if (error?.code === "23505") {
    return { status: "error", message: "That SKU is already used in this workspace." };
  }
  if (error || !data) {
    return { status: "error", message: "The inventory item could not be created." };
  }

  revalidateInventoryViews();
  return {
    status: "success",
    message:
      parsed.input.openingStock > 0
        ? "Inventory item and opening stock created."
        : "Inventory item created at zero stock.",
  };
}

export async function updateInventoryItem(
  itemId: string,
  _previousState: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  if (!uuidPattern.test(itemId)) {
    return { status: "error", message: "The inventory item could not be updated." };
  }

  const parsed = parseInventoryItemInput(formData);
  if (!parsed.input) return { status: "error", message: parsed.message };

  const context = await getConfiguredContext();
  if (!context || context.role !== "owner") {
    return { status: "error", message: "Only the workspace owner can edit inventory items." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory_items")
    .update({
      category: parsed.input.category,
      name: parsed.input.name,
      reorder_threshold: parsed.input.reorderThreshold,
      sku: parsed.input.sku,
      unit_of_measure: parsed.input.unitOfMeasure,
    })
    .eq("id", itemId)
    .eq("workspace_id", context.workspace.id)
    .select("id")
    .maybeSingle();

  if (error?.code === "23505") {
    return { status: "error", message: "That SKU is already used in this workspace." };
  }
  if (error?.code === "23514") {
    return {
      status: "error",
      message: "Unit of measure cannot change after stock movements have been recorded.",
    };
  }
  if (error || !data) {
    return { status: "error", message: "The inventory item could not be updated." };
  }

  revalidateInventoryViews();
  return { status: "success", message: "Inventory item updated." };
}

export async function recordInventoryMovement(
  itemId: string,
  _previousState: InventoryActionState,
  formData: FormData,
): Promise<InventoryActionState> {
  if (!uuidPattern.test(itemId)) {
    return { status: "error", message: "The stock movement could not be recorded." };
  }

  const parsed = parseInventoryMovementInput(formData);
  if (!parsed.input) return { status: "error", message: parsed.message };

  const context = await getConfiguredContext();
  if (!context) {
    return { status: "error", message: "A configured workspace is required." };
  }

  const supabase = await createClient();
  const { data: item, error: itemError } = await supabase
    .from("inventory_items")
    .select("id")
    .eq("id", itemId)
    .eq("workspace_id", context.workspace.id)
    .maybeSingle();

  if (itemError || !item) {
    return { status: "error", message: "The inventory item is not available in this workspace." };
  }

  const { data, error } = await supabase
    .from("inventory_movements")
    .insert({
      inventory_item_id: itemId,
      movement_type: parsed.input.movementType,
      note: parsed.input.note,
      quantity_change: parsed.input.quantityChange,
      recorded_by: context.user.id,
      workspace_id: context.workspace.id,
    })
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { status: "error", message: "The stock movement could not be recorded." };
  }

  revalidateInventoryViews();
  return { status: "success", message: "Stock movement recorded." };
}
