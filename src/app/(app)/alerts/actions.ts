"use server";

import { revalidatePath } from "next/cache";
import { requireAccountContext } from "@/lib/auth";
import { isAlertType } from "@/lib/attention";
import { createClient } from "@/lib/supabase/server";
import type { AlertType } from "@/lib/supabase/database.types";

export type AttentionActionState = {
  message: string | null;
  status: "error" | "idle" | "success";
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fingerprintPattern = /^[0-9a-f]{32}$/;

function isValidAlertReference(
  alertType: string,
  sourceId: string,
  conditionFingerprint: string,
): alertType is AlertType {
  return (
    isAlertType(alertType) &&
    uuidPattern.test(sourceId) &&
    fingerprintPattern.test(conditionFingerprint)
  );
}

async function getConfiguredContext() {
  const context = await requireAccountContext();
  return context.status === "configured" ? context : null;
}

function revalidateAttentionViews() {
  revalidatePath("/alerts");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
}

export async function acknowledgeAttentionItem(
  alertType: string,
  sourceId: string,
  conditionFingerprint: string,
  previousState: AttentionActionState,
  formData: FormData,
): Promise<AttentionActionState> {
  void previousState;
  void formData;

  if (!isValidAlertReference(alertType, sourceId, conditionFingerprint)) {
    return { status: "error", message: "This attention item could not be acknowledged." };
  }

  const context = await getConfiguredContext();
  if (!context) {
    return { status: "error", message: "A configured workspace is required." };
  }

  const supabase = await createClient();
  const { data: attentionItem, error: attentionError } = await supabase
    .from("operations_attention_items")
    .select("source_id")
    .eq("workspace_id", context.workspace.id)
    .eq("alert_type", alertType)
    .eq("source_id", sourceId)
    .eq("condition_fingerprint", conditionFingerprint)
    .maybeSingle();

  if (attentionError || !attentionItem) {
    return {
      status: "error",
      message: "This condition changed or was resolved. Refresh to see current attention.",
    };
  }

  const { error } = await supabase.from("alert_acknowledgements").insert({
    alert_type: alertType,
    condition_fingerprint: conditionFingerprint,
    source_id: sourceId,
    user_id: context.user.id,
    workspace_id: context.workspace.id,
  });

  if (error && error.code !== "23505") {
    return { status: "error", message: "This attention item could not be acknowledged." };
  }

  revalidateAttentionViews();
  return { status: "success", message: "Attention item acknowledged." };
}

export async function unacknowledgeAttentionItem(
  alertType: string,
  sourceId: string,
  conditionFingerprint: string,
  previousState: AttentionActionState,
  formData: FormData,
): Promise<AttentionActionState> {
  void previousState;
  void formData;

  if (!isValidAlertReference(alertType, sourceId, conditionFingerprint)) {
    return { status: "error", message: "This attention item could not be reopened for review." };
  }

  const context = await getConfiguredContext();
  if (!context) {
    return { status: "error", message: "A configured workspace is required." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("alert_acknowledgements")
    .delete()
    .eq("workspace_id", context.workspace.id)
    .eq("user_id", context.user.id)
    .eq("alert_type", alertType)
    .eq("source_id", sourceId)
    .eq("condition_fingerprint", conditionFingerprint);

  if (error) {
    return { status: "error", message: "This attention item could not be reopened for review." };
  }

  revalidateAttentionViews();
  return { status: "success", message: "Attention item returned to needs review." };
}
