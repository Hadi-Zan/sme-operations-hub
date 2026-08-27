import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { FollowUp } from "@/lib/supabase/database.types";
import {
  formatCompletionTime,
  getDateInWorkspace,
  type DashboardFollowUpData,
  type FollowUpCustomerOption,
  type FollowUpFilters,
  type FollowUpListItem,
  type FollowUpMemberOption,
  type FollowUpPageSummary,
} from "@/lib/follow-ups";

const followUpColumns =
  "id, customer_id, title, due_date, due_time, assigned_to, status, notes, outcome, created_by, completed_by, completed_at, created_at, updated_at";

function sortFollowUps(left: FollowUpListItem, right: FollowUpListItem) {
  if (left.status !== right.status) return left.status === "pending" ? -1 : 1;
  if (left.status === "completed") {
    return (right.completedAt ?? "").localeCompare(left.completedAt ?? "");
  }

  const dateDifference = left.dueDate.localeCompare(right.dueDate);
  if (dateDifference !== 0) return dateDifference;
  const timeDifference = (left.dueTime ?? "99:99").localeCompare(right.dueTime ?? "99:99");
  if (timeDifference !== 0) return timeDifference;
  return left.createdAt.localeCompare(right.createdAt);
}

function mapFollowUps(
  rows: Pick<
    FollowUp,
    | "assigned_to"
    | "completed_at"
    | "completed_by"
    | "created_at"
    | "customer_id"
    | "due_date"
    | "due_time"
    | "id"
    | "notes"
    | "outcome"
    | "status"
    | "title"
    | "updated_at"
  >[],
  customers: Map<string, FollowUpCustomerOption>,
  memberNames: Map<string, string>,
  timeZone: string,
  today: string,
) {
  return rows.map<FollowUpListItem>((followUp) => {
    const customer = customers.get(followUp.customer_id);
    return {
      assignedTo: followUp.assigned_to,
      assigneeName: followUp.assigned_to
        ? (memberNames.get(followUp.assigned_to) ?? "Workspace member")
        : "Unassigned",
      completedAt: followUp.completed_at,
      completedByName: followUp.completed_by
        ? (memberNames.get(followUp.completed_by) ?? "Workspace member")
        : null,
      createdAt: followUp.created_at,
      customerContactName: customer?.contactName ?? null,
      customerId: followUp.customer_id,
      customerIsActive: customer?.isActive ?? false,
      customerName: customer?.name ?? "Customer",
      dueDate: followUp.due_date,
      dueTime: followUp.due_time,
      formattedCompletedAt: followUp.completed_at
        ? formatCompletionTime(followUp.completed_at, timeZone)
        : null,
      id: followUp.id,
      isDueToday: followUp.status === "pending" && followUp.due_date === today,
      isOverdue: followUp.status === "pending" && followUp.due_date < today,
      isUpcoming: followUp.status === "pending" && followUp.due_date > today,
      notes: followUp.notes,
      outcome: followUp.outcome,
      status: followUp.status,
      title: followUp.title,
      updatedAt: followUp.updated_at,
    };
  });
}

async function getWorkspaceFollowUps(workspaceId: string, timeZone: string) {
  const supabase = await createClient();
  const [followUpsResult, customersResult, membersResult] = await Promise.all([
    supabase.from("follow_ups").select(followUpColumns).eq("workspace_id", workspaceId),
    supabase
      .from("customers")
      .select("id, name, contact_name, email, phone, is_active")
      .eq("workspace_id", workspaceId)
      .order("name"),
    supabase
      .from("workspace_members")
      .select("user_id, display_name, role, status")
      .eq("workspace_id", workspaceId)
      .order("display_name"),
  ]);

  if (followUpsResult.error || customersResult.error || membersResult.error) {
    throw new Error("Workspace follow-ups could not be loaded.");
  }

  const customers: FollowUpCustomerOption[] = customersResult.data.map((customer) => ({
    contactName: customer.contact_name,
    email: customer.email,
    id: customer.id,
    isActive: customer.is_active,
    name: customer.name,
    phone: customer.phone,
  }));
  const memberNames = new Map(
    membersResult.data.map((member) => [member.user_id, member.display_name]),
  );
  const members: FollowUpMemberOption[] = membersResult.data
    .filter((member) => member.status === "active")
    .map((member) => ({
    displayName: member.display_name,
    role: member.role,
    userId: member.user_id,
  }));
  const customerMap = new Map(customers.map((customer) => [customer.id, customer]));
  const today = getDateInWorkspace(new Date(), timeZone);
  const followUps = mapFollowUps(
    followUpsResult.data,
    customerMap,
    memberNames,
    timeZone,
    today,
  ).sort(sortFollowUps);

  return { customers, followUps, members, today };
}

