import type { FollowUpStatus, WorkspaceRole } from "@/lib/supabase/database.types";

export const followUpStatuses = ["pending", "completed"] as const satisfies readonly FollowUpStatus[];
export const followUpTimings = ["all", "overdue", "today", "upcoming"] as const;

export type FollowUpTiming = (typeof followUpTimings)[number];
export type FollowUpAssigneeFilter = "all" | "unassigned" | string;

export type FollowUpFilters = {
  assignee: FollowUpAssigneeFilter;
  customerId: string | null;
  query: string;
  status: FollowUpStatus | "all";
  timing: FollowUpTiming;
};

export type FollowUpCustomerOption = {
  contactName: string | null;
  id: string;
  isActive: boolean;
  name: string;
};

export type FollowUpMemberOption = {
  displayName: string;
  role: WorkspaceRole;
  userId: string;
};

export type FollowUpListItem = {
  assignedTo: string | null;
  assigneeName: string;
  completedAt: string | null;
  completedByName: string | null;
  createdAt: string;
  customerContactName: string | null;
  customerId: string;
  customerIsActive: boolean;
  customerName: string;
  dueDate: string;
  dueTime: string | null;
  formattedCompletedAt: string | null;
  id: string;
  isDueToday: boolean;
  isOverdue: boolean;
  isUpcoming: boolean;
  notes: string | null;
  outcome: string | null;
  status: FollowUpStatus;
  title: string;
  updatedAt: string;
};

export type FollowUpPageSummary = {
  completed: number;
  overdue: number;
  pending: number;
  today: number;
  upcoming: number;
};

export type DashboardFollowUpItem = Pick<
  FollowUpListItem,
  | "assignedTo"
  | "assigneeName"
  | "customerName"
  | "dueDate"
  | "dueTime"
  | "id"
  | "isDueToday"
  | "isOverdue"
  | "title"
>;

export type DashboardFollowUpData = {
  dueToday: number;
  items: DashboardFollowUpItem[];
  overdue: number;
  pending: number;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function firstSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function isFollowUpStatus(value: string): value is FollowUpStatus {
  return followUpStatuses.some((status) => status === value);
}

export function isFollowUpTiming(value: string): value is FollowUpTiming {
  return followUpTimings.some((timing) => timing === value);
}

export function parseFollowUpFilters(searchParams: {
  assignee?: string | string[];
  customer?: string | string[];
  q?: string | string[];
  status?: string | string[];
  timing?: string | string[];
}): FollowUpFilters {
  const rawAssignee = firstSearchValue(searchParams.assignee) ?? "all";
  const rawCustomer = firstSearchValue(searchParams.customer) ?? "";
  const rawStatus = firstSearchValue(searchParams.status) ?? "pending";
  const rawTiming = firstSearchValue(searchParams.timing) ?? "all";

  return {
    assignee:
      rawAssignee === "all" || rawAssignee === "unassigned" || uuidPattern.test(rawAssignee)
        ? rawAssignee
        : "all",
    customerId: uuidPattern.test(rawCustomer) ? rawCustomer : null,
    query: (firstSearchValue(searchParams.q) ?? "").trim().slice(0, 100),
    status: rawStatus === "all" || isFollowUpStatus(rawStatus) ? rawStatus : "pending",
    timing: isFollowUpTiming(rawTiming) ? rawTiming : "all",
  };
}

export function getDateInWorkspace(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function formatFollowUpDate(date: string) {
  return new Intl.DateTimeFormat("en-SG", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00Z`));
}

export function formatFollowUpTime(time: string | null) {
  if (!time) return null;
  const [hour, minute] = time.split(":").map(Number);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
}

export function formatCompletionTime(timestamp: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-SG", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZone,
    year: "numeric",
  }).format(new Date(timestamp));
}

export function followUpStatusTone(status: FollowUpStatus) {
  return status === "completed"
    ? "bg-emerald-50 text-emerald-700 ring-emerald-600/10"
    : "bg-slate-100 text-slate-600 ring-slate-500/10";
}

export function followUpTimingTone(followUp: FollowUpListItem) {
  if (followUp.status === "completed") return followUpStatusTone("completed");
  if (followUp.isOverdue) return "bg-rose-50 text-rose-700 ring-rose-600/10";
  if (followUp.isDueToday) return "bg-amber-50 text-amber-800 ring-amber-600/10";
  return "bg-sky-50 text-sky-700 ring-sky-600/10";
}

export function followUpTimingLabel(followUp: FollowUpListItem) {
  if (followUp.status === "completed") return "Completed";
  if (followUp.isOverdue) return "Overdue";
  if (followUp.isDueToday) return "Due today";
  return "Upcoming";
}
