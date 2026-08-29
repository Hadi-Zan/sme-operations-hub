import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOptionalCurrentUser: vi.fn(),
  getSupabaseConfig: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/components/login-form", () => ({ LoginForm: () => null }));
vi.mock("@/lib/auth", () => ({ getOptionalCurrentUser: mocks.getOptionalCurrentUser }));
vi.mock("@/lib/supabase/config", () => ({ getSupabaseConfig: mocks.getSupabaseConfig }));

import LoginPage from "@/app/(auth)/login/page";

describe("login page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSupabaseConfig.mockReturnValue({
      publishableKey: "test-publishable-key",
      url: "https://example.supabase.co",
    });
  });

  it("redirects an authenticated visitor to the dashboard", async () => {
    mocks.getOptionalCurrentUser.mockResolvedValue({ id: "user-1" });

    await LoginPage({ searchParams: Promise.resolve({}) });

    expect(mocks.redirect).toHaveBeenCalledWith("/dashboard");
  });
});
