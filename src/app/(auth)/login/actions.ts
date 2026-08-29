"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type LoginActionState = {
  message: string | null;
};

export async function signIn(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");
  const email = typeof emailValue === "string" ? emailValue.trim().toLowerCase() : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";

  if (!email || !email.includes("@") || !password || email.length > 320 || password.length > 1024) {
    return { message: "Enter a valid email address and password." };
  }

  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return { message: "The application connection has not been configured yet." };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { message: "Unable to sign in with those credentials." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } finally {
    revalidatePath("/", "layout");
    redirect("/login");
  }
}
