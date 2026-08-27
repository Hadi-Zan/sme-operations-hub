"use client";

import { useActionState } from "react";
import {
  acceptInvitation,
  type InvitationAcceptState,
} from "@/app/(auth)/invite/accept/actions";

const initialState: InvitationAcceptState = { message: null };

type InvitationAcceptFormProps = {
  invitationId: string;
  requiresPassword: boolean;
};

export function InvitationAcceptForm({ invitationId, requiresPassword }: InvitationAcceptFormProps) {
  const [state, action, pending] = useActionState(acceptInvitation, initialState);
  return (
    <form action={action} className="mt-6 space-y-5">
      <input type="hidden" name="invitationId" value={invitationId} />
      {requiresPassword ? (
        <>
          <div>
            <label htmlFor="invite-password" className="block text-sm font-semibold text-slate-800">Create password</label>
            <input id="invite-password" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={1024} required className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" />
          </div>
          <div>
            <label htmlFor="invite-password-confirmation" className="block text-sm font-semibold text-slate-800">Confirm password</label>
            <input id="invite-password-confirmation" name="passwordConfirmation" type="password" autoComplete="new-password" minLength={12} maxLength={1024} required className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" />
          </div>
        </>
      ) : null}
      {state.message ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800">{state.message}</p> : null}
      <button type="submit" disabled={pending} className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-60">{pending ? "Accepting…" : "Accept invitation"}</button>
    </form>
  );
}
