"use client";

import { useActionState } from "react";
import { deactivateMember, reactivateMember, updateMemberDisplayName, type TeamActionState } from "@/app/(app)/settings/team/actions";
import type { TeamMemberRecord } from "@/lib/team-data";

const initialState: TeamActionState = { message: null, status: "idle" };

function TeamMemberRow({ member }: { member: TeamMemberRecord }) {
  const lifecycleAction = member.status === "active" ? deactivateMember : reactivateMember;
  const [nameState, nameAction, namePending] = useActionState(updateMemberDisplayName, initialState);
  const [lifecycleState, lifecycleFormAction, lifecyclePending] = useActionState(lifecycleAction, initialState);
  const isEmployee = member.role === "member";

  return (
    <article className="grid gap-4 border-t border-slate-100 py-5 first:border-t-0 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-slate-950">{member.displayName}</h3><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{member.role === "owner" ? "Owner" : "Member"}</span><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${member.status === "active" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{member.status === "active" ? "Active" : "Deactivated"}</span></div>
        <p className="mt-1 truncate text-sm text-slate-500">{member.email}</p>
        {!isEmployee ? <p className="mt-2 text-xs text-slate-500">Owner role changes are not available in Gate 7A.</p> : null}
      </div>
      <div className="space-y-3">
        {isEmployee ? (
          <>
            <form action={nameAction} className="flex gap-2">
              <input type="hidden" name="userId" value={member.userId} />
              <label className="sr-only" htmlFor={`name-${member.userId}`}>Display name for {member.email}</label>
              <input id={`name-${member.userId}`} name="displayName" defaultValue={member.displayName} maxLength={100} required className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600" />
              <button disabled={namePending} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-60">Save</button>
            </form>
            {nameState.message ? <p role={nameState.status === "error" ? "alert" : "status"} className="text-xs text-slate-600">{nameState.message}</p> : null}
          </>
        ) : null}
        {isEmployee ? <form action={lifecycleFormAction}><input type="hidden" name="userId" value={member.userId} /><button disabled={lifecyclePending} className={`rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-60 ${member.status === "active" ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-800"}`}>{lifecyclePending ? "Updating…" : member.status === "active" ? "Deactivate" : "Reactivate"}</button>{lifecycleState.message ? <p role={lifecycleState.status === "error" ? "alert" : "status"} className="mt-2 text-xs text-slate-600">{lifecycleState.message}</p> : null}</form> : null}
      </div>
    </article>
  );
}

export function TeamMemberList({ members }: { members: TeamMemberRecord[] }) {
  return <div>{members.map((member) => <TeamMemberRow key={member.userId} member={member} />)}</div>;
}
