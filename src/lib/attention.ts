import type {
  AlertSeverity,
  AlertType,
  AttentionSourceType,
  WorkspaceRole,
} from "@/lib/supabase/database.types";

export const alertTypes = [
  "task_overdue",
  "task_urgent_today",
  "inventory_low_stock",
  "follow_up_overdue",
  "follow_up_due_today",
] as const satisfies readonly AlertType[];

export const alertSeverities = [
  "critical",
  "high",
  "medium",
] as const satisfies readonly AlertSeverity[];

export const attentionCategories = [
  "all",
  "tasks",
  "inventory",
  "follow_ups",
] as const;

export const attentionStatuses = [
  "needs_review",
  "acknowledged",
  "all",
] as const;

export const attentionScopes = ["mine", "workspace"] as const;

export type AttentionCategory = (typeof attentionCategories)[number];
export type AttentionStatus = (typeof attentionStatuses)[number];
export type AttentionScope = (typeof attentionScopes)[number];

export type AttentionFilters = {
  category: AttentionCategory;
  query: string;
  scope: AttentionScope;
  severity: AlertSeverity | "all";
  status: AttentionStatus;
};

export type AttentionListItem = {
  acknowledgedAt: string | null;
  actionPath: string;
  alertType: AlertType;
  assignedTo: string | null;
  assigneeName: string;
  conditionFingerprint: string;
  detail: string;
  effectiveDate: string;
  id: string;
  isAcknowledged: boolean;
  severity: AlertSeverity;
  sortRank: number;
  sourceId: string;
  sourceType: AttentionSourceType;
  sourceUpdatedAt: string;
  title: string;
};

export type AttentionSummary = {
  acknowledged: number;
  byType: Record<AlertType, number>;
  critical: number;
  high: number;
  total: number;
  unacknowledged: number;
};

export type DailyOperationsDigest = {
  items: AttentionListItem[];
  message: string;
  summary: AttentionSummary;
};

export const alertTypeLabels: Record<AlertType, string> = {
  follow_up_due_today: "Follow-up due today",
  follow_up_overdue: "Overdue follow-up",
  inventory_low_stock: "Low stock",
  task_overdue: "Overdue task",
  task_urgent_today: "Urgent task due today",
};

export const alertSeverityLabels: Record<AlertSeverity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
};

const severityRank: Record<AlertSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
};

const sourceCategory: Record<AttentionSourceType, Exclude<AttentionCategory, "all">> = {
  follow_up: "follow_ups",
  inventory: "inventory",
  task: "tasks",
};

function firstSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function includesValue<const T extends readonly string[]>(values: T, value: string): value is T[number] {
  return values.some((entry) => entry === value);
}

export function isAlertType(value: string): value is AlertType {
  return includesValue(alertTypes, value);
}

export function attentionEpisodeKey(
  alertType: AlertType,
  sourceId: string,
  conditionFingerprint: string,
) {
  return `${alertType}:${sourceId}:${conditionFingerprint}`;
}

export function parseAttentionFilters(
  searchParams: {
    category?: string | string[];
    q?: string | string[];
    scope?: string | string[];
    severity?: string | string[];
    status?: string | string[];
  },
  role: WorkspaceRole,
): AttentionFilters {
  const defaultScope: AttentionScope = role === "owner" ? "workspace" : "mine";
  const rawCategory = firstSearchValue(searchParams.category) ?? "all";
  const rawScope = firstSearchValue(searchParams.scope) ?? defaultScope;
  const rawSeverity = firstSearchValue(searchParams.severity) ?? "all";
  const rawStatus = firstSearchValue(searchParams.status) ?? "needs_review";

  return {
    category: includesValue(attentionCategories, rawCategory) ? rawCategory : "all",
    query: (firstSearchValue(searchParams.q) ?? "").trim().slice(0, 100),
    scope: includesValue(attentionScopes, rawScope) ? rawScope : defaultScope,
    severity:
      rawSeverity === "all" || includesValue(alertSeverities, rawSeverity)
        ? rawSeverity
        : "all",
    status: includesValue(attentionStatuses, rawStatus) ? rawStatus : "needs_review",
  };
}

export function isInMyAttention(item: AttentionListItem, userId: string) {
  return (
    item.sourceType === "inventory" ||
    item.assignedTo === null ||
    item.assignedTo === userId
  );
}

