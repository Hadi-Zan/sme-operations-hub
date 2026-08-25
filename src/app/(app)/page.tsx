import Link from "next/link";
import { customerInitials } from "@/lib/customers";
import { workstreamProgress } from "@/lib/demo-data";
import { requireAccountContext } from "@/lib/auth";
import { getDashboardFollowUpData } from "@/lib/follow-up-data";
import { formatFollowUpDate, formatFollowUpTime } from "@/lib/follow-ups";
import { getDashboardInventoryData } from "@/lib/inventory-data";
import { formatInventoryQuantity } from "@/lib/inventory";
import { getDashboardTaskData } from "@/lib/task-data";
import {
  taskPriorityLabels,
  taskPriorityTone,
  taskStatusLabels,
} from "@/lib/tasks";

export default async function DashboardPage() {
  const context = await requireAccountContext();
  if (context.status !== "configured") return null;

  const [taskData, inventoryData, followUpData] = await Promise.all([
    getDashboardTaskData(context.workspace.id, context.workspace.timezone),
    getDashboardInventoryData(context.workspace.id),
    getDashboardFollowUpData(context.workspace.id, context.workspace.timezone),
  ]);
  const firstName = context.user.displayName.split(/\s+/)[0];
  const summaryMetrics = [
    {
      label: "Open tasks",
      value: String(taskData.open),
      detail: `${taskData.dueToday} scheduled for today`,
      change: "Live",
      tone: "bg-sky-50 text-sky-700 ring-sky-600/10",
    },
    {
      label: "Due today",
      value: String(taskData.dueToday),
      detail:
        taskData.urgentDueToday === 1
          ? "1 marked as urgent"
          : `${taskData.urgentDueToday} marked as urgent`,
      change: "Live",
      tone: "bg-rose-50 text-rose-700 ring-rose-600/10",
    },
    {
      label: "Low stock",
      value: String(inventoryData.lowStock),
      detail:
        inventoryData.lowStock === 1
          ? "1 item at or below its reorder level"
          : `${inventoryData.lowStock} items at or below reorder level`,
      change: "Live",
      tone: "bg-amber-50 text-amber-800 ring-amber-600/10",
    },
    {
      label: "Follow-ups",
      value: String(followUpData.pending),
      detail:
        followUpData.overdue > 0
          ? `${followUpData.overdue} overdue · ${followUpData.dueToday} due today`
          : `${followUpData.dueToday} due today · none overdue`,
      change: "Live",
      tone: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
      <section
        aria-labelledby="dashboard-heading"
        className="flex flex-col gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span>{taskData.formattedDate}</span>
            <span aria-hidden="true" className="size-1 rounded-full bg-slate-300" />
            <span className="font-medium text-emerald-700">
              Live tasks, inventory, customers, and follow-ups · demo weekly pulse
            </span>
          </div>
          <h1
            id="dashboard-heading"
            className="text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-4xl"
          >
            Good morning, {firstName}.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Here is a clear view of today&apos;s work across your service operations.
          </p>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
          <span className="size-1.5 rounded-full bg-amber-500" aria-hidden="true" />
          Mixed live and demo data
        </div>
      </section>

      <section aria-labelledby="summary-heading" className="mt-6">
        <h2 id="summary-heading" className="sr-only">
          Operations summary
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaryMetrics.map((metric) => (
            <article
              key={metric.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
            >
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm font-medium text-slate-600">{metric.label}</p>
                <span
                  className={`rounded-full px-2 py-1 text-[11px] font-semibold ring-1 ring-inset ${metric.tone}`}
                >
                  {metric.change}
                </span>
              </div>
              <p className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">
                {metric.value}
              </p>
              <p className="mt-1 text-xs text-slate-500">{metric.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.7fr)]">
        <section
          aria-labelledby="priorities-heading"
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
        >
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                Live tasks
              </p>
              <h2 id="priorities-heading" className="mt-1 text-lg font-semibold text-slate-950">
                Daily priorities
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {taskData.dueToday} {taskData.dueToday === 1 ? "item" : "items"}
              </span>
              <Link
                href="/tasks"
                className="rounded-lg text-xs font-semibold text-emerald-700 outline-none transition hover:text-emerald-900 focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                View tasks
              </Link>
            </div>
          </div>

          {taskData.dailyPriorities.length ? (
            <div className="divide-y divide-slate-100">
              {taskData.dailyPriorities.map((task) => (
                <article
                  key={task.id}
                  className="grid gap-4 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6"
                >
                  <div className="flex min-w-0 gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 size-3 shrink-0 rounded-full border-2 border-emerald-300 bg-white"
                    />
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-slate-900">{task.title}</h3>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        Assigned to {task.assigneeName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pl-6 sm:pl-0">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${taskPriorityTone(task.priority)}`}
                    >
                      {taskPriorityLabels[task.priority]}
                    </span>
                    <div className="text-right">
                      <span className="block text-xs font-semibold text-slate-700">Due today</span>
                      <span className="text-[11px] text-slate-400">
                        {taskStatusLabels[task.status]}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="px-5 py-10 text-center sm:px-6">
              <p className="text-sm font-semibold text-slate-800">No tasks are due today</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                New tasks with today&apos;s due date will appear here automatically.
              </p>
            </div>
          )}
        </section>

        <section
          aria-labelledby="pulse-heading"
          className="rounded-2xl bg-slate-950 p-6 text-white shadow-[0_14px_40px_rgba(15,23,42,0.12)]"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
            Demo weekly pulse
          </p>
          <h2 id="pulse-heading" className="mt-1 text-lg font-semibold">
            Work is moving steadily
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            72% of scheduled work is complete. Two areas need attention before Monday.
          </p>

          <div className="mt-7 space-y-5">
            {workstreamProgress.map((workstream) => (
              <div key={workstream.label}>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-200">{workstream.label}</span>
                  <span className="text-slate-400">{workstream.value}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full ${workstream.color}`}
                    style={{ width: `${workstream.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-7 rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-semibold text-white">Next review</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Monday at 8:30 AM · Check low stock and unconfirmed visits.
            </p>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section
          aria-labelledby="inventory-heading"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-600">
                Needs attention
              </p>
              <h2 id="inventory-heading" className="mt-1 text-lg font-semibold text-slate-950">
                Inventory alerts
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                Live data
              </span>
              <Link
                href="/inventory?stock=low"
                className="rounded-lg text-xs font-semibold text-emerald-700 outline-none transition hover:text-emerald-900 focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                View inventory
              </Link>
            </div>
          </div>

          {inventoryData.alerts.length ? (
            <div className="mt-5 space-y-3">
              {inventoryData.alerts.map((item) => (
                <article
                  key={item.id}
                  className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3"
                >
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-slate-800">{item.name}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Reorder at {formatInventoryQuantity(item.reorderThreshold)} {item.unitOfMeasure}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-rose-700">
                      {formatInventoryQuantity(item.currentQuantity)} {item.unitOfMeasure}
                    </p>
                    <p className="text-[11px] text-slate-400">remaining</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-xl bg-emerald-50 px-4 py-5 text-center">
              <p className="text-sm font-semibold text-emerald-900">No low-stock items</p>
              <p className="mt-1 text-xs leading-5 text-emerald-700">
                Inventory alerts will appear when stock reaches a reorder threshold.
              </p>
            </div>
          )}
        </section>

        <section
          aria-labelledby="followups-heading"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
                Customer care
              </p>
              <h2 id="followups-heading" className="mt-1 text-lg font-semibold text-slate-950">
                Follow-ups needing attention
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                Live data
              </span>
              <Link
                href="/follow-ups"
                className="rounded-lg text-xs font-semibold text-emerald-700 outline-none transition hover:text-emerald-900 focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                View follow-ups
              </Link>
            </div>
          </div>

          {followUpData.items.length ? (
            <div className="mt-5 divide-y divide-slate-100">
              {followUpData.items.map((followUp) => {
                const dueTime = formatFollowUpTime(followUp.dueTime);
                const dueLabel = followUp.isOverdue
                  ? `Overdue · ${formatFollowUpDate(followUp.dueDate)}`
                  : followUp.isDueToday
                    ? `Today${dueTime ? ` · ${dueTime}` : ""}`
                    : `${formatFollowUpDate(followUp.dueDate)}${dueTime ? ` · ${dueTime}` : ""}`;

                return (
                  <article key={followUp.id} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sky-50 text-xs font-bold text-sky-700">
                      {customerInitials(followUp.customerName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="truncate text-sm font-semibold text-slate-800">
                          {followUp.customerName}
                        </h3>
                        <span
                          className={`shrink-0 text-xs font-semibold ${followUp.isOverdue ? "text-rose-700" : "text-slate-500"}`}
                        >
                          {dueLabel}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-slate-500">{followUp.title}</p>
                      <p className="mt-1 truncate text-[11px] text-slate-400">
                        Assigned to {followUp.assigneeName}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-5 rounded-xl bg-emerald-50 px-4 py-5 text-center">
              <p className="text-sm font-semibold text-emerald-900">No pending follow-ups</p>
              <p className="mt-1 text-xs leading-5 text-emerald-700">
                New customer promises will appear here by due date.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
