import { describe, expect, it } from "vitest";
import { isPublicAuthPath } from "@/lib/supabase/proxy";

describe("public authentication routes", () => {
  it.each([
    "/login",
    "/forgot-password",
    "/auth/confirm",
    "/auth/confirm/stage",
    "/auth/continue",
    "/auth/error",
  ])("allows %s before a session exists", (pathname) => {
    expect(isPublicAuthPath(pathname)).toBe(true);
  });

  it.each(["/", "/settings/team", "/reset-password", "/invite/accept"])(
    "keeps %s session-protected",
    (pathname) => {
      expect(isPublicAuthPath(pathname)).toBe(false);
    },
  );
});
