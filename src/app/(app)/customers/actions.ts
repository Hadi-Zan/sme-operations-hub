"use server";

import { revalidatePath } from "next/cache";
import { requireAccountContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type CustomerActionState = {
  message: string | null;
  status: "error" | "idle" | "success";
};

type CustomerInput = {
  address: string | null;
  contactName: string | null;
  email: string | null;
  name: string;
  notes: string | null;
  phone: string | null;
};

type InputResult =
  | { input: CustomerInput; message?: never }
  | { input?: never; message: string };

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(formData: FormData, key: string) {
  const value = textValue(formData, key);
  return value || null;
}

function parseCustomerInput(formData: FormData): InputResult {
  const name = textValue(formData, "name");
  const contactName = optionalText(formData, "contactName");
  const email = optionalText(formData, "email")?.toLowerCase() ?? null;
  const phone = optionalText(formData, "phone");
  const address = optionalText(formData, "address");
  const notes = optionalText(formData, "notes");

  if (!name || name.length > 160) {
    return { message: "Customer name must be between 1 and 160 characters." };
  }
  if (contactName && contactName.length > 120) {
    return { message: "Contact name must be 120 characters or fewer." };
  }
  if (email && (!email.includes("@") || email.length > 320)) {
    return { message: "Enter a valid email address." };
  }
  if (phone && phone.length > 40) {
    return { message: "Phone number must be 40 characters or fewer." };
  }
  if (address && address.length > 500) {
    return { message: "Address or service location must be 500 characters or fewer." };
  }
  if (notes && notes.length > 2000) {
    return { message: "Customer notes must be 2,000 characters or fewer." };
  }

  return { input: { address, contactName, email, name, notes, phone } };
}

async function getOwnerContext() {
  const context = await requireAccountContext();
  return context.status === "configured" && context.role === "owner" ? context : null;
}

function revalidateCustomerViews() {
  revalidatePath("/customers");
  revalidatePath("/follow-ups");
  revalidatePath("/alerts");
  revalidatePath("/");
  revalidatePath("/", "layout");
}

export async function createCustomer(
  _previousState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  const parsed = parseCustomerInput(formData);
  if (!parsed.input) return { status: "error", message: parsed.message };

  const context = await getOwnerContext();
  if (!context) {
    return { status: "error", message: "Only the workspace owner can create customers." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .insert({
      address: parsed.input.address,
      contact_name: parsed.input.contactName,
      created_by: context.user.id,
      email: parsed.input.email,
      name: parsed.input.name,
      notes: parsed.input.notes,
      phone: parsed.input.phone,
      workspace_id: context.workspace.id,
    })
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { status: "error", message: "The customer could not be created." };
  }

  revalidateCustomerViews();
  return { status: "success", message: "Customer created." };
}

export async function updateCustomer(
  customerId: string,
  _previousState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  if (!uuidPattern.test(customerId)) {
    return { status: "error", message: "The customer could not be updated." };
  }

  const parsed = parseCustomerInput(formData);
  if (!parsed.input) return { status: "error", message: parsed.message };

  const context = await getOwnerContext();
  if (!context) {
    return { status: "error", message: "Only the workspace owner can edit customers." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .update({
      address: parsed.input.address,
      contact_name: parsed.input.contactName,
      email: parsed.input.email,
      name: parsed.input.name,
      notes: parsed.input.notes,
      phone: parsed.input.phone,
    })
    .eq("id", customerId)
    .eq("workspace_id", context.workspace.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { status: "error", message: "The customer could not be updated." };
  }

  revalidateCustomerViews();
  return { status: "success", message: "Customer updated." };
}

export async function setCustomerActive(
  customerId: string,
  isActive: boolean,
  previousState: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  void previousState;
  void formData;

  if (!uuidPattern.test(customerId) || typeof isActive !== "boolean") {
    return { status: "error", message: "The customer status could not be updated." };
  }

  const context = await getOwnerContext();
  if (!context) {
    return { status: "error", message: "Only the workspace owner can change customer status." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .update({ is_active: isActive })
    .eq("id", customerId)
    .eq("workspace_id", context.workspace.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { status: "error", message: "The customer status could not be updated." };
  }

  revalidateCustomerViews();
  return {
    status: "success",
    message: isActive ? "Customer reactivated." : "Customer deactivated.",
  };
}
