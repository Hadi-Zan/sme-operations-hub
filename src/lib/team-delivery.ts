import "server-only";

import type { User } from "@supabase/supabase-js";
import { requireAppUrl } from "@/lib/app-url";
import { createAdminClient } from "@/lib/supabase/admin";
import type { WorkspaceInvitation } from "@/lib/supabase/database.types";
import {
  isConfirmedAuthUser,
  normalizeInvitationEmail,
  sanitizeInviteErrorCode,
  type InvitationActivationMode,
} from "@/lib/team";

const USERS_PER_PAGE = 200;
const CONFIRMED_USER_INVITE_ERROR_CODE = "email_exists";

type ProviderError = {
  code?: string;
  status?: number;
} | null;

function hasMatchingEmail(user: Pick<User, "email">, email: string) {
  return Boolean(user.email && normalizeInvitationEmail(user.email) === normalizeInvitationEmail(email));
}

async function findAuthUsersByEmail(email: string): Promise<User[]> {
  const admin = createAdminClient();
  const normalizedEmail = normalizeInvitationEmail(email);
  const matchingUsers: User[] = [];

  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: USERS_PER_PAGE });
    if (error) throw new Error("Auth user lookup failed.");

    matchingUsers.push(
      ...data.users.filter(
        (user) => user.email && normalizeInvitationEmail(user.email) === normalizedEmail,
      ),
    );
    if (data.users.length < USERS_PER_PAGE) return matchingUsers;
  }
}

export async function findAuthUserByEmail(email: string): Promise<User | null> {
  const matchingUsers = await findAuthUsersByEmail(email);
  if (matchingUsers.length > 1) throw new Error("Auth user lookup failed.");
  return matchingUsers[0] ?? null;
}

async function recordSend(
  invitationId: string,
  userId: string,
  activationMode: InvitationActivationMode,
) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("record_workspace_invitation_send", {
    target_activation_mode: activationMode,
    target_auth_user_id: userId,
    target_invitation_id: invitationId,
  });

  if (error || !data) throw new Error("Invitation send could not be recorded.");
}

async function recordError(invitationId: string, userId: string | null, code: string) {
  const admin = createAdminClient();
  await admin.rpc("record_workspace_invitation_error", {
    sanitized_error_code: code,
    target_auth_user_id: userId,
    target_invitation_id: invitationId,
  });
}

async function sendConfirmedUserLink(invitation: WorkspaceInvitation, user: User) {
  if (!isConfirmedAuthUser(user) || !hasMatchingEmail(user, invitation.email)) {
    await recordError(invitation.id, invitation.auth_user_id, "provider_rejected");
    return { ok: false as const };
  }

  const admin = createAdminClient();
  let error: ProviderError;
  try {
    ({ error } = await admin.auth.signInWithOtp({
      email: invitation.email,
      options: {
        emailRedirectTo: `${requireAppUrl()}/auth/confirm`,
        shouldCreateUser: false,
      },
    }));
  } catch {
    error = {};
  }

  if (error) {
    await recordError(invitation.id, user.id, sanitizeInviteErrorCode(error.status));
    return { ok: false as const };
  }

  await recordSend(invitation.id, user.id, "existing_account");
  return { activationMode: "existing_account" as const, ok: true as const };
}

async function authUserNoLongerExists(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (!error && data.user) return false;
  return error?.code === "user_not_found";
}

async function hasWorkspaceMembership(userId: string) {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("workspace_members")
    .select("user_id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error || count === null) throw new Error("Workspace membership lookup failed.");
  return count > 0;
}

async function canUseReturnedInviteUser(
  email: string,
  returnedUser: User,
  expectedUser: User | null,
) {
  if (!hasMatchingEmail(returnedUser, email)) return false;
  if (!expectedUser || returnedUser.id === expectedUser.id) return true;

  try {
    if (!(await authUserNoLongerExists(expectedUser.id))) return false;

    const matchingUsers = await findAuthUsersByEmail(email);
    if (matchingUsers.length !== 1 || matchingUsers[0]?.id !== returnedUser.id) return false;

    return !(await hasWorkspaceMembership(returnedUser.id));
  } catch {
    return false;
  }
}

async function recordInviteFailure(
  invitation: WorkspaceInvitation,
  expectedUser: User | null,
  error: ProviderError,
) {
  let knownUserId = expectedUser?.id ?? invitation.auth_user_id;

  if (!expectedUser) {
    try {
      knownUserId = (await findAuthUserByEmail(invitation.email))?.id ?? knownUserId;
    } catch {
      await recordError(invitation.id, knownUserId, "user_lookup_failed");
      return { ok: false as const };
    }
  }

  await recordError(invitation.id, knownUserId, sanitizeInviteErrorCode(error?.status));
  return { ok: false as const };
}

async function sendNativeInvitation(invitation: WorkspaceInvitation, expectedUser: User | null) {
  const admin = createAdminClient();
  let data: { user: User | null };
  let error: ProviderError;

  try {
    ({ data, error } = await admin.auth.admin.inviteUserByEmail(invitation.email, {
      data: { display_name: invitation.display_name },
      redirectTo: `${requireAppUrl()}/auth/confirm`,
    }));
  } catch {
    return recordInviteFailure(invitation, expectedUser, {});
  }

  if (!error && data.user) {
    if (!(await canUseReturnedInviteUser(invitation.email, data.user, expectedUser))) {
      await recordError(
        invitation.id,
        expectedUser?.id ?? invitation.auth_user_id,
        "provider_rejected",
      );
      return { ok: false as const };
    }

    await recordSend(invitation.id, data.user.id, "set_password");
    return { activationMode: "set_password" as const, ok: true as const };
  }

  if (expectedUser && error?.code === CONFIRMED_USER_INVITE_ERROR_CODE) {
    let refreshedUser: User | null;
    try {
      refreshedUser = await findAuthUserByEmail(invitation.email);
    } catch {
      await recordError(invitation.id, expectedUser.id, "user_lookup_failed");
      return { ok: false as const };
    }

    if (
      refreshedUser?.id === expectedUser.id &&
      isConfirmedAuthUser(refreshedUser) &&
      hasMatchingEmail(refreshedUser, invitation.email)
    ) {
      return sendConfirmedUserLink(invitation, refreshedUser);
    }
  }

  return recordInviteFailure(invitation, expectedUser, error);
}

export async function deliverWorkspaceInvitation(invitation: WorkspaceInvitation) {
  let existingUser: User | null;
  try {
    existingUser = await findAuthUserByEmail(invitation.email);
  } catch {
    await recordError(invitation.id, invitation.auth_user_id, "user_lookup_failed");
    return { ok: false as const };
  }

  if (existingUser && isConfirmedAuthUser(existingUser)) {
    return sendConfirmedUserLink(invitation, existingUser);
  }

  return sendNativeInvitation(invitation, existingUser);
}
