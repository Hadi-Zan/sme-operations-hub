import type { Metadata } from "next";
import Link from "next/link";
import { TaskManager } from "@/components/task-manager";
import { requireAccountContext } from "@/lib/auth";
import { getTasksPageData } from "@/lib/task-data";
import {
  parseTaskFilters,
  taskPriorities,
  taskPriorityLabels,
  taskStatuses,
  taskStatusLabels,
} from "@/lib/tasks";

export const metadata: Metadata = {
  title: "Tasks",
};

type TasksPageProps = {
  searchParams: Promise<{
    priority?: string | string[];
    q?: string | string[];
    status?: string | string[];
  }>;
};

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const context = await requireAccountContext();
  if (context.status !== "configured") return null;

  const filters = parseTaskFilters(await searchParams);
  const { filteredTasks, members, summary, today } = await getTasksPageData(
    context.workspace.id,
    context.workspace.timezone,
    filters,
  );
  const hasActiveFilters =
    filters.query.length > 0 || filters.status !== "active" || filters.priority !== "all";

  const summaryItems = [
    {
      detail: `${summary.total} total workspace ${summary.total === 1 ? "task" : "tasks"}`,
      label: "Open tasks",
      tone: "bg-sky-50 text-sky-700",
      value: summary.open,
    },
    {
      detail: "Incomplete tasks scheduled for today",
      label: "Due today",
      tone: "bg-amber-50 text-amber-800",
      value: summary.dueToday,
    },
    {
      detail: "Incomplete tasks past their due date",
      label: "Overdue",
      tone: "bg-rose-50 text-rose-700",
      value: summary.overdue,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8">
      <section
        aria-labelledby="tasks-heading"
        className="flex flex-col gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
            <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            Live workspace data
          </div>
          <h1
            id="tasks-heading"
            className="text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-4xl"
          >
            Tasks
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Plan, assign, and complete the practical work that keeps daily operations moving.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <p className="font-semibold text-slate-800">{context.workspace.name}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {context.role === "owner" ? "Owner task controls" : "Member task access"}
          </p>
        </div>
      </section>

      <section aria-labelledby="task-summary-heading" className="mt-6">
        <h2 id="task-summary-heading" className="sr-only">
          Task summary
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {summaryItems.map((item) => (
            <article
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
            >
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm font-medium text-slate-600">{item.label}</p>
                <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${item.tone}`}>
                  {item.value}
                </span>
              </div>
              <p className="mt-5 text-xs leading-5 text-slate-500">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="task-filters-heading"
        className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-5"
      >
        <h2 id="task-filters-heading" className="sr-only">
          Filter tasks
        </h2>
        <form
          action="/tasks"
          method="get"
          className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_190px_190px_auto]"
        >
          <div>
            <label htmlFor="task-search" className="sr-only">
              Search tasks
            </label>
            <input
              id="task-search"
              name="q"
              type="search"
              defaultValue={filters.query}
              maxLength={100}
              placeholder="Search title or description"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            />
          </div>
          <div>
            <label htmlFor="status-filter" className="sr-only">
              Filter by status
            </label>
            <select
              id="status-filter"
              name="status"
              defaultValue={filters.status}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            >
              <option value="active">Active tasks</option>
              <option value="all">All statuses</option>
              {taskStatuses.map((status) => (
                <option key={status} value={status}>
                  {taskStatusLabels[status]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="priority-filter" className="sr-only">
              Filter by priority
            </label>
            <select
              id="priority-filter"
              name="priority"
              defaultValue={filters.priority}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            >
              <option value="all">All priorities</option>
              {taskPriorities.map((priority) => (
                <option key={priority} value={priority}>
                  {taskPriorityLabels[priority]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              Apply
            </button>
            {hasActiveFilters ? (
              <Link
                href="/tasks"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 outline-none transition hover:bg-slate-50 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                Clear
              </Link>
            ) : null}
          </div>
        </form>
      </section>

      <div className="mt-6">
        <TaskManager
          currentUserId={context.user.id}
          hasActiveFilters={hasActiveFilters}
          members={members}
          role={context.role}
          tasks={filteredTasks}
          today={today}
          totalTasks={summary.total}
        />
      </div>
    </div>
  );
}
