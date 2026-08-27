import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Task, TaskPriority } from "@/lib/supabase/database.types";
import {
  formatWorkspaceDate,
  getDateInTimeZone,
  type DashboardTaskData,
  type TaskFilters,
  type TaskListItem,
  type TaskPageSummary,
  type WorkspaceMemberOption,
} from "@/lib/tasks";

const priorityRank: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const taskColumns =
  "id, title, description, status, priority, due_date, assigned_to, created_at, updated_at";

function sortTasks(left: TaskListItem, right: TaskListItem) {
  const leftComplete = left.status === "completed" ? 1 : 0;
  const rightComplete = right.status === "completed" ? 1 : 0;
  if (leftComplete !== rightComplete) return leftComplete - rightComplete;

  if (left.dueDate && right.dueDate && left.dueDate !== right.dueDate) {
    return left.dueDate.localeCompare(right.dueDate);
  }
  if (left.dueDate && !right.dueDate) return -1;
  if (!left.dueDate && right.dueDate) return 1;

  const priorityDifference = priorityRank[left.priority] - priorityRank[right.priority];
  if (priorityDifference !== 0) return priorityDifference;

  return right.createdAt.localeCompare(left.createdAt);
}

function mapTasks(
  rows: Pick<
    Task,
    | "assigned_to"
    | "created_at"
    | "description"
    | "due_date"
    | "id"
    | "priority"
    | "status"
    | "title"
    | "updated_at"
  >[],
  memberNames: Map<string, string>,
): TaskListItem[] {
  return rows.map((task) => ({
    assignedTo: task.assigned_to,
    assigneeName: task.assigned_to
      ? (memberNames.get(task.assigned_to) ?? "Workspace member")
      : "Unassigned",
    createdAt: task.created_at,
    description: task.description,
    dueDate: task.due_date,
    id: task.id,
    priority: task.priority,
    status: task.status,
    title: task.title,
    updatedAt: task.updated_at,
  }));
}

async function getWorkspaceTasksAndMembers(workspaceId: string) {
  const supabase = await createClient();
  const [tasksResult, membersResult] = await Promise.all([
    supabase.from("tasks").select(taskColumns).eq("workspace_id", workspaceId),
    supabase
      .from("workspace_members")
      .select("user_id, display_name, role, status")
      .eq("workspace_id", workspaceId)
      .order("display_name"),
  ]);

  if (tasksResult.error || membersResult.error) {
    throw new Error("Workspace tasks could not be loaded.");
  }

  const memberNames = new Map(
    membersResult.data.map((member) => [member.user_id, member.display_name]),
  );
  const members: WorkspaceMemberOption[] = membersResult.data
    .filter((member) => member.status === "active")
    .map((member) => ({
    displayName: member.display_name,
    role: member.role,
    userId: member.user_id,
  }));
  const tasks = mapTasks(tasksResult.data, memberNames).sort(sortTasks);

  return { members, tasks };
}

export async function getTasksPageData(
  workspaceId: string,
  timeZone: string,
  filters: TaskFilters,
) {
  const { members, tasks } = await getWorkspaceTasksAndMembers(workspaceId);
  const today = getDateInTimeZone(new Date(), timeZone);
  const openTasks = tasks.filter((task) => task.status !== "completed");
  const summary: TaskPageSummary = {
    dueToday: openTasks.filter((task) => task.dueDate === today).length,
    open: openTasks.length,
    overdue: openTasks.filter((task) => task.dueDate && task.dueDate < today).length,
    total: tasks.length,
  };
  const normalizedQuery = filters.query.toLocaleLowerCase();
  const filteredTasks = tasks.filter((task) => {
    if (filters.status === "active" && task.status === "completed") return false;
    if (
      filters.status !== "active" &&
      filters.status !== "all" &&
      task.status !== filters.status
    ) {
      return false;
    }
    if (filters.priority !== "all" && task.priority !== filters.priority) return false;
    if (!normalizedQuery) return true;

    return `${task.title}\n${task.description ?? ""}`
      .toLocaleLowerCase()
      .includes(normalizedQuery);
  });

  return {
    filteredTasks,
    members,
    summary,
    today,
  };
}

export async function getDashboardTaskData(
  workspaceId: string,
  timeZone: string,
): Promise<DashboardTaskData> {
  const { members, tasks } = await getWorkspaceTasksAndMembers(workspaceId);
  const now = new Date();
  const today = getDateInTimeZone(now, timeZone);
  const openTasks = tasks.filter((task) => task.status !== "completed");
  const dueTodayTasks = openTasks.filter((task) => task.dueDate === today);
  const memberNames = new Map(members.map((member) => [member.userId, member.displayName]));
  const dailyPriorities = [...dueTodayTasks]
    .sort((left, right) => {
      const priorityDifference = priorityRank[left.priority] - priorityRank[right.priority];
      if (priorityDifference !== 0) return priorityDifference;
      return left.createdAt.localeCompare(right.createdAt);
    })
    .slice(0, 5)
    .map((task) => ({
      assignedTo: task.assignedTo,
      assigneeName: task.assignedTo
        ? (memberNames.get(task.assignedTo) ?? "Workspace member")
        : "Unassigned",
      id: task.id,
      priority: task.priority,
      status: task.status,
      title: task.title,
    }));

  return {
    dailyPriorities,
    dueToday: dueTodayTasks.length,
    formattedDate: formatWorkspaceDate(now, timeZone),
    open: openTasks.length,
    urgentDueToday: dueTodayTasks.filter((task) => task.priority === "urgent").length,
  };
}
