import { afterEach, describe, expect, it, vi } from "vitest";
import { getSupabaseCookieOptions } from "@/lib/supabase/config";

describe("Supabase session cookie options", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps session cookies HttpOnly and same-site in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(getSupabaseCookieOptions()).toEqual({
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });
  });

  it("also requires HTTPS transport in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(getSupabaseCookieOptions()).toEqual({
      httpOnly: true,
      sameSite: "lax",
      secure: true,
    });
  });
});
