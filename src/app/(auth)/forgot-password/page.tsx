import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4 sm:p-6">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.08)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Account recovery</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Reset your password</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Enter your account email. For privacy, the response is the same whether or not the account exists.</p>
        <ForgotPasswordForm />
        <Link href="/login" className="mt-5 inline-block text-sm font-semibold text-emerald-800 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">Back to sign in</Link>
      </section>
    </main>
  );
}
