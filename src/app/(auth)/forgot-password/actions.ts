"use server";

import { requireAppUrl } from "@/lib/app-url";
import { createClient } from "@/lib/supabase/server";

export type ForgotPasswordState = { message: string | null; status: "idle" | "sent" };

const genericRecoveryMessage =
  "If that address belongs to an account, a password recovery email will arrive shortly.";

export async function requestPasswordRecovery(
  _previousState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const value = formData.get("email");
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";

  if (email && email.length <= 320 && email.includes("@")) {
    try {
      const supabase = await createClient();
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${requireAppUrl()}/auth/confirm`,
      });
    } catch {
      // Recovery is deliberately enumeration-safe, including configuration and
      // provider failures. Detailed credentials, URLs, and tokens are not logged.
    }
  }

  return { message: genericRecoveryMessage, status: "sent" };
}
