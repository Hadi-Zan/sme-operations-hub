import Link from "next/link";
import type { ReactNode } from "react";
import { Navigation } from "@/components/navigation";

type WorkspaceShellProps = {
  children: ReactNode;
};

export function WorkspaceShell({ children }: WorkspaceShellProps) {
  return (
    <div className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen flex-col bg-slate-950 px-4 py-5 text-white lg:flex">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-300 text-xs font-black tracking-tight text-slate-950">
            SO
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-tight">SME Operations</span>
            <span className="block text-xs text-slate-500">Daily workspace</span>
          </span>
        </Link>

        <div className="mt-9 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
          Workspace
        </div>
        <div className="mt-3">
          <Navigation variant="desktop" />
        </div>

        <div className="mt-auto">
          <div className="mb-4 rounded-xl border border-white/[0.08] bg-white/[0.04] p-4">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-300" aria-hidden="true" />
              <p className="text-xs font-semibold text-slate-200">Brightside Services</p>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-slate-500">
              Phase 1 sample workspace. No live systems are connected.
            </p>
          </div>

          <div className="flex items-center gap-3 border-t border-white/[0.08] px-2 pt-4">
            <span className="flex size-9 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-200">
              HZ
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold text-slate-200">Hadi Zan</span>
              <span className="block text-[11px] text-slate-500">Workspace owner</span>
            </span>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 lg:hidden"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-slate-950 text-[10px] font-black text-emerald-300">
                SO
              </span>
              <span className="text-sm font-semibold text-slate-900">Operations Hub</span>
            </Link>

            <div className="hidden lg:block">
              <p className="text-xs font-medium text-slate-400">Brightside Services</p>
              <p className="text-sm font-semibold text-slate-800">Operations overview</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 sm:inline-flex">
                Sample data
              </span>
              <span className="flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-sm lg:hidden">
                HZ
              </span>
            </div>
          </div>

          <div className="overflow-x-auto border-t border-slate-100 px-3 py-2 lg:hidden">
            <Navigation variant="mobile" />
          </div>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}
