"use client";

import { useActionState, useEffect, useState } from "react";
import {
  recordInventoryMovement,
  type InventoryActionState,
} from "@/app/(app)/inventory/actions";
import {
  formatInventoryQuantity,
  inventoryMovementTypes,
  inventoryMovementTypeLabels,
  type InventoryListItem,
} from "@/lib/inventory";
import type { InventoryMovementType } from "@/lib/supabase/database.types";

const initialState: InventoryActionState = { message: null, status: "idle" };

type InventoryMovementFormProps = {
  item: InventoryListItem;
  onCancel: () => void;
  onSaved: (message: string) => void;
};

export function InventoryMovementForm({ item, onCancel, onSaved }: InventoryMovementFormProps) {
  const action = recordInventoryMovement.bind(null, item.id);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [movementType, setMovementType] = useState<InventoryMovementType>("stock_in");
  const messageId = "inventory-movement-form-message";
  const quantityHelpId = "inventory-movement-quantity-help";

  useEffect(() => {
    if (state.status === "success") {
      onSaved(state.message ?? "Stock movement recorded.");
    }
  }, [onSaved, state.message, state.status]);

  return (
    <form action={formAction} className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-900">{item.name}</p>
        <p className="mt-1 text-xs text-slate-500">
          Current stock: {formatInventoryQuantity(item.currentQuantity)} {item.unitOfMeasure}
        </p>
      </div>

      <fieldset disabled={pending} className="space-y-5 disabled:opacity-70">
        <div>
          <label htmlFor="inventory-movement-type" className="block text-sm font-semibold text-slate-800">
            Movement type
          </label>
          <select
            id="inventory-movement-type"
            name="movementType"
            value={movementType}
            onChange={(event) => setMovementType(event.target.value as InventoryMovementType)}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          >
            {inventoryMovementTypes.map((type) => (
              <option key={type} value={type}>
                {inventoryMovementTypeLabels[type]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="inventory-movement-quantity" className="block text-sm font-semibold text-slate-800">
            Quantity ({item.unitOfMeasure})
          </label>
          <input
            key={movementType}
            id="inventory-movement-quantity"
            name="quantity"
            type="number"
            required
            autoFocus
            min={movementType === "adjustment" ? undefined : "0.001"}
            max="99999999999.999"
            step="0.001"
            inputMode="decimal"
            aria-describedby={state.message ? `${quantityHelpId} ${messageId}` : quantityHelpId}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            placeholder={movementType === "adjustment" ? "e.g. -1 or 2" : "e.g. 10"}
          />
          <p id={quantityHelpId} className="mt-2 text-xs leading-5 text-slate-500">
            {movementType === "stock_in"
              ? "Enter the positive amount received. It will be stored as an increase."
              : movementType === "stock_out"
                ? "Enter the positive amount used. It will be stored as a decrease."
                : "Use a positive number to increase stock or a negative number to decrease it."}
          </p>
        </div>

        <div>
          <label htmlFor="inventory-movement-note" className="block text-sm font-semibold text-slate-800">
            Note{" "}
            {movementType === "adjustment" ? (
              <span className="font-normal text-rose-600">(required)</span>
            ) : (
              <span className="font-normal text-slate-400">(optional)</span>
            )}
          </label>
          <textarea
            id="inventory-movement-note"
            name="note"
            required={movementType === "adjustment"}
            maxLength={500}
            rows={3}
            aria-describedby={state.message ? messageId : undefined}
            className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            placeholder={
              movementType === "adjustment"
                ? "Explain the discrepancy, damage, loss, or correction."
                : "Add delivery, job, or usage context."
            }
          />
        </div>
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
          {pending ? "Recording…" : "Record movement"}
        </button>
      </div>
    </form>
  );
}
