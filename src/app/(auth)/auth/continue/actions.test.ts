import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AUTH_CONTINUATION_COOKIE,
  encodeAuthContinuation,
  type AuthContinuationType,
} from "@/lib/auth-continuation";

const mocks = vi.hoisted(() => ({
  continuationValue: undefined as string | undefined,
  cookieGet: vi.fn(),
  cookieSet: vi.fn(),
  createClient: vi.fn(),
  redirect: vi.fn(),
  verifyOtp: vi.fn(),
}));

class RedirectSignal extends Error {
  constructor(readonly destination: string) {
    super(`NEXT_REDIRECT:${destination}`);
  }
}

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: mocks.cookieGet,
    set: mocks.cookieSet,
  })),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));

import { continueAuthentication } from "@/app/(auth)/auth/continue/actions";

const tokenHash = "test_token_hash_abcdefghijklmnopqrstuvwxyz_1234567890";

function stageContinuation(type: AuthContinuationType) {
  mocks.continuationValue = encodeAuthContinuation({ tokenHash, type });
}

describe("continueAuthentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.continuationValue = undefined;
    mocks.cookieGet.mockImplementation((name: string) =>
      name === AUTH_CONTINUATION_COOKIE && mocks.continuationValue
        ? { name, value: mocks.continuationValue }
        : undefined,
    );
    mocks.verifyOtp.mockResolvedValue({ error: null });
    mocks.createClient.mockResolvedValue({ auth: { verifyOtp: mocks.verifyOtp } });
    mocks.redirect.mockImplementation((destination: string) => {
      throw new RedirectSignal(destination);
    });
  });

  it.each<AuthContinuationType>(["invite", "email", "magiclink"])(
    "redirects a verified %s continuation to invitation acceptance",
    async (type) => {
      stageContinuation(type);

      await expect(continueAuthentication()).rejects.toMatchObject({
        destination: "/invite/accept",
      });

      expect(mocks.verifyOtp).toHaveBeenCalledWith({ token_hash: tokenHash, type });
      expect(mocks.redirect).toHaveBeenCalledOnce();
      expect(mocks.redirect).toHaveBeenCalledWith("/invite/accept");
    },
  );

  it("redirects a verified recovery continuation to password reset", async () => {
    stageContinuation("recovery");

    await expect(continueAuthentication()).rejects.toMatchObject({
      destination: "/reset-password",
    });

    expect(mocks.verifyOtp).toHaveBeenCalledWith({
      token_hash: tokenHash,
      type: "recovery",
    });
    expect(mocks.redirect).toHaveBeenCalledOnce();
    expect(mocks.redirect).toHaveBeenCalledWith("/reset-password");
  });

  it("redirects a genuine verification failure to the generic invalid-link page", async () => {
    stageContinuation("invite");
    mocks.verifyOtp.mockResolvedValue({ error: new Error("synthetic verification failure") });

    await expect(continueAuthentication()).rejects.toMatchObject({
      destination: "/auth/error?reason=invalid",
    });

    expect(mocks.redirect).toHaveBeenCalledOnce();
    expect(mocks.redirect).toHaveBeenCalledWith("/auth/error?reason=invalid");
  });

  it("does not mistake the successful Next.js redirect signal for an Auth failure", async () => {
    stageContinuation("invite");
    const successRedirect = new RedirectSignal("/invite/accept");
    mocks.redirect.mockImplementationOnce(() => {
      throw successRedirect;
    });

    await expect(continueAuthentication()).rejects.toBe(successRedirect);

    expect(mocks.verifyOtp).toHaveBeenCalledOnce();
    expect(mocks.redirect).toHaveBeenCalledOnce();
    expect(mocks.redirect).not.toHaveBeenCalledWith("/auth/error?reason=invalid");
  });

  it("clears malformed continuation state without calling Supabase Auth", async () => {
    mocks.continuationValue = "invite.short";

    await expect(continueAuthentication()).rejects.toMatchObject({
      destination: "/auth/error?reason=invalid",
    });

    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.verifyOtp).not.toHaveBeenCalled();
  });

  it("expires the scoped continuation cookie only after verification finishes", async () => {
    stageContinuation("invite");

    await expect(continueAuthentication()).rejects.toBeInstanceOf(RedirectSignal);

    expect(mocks.cookieSet).toHaveBeenCalledWith(AUTH_CONTINUATION_COOKIE, "", {
      httpOnly: true,
      maxAge: 0,
      path: "/auth",
      sameSite: "lax",
      secure: false,
    });
    expect(mocks.verifyOtp.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.cookieSet.mock.invocationCallOrder[0],
    );
  });
});
