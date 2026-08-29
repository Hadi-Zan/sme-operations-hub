"use server";

import { revalidatePath } from "next/cache";
import { requireAccountContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type FollowUpActionState = {
  message: string | null;
  status: "error" | "idle" | "success";
};

type FollowUpInput = {
  assignedTo: string | null;
  customerId: string;
  dueDate: string;
  dueTime: string | null;
  notes: string | null;
  title: string;
};

type InputResult =
  | { input: FollowUpInput; message?: never }
  | { input?: never; message: string };

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

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

function parseFollowUpInput(formData: FormData): InputResult {
  const customerId = textValue(formData, "customerId");
  const title = textValue(formData, "title");
  const dueDate = textValue(formData, "dueDate");
  const dueTime = optionalText(formData, "dueTime");
  const assignedTo = optionalText(formData, "assignedTo");
  const notes = optionalText(formData, "notes");

  if (!uuidPattern.test(customerId)) {
    return { message: "Choose an active customer." };
  }
  if (!title || title.length > 160) {
    return { message: "Follow-up reason must be between 1 and 160 characters." };
  }
  if (!isValidDate(dueDate)) {
    return { message: "Choose a valid due date." };
  }
  if (dueTime && !timePattern.test(dueTime)) {
    return { message: "Choose a valid due time." };
  }
  if (assignedTo && !uuidPattern.test(assignedTo)) {
    return { message: "Choose a valid workspace member." };
  }
  if (notes && notes.length > 2000) {
    return { message: "Follow-up notes must be 2,000 characters or fewer." };
  }

  return { input: { assignedTo, customerId, dueDate, dueTime, notes, title } };
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

async function validateActiveCustomer(workspaceId: string, customerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("id", customerId)
    .eq("is_active", true)
    .maybeSingle();
  return !error && Boolean(data);
}

function revalidateFollowUpViews() {
  revalidatePath("/follow-ups");
  revalidatePath("/customers");
  revalidatePath("/alerts");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
}

export async function createFollowUp(
  _previousState: FollowUpActionState,
  formData: FormData,
): Promise<FollowUpActionState> {
  const parsed = parseFollowUpInput(formData);
  if (!parsed.input) return { status: "error", message: parsed.message };

  const context = await getConfiguredContext();
  if (!context || context.role !== "owner") {
    return { status: "error", message: "Only the workspace owner can create follow-ups." };
  }
  if (!(await validateActiveCustomer(context.workspace.id, parsed.input.customerId))) {
    return { status: "error", message: "New follow-ups require an active workspace customer." };
  }
  if (!(await validateAssignee(context.workspace.id, parsed.input.assignedTo))) {
    return { status: "error", message: "The selected assignee is not in this workspace." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("follow_ups")
    .insert({
      assigned_to: parsed.input.assignedTo,
      created_by: context.user.id,
      customer_id: parsed.input.customerId,
      due_date: parsed.input.dueDate,
      due_time: parsed.input.dueTime,
      notes: parsed.input.notes,
      title: parsed.input.title,
      workspace_id: context.workspace.id,
    })
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { status: "error", message: "The follow-up could not be created." };
  }

  revalidateFollowUpViews();
  return { status: "success", message: "Follow-up created." };
}

export async function updateFollowUp(
  followUpId: string,
  _previousState: FollowUpActionState,
  formData: FormData,
): Promise<FollowUpActionState> {
  if (!uuidPattern.test(followUpId)) {
    return { status: "error", message: "The follow-up could not be updated." };
  }
  const parsed = parseFollowUpInput(formData);
  if (!parsed.input) return { status: "error", message: parsed.message };

  const context = await getConfiguredContext();
  if (!context || context.role !== "owner") {
    return { status: "error", message: "Only the workspace owner can edit follow-up details." };
  }

  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("follow_ups")
    .select("id, customer_id")
    .eq("id", followUpId)
    .eq("workspace_id", context.workspace.id)
    .maybeSingle();
  if (existingError || !existing) {
    return { status: "error", message: "The follow-up could not be updated." };
  }
  if (
    existing.customer_id !== parsed.input.customerId &&
    !(await validateActiveCustomer(context.workspace.id, parsed.input.customerId))
  ) {
    return { status: "error", message: "Choose an active workspace customer." };
  }
  if (!(await validateAssignee(context.workspace.id, parsed.input.assignedTo))) {
    return { status: "error", message: "The selected assignee is not in this workspace." };
  }

  const { data, error } = await supabase
    .from("follow_ups")
    .update({
      assigned_to: parsed.input.assignedTo,
      customer_id: parsed.input.customerId,
      due_date: parsed.input.dueDate,
      due_time: parsed.input.dueTime,
      notes: parsed.input.notes,
      title: parsed.input.title,
    })
    .eq("id", followUpId)
    .eq("workspace_id", context.workspace.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { status: "error", message: "The follow-up could not be updated." };
  }

  revalidateFollowUpViews();
  return { status: "success", message: "Follow-up updated." };
}

async function getActionableFollowUp(followUpId: string) {
  if (!uuidPattern.test(followUpId)) return null;
  const context = await getConfiguredContext();
  if (!context) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("follow_ups")
    .select("id, assigned_to, status")
    .eq("id", followUpId)
    .eq("workspace_id", context.workspace.id)
    .maybeSingle();

  if (error || !data) return null;
  if (context.role === "member" && data.assigned_to !== context.user.id) return null;
  return { context, followUp: data, supabase };
}

export async function completeFollowUp(
  followUpId: string,
  _previousState: FollowUpActionState,
  formData: FormData,
): Promise<FollowUpActionState> {
  const outcome = textValue(formData, "outcome");
  if (!outcome || outcome.length > 1000) {
    return { status: "error", message: "Outcome must be between 1 and 1,000 characters." };
  }

  const actionable = await getActionableFollowUp(followUpId);
  if (!actionable) {
    return { status: "error", message: "You cannot complete this follow-up." };
  }

  const { data, error } = await actionable.supabase
    .from("follow_ups")
    .update({ outcome, status: "completed" })
    .eq("id", followUpId)
    .eq("workspace_id", actionable.context.workspace.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { status: "error", message: "The follow-up could not be completed." };
  }

  revalidateFollowUpViews();
  return {
    status: "success",
    message:
      actionable.followUp.status === "completed"
        ? "Follow-up outcome updated."
        : "Follow-up completed.",
  };
}

export async function reopenFollowUp(
  followUpId: string,
  previousState: FollowUpActionState,
  formData: FormData,
): Promise<FollowUpActionState> {
  void previousState;
  void formData;

  const actionable = await getActionableFollowUp(followUpId);
  if (!actionable || actionable.followUp.status !== "completed") {
    return { status: "error", message: "You cannot reopen this follow-up." };
  }

  const { data, error } = await actionable.supabase
    .from("follow_ups")
    .update({ status: "pending" })
    .eq("id", followUpId)
    .eq("workspace_id", actionable.context.workspace.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { status: "error", message: "The follow-up could not be reopened." };
  }

  revalidateFollowUpViews();
  return { status: "success", message: "Follow-up reopened and returned to the active queue." };
}
