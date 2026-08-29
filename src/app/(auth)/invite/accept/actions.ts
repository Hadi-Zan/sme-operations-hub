"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSuccessfulInvitationAcceptanceResult } from "@/lib/team";

export type InvitationAcceptState = { message: string | null };

export async function acceptInvitation(
  _previousState: InvitationAcceptState,
  formData: FormData,
): Promise<InvitationAcceptState> {
  const invitationId = formData.get("invitationId");
  const password = formData.get("password");
  const passwordConfirmation = formData.get("passwordConfirmation");

  if (typeof invitationId !== "string" || !/^[0-9a-f-]{36}$/i.test(invitationId)) {
    return { message: "This invitation is unavailable." };
  }

  const supabase = await createClient();
  const { data: rows, error: invitationError } = await supabase.rpc(
    "get_current_workspace_invitation",
  );
  const invitation = rows?.find((row) => row.invitation_id === invitationId);
  if (invitationError || !invitation || invitation.lifecycle_status !== "pending") {
    return { message: "This invitation is expired, cancelled, or unavailable." };
  }

  const requiresPassword = invitation.activation_mode === "set_password";
  if (requiresPassword) {
    if (typeof password !== "string" || password.length < 12 || password.length > 1024) {
      return { message: "Use a password of at least 12 characters." };
    }
    if (password !== passwordConfirmation) return { message: "The passwords do not match." };

    const { error: passwordError } = await supabase.auth.updateUser({ password });
    if (passwordError) {
      return { message: "The account password could not be set. Request a new invitation link." };
    }
  }

  const { data: result, error } = await supabase.rpc("accept_workspace_invitation", {
    target_invitation_id: invitationId,
  });
  if (error || !isSuccessfulInvitationAcceptanceResult(result)) {
    const messages: Record<string, string> = {
      expired: "This workspace invitation has expired. Ask the owner to resend it.",
      mismatch: "This invitation belongs to a different account.",
      unavailable: "This invitation is cancelled or already used.",
    };
    return { message: messages[result ?? ""] ?? "The invitation could not be accepted." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
