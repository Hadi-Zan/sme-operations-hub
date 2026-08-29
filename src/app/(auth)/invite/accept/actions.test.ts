import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));

import { acceptInvitation } from "@/app/(auth)/invite/accept/actions";

describe("invitation acceptance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createClient.mockResolvedValue({
      auth: { updateUser: vi.fn() },
      rpc: mocks.rpc,
    });
  });

  it("redirects a successful acceptance to the dashboard", async () => {
    const invitationId = "00000000-0000-0000-0000-000000000001";
    mocks.rpc
      .mockResolvedValueOnce({
        data: [
          {
            activation_mode: "existing_account",
            invitation_id: invitationId,
            lifecycle_status: "pending",
          },
        ],
        error: null,
      })
      .mockResolvedValueOnce({ data: "accepted", error: null });

    const formData = new FormData();
    formData.set("invitationId", invitationId);

    await acceptInvitation({ message: null }, formData);

    expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(mocks.redirect).toHaveBeenCalledWith("/dashboard");
  });
});
