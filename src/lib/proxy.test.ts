import { describe, expect, it } from "vitest";
import { isPublicPath } from "@/lib/supabase/proxy";

describe("public routes", () => {
  it.each([
    "/",
    "/login",
    "/forgot-password",
    "/auth/confirm",
    "/auth/confirm/stage",
    "/auth/continue",
    "/auth/error",
  ])("allows %s before a session exists", (pathname) => {
    expect(isPublicPath(pathname)).toBe(true);
  });

  it.each([
    "/dashboard",
    "/tasks",
    "/inventory",
    "/customers",
    "/follow-ups",
    "/alerts",
    "/settings",
    "/settings/team",
    "/reset-password",
    "/invite/accept",
  ])("keeps %s session-protected", (pathname) => {
    expect(isPublicPath(pathname)).toBe(false);
  });

  it("does not treat root-prefixed paths as public", () => {
    expect(isPublicPath("/dashboard/reports")).toBe(false);
  });
});
