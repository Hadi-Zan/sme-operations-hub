"use client";

import { useActionState, useEffect } from "react";
import {
  createInventoryItem,
  updateInventoryItem,
  type InventoryActionState,
} from "@/app/(app)/inventory/actions";
import type { InventoryListItem } from "@/lib/inventory";

const initialState: InventoryActionState = { message: null, status: "idle" };

type InventoryItemFormProps = {
  item?: InventoryListItem;
  onCancel: () => void;
  onSaved: (message: string) => void;
};

export function InventoryItemForm({ item, onCancel, onSaved }: InventoryItemFormProps) {
  const action: (
    state: InventoryActionState,
    formData: FormData,
  ) => Promise<InventoryActionState> = item
    ? updateInventoryItem.bind(null, item.id)
    : createInventoryItem;
  const [state, formAction, pending] = useActionState(action, initialState);
  const messageId = "inventory-item-form-message";
  const unitIsLocked = Boolean(item && item.movementCount > 0);

  useEffect(() => {
    if (state.status === "success") {
      onSaved(state.message ?? (item ? "Inventory item updated." : "Inventory item created."));
    }
  }, [item, onSaved, state.message, state.status]);

  return (
    <form action={formAction} className="space-y-5">
      <fieldset disabled={pending} className="space-y-5 disabled:opacity-70">
        <div>
          <label htmlFor="inventory-item-name" className="block text-sm font-semibold text-slate-800">
            Item name
          </label>
          <input
            id="inventory-item-name"
            name="name"
            defaultValue={item?.name ?? ""}
            required
            maxLength={160}
            autoFocus
            aria-describedby={state.message ? messageId : undefined}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            placeholder="e.g. 20 × 20 filter cartridges"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="inventory-item-sku" className="block text-sm font-semibold text-slate-800">
              SKU <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="inventory-item-sku"
              name="sku"
              defaultValue={item?.sku ?? ""}
              maxLength={80}
              aria-describedby={state.message ? messageId : undefined}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              placeholder="e.g. FLT-2020"
            />
          </div>
          <div>
            <label htmlFor="inventory-item-category" className="block text-sm font-semibold text-slate-800">
              Category <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="inventory-item-category"
              name="category"
              defaultValue={item?.category ?? ""}
              maxLength={80}
              aria-describedby={state.message ? messageId : undefined}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              placeholder="e.g. Filters"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="inventory-item-unit" className="block text-sm font-semibold text-slate-800">
              Unit of measure
            </label>
            <input
              id="inventory-item-unit"
              name="unitOfMeasure"
              list="inventory-unit-suggestions"
              defaultValue={item?.unitOfMeasure ?? "units"}
              required
              readOnly={unitIsLocked}
              maxLength={40}
              aria-describedby={unitIsLocked ? "inventory-unit-lock-note" : state.message ? messageId : undefined}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 read-only:bg-slate-50 read-only:text-slate-500"
              placeholder="e.g. units, litres, kg"
            />
            <datalist id="inventory-unit-suggestions">
              <option value="units" />
              <option value="pieces" />
              <option value="litres" />
              <option value="kilograms" />
              <option value="metres" />
              <option value="boxes" />
            </datalist>
            {unitIsLocked ? (
              <p id="inventory-unit-lock-note" className="mt-2 text-xs leading-5 text-slate-500">
                The unit is locked because movement history already exists for this item.
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor="inventory-item-threshold" className="block text-sm font-semibold text-slate-800">
              Reorder threshold
            </label>
            <input
              id="inventory-item-threshold"
              name="reorderThreshold"
              type="number"
              defaultValue={item?.reorderThreshold ?? 0}
              required
              min="0"
              max="99999999999.999"
              step="0.001"
              inputMode="decimal"
              aria-describedby={state.message ? messageId : undefined}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            />
          </div>
        </div>

        {!item ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <label htmlFor="inventory-opening-stock" className="block text-sm font-semibold text-slate-800">
              Opening stock <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="inventory-opening-stock"
              name="openingStock"
              type="number"
              defaultValue="0"
              min="0"
              max="99999999999.999"
              step="0.001"
              inputMode="decimal"
              aria-describedby="inventory-opening-stock-note"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            />
            <p id="inventory-opening-stock-note" className="mt-2 text-xs leading-5 text-slate-500">
              New items start at zero. Any opening amount is saved as the first stock-in movement.
            </p>
          </div>
        ) : null}
      </fieldset>

      {state.message && state.status === "error" ? (
        <p
          id={messageId}
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800"
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-65"
        >
          {pending ? "Saving…" : item ? "Save changes" : "Create item"}
        </button>
      </div>
    </form>
  );
}
