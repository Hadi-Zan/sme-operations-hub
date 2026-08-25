import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { OperationsAttentionItem, WorkspaceRole } from "@/lib/supabase/database.types";
import {
  attentionEpisodeKey,
  buildAttentionSummary,
  buildDailyOperationsDigest,
  filterAttentionItems,
  getAttentionScopeItems,
  sortAttentionItems,
  type AttentionFilters,
  type AttentionListItem,
} from "@/lib/attention";

const attentionColumns =
  "workspace_id, alert_type, source_type, source_id, condition_fingerprint, severity, sort_rank, title, detail, assigned_to, effective_date, source_updated_at, action_path";

function mapAttentionItem(
  row: OperationsAttentionItem,
  acknowledgements: Map<string, string>,
  memberNames: Map<string, string>,
): AttentionListItem {
  const acknowledgedAt = acknowledgements.get(
    attentionEpisodeKey(row.alert_type, row.source_id, row.condition_fingerprint),
  ) ?? null;

  return {
    acknowledgedAt,
    actionPath: row.action_path,
    alertType: row.alert_type,
    assignedTo: row.assigned_to,
    assigneeName: row.assigned_to
      ? (memberNames.get(row.assigned_to) ?? "Workspace member")
      : row.source_type === "inventory"
        ? "Workspace-wide"
        : "Unassigned",
    conditionFingerprint: row.condition_fingerprint,
    detail: row.detail,
    effectiveDate: row.effective_date,
    id: attentionEpisodeKey(row.alert_type, row.source_id, row.condition_fingerprint),
    isAcknowledged: Boolean(acknowledgedAt),
    severity: row.severity,
    sortRank: row.sort_rank,
    sourceId: row.source_id,
    sourceType: row.source_type,
    sourceUpdatedAt: row.source_updated_at,
    title: row.title,
  };
}

export const getWorkspaceAttentionItems = cache(
  async (workspaceId: string, userId: string): Promise<AttentionListItem[]> => {
    const supabase = await createClient();
    const [itemsResult, acknowledgementsResult, membersResult] = await Promise.all([
      supabase
        .from("operations_attention_items")
        .select(attentionColumns)
        .eq("workspace_id", workspaceId),
      supabase
        .from("alert_acknowledgements")
        .select("alert_type, source_id, condition_fingerprint, acknowledged_at")
        .eq("workspace_id", workspaceId)
        .eq("user_id", userId),
      supabase
        .from("workspace_members")
        .select("user_id, display_name")
        .eq("workspace_id", workspaceId),
    ]);

    if (itemsResult.error || acknowledgementsResult.error || membersResult.error) {
      throw new Error("Workspace attention could not be loaded.");
    }

    const acknowledgements = new Map(
      acknowledgementsResult.data.map((acknowledgement) => [
        attentionEpisodeKey(
          acknowledgement.alert_type,
          acknowledgement.source_id,
          acknowledgement.condition_fingerprint,
        ),
        acknowledgement.acknowledged_at,
      ]),
    );
    const memberNames = new Map(
      membersResult.data.map((member) => [member.user_id, member.display_name]),
    );

    return sortAttentionItems(
      itemsResult.data.map((row) =>
        mapAttentionItem(row, acknowledgements, memberNames),
      ),
    );
  },
);

export async function getAttentionPageData(
  workspaceId: string,
  userId: string,
  filters: AttentionFilters,
) {
  const items = await getWorkspaceAttentionItems(workspaceId, userId);
  const scopedItems = getAttentionScopeItems(items, filters.scope, userId);

  return {
    digest: buildDailyOperationsDigest(scopedItems, 8),
    filteredItems: filterAttentionItems(items, filters, userId),
    summary: buildAttentionSummary(scopedItems),
  };
}

export async function getAttentionNavigationCount(
  workspaceId: string,
  userId: string,
  role: WorkspaceRole,
) {
  const items = await getWorkspaceAttentionItems(workspaceId, userId);
  const defaultScope = role === "owner" ? "workspace" : "mine";

  return getAttentionScopeItems(items, defaultScope, userId).filter(
    (item) => !item.isAcknowledged,
  ).length;
}

export async function getDashboardAttentionData(
  workspaceId: string,
  userId: string,
) {
  const items = await getWorkspaceAttentionItems(workspaceId, userId);

  return {
    digest: buildDailyOperationsDigest(items, 6),
    items,
  };
}
