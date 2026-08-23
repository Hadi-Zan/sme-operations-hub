export const summaryMetrics = [
  {
    label: "Open tasks",
    value: "18",
    detail: "6 scheduled for today",
    change: "+3 this week",
    tone: "bg-sky-50 text-sky-700 ring-sky-600/10",
  },
  {
    label: "Due today",
    value: "6",
    detail: "2 marked as urgent",
    change: "2 urgent",
    tone: "bg-rose-50 text-rose-700 ring-rose-600/10",
  },
  {
    label: "Low stock",
    value: "4",
    detail: "Across 3 supply categories",
    change: "Review",
    tone: "bg-amber-50 text-amber-800 ring-amber-600/10",
  },
  {
    label: "Follow-ups",
    value: "8",
    detail: "3 customer replies pending",
    change: "On track",
    tone: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  },
] as const;
export const priorityTasks = [
  {
    title: "Confirm air-conditioning maintenance visit",
    customer: "Riverside Dental · Service #S-2041",
    due: "9:30 AM",
    owner: "Maya",
    status: "Urgent",
    statusTone: "bg-rose-50 text-rose-700",
  },
  {
    title: "Prepare replacement filter kit",
    customer: "Northpoint Studio · Service #S-2045",
    due: "11:00 AM",
    owner: "Hadi",
    status: "In progress",
    statusTone: "bg-sky-50 text-sky-700",
  },
  {
    title: "Send completed service report",
    customer: "Juniper Learning Centre · Service #S-2038",
    due: "2:00 PM",
    owner: "Aisha",
    status: "Ready",
    statusTone: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Review next week's technician schedule",
    customer: "Internal operations",
    due: "4:30 PM",
    owner: "Hadi",
    status: "Planned",
    statusTone: "bg-slate-100 text-slate-600",
  },
] as const;

export const workstreamProgress = [
  { label: "Scheduled visits", value: 82, color: "bg-emerald-300" },
  { label: "Task completion", value: 72, color: "bg-sky-300" },
  { label: "Customer follow-ups", value: 61, color: "bg-amber-300" },
] as const;

export const inventoryAlerts = [
  { name: "20 × 20 filter cartridges", reorderAt: "8 units", remaining: "3 units" },
  { name: "Condenser cleaning solution", reorderAt: "15 litres", remaining: "9 litres" },
  { name: "Service report booklets", reorderAt: "10 books", remaining: "6 books" },
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
