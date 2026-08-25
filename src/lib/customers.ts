export type CustomerLifecycleFilter = "active" | "all" | "inactive";

export type CustomerFilters = {
  query: string;
  status: CustomerLifecycleFilter;
};

export type CustomerListItem = {
  address: string | null;
  contactName: string | null;
  email: string | null;
  id: string;
  isActive: boolean;
  name: string;
  nextFollowUpDate: string | null;
  notes: string | null;
  pendingFollowUpCount: number;
  phone: string | null;
  updatedAt: string;
};

export type CustomerPageSummary = {
  active: number;
  inactive: number;
  total: number;
};

function firstSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseCustomerFilters(searchParams: {
  q?: string | string[];
  status?: string | string[];
}): CustomerFilters {
  const rawStatus = firstSearchValue(searchParams.status) ?? "active";
  const query = (firstSearchValue(searchParams.q) ?? "").trim().slice(0, 100);

  return {
    query,
    status:
      rawStatus === "inactive" || rawStatus === "all" || rawStatus === "active"
        ? rawStatus
        : "active",
  };
}

export function customerInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const initials =
    words.length > 1
      ? `${words[0][0]}${words[words.length - 1][0]}`
      : words[0]?.slice(0, 2);

  return initials?.toUpperCase() || "CU";
}

export function formatCustomerFollowUpDate(date: string) {
  return new Intl.DateTimeFormat("en-SG", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00Z`));
}
