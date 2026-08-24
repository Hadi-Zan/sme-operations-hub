export const demoSummaryMetrics = [
  {
    label: "Follow-ups",
    value: "8",
    detail: "3 customer replies pending",
    change: "Demo",
    tone: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  },
] as const;

export const workstreamProgress = [
  { label: "Scheduled visits", value: 82, color: "bg-emerald-300" },
  { label: "Task completion", value: 72, color: "bg-sky-300" },
  { label: "Customer follow-ups", value: 61, color: "bg-amber-300" },
] as const;

export const followUps = [
  {
    customer: "Marcus Tan",
    initials: "MT",
    reason: "Approve quotation Q-1048",
    when: "10:30 AM",
  },
  {
    customer: "Orchard Family Dental",
    initials: "OD",
    reason: "Post-service satisfaction check",
    when: "2:00 PM",
  },
  {
    customer: "Elaine Goh",
    initials: "EG",
    reason: "Annual maintenance renewal",
    when: "Tomorrow",
  },
] as const;
