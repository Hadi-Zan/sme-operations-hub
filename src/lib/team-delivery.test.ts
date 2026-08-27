import type { User } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { WorkspaceInvitation } from "@/lib/supabase/database.types";

const mocks = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  deleteUser: vi.fn(),
  from: vi.fn(),
  getUserById: vi.fn(),
  inviteUserByEmail: vi.fn(),
  listUsers: vi.fn(),
  rpc: vi.fn(),
  signInWithOtp: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/app-url", () => ({
  requireAppUrl: () => "http://localhost:3000",
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mocks.createAdminClient,
}));

import { deliverWorkspaceInvitation } from "@/lib/team-delivery";

const invitationId = "70000000-0000-4000-8000-000000000001";
const existingUserId = "70000000-0000-4000-8000-000000000002";
const returnedUserId = "70000000-0000-4000-8000-000000000003";

function authUser(
  id: string,
  email: string,
  confirmed = false,
): User {
  return {
    app_metadata: { provider: "email", providers: ["email"] },
    aud: "authenticated",
    created_at: "2026-08-27T00:00:00.000Z",
    email,
    email_confirmed_at: confirmed ? "2026-08-27T00:01:00.000Z" : undefined,
    id,
    user_metadata: {},
  } as User;
}

function invitation(overrides: Partial<WorkspaceInvitation> = {}): WorkspaceInvitation {
  return {
    accepted_at: null,
    accepted_by: null,
    activation_mode: null,
    auth_user_id: null,
    cancelled_at: null,
    cancelled_by: null,
    created_at: "2026-08-27T00:00:00.000Z",
    created_by: "70000000-0000-4000-8000-000000000004",
    display_name: "Employee Four",
    email: "employee4@example.com",
    expires_at: "2026-08-28T00:00:00.000Z",
    id: invitationId,
    last_error_code: null,
    last_sent_at: null,
    role: "member",
    send_count: 0,
    status: "pending",
    updated_at: "2026-08-27T00:00:00.000Z",
    workspace_id: "70000000-0000-4000-8000-000000000005",
    ...overrides,
  };
}

type DeliveryState = {
  activationMode: WorkspaceInvitation["activation_mode"];
  expiresAt: string;
  lastErrorCode: string | null;
  lastSentAt: string | null;
  sendCount: number;
};

let deliveryState: DeliveryState;

