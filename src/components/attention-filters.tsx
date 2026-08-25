import Link from "next/link";
import {
  alertSeverityLabels,
  alertSeverities,
  type AttentionFilters,
} from "@/lib/attention";
import type { WorkspaceRole } from "@/lib/supabase/database.types";

type AttentionFiltersFormProps = {
  filters: AttentionFilters;
  role: WorkspaceRole;
};

export function AttentionFiltersForm({ filters, role }: AttentionFiltersFormProps) {
  const defaultScope = role === "owner" ? "workspace" : "mine";
  const hasActiveFilters =
    filters.category !== "all" ||
    filters.query.length > 0 ||
    filters.scope !== defaultScope ||
    filters.severity !== "all" ||
    filters.status !== "needs_review";

  return (
    <form
      key={JSON.stringify(filters)}
      action="/alerts"
      method="get"
      className="grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1fr)_auto] 2xl:items-end"
    >
      <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-[minmax(260px,1.6fr)_repeat(4,minmax(0,1fr))]">
        <div className="min-w-0 sm:col-span-2 2xl:col-span-1">
          <label htmlFor="attention-search" className="sr-only">
            Search attention
          </label>
          <input
            id="attention-search"
            name="q"
            type="search"
            defaultValue={filters.query}
            maxLength={100}
            placeholder="Search title, detail, or assignee"
            className="h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          />
        </div>

        <div className="min-w-0">
          <label htmlFor="attention-scope" className="sr-only">
            Attention scope
          </label>
          <select
            id="attention-scope"
            name="scope"
            defaultValue={filters.scope}
            className="h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          >
            <option value="mine">My Attention</option>
            <option value="workspace">All Workspace</option>
          </select>
        </div>

        <div className="min-w-0">
          <label htmlFor="attention-status" className="sr-only">
            Acknowledgement status
          </label>
          <select
            id="attention-status"
            name="status"
            defaultValue={filters.status}
            className="h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          >
            <option value="needs_review">Needs review</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="all">All states</option>
          </select>
        </div>

        <div className="min-w-0">
          <label htmlFor="attention-category" className="sr-only">
            Attention category
          </label>
          <select
            id="attention-category"
            name="category"
            defaultValue={filters.category}
            className="h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          >
            <option value="all">All categories</option>
            <option value="tasks">Tasks</option>
            <option value="inventory">Inventory</option>
            <option value="follow_ups">Follow-ups</option>
          </select>
        </div>

        <div className="min-w-0">
          <label htmlFor="attention-severity" className="sr-only">
            Attention severity
          </label>
          <select
            id="attention-severity"
            name="severity"
            defaultValue={filters.severity}
            className="h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          >
            <option value="all">All severity levels</option>
            {alertSeverities.map((severity) => (
              <option key={severity} value={severity}>
                {alertSeverityLabels[severity]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4 2xl:border-t-0 2xl:pt-0">
        <button
          type="submit"
          className="inline-flex h-11 min-w-24 flex-1 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 sm:flex-none"
        >
          Apply
        </button>
        {hasActiveFilters ? (
          <Link
            href="/alerts"
            className="inline-flex h-11 min-w-24 flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-600 outline-none transition hover:bg-slate-50 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-emerald-500 sm:flex-none"
          >
            Clear
          </Link>
        ) : null}
      </div>
    </form>
  );
}
