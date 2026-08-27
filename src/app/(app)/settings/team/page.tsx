import type { Metadata } from "next";
import Link from "next/link";
import { PendingInvitationList } from "@/components/pending-invitation-list";
import { TeamInviteForm } from "@/components/team-invite-form";
import { TeamMemberList } from "@/components/team-member-list";
import { requireWorkspaceOwner } from "@/lib/auth";
import { getTeamData } from "@/lib/team-data";

export const metadata: Metadata = { title: "Team settings" };
export const dynamic = "force-dynamic";

export default async function TeamSettingsPage() {
  const context = await requireWorkspaceOwner();
  if (!context) {
    return <main className="mx-auto max-w-3xl p-6"><h1 className="text-2xl font-semibold text-slate-950">Team settings</h1><p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Only an active workspace owner can manage employees.</p></main>;
  }

  let team;
  try {
    team = await getTeamData(context.workspace.id, context.workspace.timezone);
  } catch {
    return <main className="mx-auto max-w-3xl p-6"><h1 className="text-2xl font-semibold text-slate-950">Team settings</h1><p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">Team management could not load. Check the server-only Supabase admin configuration.</p></main>;
  }

  return (
    <main className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
      <Link href="/settings" className="text-sm font-semibold text-emerald-800">← Settings</Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Team</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">Invite employees as members, maintain display names, and pause or restore access without deleting history.</p>
      <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><h2 className="text-lg font-semibold text-slate-950">Invite an employee</h2><p className="mb-5 mt-1 text-sm text-slate-500">Invitations use the member role. Owner promotion and ownership transfer are not available.</p><TeamInviteForm /></section>
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><h2 className="text-lg font-semibold text-slate-950">Workspace members</h2><TeamMemberList members={team.members} /></section>
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><h2 className="text-lg font-semibold text-slate-950">Invitation history</h2><PendingInvitationList invitations={team.invitations} /></section>
    </main>
  );
}
