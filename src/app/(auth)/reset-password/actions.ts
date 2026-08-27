"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ResetPasswordState = { message: string | null };

const genericUpdateError = "The password could not be updated. Request a new recovery link.";
const samePasswordError = "Your new password must be different from your current password.";

export async function resetPassword(
  _previousState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const password = formData.get("password");
  const confirmation = formData.get("passwordConfirmation");

  if (typeof password !== "string" || password.length < 12 || password.length > 1024) {
    return { message: "Use a password of at least 12 characters." };
  }
  if (password !== confirmation) return { message: "The passwords do not match." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { message: error.code === "same_password" ? samePasswordError : genericUpdateError };
  }

  await supabase.auth.signOut({ scope: "global" });
  redirect("/login?notice=password-reset");
}
