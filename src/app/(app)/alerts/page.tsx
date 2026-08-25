import type { Metadata } from "next";
import Link from "next/link";
import { AttentionFiltersForm } from "@/components/attention-filters";
import { AttentionList } from "@/components/attention-list";
import { requireAccountContext } from "@/lib/auth";
import { getAttentionPageData } from "@/lib/attention-data";
import {
  alertTypeLabels,
  parseAttentionFilters,
} from "@/lib/attention";
import { formatWorkspaceDate } from "@/lib/tasks";

export const metadata: Metadata = {
  title: "Attention",
};

type AlertsPageProps = {
  searchParams: Promise<{
    category?: string | string[];
    q?: string | string[];
    scope?: string | string[];
    severity?: string | string[];
    status?: string | string[];
  }>;
};

export default async function AlertsPage({ searchParams }: AlertsPageProps) {
  const context = await requireAccountContext();
  if (context.status !== "configured") return null;

  const filters = parseAttentionFilters(await searchParams, context.role);
  const { digest, filteredItems, summary } = await getAttentionPageData(
    context.workspace.id,
    context.user.id,
    filters,
  );
  const defaultScope = context.role === "owner" ? "workspace" : "mine";
  const hasActiveFilters =
    filters.category !== "all" ||
    filters.query.length > 0 ||
    filters.scope !== defaultScope ||
    filters.severity !== "all" ||
    filters.status !== "needs_review";
  const generatedDate = formatWorkspaceDate(new Date(), context.workspace.timezone);
  const conditionCards = [
    { alertType: "task_overdue" as const, tone: "bg-rose-50 text-rose-700" },
    { alertType: "task_urgent_today" as const, tone: "bg-amber-50 text-amber-800" },
    { alertType: "inventory_low_stock" as const, tone: "bg-orange-50 text-orange-800" },
    { alertType: "follow_up_overdue" as const, tone: "bg-rose-50 text-rose-700" },
    { alertType: "follow_up_due_today" as const, tone: "bg-sky-50 text-sky-700" },
  ];

  return (
    <div className="mx-auto w-full max-w-[1550px] p-4 sm:p-6 lg:p-8">
      <section
        aria-labelledby="attention-heading"
        className="flex flex-col gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
            <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            Live workspace attention
          </div>
          <h1
            id="attention-heading"
            className="text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-4xl"
          >
            Attention
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Review overdue work, urgent commitments, and low stock from one focused queue.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <p className="font-semibold text-slate-800">
            {summary.unacknowledged} {summary.unacknowledged === 1 ? "item" : "items"} need review
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {filters.scope === "mine" ? "My Attention" : "All Workspace"} · {summary.total} active
          </p>
        </div>
      </section>

      <section aria-labelledby="condition-summary-heading" className="mt-6">
        <h2 id="condition-summary-heading" className="sr-only">
          Attention condition summary
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {conditionCards.map((card) => (
            <article
              key={card.alertType}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-semibold leading-5 text-slate-600">
                  {alertTypeLabels[card.alertType]}
                </p>
                <span className={`rounded-lg px-2 py-1 text-xs font-bold ${card.tone}`}>
                  {summary.byType[card.alertType]}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="digest-preview-heading"
        className="mt-6 overflow-hidden rounded-2xl bg-slate-950 text-white shadow-[0_14px_40px_rgba(15,23,42,0.12)]"
      >
        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
              Live daily digest · {generatedDate}
            </p>
            <h2 id="digest-preview-heading" className="mt-2 text-xl font-semibold">
              Operations preview
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">{digest.message}</p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-white/[0.06] p-3">
                <p className="text-2xl font-semibold">{digest.summary.unacknowledged}</p>
                <p className="mt-1 text-[11px] text-slate-400">Needs review</p>
              </div>
              <div className="rounded-xl bg-white/[0.06] p-3">
                <p className="text-2xl font-semibold">{digest.summary.critical}</p>
                <p className="mt-1 text-[11px] text-slate-400">Critical</p>
              </div>
              <div className="rounded-xl bg-white/[0.06] p-3">
                <p className="text-2xl font-semibold">{digest.summary.total}</p>
                <p className="mt-1 text-[11px] text-slate-400">Active</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-semibold text-slate-200">Highest-priority conditions</p>
            {digest.items.length ? (
              <div className="mt-3 divide-y divide-white/10">
                {digest.items.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                      <p className="mt-1 truncate text-xs text-slate-400">
                        {alertTypeLabels[item.alertType]} · {item.assigneeName}
                      </p>
                    </div>
                    <Link
                      href={item.actionPath}
                      aria-label={`${item.isAcknowledged ? "Open" : "Review"} ${item.title}`}
                      className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-emerald-200/15 bg-emerald-300/10 px-3 text-xs font-semibold text-emerald-200 outline-none transition hover:border-emerald-200/30 hover:bg-emerald-300/20 hover:text-white focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                    >
                      {item.isAcknowledged ? "Open source" : "Review"}
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm font-semibold text-emerald-300">All clear</p>
                <p className="mt-1 text-xs text-slate-400">No active conditions in this scope.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="attention-filter-heading"
        className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-5"
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id="attention-filter-heading" className="text-sm font-semibold text-slate-900">
            Refine attention
          </h2>
          {summary.acknowledged > 0 ? (
            <Link
              href={`/alerts?scope=${filters.scope}&status=acknowledged`}
              className="text-xs font-semibold text-emerald-700 outline-none hover:text-emerald-900 focus-visible:rounded focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              {summary.acknowledged} acknowledged
            </Link>
          ) : null}
        </div>
        <AttentionFiltersForm filters={filters} role={context.role} />
      </section>

      <div className="mt-6">
        <AttentionList
          hasActiveFilters={hasActiveFilters}
          items={filteredItems}
          totalItems={summary.total}
        />
      </div>
    </div>
  );
}
