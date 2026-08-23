import {
  followUps,
  inventoryAlerts,
  priorityTasks,
  summaryMetrics,
  workstreamProgress,
} from "@/lib/demo-data";

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
      <section
        aria-labelledby="dashboard-heading"
        className="flex flex-col gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span>Sunday, 23 August</span>
            <span aria-hidden="true" className="size-1 rounded-full bg-slate-300" />
            <span className="font-medium text-emerald-700">Sample workspace</span>
          </div>
          <h1
            id="dashboard-heading"
            className="text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-4xl"
          >
            Good morning, Hadi.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Here is a clear view of today&apos;s work across your service operations.
          </p>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
          <span className="size-1.5 rounded-full bg-amber-500" aria-hidden="true" />
          Demo data only
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
                Today
              </p>
              <h2 id="priorities-heading" className="mt-1 text-lg font-semibold text-slate-950">
                Daily priorities
              </h2>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {priorityTasks.length} items
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {priorityTasks.map((task) => (
              <article
                key={task.title}
                className="grid gap-4 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6"
              >
                <div className="flex min-w-0 gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-1.5 size-3 shrink-0 rounded-full border-2 border-slate-300 bg-white"
                  />
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-slate-900">{task.title}</h3>
                    <p className="mt-1 truncate text-xs text-slate-500">{task.customer}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 pl-6 sm:pl-0">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${task.statusTone}`}>
                    {task.status}
                  </span>
                  <div className="text-right">
                    <time className="block text-xs font-semibold text-slate-700">{task.due}</time>
                    <span className="text-[11px] text-slate-400">{task.owner}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="pulse-heading"
          className="rounded-2xl bg-slate-950 p-6 text-white shadow-[0_14px_40px_rgba(15,23,42,0.12)]"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
            Weekly pulse
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
            <span className="text-xs font-medium text-slate-400">Updated 8:15 AM</span>
          </div>

          <div className="mt-5 space-y-3">
            {inventoryAlerts.map((item) => (
              <article
                key={item.name}
                className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3"
              >
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-slate-800">{item.name}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">Reorder at {item.reorderAt}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-rose-700">{item.remaining}</p>
                  <p className="text-[11px] text-slate-400">remaining</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="followups-heading"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-6"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
              Customer care
            </p>
            <h2 id="followups-heading" className="mt-1 text-lg font-semibold text-slate-950">
              Upcoming follow-ups
            </h2>
          </div>

          <div className="mt-5 divide-y divide-slate-100">
            {followUps.map((followUp) => (
              <article key={followUp.customer} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sky-50 text-xs font-bold text-sky-700">
                  {followUp.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="truncate text-sm font-semibold text-slate-800">
                      {followUp.customer}
                    </h3>
                    <time className="shrink-0 text-xs font-semibold text-slate-500">
                      {followUp.when}
                    </time>
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-500">{followUp.reason}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
