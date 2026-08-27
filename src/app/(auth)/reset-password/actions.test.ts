import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  redirect: vi.fn(),
  signOut: vi.fn(),
  updateUser: vi.fn(),
}));

class RedirectSignal extends Error {
  constructor(readonly destination: string) {
    super(`NEXT_REDIRECT:${destination}`);
  }
}

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

import { resetPassword } from "@/app/(auth)/reset-password/actions";

function passwordFormData() {
  const formData = new FormData();
  formData.set("password", "a-secure-new-password");
  formData.set("passwordConfirmation", "a-secure-new-password");
  return formData;
}

describe("resetPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateUser.mockResolvedValue({ error: null });
    mocks.signOut.mockResolvedValue({ error: null });
    mocks.createClient.mockResolvedValue({
      auth: {
        signOut: mocks.signOut,
        updateUser: mocks.updateUser,
      },
    });
    mocks.redirect.mockImplementation((destination: string) => {
      throw new RedirectSignal(destination);
    });
  });

  it("maps same_password to a specific retryable message without requesting a new link", async () => {
    mocks.updateUser.mockResolvedValue({
      error: {
        code: "same_password",
        message: "provider detail that must not reach the user",
      },
    });

    const result = await resetPassword({ message: null }, passwordFormData());

    expect(result).toEqual({
      message: "Your new password must be different from your current password.",
    });
    expect(result.message).not.toContain("recovery link");
    expect(mocks.signOut).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("keeps unexpected provider failures generic and sanitized", async () => {
    mocks.updateUser.mockResolvedValue({
      error: {
        code: "unexpected_failure",
        message: "sensitive provider detail",
      },
    });

    const result = await resetPassword({ message: null }, passwordFormData());

    expect(result).toEqual({
      message: "The password could not be updated. Request a new recovery link.",
    });
    expect(result.message).not.toContain("sensitive provider detail");
    expect(mocks.signOut).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("preserves global sign-out and redirect after a successful password update", async () => {
    await expect(resetPassword({ message: null }, passwordFormData())).rejects.toMatchObject({
      destination: "/login?notice=password-reset",
    });

    expect(mocks.updateUser).toHaveBeenCalledWith({ password: "a-secure-new-password" });
    expect(mocks.signOut).toHaveBeenCalledOnce();
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "global" });
    expect(mocks.redirect).toHaveBeenCalledOnce();
    expect(mocks.redirect).toHaveBeenCalledWith("/login?notice=password-reset");
  });
});
