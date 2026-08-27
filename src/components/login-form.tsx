"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, type LoginActionState } from "@/app/(auth)/login/actions";

const initialState: LoginActionState = { message: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-slate-800">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          aria-describedby={state.message ? "login-error" : undefined}
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="password" className="block text-sm font-semibold text-slate-800">
            Password
          </label>
          <Link href="/forgot-password" className="text-xs font-semibold text-emerald-800 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-describedby={state.message ? "login-error" : undefined}
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
        />
      </div>

      {state.message ? (
        <p
          id="login-error"
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm leading-5 text-rose-800"
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-65"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
