import Link from "next/link";
import { requireAccountContext } from "@/lib/auth";
import { getDashboardAttentionData } from "@/lib/attention-data";
import {
  alertSeverityLabels,
  alertSeverityTone,
  alertTypeLabels,
} from "@/lib/attention";
import { getDashboardFollowUpData } from "@/lib/follow-up-data";
import { getDashboardInventoryData } from "@/lib/inventory-data";
import { getDashboardTaskData } from "@/lib/task-data";

export default async function DashboardPage() {
  const context = await requireAccountContext();
  if (context.status !== "configured") return null;

  const [taskData, inventoryData, followUpData, attentionData] = await Promise.all([
    getDashboardTaskData(context.workspace.id, context.workspace.timezone),
    getDashboardInventoryData(context.workspace.id),
    getDashboardFollowUpData(context.workspace.id, context.workspace.timezone),
    getDashboardAttentionData(context.workspace.id, context.user.id),
  ]);
  const firstName = context.user.displayName.split(/\s+/)[0];
  const { digest } = attentionData;
  const summaryMetrics = [
    {
      label: "Open tasks",
      value: taskData.open,
      detail: `${taskData.dueToday} scheduled for today`,
      tone: "bg-sky-50 text-sky-700",
    },
    {
      label: "Overdue tasks",
      value: digest.summary.byType.task_overdue,
      detail: "Open tasks past their workspace due date",
      tone: "bg-rose-50 text-rose-700",
    },
    {
      label: "Urgent today",
      value: digest.summary.byType.task_urgent_today,
      detail: "Urgent open tasks due today",
      tone: "bg-amber-50 text-amber-800",
    },
    {
      label: "Low stock",
      value: inventoryData.lowStock,
      detail: "At or below reorder threshold",
      tone: "bg-orange-50 text-orange-800",
    },
    {
      label: "Follow-ups",
      value: followUpData.pending,
      detail: `${followUpData.overdue} overdue · ${followUpData.dueToday} due today`,
      tone: "bg-emerald-50 text-emerald-700",
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
              Live operations and attention data
            </span>
          </div>
          <h1
            id="dashboard-heading"
            className="text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-4xl"
          >
            Good morning, {firstName}.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Here is today&apos;s operational picture across work, stock, and customer commitments.
          </p>
        </div>

        <Link
          href="/alerts"
          className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold outline-none ring-1 ring-inset transition focus-visible:ring-2 focus-visible:ring-emerald-500 ${
            digest.summary.unacknowledged > 0
              ? "bg-amber-50 text-amber-800 ring-amber-600/15 hover:bg-amber-100"
              : "bg-emerald-50 text-emerald-800 ring-emerald-600/15 hover:bg-emerald-100"
          }`}
        >
          <span
            className={`size-1.5 rounded-full ${digest.summary.unacknowledged > 0 ? "bg-amber-500" : "bg-emerald-500"}`}
            aria-hidden="true"
          />
          {digest.summary.unacknowledged > 0
            ? `${digest.summary.unacknowledged} need review`
            : "Attention reviewed"}
        </Link>
      </section>

      <section aria-labelledby="summary-heading" className="mt-6">
        <h2 id="summary-heading" className="sr-only">
          Operations summary
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {summaryMetrics.map((metric) => (
            <article
              key={metric.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
            >
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm font-medium text-slate-600">{metric.label}</p>
                <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${metric.tone}`}>
                  {metric.value}
                </span>
              </div>
              <p className="mt-5 text-xs leading-5 text-slate-500">{metric.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="digest-heading"
        className="mt-6 overflow-hidden rounded-2xl bg-slate-950 text-white shadow-[0_14px_40px_rgba(15,23,42,0.12)]"
      >
        <div className="grid lg:grid-cols-[minmax(300px,0.7fr)_minmax(0,1.3fr)]">
          <div className="border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
              Live daily operations digest
            </p>
            <h2 id="digest-heading" className="mt-2 text-2xl font-semibold tracking-tight">
              What needs attention now
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">{digest.message}</p>

            <div className="mt-6 grid grid-cols-3 gap-2">
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

            <Link
              href="/alerts"
              className="mt-6 inline-flex rounded-lg text-sm font-semibold text-emerald-300 outline-none transition hover:text-emerald-200 focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              Open Attention
            </Link>
          </div>

          <div className="p-5 sm:p-6">
            {digest.items.length ? (
              <div className="divide-y divide-white/10">
                {digest.items.map((item) => (
                  <article
                    key={item.id}
                    className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-semibold text-emerald-300">
                          {alertTypeLabels[item.alertType]}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${alertSeverityTone(item.severity)}`}
                        >
                          {alertSeverityLabels[item.severity]}
                        </span>
                      </div>
                      <h3 className="mt-2 truncate text-sm font-semibold text-white">{item.title}</h3>
                      <p className="mt-1 truncate text-xs text-slate-400">
                        {item.detail} · {item.assigneeName}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[11px] font-semibold ${item.isAcknowledged ? "text-slate-400" : "text-emerald-300"}`}
                      >
                        {item.isAcknowledged ? "Acknowledged" : "Needs review"}
                      </span>
                      <Link
                        href={item.actionPath}
                        aria-label={`${item.isAcknowledged ? "Open" : "Review"} ${item.title}`}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] px-3 text-xs font-semibold text-white outline-none transition hover:border-emerald-200/30 hover:bg-emerald-300/15 focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                      >
                        {item.isAcknowledged ? "Open source" : "Review"}
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="flex min-h-56 flex-col items-center justify-center text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-emerald-300 text-lg font-bold text-slate-950">
                  ✓
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">Operations are all clear</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                  New overdue work, urgent commitments, or low-stock conditions will appear here automatically.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
            Today&apos;s commitments
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">Scheduled work</h2>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link
              href="/tasks?status=active"
              className="rounded-xl bg-sky-50 p-4 outline-none transition hover:bg-sky-100 focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              <p className="text-2xl font-semibold text-sky-900">{taskData.dueToday}</p>
              <p className="mt-1 text-xs font-semibold text-sky-700">Tasks due today</p>
            </Link>
            <Link
              href="/follow-ups?status=pending&timing=today"
              className="rounded-xl bg-emerald-50 p-4 outline-none transition hover:bg-emerald-100 focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <p className="text-2xl font-semibold text-emerald-900">{followUpData.dueToday}</p>
              <p className="mt-1 text-xs font-semibold text-emerald-700">Follow-ups due today</p>
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
            Review state
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">Attention coverage</h2>
          <div className="mt-5 flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {digest.summary.acknowledged} acknowledged
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Acknowledged conditions remain active until their source is resolved.
              </p>
            </div>
            <Link
              href="/alerts?status=acknowledged&scope=workspace"
              className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              Review
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