export function compareAttentionItems(
  left: AttentionListItem,
  right: AttentionListItem,
) {
  if (left.isAcknowledged !== right.isAcknowledged) {
    return left.isAcknowledged ? 1 : -1;
  }

  const severityDifference = severityRank[left.severity] - severityRank[right.severity];
  if (severityDifference !== 0) return severityDifference;

  const dateDifference = left.effectiveDate.localeCompare(right.effectiveDate);
  if (dateDifference !== 0) return dateDifference;

  if (left.sortRank !== right.sortRank) return left.sortRank - right.sortRank;

  const titleDifference = left.title.localeCompare(right.title, "en");
  if (titleDifference !== 0) return titleDifference;

  return left.sourceId.localeCompare(right.sourceId);
}

export function sortAttentionItems(items: AttentionListItem[]) {
  return [...items].sort(compareAttentionItems);
}

export function getAttentionScopeItems(
  items: AttentionListItem[],
  scope: AttentionScope,
  userId: string,
) {
  return scope === "mine" ? items.filter((item) => isInMyAttention(item, userId)) : items;
}

export function filterAttentionItems(
  items: AttentionListItem[],
  filters: AttentionFilters,
  userId: string,
) {
  const scopedItems = getAttentionScopeItems(items, filters.scope, userId);
  const normalizedQuery = filters.query.toLocaleLowerCase("en");

  return sortAttentionItems(
    scopedItems.filter((item) => {
      if (filters.status === "needs_review" && item.isAcknowledged) return false;
      if (filters.status === "acknowledged" && !item.isAcknowledged) return false;
      if (filters.severity !== "all" && item.severity !== filters.severity) return false;
      if (
        filters.category !== "all" &&
        sourceCategory[item.sourceType] !== filters.category
      ) {
        return false;
      }
      if (!normalizedQuery) return true;

      return [item.title, item.detail, item.assigneeName, alertTypeLabels[item.alertType]]
        .join("\n")
        .toLocaleLowerCase("en")
        .includes(normalizedQuery);
    }),
  );
}

export function buildAttentionSummary(items: AttentionListItem[]): AttentionSummary {
  const byType = Object.fromEntries(
    alertTypes.map((alertType) => [alertType, 0]),
  ) as Record<AlertType, number>;

  items.forEach((item) => {
    byType[item.alertType] += 1;
  });

  const acknowledged = items.filter((item) => item.isAcknowledged).length;

  return {
    acknowledged,
    byType,
    critical: items.filter((item) => item.severity === "critical").length,
    high: items.filter((item) => item.severity === "high").length,
    total: items.length,
    unacknowledged: items.length - acknowledged,
  };
}

export function buildDailyOperationsDigest(
  items: AttentionListItem[],
  previewLimit = 6,
): DailyOperationsDigest {
  const sortedItems = sortAttentionItems(items);
  const summary = buildAttentionSummary(sortedItems);
  let message = "No active operational conditions need attention.";

  if (summary.unacknowledged > 0) {
    message = `${summary.unacknowledged} ${summary.unacknowledged === 1 ? "item needs" : "items need"} review across ${summary.total} active ${summary.total === 1 ? "condition" : "conditions"}.`;
  } else if (summary.total > 0) {
    message = `${summary.total} active ${summary.total === 1 ? "condition has been acknowledged and remains" : "conditions have been acknowledged and remain"} open.`;
  }

  return {
    items: sortedItems.slice(0, previewLimit),
    message,
    summary,
  };
}

export function alertSeverityTone(severity: AlertSeverity) {
  const tones: Record<AlertSeverity, string> = {
    critical: "bg-rose-100 text-rose-800 ring-rose-600/15",
    high: "bg-amber-50 text-amber-800 ring-amber-600/10",
    medium: "bg-sky-50 text-sky-700 ring-sky-600/10",
  };

  return tones[severity];
}

export function alertTypeTone(alertType: AlertType) {
  const tones: Record<AlertType, string> = {
    follow_up_due_today: "text-sky-700",
    follow_up_overdue: "text-rose-700",
    inventory_low_stock: "text-amber-800",
    task_overdue: "text-rose-700",
    task_urgent_today: "text-amber-800",
  };

  return tones[alertType];
}