export async function getFollowUpsPageData(
  workspaceId: string,
  timeZone: string,
  requestedFilters: FollowUpFilters,
) {
  const { customers, followUps, members, today } = await getWorkspaceFollowUps(
    workspaceId,
    timeZone,
  );
  const customerIds = new Set(customers.map((customer) => customer.id));
  const memberIds = new Set(members.map((member) => member.userId));
  const filters: FollowUpFilters = {
    ...requestedFilters,
    assignee:
      requestedFilters.assignee === "all" ||
      requestedFilters.assignee === "unassigned" ||
      memberIds.has(requestedFilters.assignee)
        ? requestedFilters.assignee
        : "all",
    customerId:
      requestedFilters.customerId && customerIds.has(requestedFilters.customerId)
        ? requestedFilters.customerId
        : null,
  };
  const pending = followUps.filter((followUp) => followUp.status === "pending");
  const summary: FollowUpPageSummary = {
    completed: followUps.filter((followUp) => followUp.status === "completed").length,
    overdue: pending.filter((followUp) => followUp.isOverdue).length,
    pending: pending.length,
    today: pending.filter((followUp) => followUp.isDueToday).length,
    upcoming: pending.filter((followUp) => followUp.isUpcoming).length,
  };
  const normalizedQuery = filters.query.toLocaleLowerCase("en");
  const filteredFollowUps = followUps.filter((followUp) => {
    if (filters.status !== "all" && followUp.status !== filters.status) return false;
    if (filters.timing !== "all") {
      if (filters.timing === "overdue" && !followUp.isOverdue) return false;
      if (filters.timing === "today" && !followUp.isDueToday) return false;
      if (filters.timing === "upcoming" && !followUp.isUpcoming) return false;
    }
    if (filters.assignee === "unassigned" && followUp.assignedTo !== null) return false;
    if (
      filters.assignee !== "all" &&
      filters.assignee !== "unassigned" &&
      followUp.assignedTo !== filters.assignee
    ) {
      return false;
    }
    if (filters.customerId && followUp.customerId !== filters.customerId) return false;
    if (!normalizedQuery) return true;

    return [
      followUp.title,
      followUp.notes,
      followUp.outcome,
      followUp.customerName,
      followUp.customerContactName,
      followUp.assigneeName,
    ]
      .filter((value): value is string => Boolean(value))
      .join("\n")
      .toLocaleLowerCase("en")
      .includes(normalizedQuery);
  });

  return { customers, filteredFollowUps, filters, members, summary, today };
}

export async function getDashboardFollowUpData(
  workspaceId: string,
  timeZone: string,
): Promise<DashboardFollowUpData> {
  const { followUps } = await getWorkspaceFollowUps(workspaceId, timeZone);
  const pending = followUps.filter((followUp) => followUp.status === "pending");

  return {
    dueToday: pending.filter((followUp) => followUp.isDueToday).length,
    items: pending.slice(0, 4).map((followUp) => ({
      assignedTo: followUp.assignedTo,
      assigneeName: followUp.assigneeName,
      customerName: followUp.customerName,
      dueDate: followUp.dueDate,
      dueTime: followUp.dueTime,
      id: followUp.id,
      isDueToday: followUp.isDueToday,
      isOverdue: followUp.isOverdue,
      title: followUp.title,
    })),
    overdue: pending.filter((followUp) => followUp.isOverdue).length,
    pending: pending.length,
  };
}
