"use client";

import { useFormStatus } from "react-dom";
import { continueAuthentication } from "@/app/(auth)/auth/continue/actions";

function ContinueButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? "Continuing securely…" : "Continue securely"}
    </button>
  );
}

export function AuthContinueForm() {
  return (
    <form action={continueAuthentication} className="mt-6">
      <ContinueButton />
    </form>
  );
}
