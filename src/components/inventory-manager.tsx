"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { InventoryItemForm } from "@/components/inventory-item-form";
import { InventoryMovementForm } from "@/components/inventory-movement-form";
import {
  formatInventoryQuantity,
  inventoryMovementTypeLabels,
  inventoryStockLabel,
  inventoryStockTone,
  movementTone,
  type InventoryFilters,
  type InventoryListItem,
  type InventoryMovementListItem,
} from "@/lib/inventory";
import type { WorkspaceRole } from "@/lib/supabase/database.types";

type DialogState =
  | { kind: "create" }
  | { item: InventoryListItem; kind: "edit" }
  | { item: InventoryListItem; kind: "movement" }
  | null;

type HistoryItemOption = {
  id: string;
  name: string;
};

type InventoryManagerProps = {
  filters: InventoryFilters;
  hasActiveFilters: boolean;
  historyItems: HistoryItemOption[];
  items: InventoryListItem[];
  movements: InventoryMovementListItem[];
  role: WorkspaceRole;
  selectedHistoryItem: InventoryListItem | null;
  totalItems: number;
};

function inventoryHref(filters: InventoryFilters, historyItemId: string | null) {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.stock === "low") params.set("stock", "low");
  if (filters.category) params.set("category", filters.category);
  if (historyItemId) params.set("history", historyItemId);
  const query = params.toString();
  return query ? `/inventory?${query}` : "/inventory";
}

