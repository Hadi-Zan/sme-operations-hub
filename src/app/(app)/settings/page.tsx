import type { Metadata } from "next";
import Link from "next/link";
import { WorkspaceProfileForm } from "@/components/workspace-profile-form";
import { requireAccountContext } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const context = await requireAccountContext();

  if (context.status !== "configured") return null;

  return (
    <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">
      <section aria-labelledby="settings-heading" className="border-b border-slate-200 pb-7">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
          <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
          Connected workspace
        </div>
        <h1
          id="settings-heading"
          className="text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-4xl"
        >
          Settings
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          Maintain the basic business profile used throughout this deployment.
        </p>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.65fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-6">
          <div className="mb-6 border-b border-slate-100 pb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Business profile
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">Workspace details</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              These live details are stored securely in Supabase and shared across the operations workspace.
            </p>
          </div>
          <WorkspaceProfileForm canEdit={context.role === "owner"} workspace={context.workspace} />
        </section>

        <aside className="space-y-6">
          {context.role === "owner" ? (
            <Link href="/settings/team" className="block rounded-2xl border border-emerald-200 bg-emerald-50 p-6 outline-none transition hover:border-emerald-300 focus-visible:ring-2 focus-visible:ring-emerald-500">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Team management</p>
              <p className="mt-2 text-lg font-semibold text-emerald-950">Manage employees →</p>
              <p className="mt-2 text-sm leading-6 text-emerald-900">Invite, rename, deactivate, or reactivate workspace members.</p>
            </Link>
          ) : null}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Signed-in user
            </p>
            <div className="mt-5 flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-emerald-300">
                {context.user.initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {context.user.displayName}
                </p>
                <p className="truncate text-xs text-slate-500">{context.user.email}</p>
              </div>
            </div>
            <p className="mt-4 rounded-xl bg-slate-50 px-3.5 py-3 text-xs font-semibold text-slate-600">
              {context.role === "owner" ? "Workspace owner" : "Workspace member"}
            </p>
          </section>

          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Live operations
            </p>
            <p className="mt-2 text-sm leading-6 text-emerald-900">
              Tasks, inventory, customers, follow-ups, and attention signals are derived from live workspace data.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
