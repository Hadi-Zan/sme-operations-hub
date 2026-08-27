import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { requireAppUrl } from "@/lib/app-url";

describe("production application URL", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("requires an explicit configured URL", () => {
    vi.stubEnv("APP_BASE_URL", "");
    expect(() => requireAppUrl()).toThrow("APP_BASE_URL is not configured.");
  });

  it("allows local HTTP during development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("APP_BASE_URL", "http://localhost:3000/path");
    expect(requireAppUrl()).toBe("http://localhost:3000");
  });

  it("rejects HTTP callback origins in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_BASE_URL", "http://operations.example.com");
    expect(() => requireAppUrl()).toThrow("APP_BASE_URL must use https in production.");
  });

  it("accepts an HTTPS callback origin in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_BASE_URL", "https://operations.example.com/auth/confirm");
    expect(requireAppUrl()).toBe("https://operations.example.com");
  });
});
