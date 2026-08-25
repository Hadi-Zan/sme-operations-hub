"use client";

import { useActionState } from "react";
import {
  acknowledgeAttentionItem,
  unacknowledgeAttentionItem,
  type AttentionActionState,
} from "@/app/(app)/alerts/actions";
import type { AlertType } from "@/lib/supabase/database.types";

const initialState: AttentionActionState = {
  message: null,
  status: "idle",
};

type AlertAcknowledgeButtonProps = {
  alertType: AlertType;
  conditionFingerprint: string;
  isAcknowledged: boolean;
  sourceId: string;
};

export function AlertAcknowledgeButton({
  alertType,
  conditionFingerprint,
  isAcknowledged,
  sourceId,
}: AlertAcknowledgeButtonProps) {
  const action = isAcknowledged
    ? unacknowledgeAttentionItem.bind(
        null,
        alertType,
        sourceId,
        conditionFingerprint,
      )
    : acknowledgeAttentionItem.bind(
        null,
        alertType,
        sourceId,
        conditionFingerprint,
      );
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col items-start gap-1 sm:items-end">
      <button
        type="submit"
        disabled={isPending}
        className={`rounded-lg px-3 py-2 text-xs font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 ${
          isAcknowledged
            ? "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            : "bg-slate-950 text-white hover:bg-slate-800"
        }`}
      >
        {isPending
          ? "Saving…"
          : isAcknowledged
            ? "Return to review"
            : "Acknowledge"}
      </button>
      {state.status === "error" ? (
        <span className="max-w-56 text-left text-[11px] leading-4 text-rose-700 sm:text-right" role="alert">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
