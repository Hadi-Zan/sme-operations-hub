"use client";

import Link from "next/link";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import {
  setCustomerActive,
  type CustomerActionState,
} from "@/app/(app)/customers/actions";
import { CustomerForm } from "@/components/customer-form";
import {
  customerInitials,
  formatCustomerFollowUpDate,
  type CustomerListItem,
} from "@/lib/customers";
import type { WorkspaceRole } from "@/lib/supabase/database.types";

type CustomerDialog =
  | { kind: "create" }
  | { customer: CustomerListItem; kind: "edit" }
  | { customer: CustomerListItem; kind: "status" };

type CustomerManagerProps = {
  customers: CustomerListItem[];
  hasActiveFilters: boolean;
  role: WorkspaceRole;
  totalCustomers: number;
};

const initialState: CustomerActionState = { message: null, status: "idle" };

function CustomerStatusForm({
  customer,
  onCancel,
  onSaved,
}: {
  customer: CustomerListItem;
  onCancel: () => void;
  onSaved: (message: string) => void;
}) {
  const action = setCustomerActive.bind(null, customer.id, !customer.isActive);
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.status === "success") onSaved(state.message ?? "Customer status updated.");
  }, [onSaved, state.message, state.status]);

  return (
    <form action={formAction}>
      <div
        className={`rounded-xl border p-4 ${
          customer.isActive
            ? "border-amber-200 bg-amber-50 text-amber-950"
            : "border-emerald-200 bg-emerald-50 text-emerald-950"
        }`}
      >
        <p className="text-sm font-semibold">
          {customer.isActive ? `Deactivate ${customer.name}?` : `Reactivate ${customer.name}?`}
        </p>
        <p className="mt-2 text-xs leading-5 opacity-80">
          {customer.isActive
            ? customer.pendingFollowUpCount > 0
              ? `${customer.pendingFollowUpCount} pending ${customer.pendingFollowUpCount === 1 ? "follow-up remains" : "follow-ups remain"} actionable and visible. Nothing will be completed, deleted, cancelled, or reassigned automatically.`
              : "The customer will be removed from active selectors but all completed follow-up history will remain."
            : "The customer will return to active lists and can be selected for new follow-ups."}
        </p>
      </div>

      {state.message && state.status === "error" ? (
        <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-3.5 py-3 text-sm text-rose-800">
          {state.message}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white outline-none transition focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-65 ${
            customer.isActive
              ? "bg-amber-700 hover:bg-amber-800 focus-visible:ring-amber-500"
              : "bg-slate-950 hover:bg-slate-800 focus-visible:ring-emerald-500"
          }`}
        >
          {pending ? "Updating…" : customer.isActive ? "Deactivate customer" : "Reactivate customer"}
        </button>
      </div>
    </form>
  );
}

export function CustomerManager({
  customers,
  hasActiveFilters,
  role,
  totalCustomers,
}: CustomerManagerProps) {
  const [dialog, setDialog] = useState<CustomerDialog | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isOwner = role === "owner";

  useEffect(() => {
    const element = dialogRef.current;
    if (dialog && element && !element.open) element.showModal();
    if (!dialog && element?.open) element.close();
  }, [dialog]);

  const closeDialog = useCallback(() => setDialog(null), []);
  const handleSaved = useCallback((message: string) => {
    setNotice(message);
    setDialog(null);
  }, []);

  return (
    <div>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Customer directory
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">
              {customers.length} {customers.length === 1 ? "customer" : "customers"}
            </h2>
          </div>
          {isOwner ? (
            <button
              type="button"
              onClick={() => setDialog({ kind: "create" })}
              className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              New customer
            </button>
          ) : (
            <p className="max-w-sm text-xs leading-5 text-slate-500">
              Customer details are shared with the workspace and managed by the owner.
            </p>
          )}
        </div>

        {notice ? (
          <p role="status" className="mx-5 mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800 sm:mx-6">
            {notice}
          </p>
        ) : null}

        {customers.length ? (
          <div className="divide-y divide-slate-100">
            {customers.map((customer) => (
              <article key={customer.id} className="grid gap-5 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.65fr)]">
                <div className="flex min-w-0 gap-4">
                  <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${customer.isActive ? "bg-sky-50 text-sky-700" : "bg-slate-100 text-slate-500"}`}>
                    {customerInitials(customer.name)}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-950 sm:text-base">{customer.name}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${customer.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {customer.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {customer.contactName ? <p className="mt-1 text-xs text-slate-500">Contact: {customer.contactName}</p> : null}
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600">
                      {customer.email ? <a href={`mailto:${customer.email}`} className="rounded outline-none hover:text-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500">{customer.email}</a> : null}
                      {customer.phone ? <a href={`tel:${customer.phone}`} className="rounded outline-none hover:text-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500">{customer.phone}</a> : null}
                      {!customer.email && !customer.phone ? <span className="text-slate-400">No email or phone recorded</span> : null}
                    </div>
                    {customer.address ? <p className="mt-3 text-xs leading-5 text-slate-500">{customer.address}</p> : null}
                    {customer.notes ? <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-slate-600">{customer.notes}</p> : null}
                  </div>
                </div>

                <div className="flex flex-col justify-between gap-4 border-t border-slate-100 pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                  <div>
                    <p className="text-xs font-medium text-slate-400">Pending follow-ups</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">{customer.pendingFollowUpCount}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {customer.nextFollowUpDate ? `Next due ${formatCustomerFollowUpDate(customer.nextFollowUpDate)}` : "No pending follow-up"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <Link
                      href={`/follow-ups?customer=${customer.id}`}
                      className="rounded-lg bg-sky-50 px-2.5 py-2 text-xs font-semibold text-sky-700 outline-none transition hover:bg-sky-100 focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      Follow-ups
                    </Link>
                    {isOwner ? (
                      <>
                        <button type="button" onClick={() => setDialog({ customer, kind: "edit" })} className="rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-600 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-500">
                          Edit
                        </button>
                        <button type="button" onClick={() => setDialog({ customer, kind: "status" })} className="rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-600 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-500">
                          {customer.isActive ? "Deactivate" : "Reactivate"}
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-slate-950 text-xs font-black text-emerald-300">CU</span>
            <h3 className="mt-4 text-base font-semibold text-slate-900">
              {hasActiveFilters && totalCustomers > 0 ? "No matching customers" : "No customers yet"}
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              {hasActiveFilters && totalCustomers > 0
                ? "Clear or change the filters to see other workspace customers."
                : isOwner
                  ? "Create the first customer to start scheduling real follow-ups."
                  : "The workspace owner can create the first customer."}
            </p>
          </div>
        )}
      </section>

      <dialog
        ref={dialogRef}
        aria-labelledby="customer-dialog-heading"
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
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Customer record</p>
                <h2 id="customer-dialog-heading" className="mt-1 text-xl font-semibold text-slate-950">
                  {dialog.kind === "create" ? "Create customer" : dialog.kind === "edit" ? "Edit customer" : "Change customer status"}
                </h2>
              </div>
              <button type="button" onClick={closeDialog} aria-label="Close customer dialog" className="flex size-9 items-center justify-center rounded-lg text-lg text-slate-400 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-500">×</button>
            </div>
            <div className="max-h-[calc(100vh-10rem)] overflow-y-auto p-5 sm:p-6">
              {dialog.kind === "status" ? (
                <CustomerStatusForm key={dialog.customer.id} customer={dialog.customer} onCancel={closeDialog} onSaved={handleSaved} />
              ) : (
                <CustomerForm key={dialog.kind === "edit" ? dialog.customer.id : "new"} customer={dialog.kind === "edit" ? dialog.customer : undefined} onCancel={closeDialog} onSaved={handleSaved} />
              )}
            </div>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
