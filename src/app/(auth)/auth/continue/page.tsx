import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AuthContinueForm } from "@/components/auth-continue-form";
import { AUTH_CONTINUATION_COOKIE, decodeAuthContinuation } from "@/lib/auth-continuation";

export const metadata: Metadata = { title: "Continue authentication" };

export default async function AuthContinuePage() {
  const cookieStore = await cookies();
  const hasContinuation = Boolean(
    decodeAuthContinuation(cookieStore.get(AUTH_CONTINUATION_COOKIE)?.value),
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-950">Continue authentication</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">For your protection, the one-time credential will only be verified after this deliberate POST action.</p>
        {hasContinuation ? <AuthContinueForm /> : <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800">This continuation has expired or is unavailable. Request a new email link.</p>}
      </section>
    </main>
  );
}
