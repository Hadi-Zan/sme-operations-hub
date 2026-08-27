import { SignOutButton } from "@/components/sign-out-button";

type AccountAccessDeactivatedProps = {
  email: string;
};

export function AccountAccessDeactivated({ email }: AccountAccessDeactivatedProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4 sm:p-6">
      <section
        aria-labelledby="deactivated-heading"
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.08)] sm:p-8"
      >
        <div className="flex size-12 items-center justify-center rounded-xl bg-slate-100 text-sm font-black text-slate-700">
          —
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Access deactivated
        </p>
        <h1 id="deactivated-heading" className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
          Your workspace access is paused
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The account <span className="font-semibold text-slate-800">{email}</span> is still retained
          for workspace history, but it cannot access operational data or receive new assignments.
          Contact your workspace owner if access should be restored.
        </p>
        <div className="mt-6">
          <SignOutButton variant="card" />
        </div>
      </section>
    </main>
  );
}
