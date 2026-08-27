import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/reset-password-form";

export const metadata: Metadata = { title: "Choose a new password" };

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4 sm:p-6">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.08)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Secure recovery</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Choose a new password</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">After the password changes, all account sessions are signed out.</p>
        <ResetPasswordForm />
      </section>
    </main>
  );
}
