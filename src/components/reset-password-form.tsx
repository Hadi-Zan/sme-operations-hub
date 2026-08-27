"use client";

import { useActionState } from "react";
import { resetPassword, type ResetPasswordState } from "@/app/(auth)/reset-password/actions";

const initialState: ResetPasswordState = { message: null };

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(resetPassword, initialState);
  return (
    <form action={action} className="mt-7 space-y-5">
      <div>
        <label htmlFor="new-password" className="block text-sm font-semibold text-slate-800">New password</label>
        <input id="new-password" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={1024} required autoFocus className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" />
      </div>
      <div>
        <label htmlFor="password-confirmation" className="block text-sm font-semibold text-slate-800">Confirm password</label>
        <input id="password-confirmation" name="passwordConfirmation" type="password" autoComplete="new-password" minLength={12} maxLength={1024} required className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" />
      </div>
      {state.message ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800">{state.message}</p> : null}
      <button disabled={pending} type="submit" className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-60">{pending ? "Updating…" : "Update password"}</button>
    </form>
  );
}
