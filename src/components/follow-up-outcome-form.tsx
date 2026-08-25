"use client";

import { useActionState, useEffect } from "react";
import {
  completeFollowUp,
  reopenFollowUp,
  type FollowUpActionState,
} from "@/app/(app)/follow-ups/actions";
import type { FollowUpListItem } from "@/lib/follow-ups";

const initialState: FollowUpActionState = { message: null, status: "idle" };

type FollowUpOutcomeFormProps = {
  followUp: FollowUpListItem;
  mode: "complete" | "reopen";
  onCancel: () => void;
  onSaved: (message: string) => void;
};

export function FollowUpOutcomeForm({
  followUp,
  mode,
  onCancel,
  onSaved,
}: FollowUpOutcomeFormProps) {
  const action =
    mode === "complete"
      ? completeFollowUp.bind(null, followUp.id)
      : reopenFollowUp.bind(null, followUp.id);
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.status === "success") onSaved(state.message ?? "Follow-up updated.");
  }, [onSaved, state.message, state.status]);

  return (
    <form action={formAction}>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-900">{followUp.title}</p>
        <p className="mt-1 text-xs text-slate-500">{followUp.customerName}</p>
      </div>

      {mode === "complete" ? (
        <div className="mt-5">
          <label htmlFor="follow-up-outcome" className="block text-sm font-semibold text-slate-800">
            Outcome
          </label>
          <textarea
            id="follow-up-outcome"
            name="outcome"
            required
            autoFocus
            maxLength={1000}
            rows={4}
            defaultValue={followUp.outcome ?? ""}
            disabled={pending}
            className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm leading-6 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 disabled:opacity-70"
            placeholder="Record the decision, response, or next agreed step."
          />
          <p className="mt-2 text-xs leading-5 text-slate-500">
            The database records who completed this follow-up and when. Editing this outcome later preserves those audit fields.
          </p>
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
          <p className="text-sm font-semibold">Return this follow-up to the pending queue?</p>
          <p className="mt-2 text-xs leading-5 text-amber-800">
            Reopening clears the current outcome, completion time, and completer. Its due date is retained, so it may immediately appear overdue.
          </p>
        </div>
      )}

      {state.message && state.status === "error" ? (
        <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800">
          {state.message}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} disabled={pending} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-60">
          Cancel
        </button>
        <button type="submit" disabled={pending} className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white outline-none transition focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-65 ${mode === "reopen" ? "bg-amber-700 hover:bg-amber-800 focus-visible:ring-amber-500" : "bg-slate-950 hover:bg-slate-800 focus-visible:ring-emerald-500"}`}>
          {pending ? "Updating…" : mode === "reopen" ? "Reopen follow-up" : followUp.status === "completed" ? "Update outcome" : "Complete follow-up"}
        </button>
      </div>
    </form>
  );
}