describe("workspace invitation Auth delivery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deliveryState = {
      activationMode: null,
      expiresAt: "2026-08-28T00:00:00.000Z",
      lastErrorCode: null,
      lastSentAt: null,
      sendCount: 0,
    };

    mocks.createAdminClient.mockImplementation(() => ({
      auth: {
        admin: {
          deleteUser: mocks.deleteUser,
          getUserById: mocks.getUserById,
          inviteUserByEmail: mocks.inviteUserByEmail,
          listUsers: mocks.listUsers,
        },
        signInWithOtp: mocks.signInWithOtp,
      },
      from: mocks.from,
      rpc: mocks.rpc,
    }));
    mocks.listUsers.mockResolvedValue({ data: { users: [] }, error: null });
    mocks.signInWithOtp.mockResolvedValue({ data: {}, error: null });
    mocks.inviteUserByEmail.mockResolvedValue({ data: { user: null }, error: null });
    mocks.getUserById.mockResolvedValue({ data: { user: null }, error: { code: "user_not_found" } });
    mocks.from.mockImplementation(() => ({
      select: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
      })),
    }));
    mocks.rpc.mockImplementation(async (name: string, args: Record<string, unknown>) => {
      if (name === "record_workspace_invitation_send") {
        deliveryState = {
          activationMode: args.target_activation_mode as WorkspaceInvitation["activation_mode"],
          expiresAt: "2026-08-28T01:00:00.000Z",
          lastErrorCode: null,
          lastSentAt: "2026-08-27T01:00:00.000Z",
          sendCount: deliveryState.sendCount + 1,
        };
      }
      if (name === "record_workspace_invitation_error") {
        deliveryState.lastErrorCode = args.sanitized_error_code as string;
      }
      return { data: true, error: null };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses Magic Link only for a confirmed existing user", async () => {
    const user = authUser(existingUserId, "Employee4@Example.com", true);
    mocks.listUsers.mockResolvedValue({ data: { users: [user] }, error: null });

    await expect(deliverWorkspaceInvitation(invitation())).resolves.toEqual({
      activationMode: "existing_account",
      ok: true,
    });

    expect(mocks.signInWithOtp).toHaveBeenCalledWith({
      email: "employee4@example.com",
      options: {
        emailRedirectTo: "http://localhost:3000/auth/confirm",
        shouldCreateUser: false,
      },
    });
    expect(mocks.inviteUserByEmail).not.toHaveBeenCalled();
    expect(mocks.rpc).toHaveBeenCalledWith("record_workspace_invitation_send", {
      target_activation_mode: "existing_account",
      target_auth_user_id: existingUserId,
      target_invitation_id: invitationId,
    });
  });

  it("re-invites an existing unconfirmed user and reuses the same Auth identity", async () => {
    const user = authUser(existingUserId, "employee4@example.com");
    mocks.listUsers.mockResolvedValue({ data: { users: [user] }, error: null });
    mocks.inviteUserByEmail.mockResolvedValue({ data: { user }, error: null });

    await expect(deliverWorkspaceInvitation(invitation())).resolves.toEqual({
      activationMode: "set_password",
      ok: true,
    });

    expect(mocks.inviteUserByEmail).toHaveBeenCalledWith("employee4@example.com", {
      data: { display_name: "Employee Four" },
      redirectTo: "http://localhost:3000/auth/confirm",
    });
    expect(mocks.signInWithOtp).not.toHaveBeenCalled();
    expect(mocks.rpc).toHaveBeenCalledWith("record_workspace_invitation_send", {
      target_activation_mode: "set_password",
      target_auth_user_id: existingUserId,
      target_invitation_id: invitationId,
    });
  });

  it("uses the native invitation path for an absent Auth user", async () => {
    const createdUser = authUser(returnedUserId, "employee4@example.com");
    mocks.inviteUserByEmail.mockResolvedValue({ data: { user: createdUser }, error: null });

    await expect(deliverWorkspaceInvitation(invitation())).resolves.toEqual({
      activationMode: "set_password",
      ok: true,
    });

    expect(mocks.inviteUserByEmail).toHaveBeenCalledOnce();
    expect(mocks.signInWithOtp).not.toHaveBeenCalled();
    expect(mocks.rpc).toHaveBeenCalledWith("record_workspace_invitation_send", {
      target_activation_mode: "set_password",
      target_auth_user_id: returnedUserId,
      target_invitation_id: invitationId,
    });
  });

  it("delegates resend lifecycle refresh to the existing recording RPC for the same row", async () => {
    const user = authUser(existingUserId, "employee4@example.com");
    const pendingInvitation = invitation({
      auth_user_id: existingUserId,
      last_error_code: "provider_rejected",
    });
    deliveryState.lastErrorCode = pendingInvitation.last_error_code;
    mocks.listUsers.mockResolvedValue({ data: { users: [user] }, error: null });
    mocks.inviteUserByEmail.mockResolvedValue({ data: { user }, error: null });

    await deliverWorkspaceInvitation(pendingInvitation);

    expect(mocks.rpc).toHaveBeenCalledWith("record_workspace_invitation_send", {
      target_activation_mode: "set_password",
      target_auth_user_id: existingUserId,
      target_invitation_id: invitationId,
    });
    expect(mocks.rpc).not.toHaveBeenCalledWith("create_workspace_invitation", expect.anything());
    expect(deliveryState).toEqual({
      activationMode: "set_password",
      expiresAt: "2026-08-28T01:00:00.000Z",
      lastErrorCode: null,
      lastSentAt: "2026-08-27T01:00:00.000Z",
      sendCount: 1,
    });
  });

  it("records only a sanitized provider failure without recording a send", async () => {
    const user = authUser(existingUserId, "employee4@example.com");
    mocks.listUsers.mockResolvedValue({ data: { users: [user] }, error: null });
    mocks.inviteUserByEmail.mockResolvedValue({
      data: { user: null },
      error: { code: "provider_internal_detail", message: "sensitive provider detail", status: 503 },
    });

    await expect(deliverWorkspaceInvitation(invitation())).resolves.toEqual({ ok: false });

    expect(mocks.rpc).toHaveBeenCalledWith("record_workspace_invitation_error", {
      sanitized_error_code: "provider_unavailable",
      target_auth_user_id: existingUserId,
      target_invitation_id: invitationId,
    });
    expect(mocks.rpc).not.toHaveBeenCalledWith(
      "record_workspace_invitation_send",
      expect.anything(),
    );
    expect(deliveryState.sendCount).toBe(0);
  });

  it("fails closed when the provider returns a different normalized email", async () => {
    const user = authUser(existingUserId, "employee4@example.com");
    const mismatchedUser = authUser(existingUserId, "another@example.com");
    mocks.listUsers.mockResolvedValue({ data: { users: [user] }, error: null });
    mocks.inviteUserByEmail.mockResolvedValue({ data: { user: mismatchedUser }, error: null });

    await expect(deliverWorkspaceInvitation(invitation())).resolves.toEqual({ ok: false });

    expect(mocks.rpc).toHaveBeenCalledWith("record_workspace_invitation_error", {
      sanitized_error_code: "provider_rejected",
      target_auth_user_id: existingUserId,
      target_invitation_id: invitationId,
    });
    expect(mocks.rpc).not.toHaveBeenCalledWith(
      "record_workspace_invitation_send",
      expect.anything(),
    );
  });

  it("fails closed on an unexplained returned identity mismatch", async () => {
    const existingUser = authUser(existingUserId, "employee4@example.com");
    const differentUser = authUser(returnedUserId, "employee4@example.com");
    mocks.listUsers.mockResolvedValue({ data: { users: [existingUser] }, error: null });
    mocks.inviteUserByEmail.mockResolvedValue({ data: { user: differentUser }, error: null });
    mocks.getUserById.mockResolvedValue({ data: { user: existingUser }, error: null });

    await expect(deliverWorkspaceInvitation(invitation())).resolves.toEqual({ ok: false });

    expect(mocks.getUserById).toHaveBeenCalledWith(existingUserId);
    expect(mocks.rpc).not.toHaveBeenCalledWith(
      "record_workspace_invitation_send",
      expect.anything(),
    );
  });

  it("accepts a replacement-race identity only after all approved checks pass", async () => {
    const existingUser = authUser(existingUserId, "employee4@example.com");
    const differentUser = authUser(returnedUserId, "employee4@example.com");
    mocks.listUsers
      .mockResolvedValueOnce({ data: { users: [existingUser] }, error: null })
      .mockResolvedValueOnce({ data: { users: [differentUser] }, error: null });
    mocks.inviteUserByEmail.mockResolvedValue({ data: { user: differentUser }, error: null });
    mocks.getUserById.mockResolvedValue({
      data: { user: null },
      error: { code: "user_not_found", status: 404 },
    });

    await expect(deliverWorkspaceInvitation(invitation())).resolves.toEqual({
      activationMode: "set_password",
      ok: true,
    });

    expect(mocks.listUsers).toHaveBeenCalledTimes(2);
    expect(mocks.from).toHaveBeenCalledWith("workspace_members");
    expect(mocks.rpc).toHaveBeenCalledWith("record_workspace_invitation_send", {
      target_activation_mode: "set_password",
      target_auth_user_id: returnedUserId,
      target_invitation_id: invitationId,
    });
  });

  it("rejects a replacement-race identity that already has a workspace membership", async () => {
    const existingUser = authUser(existingUserId, "employee4@example.com");
    const differentUser = authUser(returnedUserId, "employee4@example.com");
    mocks.listUsers
      .mockResolvedValueOnce({ data: { users: [existingUser] }, error: null })
      .mockResolvedValueOnce({ data: { users: [differentUser] }, error: null });
    mocks.inviteUserByEmail.mockResolvedValue({ data: { user: differentUser }, error: null });
    mocks.getUserById.mockResolvedValue({
      data: { user: null },
      error: { code: "user_not_found", status: 404 },
    });
    mocks.from.mockImplementation(() => ({
      select: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ count: 1, error: null }),
      })),
    }));

    await expect(deliverWorkspaceInvitation(invitation())).resolves.toEqual({ ok: false });

    expect(mocks.rpc).not.toHaveBeenCalledWith(
      "record_workspace_invitation_send",
      expect.anything(),
    );
  });

  it("re-reads once and switches once when the expected identity becomes confirmed", async () => {
    const unconfirmedUser = authUser(existingUserId, "employee4@example.com");
    const confirmedUser = authUser(existingUserId, "employee4@example.com", true);
    mocks.listUsers
      .mockResolvedValueOnce({ data: { users: [unconfirmedUser] }, error: null })
      .mockResolvedValueOnce({ data: { users: [confirmedUser] }, error: null });
    mocks.inviteUserByEmail.mockResolvedValue({
      data: { user: null },
      error: { code: "email_exists", status: 422 },
    });

    await expect(deliverWorkspaceInvitation(invitation())).resolves.toEqual({
      activationMode: "existing_account",
      ok: true,
    });

    expect(mocks.listUsers).toHaveBeenCalledTimes(2);
    expect(mocks.inviteUserByEmail).toHaveBeenCalledOnce();
    expect(mocks.signInWithOtp).toHaveBeenCalledOnce();
    expect(mocks.rpc).toHaveBeenCalledWith("record_workspace_invitation_send", {
      target_activation_mode: "existing_account",
      target_auth_user_id: existingUserId,
      target_invitation_id: invitationId,
    });
  });

  it("never deletes Auth users or logs provider secrets", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const user = authUser(existingUserId, "employee4@example.com");
    mocks.listUsers.mockResolvedValue({ data: { users: [user] }, error: null });
    mocks.inviteUserByEmail.mockResolvedValue({
      data: { user: null },
      error: {
        code: "provider_failure",
        message: "token_hash=never-log-this password=never-log-this secret=never-log-this",
        status: 400,
      },
    });

    await deliverWorkspaceInvitation(invitation());

    expect(mocks.deleteUser).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    expect(errorLog).not.toHaveBeenCalled();
    expect(mocks.rpc).toHaveBeenCalledWith("record_workspace_invitation_error", {
      sanitized_error_code: "provider_rejected",
      target_auth_user_id: existingUserId,
      target_invitation_id: invitationId,
    });
  });
});
