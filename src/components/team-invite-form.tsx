"use client";

import { useActionState } from "react";
import { inviteEmployee, type TeamActionState } from "@/app/(app)/settings/team/actions";

const initialState: TeamActionState = { message: null, status: "idle" };

export function TeamInviteForm() {
  const [state, action, pending] = useActionState(inviteEmployee, initialState);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor="employee-name" className="block text-sm font-semibold text-slate-800">Display name</label>
        <input id="employee-name" name="displayName" required maxLength={100} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" />
      </div>
      <div>
        <label htmlFor="employee-email" className="block text-sm font-semibold text-slate-800">Email address</label>
        <input id="employee-email" name="email" type="email" required maxLength={320} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" />
      </div>
      {state.message ? <p role={state.status === "error" ? "alert" : "status"} className={`sm:col-span-2 rounded-xl border px-3.5 py-3 text-sm ${state.status === "error" ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{state.message}</p> : null}
      <div className="sm:col-span-2"><button type="submit" disabled={pending} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-60">{pending ? "Sending…" : "Invite employee"}</button></div>
    </form>
  );
}
