import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Workspace, WorkspaceRole } from "@/lib/supabase/database.types";

export type CurrentUser = {
  displayName: string;
  email: string;
  id: string;
  initials: string;
};

export type AccountContext =
  | {
      status: "configured";
      role: WorkspaceRole;
      user: CurrentUser;
      workspace: Workspace;
    }
  | {
      status: "unconfigured";
      user: CurrentUser;
    };

function getDisplayName(user: User) {
  const metadataNames = [
    user.user_metadata.full_name,
    user.user_metadata.display_name,
    user.user_metadata.name,
  ];

  const metadataName = metadataNames.find(
    (value): value is string => typeof value === "string" && value.trim().length > 0,
  );

  if (metadataName) return metadataName.trim();
  if (user.email) return user.email.split("@")[0];
  return "Workspace user";
}

function getInitials(displayName: string) {
  const words = displayName.trim().split(/\s+/).filter(Boolean);
  const initials =
    words.length > 1
      ? `${words[0][0]}${words[words.length - 1][0]}`
      : words[0]?.slice(0, 2);

  return initials?.toUpperCase() || "WU";
}

function toCurrentUser(user: User): CurrentUser {
  const displayName = getDisplayName(user);

  return {
    displayName,
    email: user.email ?? "Email unavailable",
    id: user.id,
    initials: getInitials(displayName),
  };
}

export const getOptionalCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  try {
    const supabase = await createClient();
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

    if (claimsError || !claimsData?.claims?.sub) return null;

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user || userData.user.id !== claimsData.claims.sub) {
      return null;
    }

    return toCurrentUser(userData.user);
  } catch {
    return null;
  }
});

export const getAccountContext = cache(async (): Promise<AccountContext | null> => {
  const user = await getOptionalCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError || !membership) {
    return { status: "unconfigured", user };
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id, name, contact_email, contact_phone, address, timezone, created_at, updated_at")
    .eq("id", membership.workspace_id)
    .maybeSingle();

  if (workspaceError || !workspace) {
    return { status: "unconfigured", user };
  }

  return {
    status: "configured",
    role: membership.role,
    user,
    workspace,
  };
});

export async function requireAccountContext() {
  const context = await getAccountContext();

  if (!context) redirect("/login");

  return context;
}

export async function requireWorkspaceOwner() {
  const context = await requireAccountContext();

  if (context.status !== "configured" || context.role !== "owner") {
    return null;
  }

  return context;
}
