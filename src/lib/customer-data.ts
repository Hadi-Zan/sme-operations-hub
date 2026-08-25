import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  CustomerFilters,
  CustomerListItem,
  CustomerPageSummary,
} from "@/lib/customers";

const customerColumns =
  "id, name, contact_name, email, phone, address, notes, is_active, updated_at";

export async function getCustomersPageData(workspaceId: string, filters: CustomerFilters) {
  const supabase = await createClient();
  const [customersResult, followUpsResult] = await Promise.all([
    supabase
      .from("customers")
      .select(customerColumns)
      .eq("workspace_id", workspaceId)
      .order("name"),
    supabase
      .from("follow_ups")
      .select("customer_id, due_date, due_time")
      .eq("workspace_id", workspaceId)
      .eq("status", "pending"),
  ]);

  if (customersResult.error || followUpsResult.error) {
    throw new Error("Workspace customers could not be loaded.");
  }

  const pendingByCustomer = new Map<string, { count: number; nextDate: string | null }>();
  const sortedPending = [...followUpsResult.data].sort((left, right) => {
    const dateDifference = left.due_date.localeCompare(right.due_date);
    if (dateDifference !== 0) return dateDifference;
    return (left.due_time ?? "99:99").localeCompare(right.due_time ?? "99:99");
  });

  sortedPending.forEach((followUp) => {
    const current = pendingByCustomer.get(followUp.customer_id);
    pendingByCustomer.set(followUp.customer_id, {
      count: (current?.count ?? 0) + 1,
      nextDate: current?.nextDate ?? followUp.due_date,
    });
  });

  const customers: CustomerListItem[] = customersResult.data.map((customer) => {
    const pending = pendingByCustomer.get(customer.id);
    return {
      address: customer.address,
      contactName: customer.contact_name,
      email: customer.email,
      id: customer.id,
      isActive: customer.is_active,
      name: customer.name,
      nextFollowUpDate: pending?.nextDate ?? null,
      notes: customer.notes,
      pendingFollowUpCount: pending?.count ?? 0,
      phone: customer.phone,
      updatedAt: customer.updated_at,
    };
  });
  const summary: CustomerPageSummary = {
    active: customers.filter((customer) => customer.isActive).length,
    inactive: customers.filter((customer) => !customer.isActive).length,
    total: customers.length,
  };
  const normalizedQuery = filters.query.toLocaleLowerCase("en");
  const filteredCustomers = customers.filter((customer) => {
    if (filters.status === "active" && !customer.isActive) return false;
    if (filters.status === "inactive" && customer.isActive) return false;
    if (!normalizedQuery) return true;

    return [
      customer.name,
      customer.contactName,
      customer.email,
      customer.phone,
      customer.address,
      customer.notes,
    ]
      .filter((value): value is string => Boolean(value))
      .join("\n")
      .toLocaleLowerCase("en")
      .includes(normalizedQuery);
  });

  return { filteredCustomers, summary };
}
