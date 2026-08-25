import { describe, expect, it } from "vitest";
import {
  attentionEpisodeKey,
  buildAttentionSummary,
  buildDailyOperationsDigest,
  filterAttentionItems,
  getAttentionScopeItems,
  parseAttentionFilters,
  sortAttentionItems,
  type AttentionListItem,
} from "./attention";

const currentUserId = "11111111-1111-1111-1111-111111111111";

function attentionItem(
  overrides: Partial<AttentionListItem> & Pick<AttentionListItem, "sourceId">,
): AttentionListItem {
  const fingerprint = overrides.conditionFingerprint ?? "a".repeat(32);
  const alertType = overrides.alertType ?? "task_overdue";

  return {
    acknowledgedAt: null,
    actionPath: "/tasks?status=active",
    alertType,
    assignedTo: currentUserId,
    assigneeName: "Workspace member",
    conditionFingerprint: fingerprint,
    detail: "Task was due 20 Aug 2026",
    effectiveDate: "2026-08-20",
    id: attentionEpisodeKey(alertType, overrides.sourceId, fingerprint),
    isAcknowledged: false,
    severity: "high",
    sortRank: 20,
    sourceType: "task",
    sourceUpdatedAt: "2026-08-20T08:00:00.000Z",
    title: "Review service schedule",
    ...overrides,
  };
}

describe("attention filter parsing", () => {
  it("uses role-aware defaults", () => {
    expect(parseAttentionFilters({}, "owner")).toMatchObject({
      category: "all",
      scope: "workspace",
      severity: "all",
      status: "needs_review",
    });
    expect(parseAttentionFilters({}, "member").scope).toBe("mine");
  });

  it("rejects malformed values and limits search text", () => {
    const filters = parseAttentionFilters(
      {
        category: "billing",
        q: "x".repeat(140),
        scope: "someone-else",
        severity: "urgent",
        status: "dismissed",
      },
      "member",
    );

    expect(filters).toEqual({
      category: "all",
      query: "x".repeat(100),
      scope: "mine",
      severity: "all",
      status: "needs_review",
    });
  });
});

describe("attention episodes", () => {
  it("keeps an unchanged episode key stable", () => {
    expect(
      attentionEpisodeKey("task_overdue", "source-1", "a".repeat(32)),
    ).toBe(attentionEpisodeKey("task_overdue", "source-1", "a".repeat(32)));
  });

  it("does not let a stale acknowledgement match a renewed episode", () => {
    const firstEpisode = attentionEpisodeKey(
      "inventory_low_stock",
      "source-1",
      "a".repeat(32),
    );
    const renewedEpisode = attentionEpisodeKey(
      "inventory_low_stock",
      "source-1",
      "b".repeat(32),
    );

    expect(renewedEpisode).not.toBe(firstEpisode);
  });
});

describe("attention scope and filtering", () => {
  const assigned = attentionItem({ sourceId: "assigned" });
  const unassigned = attentionItem({ assignedTo: null, sourceId: "unassigned" });
  const anotherMember = attentionItem({
    assignedTo: "22222222-2222-2222-2222-222222222222",
    sourceId: "other",
  });
  const inventory = attentionItem({
    actionPath: "/inventory?stock=low",
    alertType: "inventory_low_stock",
    assignedTo: null,
    detail: "2 units remaining; reorder at 3 units",
    severity: "medium",
    sortRank: 40,
    sourceId: "inventory",
    sourceType: "inventory",
    title: "Filter cartridges",
  });

  it("includes assigned, unassigned, and workspace inventory in My Attention", () => {
    expect(
      getAttentionScopeItems(
        [assigned, unassigned, anotherMember, inventory],
        "mine",
        currentUserId,
      ).map((item) => item.sourceId),
    ).toEqual(["assigned", "unassigned", "inventory"]);
  });

  it("applies category, acknowledgement, severity, and search filters", () => {
    const acknowledgedInventory = {
      ...inventory,
      acknowledgedAt: "2026-08-25T08:00:00.000Z",
      isAcknowledged: true,
    };
    const filters = parseAttentionFilters(
      {
        category: "inventory",
        q: "cartridges",
        scope: "workspace",
        severity: "medium",
        status: "acknowledged",
      },
      "owner",
    );

    expect(
      filterAttentionItems(
        [assigned, acknowledgedInventory],
        filters,
        currentUserId,
      ).map((item) => item.sourceId),
    ).toEqual(["inventory"]);
  });
});

describe("attention ordering and digest", () => {
  const criticalInventory = attentionItem({
    alertType: "inventory_low_stock",
    effectiveDate: "2026-08-24",
    severity: "critical",
    sortRank: 40,
    sourceId: "critical",
    sourceType: "inventory",
  });
  const olderOverdue = attentionItem({
    effectiveDate: "2026-08-18",
    sourceId: "older",
  });
  const newerOverdue = attentionItem({
    effectiveDate: "2026-08-22",
    sourceId: "newer",
  });
  const acknowledgedCritical = attentionItem({
    acknowledgedAt: "2026-08-25T08:00:00.000Z",
    alertType: "inventory_low_stock",
    effectiveDate: "2026-08-17",
    isAcknowledged: true,
    severity: "critical",
    sortRank: 40,
    sourceId: "acknowledged",
    sourceType: "inventory",
  });

  it("sorts by acknowledgement, severity, date, rank, title, and source", () => {
    expect(
      sortAttentionItems([
        acknowledgedCritical,
        newerOverdue,
        criticalInventory,
        olderOverdue,
      ]).map((item) => item.sourceId),
    ).toEqual(["critical", "older", "newer", "acknowledged"]);
  });

  it("builds deterministic live digest counts and preview items", () => {
    const items = [acknowledgedCritical, newerOverdue, criticalInventory, olderOverdue];
    const summary = buildAttentionSummary(items);
    const digest = buildDailyOperationsDigest(items, 2);

    expect(summary).toMatchObject({
      acknowledged: 1,
      critical: 2,
      high: 2,
      total: 4,
      unacknowledged: 3,
    });
    expect(summary.byType.inventory_low_stock).toBe(2);
    expect(summary.byType.task_overdue).toBe(2);
    expect(digest.items.map((item) => item.sourceId)).toEqual(["critical", "older"]);
    expect(digest.message).toBe("3 items need review across 4 active conditions.");
  });

  it("reports all-clear and acknowledged-but-open states separately", () => {
    expect(buildDailyOperationsDigest([]).message).toBe(
      "No active operational conditions need attention.",
    );
    expect(buildDailyOperationsDigest([acknowledgedCritical]).message).toBe(
      "1 active condition has been acknowledged and remains open.",
    );
  });
});
