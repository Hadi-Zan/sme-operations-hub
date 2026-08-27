"use client";

import { useActionState } from "react";
import { cancelInvitation, resendInvitation, type TeamActionState } from "@/app/(app)/settings/team/actions";
import type { TeamInvitationRecord } from "@/lib/team-data";

const initialState: TeamActionState = { message: null, status: "idle" };

function InvitationRow({ invitation }: { invitation: TeamInvitationRecord }) {
  const [resendState, resendAction, resendPending] = useActionState(resendInvitation, initialState);
  const [cancelState, cancelAction, cancelPending] = useActionState(cancelInvitation, initialState);
  const canManage = invitation.lifecycleStatus === "pending" || invitation.lifecycleStatus === "expired";
  return (
    <article className="border-t border-slate-100 py-5 first:border-t-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-slate-950">{invitation.displayName}</h3><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold capitalize text-slate-600">{invitation.lifecycleStatus}</span></div><p className="mt-1 text-sm text-slate-500">{invitation.email}</p><p className="mt-2 text-xs text-slate-400">Sent {invitation.sendCount} time{invitation.sendCount === 1 ? "" : "s"}. Workspace expiry: <time dateTime={invitation.expiresAt}>{invitation.expiresAtDisplay}</time>.</p>{invitation.lastErrorCode ? <p className="mt-1 text-xs text-rose-700">Last immediate send result: {invitation.lastErrorCode.replaceAll("_", " ")}.</p> : null}</div>
        {canManage ? <div className="flex gap-2"><form action={resendAction}><input type="hidden" name="invitationId" value={invitation.id} /><button disabled={resendPending} className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 disabled:opacity-60">{resendPending ? "Sending…" : "Resend"}</button></form><form action={cancelAction}><input type="hidden" name="invitationId" value={invitation.id} /><button disabled={cancelPending} className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800 disabled:opacity-60">{cancelPending ? "Cancelling…" : "Cancel"}</button></form></div> : null}
      </div>
      {[resendState, cancelState].map((state, index) => state.message ? <p key={index} role={state.status === "error" ? "alert" : "status"} className="mt-2 text-xs text-slate-600">{state.message}</p> : null)}
    </article>
  );
}

export function PendingInvitationList({ invitations }: { invitations: TeamInvitationRecord[] }) {
  return invitations.length ? <div>{invitations.map((invitation) => <InvitationRow key={invitation.id} invitation={invitation} />)}</div> : <p className="py-6 text-sm text-slate-500">No invitations yet.</p>;
}