export function InventoryManager({
  filters,
  hasActiveFilters,
  historyItems,
  items,
  movements,
  role,
  selectedHistoryItem,
  totalItems,
}: InventoryManagerProps) {
  const [dialog, setDialog] = useState<DialogState>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isOwner = role === "owner";

  const closeDialog = useCallback(() => {
    dialogRef.current?.close();
    setDialog(null);
  }, []);

  const handleSaved = useCallback(
    (message: string) => {
      setNotice(message);
      closeDialog();
    },
    [closeDialog],
  );

  useEffect(() => {
    if (dialog && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  }, [dialog]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  return (
    <div className="space-y-6">
      <section
        aria-labelledby="inventory-list-heading"
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
      >
        <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Workspace inventory
            </p>
            <h2 id="inventory-list-heading" className="mt-1 text-lg font-semibold text-slate-950">
              {items.length} {items.length === 1 ? "item" : "items"}
            </h2>
          </div>
          {isOwner ? (
            <button
              type="button"
              onClick={() => setDialog({ kind: "create" })}
              className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              New inventory item
            </button>
          ) : (
            <p className="max-w-sm text-xs leading-5 text-slate-500">
              You can view stock and record movements. Item details are managed by the workspace owner.
            </p>
          )}
        </div>

        {notice ? (
          <p
            role="status"
            className="mx-5 mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800 sm:mx-6"
          >
            {notice}
          </p>
        ) : null}

        {items.length ? (
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <article
                key={item.id}
                className="grid gap-5 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.68fr)] lg:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${inventoryStockTone(item)}`}
                    >
                      {inventoryStockLabel(item)}
                    </span>
                    {item.category ? (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                        {item.category}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-3 text-sm font-semibold leading-6 text-slate-950 sm:text-base">
                    {item.name}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                    <span>{item.sku ? `SKU ${item.sku}` : "No SKU"}</span>
                    <span>
                      Reorder at {formatInventoryQuantity(item.reorderThreshold)} {item.unitOfMeasure}
                    </span>
                    <span>
                      {item.movementCount} {item.movementCount === 1 ? "movement" : "movements"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-4 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                  <div>
                    <p className="text-xs font-medium text-slate-400">Current stock</p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                      {formatInventoryQuantity(item.currentQuantity)}{" "}
                      <span className="text-sm font-medium text-slate-500">{item.unitOfMeasure}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 sm:justify-end">
                    <Link
                      href={inventoryHref(filters, item.id)}
                      className="rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-600 outline-none transition hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      History
                    </Link>
                    {isOwner ? (
                      <button
                        type="button"
                        onClick={() => setDialog({ item, kind: "edit" })}
                        className="rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-600 outline-none transition hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-emerald-500"
                      >
                        Edit
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setDialog({ item, kind: "movement" })}
                      className="rounded-lg bg-emerald-50 px-2.5 py-2 text-xs font-semibold text-emerald-800 outline-none transition hover:bg-emerald-100 focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      Record movement
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-slate-950 text-xs font-black text-emerald-300">
              IN
            </span>
            <h3 className="mt-4 text-base font-semibold text-slate-900">
              {hasActiveFilters && totalItems > 0 ? "No matching inventory" : "No inventory items yet"}
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              {hasActiveFilters && totalItems > 0
                ? "Try clearing or changing the filters to see other workspace items."
                : isOwner
                  ? "Create the first item, then record each stock increase or decrease as a movement."
                  : "The workspace owner can create the first inventory item."}
            </p>
            {isOwner && totalItems === 0 ? (
              <button
                type="button"
                onClick={() => setDialog({ kind: "create" })}
                className="mt-5 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                Create an item
              </button>
            ) : null}
          </div>
        )}
      </section>

      <section
        aria-labelledby="inventory-history-heading"
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
      >
        <div className="grid gap-4 border-b border-slate-100 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.55fr)] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
              Immutable history
            </p>
            <h2 id="inventory-history-heading" className="mt-1 text-lg font-semibold text-slate-950">
              {selectedHistoryItem ? `${selectedHistoryItem.name} movements` : "Recent stock movements"}
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Showing up to 50 movements. Corrections are recorded as new adjustments.
            </p>
          </div>
          <form
            key={selectedHistoryItem?.id ?? "all-items"}
            action="/inventory"
            method="get"
            className="flex gap-2"
          >
            {filters.query ? <input type="hidden" name="q" value={filters.query} /> : null}
            {filters.stock === "low" ? <input type="hidden" name="stock" value="low" /> : null}
            {filters.category ? <input type="hidden" name="category" value={filters.category} /> : null}
            <div className="min-w-0 flex-1">
              <label htmlFor="inventory-history-item" className="sr-only">
                Filter movement history by item
              </label>
              <select
                id="inventory-history-item"
                name="history"
                defaultValue={selectedHistoryItem?.id ?? ""}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="">All inventory items</option>
                {historyItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              Show
            </button>
          </form>
        </div>

        {movements.length ? (
          <div className="divide-y divide-slate-100">
            {movements.map((movement) => (
              <article
                key={movement.id}
                className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${movementTone(movement.movementType)}`}
                    >
                      {inventoryMovementTypeLabels[movement.movementType]}
                    </span>
                    <h3 className="truncate text-sm font-semibold text-slate-900">
                      {movement.itemName}
                    </h3>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {movement.note ?? "No note"} · Recorded by {movement.recordedByName}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p
                    className={`text-base font-semibold ${movement.quantityChange > 0 ? "text-emerald-700" : "text-rose-700"}`}
                  >
                    {movement.quantityChange > 0 ? "+" : ""}
                    {formatInventoryQuantity(movement.quantityChange)} {movement.unitOfMeasure}
                  </p>
                  <time dateTime={movement.createdAt} className="mt-1 block text-[11px] text-slate-400">
                    {movement.formattedCreatedAt}
                  </time>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="px-6 py-10 text-center">
            <p className="text-sm font-semibold text-slate-800">No stock movements recorded</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              New stock increases, decreases, and adjustments will appear here.
            </p>
          </div>
        )}
      </section>

      <dialog
        ref={dialogRef}
        aria-labelledby="inventory-dialog-heading"
        onClose={() => setDialog(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeDialog();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-2xl rounded-2xl border border-slate-200 bg-white p-0 text-slate-950 shadow-[0_24px_70px_rgba(15,23,42,0.24)] backdrop:bg-slate-950/55"
      >
        {dialog ? (
          <div>
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                  {dialog.kind === "movement" ? "Stock ledger" : "Inventory details"}
                </p>
                <h2 id="inventory-dialog-heading" className="mt-1 text-xl font-semibold text-slate-950">
                  {dialog.kind === "create"
                    ? "Create inventory item"
                    : dialog.kind === "edit"
                      ? "Edit inventory item"
                      : "Record stock movement"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeDialog}
                aria-label="Close inventory form"
                className="flex size-9 items-center justify-center rounded-lg text-lg text-slate-400 outline-none transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                ×
              </button>
            </div>
            <div className="max-h-[calc(100vh-10rem)] overflow-y-auto p-5 sm:p-6">
              {dialog.kind === "movement" ? (
                <InventoryMovementForm
                  key={dialog.item.id}
                  item={dialog.item}
                  onCancel={closeDialog}
                  onSaved={handleSaved}
                />
              ) : (
                <InventoryItemForm
                  key={dialog.kind === "edit" ? dialog.item.id : "new"}
                  item={dialog.kind === "edit" ? dialog.item : undefined}
                  onCancel={closeDialog}
                  onSaved={handleSaved}
                />
              )}
            </div>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
