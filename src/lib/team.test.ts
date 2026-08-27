import { describe, expect, it } from "vitest";
import {
  activationModeForAuthState,
  classifyAuthInvitationState,
  formatInvitationExpiry,
  invitationLifecycle,
  invitationConflictMessage,
  isSuccessfulInvitationAcceptanceResult,
  normalizeInvitationEmail,
  sanitizeInviteErrorCode,
} from "@/lib/team";

describe("workspace invitation decisions", () => {
  it("normalizes an invitation address once", () => {
    expect(normalizeInvitationEmail("  Employee@Example.COM ")).toBe("employee@example.com");
  });

  it("uses one generic application conflict message", () => {
    expect(invitationConflictMessage).toBe("This email cannot be invited.");
  });

  it("treats first and repeated same-user acceptance as successful", () => {
    expect(isSuccessfulInvitationAcceptanceResult("accepted")).toBe(true);
    expect(isSuccessfulInvitationAcceptanceResult("already_accepted")).toBe(true);
    expect(isSuccessfulInvitationAcceptanceResult("unavailable")).toBe(false);
  });

  it("keeps new, confirmed, and partial/unconfirmed Auth users distinct", () => {
    expect(classifyAuthInvitationState(null)).toBe("new");
    expect(classifyAuthInvitationState({ email_confirmed_at: "2026-08-26T00:00:00Z" })).toBe("confirmed");
    expect(classifyAuthInvitationState({ email_confirmed_at: undefined })).toBe("unconfirmed");
    expect(activationModeForAuthState("confirmed")).toBe("existing_account");
    expect(activationModeForAuthState("new")).toBe("set_password");
    expect(activationModeForAuthState("unconfirmed")).toBe("set_password");
  });

  it("derives expiry without mutating the stored pending lifecycle", () => {
    const now = new Date("2026-08-26T12:00:00Z");
    expect(invitationLifecycle("pending", "2026-08-26T11:59:59Z", now)).toBe("expired");
    expect(invitationLifecycle("pending", "2026-08-26T12:00:01Z", now)).toBe("pending");
    expect(invitationLifecycle("cancelled", "2026-08-25T00:00:00Z", now)).toBe("cancelled");
  });

  it("formats invitation expiry deterministically in the workspace timezone", () => {
    expect(formatInvitationExpiry("2026-08-27T12:19:48Z", "Asia/Singapore")).toBe(
      "27 Aug 2026, 8:19 pm",
    );
  });

  it("stores only bounded provider error categories", () => {
    expect(sanitizeInviteErrorCode(429)).toBe("provider_rate_limited");
    expect(sanitizeInviteErrorCode(503)).toBe("provider_unavailable");
    expect(sanitizeInviteErrorCode(400)).toBe("provider_rejected");
  });
});
