import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getOptionalCurrentUser } from "@/lib/auth";
import { getSupabaseConfig } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Sign in",
};

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{ notice?: string }>;
};

const notices: Record<string, string> = {
  configuration: "Supabase has not been configured for this deployment yet.",
  unavailable: "Authentication is temporarily unavailable. Please try again.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const config = getSupabaseConfig();

  if (config && (await getOptionalCurrentUser())) {
    redirect("/");
  }

  const { notice } = await searchParams;
  const noticeMessage = notice ? notices[notice] : undefined;

  return (
    <main className="grid min-h-screen bg-slate-100 lg:grid-cols-[minmax(0,0.8fr)_minmax(520px,1.2fr)]">
      <section className="flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-slate-950 text-xs font-black text-emerald-300">
              SO
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-950">SME Operations Hub</p>
              <p className="text-xs text-slate-500">Secure business workspace</p>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Welcome back
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-slate-950">
              Sign in to your workspace
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Use the email address and password provided by your workspace administrator.
            </p>
          </div>

          {noticeMessage ? (
            <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm leading-5 text-amber-800">
              {noticeMessage}
            </p>
          ) : null}

          <LoginForm />
        </div>
      </section>

      <aside className="hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Straightforward operations
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">
            A calm place to keep daily work moving.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-400">
            Sign in securely to access the dashboard, tasks, inventory, customers, and follow-ups.
          </p>
        </div>
        <p className="text-xs leading-5 text-slate-500">
          Live workspace data keeps tasks, stock, customers, follow-ups, and operational attention together.
        </p>
      </aside>
    </main>
  );
}
