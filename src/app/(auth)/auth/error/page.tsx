import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Authentication link unavailable" };

export default function AuthErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-950">This link cannot be continued</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">It may be invalid, expired, or already used. Request a new invitation or password recovery email.</p>
        <Link href="/login" className="mt-6 inline-flex rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Return to sign in</Link>
      </section>
    </main>
  );
}
