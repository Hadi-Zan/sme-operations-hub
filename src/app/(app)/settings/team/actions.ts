"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { WorkspaceInvitation } from "@/lib/supabase/database.types";
import { deliverWorkspaceInvitation } from "@/lib/team-delivery";
import {
  invitationConflictMessage,
  isValidInvitationEmail,
  normalizeInvitationEmail,
} from "@/lib/team";

export type TeamActionState = {
  message: string | null;
  status: "error" | "idle" | "success";
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function refreshTeamViews() {
  revalidatePath("/settings/team");
  revalidatePath("/tasks");
  revalidatePath("/follow-ups");
  revalidatePath("/alerts");
  revalidatePath("/dashboard");
}

async function getOwnerInvitation(invitationId: string) {
  const context = await requireWorkspaceOwner();
  if (!context) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspace_invitations")
    .select("*")
    .eq("workspace_id", context.workspace.id)
    .eq("id", invitationId)
    .maybeSingle();
  return error ? null : (data as WorkspaceInvitation | null);
}

export async function inviteEmployee(
  _previousState: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const emailValue = formData.get("email");
  const nameValue = formData.get("displayName");
  const email = typeof emailValue === "string" ? normalizeInvitationEmail(emailValue) : "";
  const displayName = typeof nameValue === "string" ? nameValue.trim() : "";

  if (!isValidInvitationEmail(email)) return { status: "error", message: "Enter a valid employee email." };
  if (!displayName || displayName.length > 100) return { status: "error", message: "Display name must be between 1 and 100 characters." };
  if (!(await requireWorkspaceOwner())) return { status: "error", message: "Only an active owner can invite employees." };

  const supabase = await createClient();
  const { data: invitationId, error } = await supabase.rpc("create_workspace_invitation", {
    invitation_display_name: displayName,
    invitation_email: email,
  });
  if (error || !invitationId) {
    return { status: "error", message: invitationConflictMessage };
  }

  const invitation = await getOwnerInvitation(invitationId);
  if (!invitation) return { status: "error", message: "The invitation was created but could not be loaded." };

  try {
    const delivery = await deliverWorkspaceInvitation(invitation);
    refreshTeamViews();
    return delivery.ok
      ? { status: "success", message: "Employee invitation sent." }
      : { status: "error", message: "The invitation is pending, but the email could not be sent. You can retry safely." };
  } catch {
    refreshTeamViews();
    return { status: "error", message: "The invitation is pending, but server-side email delivery is not configured or unavailable." };
  }
}

export async function resendInvitation(
  _previousState: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const invitationId = formData.get("invitationId");
  if (typeof invitationId !== "string" || !uuidPattern.test(invitationId)) return { status: "error", message: "The invitation could not be resent." };
  const invitation = await getOwnerInvitation(invitationId);
  if (!invitation || invitation.status !== "pending") return { status: "error", message: "Only pending or expired invitations can be resent." };

  try {
    const delivery = await deliverWorkspaceInvitation(invitation);
    refreshTeamViews();
    return delivery.ok
      ? { status: "success", message: "Invitation resent with a fresh workspace expiry." }
      : { status: "error", message: "The invitation remains pending, but the email could not be resent." };
  } catch {
    return { status: "error", message: "Server-side invitation delivery is unavailable." };
  }
}

export async function cancelInvitation(_previousState: TeamActionState, formData: FormData): Promise<TeamActionState> {
  const invitationId = formData.get("invitationId");
  if (typeof invitationId !== "string" || !uuidPattern.test(invitationId) || !(await requireWorkspaceOwner())) return { status: "error", message: "The invitation could not be cancelled." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("cancel_workspace_invitation", { target_invitation_id: invitationId });
  if (error || !data) return { status: "error", message: "Only a pending invitation can be cancelled." };
  refreshTeamViews();
  return { status: "success", message: "Invitation cancelled." };
}

async function memberLifecycleAction(formData: FormData, mode: "deactivate" | "reactivate"): Promise<TeamActionState> {
  const userId = formData.get("userId");
  if (typeof userId !== "string" || !uuidPattern.test(userId) || !(await requireWorkspaceOwner())) return { status: "error", message: "The team member could not be updated." };
  const supabase = await createClient();
  const rpc = mode === "deactivate" ? "deactivate_workspace_member" : "reactivate_workspace_member";
  const { data, error } = await supabase.rpc(rpc, { target_user_id: userId });
  if (error || !data) return { status: "error", message: `The employee could not be ${mode}d.` };
  refreshTeamViews();
  return { status: "success", message: mode === "deactivate" ? "Employee deactivated and open work unassigned." : "Employee reactivated. Previous assignments were not restored." };
}

export async function deactivateMember(_previousState: TeamActionState, formData: FormData) {
  return memberLifecycleAction(formData, "deactivate");
}

export async function reactivateMember(_previousState: TeamActionState, formData: FormData) {
  return memberLifecycleAction(formData, "reactivate");
}

export async function updateMemberDisplayName(_previousState: TeamActionState, formData: FormData): Promise<TeamActionState> {
  const userId = formData.get("userId");
  const value = formData.get("displayName");
  const displayName = typeof value === "string" ? value.trim() : "";
  if (typeof userId !== "string" || !uuidPattern.test(userId) || !displayName || displayName.length > 100 || !(await requireWorkspaceOwner())) return { status: "error", message: "The display name could not be updated." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("update_workspace_member_display_name", { new_display_name: displayName, target_user_id: userId });
  if (error || !data) return { status: "error", message: "The display name could not be updated." };
  refreshTeamViews();
  return { status: "success", message: "Display name updated." };
}
