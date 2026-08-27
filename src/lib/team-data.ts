import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  WorkspaceInvitationActivationMode,
  WorkspaceMemberStatus,
  WorkspaceRole,
} from "@/lib/supabase/database.types";
import { formatInvitationExpiry } from "@/lib/team";

export type TeamMemberRecord = {
  deactivatedAt: string | null;
  displayName: string;
  email: string;
  role: WorkspaceRole;
  status: WorkspaceMemberStatus;
  userId: string;
};

export type TeamInvitationRecord = {
  activationMode: WorkspaceInvitationActivationMode | null;
  displayName: string;
  email: string;
  expiresAt: string;
  expiresAtDisplay: string;
  id: string;
  lastErrorCode: string | null;
  lastSentAt: string | null;
  lifecycleStatus: "accepted" | "cancelled" | "expired" | "pending";
  sendCount: number;
};

async function getAuthEmailMap() {
  const admin = createAdminClient();
  const emails = new Map<string, string>();
  const perPage = 200;

  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error("Team account emails could not be loaded.");
    data.users.forEach((user) => emails.set(user.id, user.email ?? "Email unavailable"));
    if (data.users.length < perPage) return emails;
  }
}

export async function getTeamData(workspaceId: string, timeZone: string) {
  const supabase = await createClient();
  const [membersResult, invitationsResult, emailMap] = await Promise.all([
    supabase
      .from("workspace_members")
      .select("user_id, display_name, role, status, deactivated_at")
      .eq("workspace_id", workspaceId)
      .order("display_name"),
    supabase
      .from("workspace_invitation_lifecycle")
      .select("id, email, display_name, lifecycle_status, activation_mode, send_count, last_sent_at, last_error_code, expires_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false }),
    getAuthEmailMap(),
  ]);

  if (membersResult.error || invitationsResult.error) {
    throw new Error("Team data could not be loaded.");
  }

  const members: TeamMemberRecord[] = membersResult.data.map((member) => ({
    deactivatedAt: member.deactivated_at,
    displayName: member.display_name,
    email: emailMap.get(member.user_id) ?? "Email unavailable",
    role: member.role,
    status: member.status,
    userId: member.user_id,
  }));
  const invitations: TeamInvitationRecord[] = invitationsResult.data.map((invitation) => ({
    activationMode: invitation.activation_mode,
    displayName: invitation.display_name,
    email: invitation.email,
    expiresAt: invitation.expires_at,
    expiresAtDisplay: formatInvitationExpiry(invitation.expires_at, timeZone),
    id: invitation.id,
    lastErrorCode: invitation.last_error_code,
    lastSentAt: invitation.last_sent_at,
    lifecycleStatus: invitation.lifecycle_status,
    sendCount: invitation.send_count,
  }));

  return { invitations, members };
}
