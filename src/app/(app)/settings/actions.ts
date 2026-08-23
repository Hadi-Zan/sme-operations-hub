"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type WorkspaceProfileActionState = {
  message: string | null;
  status: "error" | "idle" | "success";
};

function optionalText(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function isValidTimezone(timezone: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone }).format();
    return true;
  } catch {
    return false;
  }
}

export async function updateWorkspaceProfile(
  _previousState: WorkspaceProfileActionState,
  formData: FormData,
): Promise<WorkspaceProfileActionState> {
  const name = optionalText(formData, "name");
  const contactEmail = optionalText(formData, "contactEmail")?.toLowerCase() ?? null;
  const contactPhone = optionalText(formData, "contactPhone");
  const address = optionalText(formData, "address");
  const timezone = optionalText(formData, "timezone");

  if (!name || name.length < 2 || name.length > 120) {
    return { status: "error", message: "Business name must be between 2 and 120 characters." };
  }

  if (contactEmail && (!contactEmail.includes("@") || contactEmail.length > 320)) {
    return { status: "error", message: "Enter a valid contact email address." };
  }

  if (contactPhone && contactPhone.length > 40) {
    return { status: "error", message: "Contact phone must be 40 characters or fewer." };
  }

  if (address && address.length > 500) {
    return { status: "error", message: "Address must be 500 characters or fewer." };
  }

  if (!timezone || timezone.length > 100 || !isValidTimezone(timezone)) {
    return { status: "error", message: "Choose a valid business timezone." };
  }

  const context = await requireWorkspaceOwner();
  if (!context) {
    return { status: "error", message: "Only the workspace owner can update this profile." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspaces")
    .update({
      address,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      name,
      timezone,
    })
    .eq("id", context.workspace.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { status: "error", message: "The workspace profile could not be updated." };
  }

  revalidatePath("/", "layout");
  revalidatePath("/settings");
  return { status: "success", message: "Workspace profile updated." };
}
