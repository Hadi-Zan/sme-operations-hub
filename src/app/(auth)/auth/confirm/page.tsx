import type { Metadata } from "next";
import { AuthConfirmBootstrap } from "@/components/auth-confirm-bootstrap";

export const metadata: Metadata = { title: "Confirm authentication" };

export default function AuthConfirmPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-950">Secure link received</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">The one-time credential is being removed from this browser address before you continue.</p>
        <AuthConfirmBootstrap />
      </section>
    </main>
  );
}
