import type { Metadata } from "next";
import { InvitationAcceptForm } from "@/components/invitation-accept-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Accept invitation" };
export const dynamic = "force-dynamic";

export default async function InvitationAcceptPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_current_workspace_invitation");
  const invitation = data?.[0];
  const available =
    !error &&
    invitation?.lifecycle_status === "pending" &&
    invitation.activation_mode !== null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4 sm:p-6">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.08)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Employee invitation</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          {available ? `Join ${invitation.workspace_name}` : "Invitation unavailable"}
        </h1>
        {available ? (
          <>
            <p className="mt-3 text-sm leading-6 text-slate-600">You are accepting access as <span className="font-semibold">{invitation.display_name}</span> ({invitation.email}). Your role is fixed as workspace member.</p>
            <InvitationAcceptForm invitationId={invitation.invitation_id} requiresPassword={invitation.activation_mode === "set_password"} />
          </>
        ) : (
          <p role="alert" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm leading-6 text-amber-900">This invitation is expired, cancelled, already accepted, or does not match the signed-in account. Ask the workspace owner to resend it.</p>
        )}
      </section>
    </main>
  );
}
