import { SignOutButton } from "@/components/sign-out-button";

type AccountNotConfiguredProps = {
  email: string;
};

export function AccountNotConfigured({ email }: AccountNotConfiguredProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4 sm:p-6">
      <section
        aria-labelledby="account-heading"
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.08)] sm:p-8"
      >
        <div className="flex size-12 items-center justify-center rounded-xl bg-amber-100 text-sm font-black text-amber-800">
          !
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
          Account not configured
        </p>
        <h1 id="account-heading" className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
          Your workspace is not ready yet
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          You are signed in as <span className="font-semibold text-slate-800">{email}</span>, but this
          account does not have a valid workspace membership. Ask the application administrator to
          link your user to the configured business.
        </p>
        <div className="mt-6">
          <SignOutButton variant="card" />
        </div>
      </section>
    </main>
  );
}
