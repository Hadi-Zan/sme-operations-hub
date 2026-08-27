"use server";

import { revalidatePath } from "next/cache";
import { requireAccountContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { TaskPriority, TaskStatus } from "@/lib/supabase/database.types";
import { isTaskPriority, isTaskStatus } from "@/lib/tasks";

export type TaskActionState = {
  message: string | null;
  status: "error" | "idle" | "success";
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

type TaskInput = {
  assignedTo: string | null;
  description: string | null;
  dueDate: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  title: string;
};

type InputResult =
  | { input: TaskInput; message?: never }
  | { input?: never; message: string };

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(formData: FormData, key: string) {
  const value = textValue(formData, key);
  return value || null;
}

function isValidDate(value: string) {
  if (!datePattern.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function parseTaskInput(formData: FormData): InputResult {
  const title = textValue(formData, "title");
  const description = optionalText(formData, "description");
  const rawStatus = textValue(formData, "status");
  const rawPriority = textValue(formData, "priority");
  const dueDate = optionalText(formData, "dueDate");
  const assignedTo = optionalText(formData, "assignedTo");

  if (!title || title.length > 160) {
    return { message: "Task title must be between 1 and 160 characters." };
  }

  if (description && description.length > 4000) {
    return { message: "Task description must be 4,000 characters or fewer." };
  }

  if (!isTaskStatus(rawStatus)) {
    return { message: "Choose a valid task status." };
  }

  if (!isTaskPriority(rawPriority)) {
    return { message: "Choose a valid task priority." };
  }

  if (dueDate && !isValidDate(dueDate)) {
    return { message: "Choose a valid due date." };
  }

  if (assignedTo && !uuidPattern.test(assignedTo)) {
    return { message: "Choose a valid workspace member." };
  }

  return {
    input: {
      assignedTo,
      description,
      dueDate,
      priority: rawPriority,
      status: rawStatus,
      title,
    },
  };
}

async function getConfiguredContext() {
  const context = await requireAccountContext();
  return context.status === "configured" ? context : null;
}

async function validateAssignee(workspaceId: string, assignedTo: string | null) {
  if (!assignedTo) return true;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspace_members")
    .select("user_id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", assignedTo)
    .eq("status", "active")
    .maybeSingle();

  return !error && Boolean(data);
}

function revalidateTaskViews() {
  revalidatePath("/tasks");
  revalidatePath("/alerts");
  revalidatePath("/");
  revalidatePath("/", "layout");
}

export async function createTask(
  _previousState: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  const parsed = parseTaskInput(formData);
  if (!parsed.input) return { status: "error", message: parsed.message };

  const context = await getConfiguredContext();
  if (!context || context.role !== "owner") {
    return { status: "error", message: "Only the workspace owner can create tasks." };
  }

  if (!(await validateAssignee(context.workspace.id, parsed.input.assignedTo))) {
    return { status: "error", message: "The selected assignee is not in this workspace." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      assigned_to: parsed.input.assignedTo,
      created_by: context.user.id,
      description: parsed.input.description,
      due_date: parsed.input.dueDate,
      priority: parsed.input.priority,
      status: parsed.input.status,
      title: parsed.input.title,
      workspace_id: context.workspace.id,
    })
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { status: "error", message: "The task could not be created." };
  }

  revalidateTaskViews();
  return { status: "success", message: "Task created." };
}

export async function updateTask(
  taskId: string,
  _previousState: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  if (!uuidPattern.test(taskId)) {
    return { status: "error", message: "The task could not be updated." };
  }

  const parsed = parseTaskInput(formData);
  if (!parsed.input) return { status: "error", message: parsed.message };

  const context = await getConfiguredContext();
  if (!context || context.role !== "owner") {
    return { status: "error", message: "Only the workspace owner can edit task details." };
  }

  if (!(await validateAssignee(context.workspace.id, parsed.input.assignedTo))) {
    return { status: "error", message: "The selected assignee is not in this workspace." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({
      assigned_to: parsed.input.assignedTo,
      description: parsed.input.description,
      due_date: parsed.input.dueDate,
      priority: parsed.input.priority,
      status: parsed.input.status,
      title: parsed.input.title,
    })
    .eq("id", taskId)
    .eq("workspace_id", context.workspace.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { status: "error", message: "The task could not be updated." };
  }

  revalidateTaskViews();
  return { status: "success", message: "Task updated." };
}

export async function updateTaskStatus(
  taskId: string,
  _previousState: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  const status = textValue(formData, "status");
  if (!uuidPattern.test(taskId) || !isTaskStatus(status)) {
    return { status: "error", message: "The task status could not be updated." };
  }

  const context = await getConfiguredContext();
  if (!context) {
    return { status: "error", message: "A configured workspace is required." };
  }

  const supabase = await createClient();
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("id, assigned_to")
    .eq("id", taskId)
    .eq("workspace_id", context.workspace.id)
    .maybeSingle();

  if (taskError || !task) {
    return { status: "error", message: "The task status could not be updated." };
  }

  if (context.role === "member" && task.assigned_to !== context.user.id) {
    return { status: "error", message: "You can only update tasks assigned to you." };
  }

  const { data, error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", taskId)
    .eq("workspace_id", context.workspace.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { status: "error", message: "The task status could not be updated." };
  }

  revalidateTaskViews();
  return { status: "success", message: "Task status updated." };
}

export async function deleteTask(
  taskId: string,
  previousState: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  void previousState;
  void formData;

  if (!uuidPattern.test(taskId)) {
    return { status: "error", message: "The task could not be deleted." };
  }

  const context = await getConfiguredContext();
  if (!context || context.role !== "owner") {
    return { status: "error", message: "Only the workspace owner can delete tasks." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("workspace_id", context.workspace.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { status: "error", message: "The task could not be deleted." };
  }

  revalidateTaskViews();
  return { status: "success", message: "Task deleted." };
}
