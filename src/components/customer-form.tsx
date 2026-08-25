"use client";

import { useActionState, useEffect } from "react";
import {
  createCustomer,
  updateCustomer,
  type CustomerActionState,
} from "@/app/(app)/customers/actions";
import type { CustomerListItem } from "@/lib/customers";

const initialState: CustomerActionState = { message: null, status: "idle" };

type CustomerFormProps = {
  customer?: CustomerListItem;
  onCancel: () => void;
  onSaved: (message: string) => void;
};

export function CustomerForm({ customer, onCancel, onSaved }: CustomerFormProps) {
  const action = customer ? updateCustomer.bind(null, customer.id) : createCustomer;
  const [state, formAction, pending] = useActionState(action, initialState);
  const messageId = "customer-form-message";

  useEffect(() => {
    if (state.status === "success") onSaved(state.message ?? "Customer saved.");
  }, [onSaved, state.message, state.status]);

  return (
    <form action={formAction} className="space-y-5">
      <fieldset disabled={pending} className="space-y-5 disabled:opacity-70">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="customer-name" className="block text-sm font-semibold text-slate-800">
              Customer name
            </label>
            <input
              id="customer-name"
              name="name"
              required
              autoFocus
              maxLength={160}
              defaultValue={customer?.name ?? ""}
              aria-describedby={state.message ? messageId : undefined}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              placeholder="Business or individual name"
            />
          </div>
          <div>
            <label
              htmlFor="customer-contact-name"
              className="block text-sm font-semibold text-slate-800"
            >
              Contact person <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="customer-contact-name"
              name="contactName"
              maxLength={120}
              defaultValue={customer?.contactName ?? ""}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              placeholder="Primary site contact"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="customer-email" className="block text-sm font-semibold text-slate-800">
              Email <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="customer-email"
              name="email"
              type="email"
              maxLength={320}
              defaultValue={customer?.email ?? ""}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              placeholder="customer@example.com"
            />
          </div>
          <div>
            <label htmlFor="customer-phone" className="block text-sm font-semibold text-slate-800">
              Phone <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="customer-phone"
              name="phone"
              type="tel"
              maxLength={40}
              defaultValue={customer?.phone ?? ""}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              placeholder="+65 6000 0000"
            />
          </div>
        </div>

        <div>
          <label htmlFor="customer-address" className="block text-sm font-semibold text-slate-800">
            Address or service location <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            id="customer-address"
            name="address"
            maxLength={500}
            rows={2}
            defaultValue={customer?.address ?? ""}
            className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm leading-6 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            placeholder="Site address or practical access details"
          />
        </div>

        <div>
          <label htmlFor="customer-notes" className="block text-sm font-semibold text-slate-800">
            Operational notes <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            id="customer-notes"
            name="notes"
            maxLength={2000}
            rows={4}
            defaultValue={customer?.notes ?? ""}
            className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm leading-6 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            placeholder="Keep this concise: access, service, or communication context."
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
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-wait disabled:opacity-65"
        >
          {pending ? "Saving…" : customer ? "Save changes" : "Create customer"}
        </button>
      </div>
    </form>
  );
}
