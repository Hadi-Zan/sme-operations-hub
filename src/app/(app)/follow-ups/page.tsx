import type { Metadata } from "next";
import { FollowUpFiltersForm } from "@/components/follow-up-filters";
import { FollowUpManager } from "@/components/follow-up-manager";
import { requireAccountContext } from "@/lib/auth";
import { getFollowUpsPageData } from "@/lib/follow-up-data";
import { parseFollowUpFilters } from "@/lib/follow-ups";

export const metadata: Metadata = {
  title: "Follow-ups",
};

type FollowUpsPageProps = {
  searchParams: Promise<{
    assignee?: string | string[];
    customer?: string | string[];
    q?: string | string[];
    status?: string | string[];
    timing?: string | string[];
  }>;
};

export default async function FollowUpsPage({ searchParams }: FollowUpsPageProps) {
  const context = await requireAccountContext();
  if (context.status !== "configured") return null;

  const requestedFilters = parseFollowUpFilters(await searchParams);
  const { customers, filteredFollowUps, filters, members, summary, today } =
    await getFollowUpsPageData(
      context.workspace.id,
      context.workspace.timezone,
      requestedFilters,
    );
  const hasActiveFilters =
    filters.query.length > 0 ||
    filters.status !== "pending" ||
    filters.timing !== "all" ||
    filters.assignee !== "all" ||
    filters.customerId !== null;
  const summaryItems = [
    { label: "Overdue", value: summary.overdue, detail: "Pending before today", tone: "bg-rose-50 text-rose-700" },
    { label: "Due today", value: summary.today, detail: "Pending on today’s workspace date", tone: "bg-amber-50 text-amber-800" },
    { label: "Upcoming", value: summary.upcoming, detail: "Pending after today", tone: "bg-sky-50 text-sky-700" },
    { label: "Completed", value: summary.completed, detail: "Retained as follow-up history", tone: "bg-emerald-50 text-emerald-700" },
  ];

  return (
    <div className="mx-auto w-full max-w-[1550px] p-4 sm:p-6 lg:p-8">
      <section aria-labelledby="follow-ups-heading" className="flex flex-col gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
            <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            Live workspace data
          </div>
          <h1 id="follow-ups-heading" className="text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-4xl">Follow-ups</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Keep customer promises visible, assigned, and recorded with a useful outcome.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <p className="font-semibold text-slate-800">{summary.pending} pending</p>
          <p className="mt-0.5 text-xs text-slate-500">{context.role === "owner" ? "Owner scheduling controls" : "Assigned-member actions"}</p>
        </div>
      </section>

      <section aria-labelledby="follow-up-summary-heading" className="mt-6">
        <h2 id="follow-up-summary-heading" className="sr-only">Follow-up summary</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaryItems.map((item) => (
            <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm font-medium text-slate-600">{item.label}</p>
                <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${item.tone}`}>{item.value}</span>
              </div>
              <p className="mt-5 text-xs leading-5 text-slate-500">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="follow-up-filters-heading" className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-5">
        <h2 id="follow-up-filters-heading" className="sr-only">Filter follow-ups</h2>
        <FollowUpFiltersForm
          customers={customers}
          members={members}
        />
      </section>

      <div className="mt-6">
        <FollowUpManager currentUserId={context.user.id} customers={customers} defaultCustomerId={filters.customerId} followUps={filteredFollowUps} hasActiveFilters={hasActiveFilters} members={members} role={context.role} today={today} totalFollowUps={summary.pending + summary.completed} />
      </div>
    </div>
  );
}
