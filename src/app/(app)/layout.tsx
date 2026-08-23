import type { ReactNode } from "react";
import { AccountNotConfigured } from "@/components/account-not-configured";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireAccountContext } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const context = await requireAccountContext();

  if (context.status === "unconfigured") {
    return <AccountNotConfigured email={context.user.email} />;
  }

  return (
    <WorkspaceShell user={context.user} workspace={context.workspace} role={context.role}>
      {children}
    </WorkspaceShell>
  );
}
