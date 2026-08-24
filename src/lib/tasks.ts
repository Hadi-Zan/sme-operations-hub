import type {
  TaskPriority,
  TaskStatus,
  WorkspaceRole,
} from "@/lib/supabase/database.types";

export const taskStatuses = ["todo", "in_progress", "completed"] as const satisfies readonly TaskStatus[];
export const taskPriorities = ["low", "medium", "high", "urgent"] as const satisfies readonly TaskPriority[];

export const taskStatusLabels: Record<TaskStatus, string> = {
  completed: "Completed",
  in_progress: "In progress",
  todo: "To do",
};

export const taskPriorityLabels: Record<TaskPriority, string> = {
  high: "High",
  low: "Low",
  medium: "Medium",
  urgent: "Urgent",
};

export type TaskFilters = {
  priority: TaskPriority | "all";
  query: string;
  status: TaskStatus | "active" | "all";
};

export type TaskListItem = {
  assignedTo: string | null;
  assigneeName: string;
  createdAt: string;
  description: string | null;
  dueDate: string | null;
  id: string;
  priority: TaskPriority;
  status: TaskStatus;
  title: string;
  updatedAt: string;
};

export type WorkspaceMemberOption = {
  displayName: string;
  role: WorkspaceRole;
  userId: string;
};

export type TaskPageSummary = {
  dueToday: number;
  open: number;
  overdue: number;
  total: number;
};

export type DashboardPriorityTask = {
  assignedTo: string | null;
  assigneeName: string;
  id: string;
  priority: TaskPriority;
  status: TaskStatus;
  title: string;
};

export type DashboardTaskData = {
  dailyPriorities: DashboardPriorityTask[];
  dueToday: number;
  formattedDate: string;
  open: number;
  urgentDueToday: number;
};

export function isTaskStatus(value: string): value is TaskStatus {
  return taskStatuses.some((status) => status === value);
}

export function isTaskPriority(value: string): value is TaskPriority {
  return taskPriorities.some((priority) => priority === value);
}

function firstSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseTaskFilters(searchParams: {
  priority?: string | string[];
  q?: string | string[];
  status?: string | string[];
}): TaskFilters {
  const rawStatus = firstSearchValue(searchParams.status) ?? "active";
  const rawPriority = firstSearchValue(searchParams.priority) ?? "all";
  const query = (firstSearchValue(searchParams.q) ?? "").trim().slice(0, 100);

  return {
    priority: isTaskPriority(rawPriority) ? rawPriority : "all",
    query,
    status: rawStatus === "active" || rawStatus === "all" || isTaskStatus(rawStatus)
      ? rawStatus
      : "active",
  };
}

export function getDateInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

export function formatWorkspaceDate(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-SG", {
    day: "numeric",
    month: "long",
    timeZone,
    weekday: "long",
  }).format(date);
}

export function formatTaskDate(date: string) {
  return new Intl.DateTimeFormat("en-SG", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00Z`));
}

export function taskPriorityTone(priority: TaskPriority) {
  const tones: Record<TaskPriority, string> = {
    high: "bg-amber-50 text-amber-800 ring-amber-600/10",
    low: "bg-slate-100 text-slate-600 ring-slate-500/10",
    medium: "bg-sky-50 text-sky-700 ring-sky-600/10",
    urgent: "bg-rose-50 text-rose-700 ring-rose-600/10",
  };

  return tones[priority];
}

export function taskStatusTone(status: TaskStatus) {
  const tones: Record<TaskStatus, string> = {
    completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
    in_progress: "bg-sky-50 text-sky-700 ring-sky-600/10",
    todo: "bg-slate-100 text-slate-600 ring-slate-500/10",
  };

  return tones[status];
}
