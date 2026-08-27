"use client";

import { useActionState } from "react";
import {
  requestPasswordRecovery,
  type ForgotPasswordState,
} from "@/app/(auth)/forgot-password/actions";

const initialState: ForgotPasswordState = { message: null, status: "idle" };

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordRecovery, initialState);

  return (
    <form action={action} className="mt-7 space-y-5">
      <div>
        <label htmlFor="recovery-email" className="block text-sm font-semibold text-slate-800">
          Email address
        </label>
        <input
          id="recovery-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
        />
      </div>
      {state.message ? (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm leading-6 text-emerald-900">
          {state.message}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-60">
        {pending ? "Requesting…" : "Send recovery email"}
      </button>
    </form>
  );
}
