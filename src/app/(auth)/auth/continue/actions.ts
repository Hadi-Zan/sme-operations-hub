"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AUTH_CONTINUATION_COOKIE,
  decodeAuthContinuation,
} from "@/lib/auth-continuation";
import { createClient } from "@/lib/supabase/server";

export async function continueAuthentication() {
  const cookieStore = await cookies();
  const continuation = decodeAuthContinuation(cookieStore.get(AUTH_CONTINUATION_COOKIE)?.value);

  const clearContinuation = () => {
    cookieStore.set(AUTH_CONTINUATION_COOKIE, "", {
      httpOnly: true,
      maxAge: 0,
      path: "/auth",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  };

  if (!continuation) {
    clearContinuation();
    redirect("/auth/error?reason=invalid");
  }

  let verificationFailed = true;
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: continuation.tokenHash,
      type: continuation.type,
    });
    verificationFailed = Boolean(error);
  } catch {
    verificationFailed = true;
  }

  clearContinuation();

  if (verificationFailed) redirect("/auth/error?reason=invalid");
  redirect(continuation.type === "recovery" ? "/reset-password" : "/invite/accept");
}
