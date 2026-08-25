import Link from "next/link";
import { AlertAcknowledgeButton } from "@/components/alert-acknowledge-button";
import {
  alertSeverityLabels,
  alertSeverityTone,
  alertTypeLabels,
  alertTypeTone,
  type AttentionListItem,
} from "@/lib/attention";

type AttentionListProps = {
  hasActiveFilters: boolean;
  items: AttentionListItem[];
  totalItems: number;
};

function sourceLabel(item: AttentionListItem) {
  if (item.sourceType === "inventory") return "Open inventory";
  if (item.sourceType === "follow_up") return "Open follow-ups";
  return "Open tasks";
}

export function AttentionList({
  hasActiveFilters,
  items,
  totalItems,
}: AttentionListProps) {
  if (!items.length) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-50 text-lg font-bold text-emerald-700">
          ✓
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-950">
          {hasActiveFilters ? "No attention items match these filters" : "Nothing needs review"}
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
          {hasActiveFilters
            ? "Change or clear the filters to see other active operational conditions."
            : totalItems > 0
              ? "All active conditions in this scope have been acknowledged. They remain available under Acknowledged."
              : "No overdue work, urgent tasks, low stock, or due customer follow-ups are active in this scope."}
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="attention-list-heading"
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
    >
      <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
        <h2 id="attention-list-heading" className="text-sm font-semibold text-slate-900">
          Operational conditions
        </h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Acknowledgement records review; only the underlying task, stock, or follow-up can resolve a condition.
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {items.map((item) => (
          <article
            key={item.id}
            className={`grid gap-4 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center ${
              item.isAcknowledged ? "bg-slate-50/70" : "bg-white"
            }`}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-xs font-semibold ${alertTypeTone(item.alertType)}`}
                >
                  {alertTypeLabels[item.alertType]}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${alertSeverityTone(item.severity)}`}
                >
                  {alertSeverityLabels[item.severity]}
                </span>
                {item.isAcknowledged ? (
                  <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                    Acknowledged
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    Needs review
                  </span>
                )}
              </div>
              <h3 className="mt-3 text-base font-semibold text-slate-950">{item.title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                <span>{item.assigneeName}</span>
                <Link
                  href={item.actionPath}
                  className="font-semibold text-emerald-700 outline-none transition hover:text-emerald-900 focus-visible:rounded focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  {sourceLabel(item)}
                </Link>
              </div>
            </div>

            <AlertAcknowledgeButton
              alertType={item.alertType}
              conditionFingerprint={item.conditionFingerprint}
              isAcknowledged={item.isAcknowledged}
              sourceId={item.sourceId}
            />
          </article>
        ))}
      </div>
    </section>
  );
}
