import type { ReactNode } from "react";
import { AccountNotConfigured } from "@/components/account-not-configured";
import { AccountAccessDeactivated } from "@/components/account-access-deactivated";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireAccountContext } from "@/lib/auth";
import { getAttentionNavigationCount } from "@/lib/attention-data";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const context = await requireAccountContext();

  if (context.status === "unconfigured") {
    return <AccountNotConfigured email={context.user.email} />;
  }

  if (context.status === "deactivated") {
    return <AccountAccessDeactivated email={context.user.email} />;
  }

  const attentionCount = await getAttentionNavigationCount(
    context.workspace.id,
    context.user.id,
    context.role,
  );

  return (
    <WorkspaceShell
      attentionCount={attentionCount}
      user={context.user}
      workspace={context.workspace}
      role={context.role}
    >
      {children}
    </WorkspaceShell>
  );
}
