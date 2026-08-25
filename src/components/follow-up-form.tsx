"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createFollowUp,
  updateFollowUp,
  type FollowUpActionState,
} from "@/app/(app)/follow-ups/actions";
import { CustomerCombobox } from "@/components/customer-combobox";
import type {
  FollowUpCustomerOption,
  FollowUpListItem,
  FollowUpMemberOption,
} from "@/lib/follow-ups";

const initialState: FollowUpActionState = { message: null, status: "idle" };

type FollowUpFormProps = {
  customers: FollowUpCustomerOption[];
  defaultCustomerId?: string | null;
  followUp?: FollowUpListItem;
  members: FollowUpMemberOption[];
  onCancel: () => void;
  onSaved: (message: string) => void;
  today: string;
};

export function FollowUpForm({
  customers,
  defaultCustomerId,
  followUp,
  members,
  onCancel,
  onSaved,
  today,
}: FollowUpFormProps) {
  const action = followUp ? updateFollowUp.bind(null, followUp.id) : createFollowUp;
  const [state, formAction, pending] = useActionState(action, initialState);
  const activeCustomers = customers.filter((customer) => customer.isActive);
  const currentInactiveCustomer = followUp
    ? customers.find(
        (customer) => customer.id === followUp.customerId && !customer.isActive,
      )
    : null;
  const initialCustomerId =
    followUp?.customerId ??
    (defaultCustomerId && activeCustomers.some((customer) => customer.id === defaultCustomerId)
      ? defaultCustomerId
      : activeCustomers[0]?.id ?? "");
  const [hasValidCustomer, setHasValidCustomer] = useState(Boolean(initialCustomerId));
  const messageId = "follow-up-form-message";

  useEffect(() => {
    if (state.status === "success") onSaved(state.message ?? "Follow-up saved.");
  }, [onSaved, state.message, state.status]);

  return (
    <form action={formAction} className="space-y-5">
      <fieldset disabled={pending} className="space-y-5 disabled:opacity-70">
        <div>
          <label htmlFor="follow-up-customer" className="block text-sm font-semibold text-slate-800">
            Customer
          </label>
          <CustomerCombobox
            customers={customers}
            describedBy={state.message ? messageId : undefined}
            disabled={pending}
            initialCustomerId={initialCustomerId}
            onValidityChange={setHasValidCustomer}
          />
          {currentInactiveCustomer ? (
            <p className="mt-2 text-xs leading-5 text-amber-700">
              This existing follow-up can keep its inactive customer. Choose an active customer to change the relationship.
            </p>
          ) : (
            <p className="mt-2 text-xs leading-5 text-slate-500">
              New follow-ups can only be linked to active customers.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="follow-up-title" className="block text-sm font-semibold text-slate-800">
            Reason or title
          </label>
          <input
            id="follow-up-title"
            name="title"
            required
            maxLength={160}
            defaultValue={followUp?.title ?? ""}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            placeholder="Quotation decision, service check-in, renewal…"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="follow-up-due-date" className="block text-sm font-semibold text-slate-800">
              Due date
            </label>
            <input
              id="follow-up-due-date"
              name="dueDate"
              type="date"
              required
              defaultValue={followUp?.dueDate ?? today}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            />
          </div>
          <div>
            <label htmlFor="follow-up-due-time" className="block text-sm font-semibold text-slate-800">
              Due time <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="follow-up-due-time"
              name="dueTime"
              type="time"
              defaultValue={followUp?.dueTime?.slice(0, 5) ?? ""}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            />
          </div>
        </div>

        <div>
          <label htmlFor="follow-up-assignee" className="block text-sm font-semibold text-slate-800">
            Assigned to <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <select
            id="follow-up-assignee"
            name="assignedTo"
            defaultValue={followUp?.assignedTo ?? ""}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          >
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.displayName} · {member.role === "owner" ? "Owner" : "Member"}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="follow-up-notes" className="block text-sm font-semibold text-slate-800">
            Notes <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            id="follow-up-notes"
            name="notes"
            maxLength={2000}
            rows={4}
            defaultValue={followUp?.notes ?? ""}
            className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm leading-6 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            placeholder="Add the promise, context, or information needed for the conversation."
          />
        </div>
      </fieldset>

      {state.message && state.status === "error" ? (
        <p id={messageId} role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800">
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} disabled={pending} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-60">
          Cancel
        </button>
        <button type="submit" disabled={pending || !hasValidCustomer} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-65">
          {pending ? "Saving…" : followUp ? "Save changes" : "Create follow-up"}
        </button>
      </div>
    </form>
  );
}
