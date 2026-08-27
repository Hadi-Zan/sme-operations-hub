import type { User } from "@supabase/supabase-js";

export const invitationConflictMessage = "This email cannot be invited.";
export const invitationActivationModes = ["existing_account", "set_password"] as const;
export type InvitationActivationMode = (typeof invitationActivationModes)[number];

export type InvitationLifecycleStatus = "accepted" | "cancelled" | "expired" | "pending";

export function isSuccessfulInvitationAcceptanceResult(value: string | null) {
  return value === "accepted" || value === "already_accepted";
}

export function normalizeInvitationEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidInvitationEmail(value: string) {
  const normalized = normalizeInvitationEmail(value);
  return normalized.length >= 3 && normalized.length <= 320 && normalized.includes("@");
}

export function isConfirmedAuthUser(user: Pick<User, "email_confirmed_at">) {
  return Boolean(user.email_confirmed_at);
}

export type AuthInvitationState = "confirmed" | "new" | "unconfirmed";

export function classifyAuthInvitationState(
  user: Pick<User, "email_confirmed_at"> | null,
): AuthInvitationState {
  if (!user) return "new";
  return isConfirmedAuthUser(user) ? "confirmed" : "unconfirmed";
}

export function activationModeForAuthState(
  state: AuthInvitationState,
): InvitationActivationMode {
  return state === "confirmed" ? "existing_account" : "set_password";
}

export function invitationLifecycle(status: "accepted" | "cancelled" | "pending", expiresAt: string, now = new Date()) {
  return status === "pending" && new Date(expiresAt).getTime() <= now.getTime()
    ? "expired"
    : status;
}

export function formatInvitationExpiry(timestamp: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-SG", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZone,
    year: "numeric",
  }).format(new Date(timestamp));
}

export function sanitizeInviteErrorCode(status?: number): string {
  if (status === 429) return "provider_rate_limited";
  if (status && status >= 500) return "provider_unavailable";
  return "provider_rejected";
}
