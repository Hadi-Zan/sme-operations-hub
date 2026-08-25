"use client";

import Link from "next/link";
import Form from "next/form";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  parseFollowUpFilters,
  type FollowUpAssigneeFilter,
  type FollowUpCustomerOption,
  type FollowUpFilters,
  type FollowUpMemberOption,
} from "@/lib/follow-ups";

type FollowUpFiltersProps = {
  customers: FollowUpCustomerOption[];
  members: FollowUpMemberOption[];
};

type FollowUpFilterFieldsProps = FollowUpFiltersProps & {
  filters: FollowUpFilters;
  hasActiveFilters: boolean;
};

function useUrlSyncedControl<T extends HTMLInputElement | HTMLSelectElement>(
  value: string,
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (ref.current && ref.current.value !== value) ref.current.value = value;
  }, [value]);

  return ref;
}

function FollowUpFilterFields({
  customers,
  filters,
  hasActiveFilters,
  members,
}: FollowUpFilterFieldsProps) {
  const [query, setQuery] = useState(filters.query);
  const [status, setStatus] = useState(filters.status);
  const [timing, setTiming] = useState(filters.timing);
  const [assignee, setAssignee] = useState(filters.assignee);
  const [customerId, setCustomerId] = useState(filters.customerId ?? "");
  const queryRef = useUrlSyncedControl<HTMLInputElement>(filters.query);
  const statusRef = useUrlSyncedControl<HTMLSelectElement>(filters.status);
  const timingRef = useUrlSyncedControl<HTMLSelectElement>(filters.timing);
  const assigneeRef = useUrlSyncedControl<HTMLSelectElement>(filters.assignee);
  const customerRef = useUrlSyncedControl<HTMLSelectElement>(filters.customerId ?? "");

  return (
    <Form
      action="/follow-ups"
      autoComplete="off"
      className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_160px_160px_190px_210px_auto]"
    >
      <div>
        <label htmlFor="follow-up-search" className="sr-only">
          Search follow-ups
        </label>
        <input
          id="follow-up-search"
          ref={queryRef}
          name="q"
          type="search"
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          maxLength={100}
          placeholder="Search customer, reason, notes, or outcome"
          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
        />
      </div>
      <div>
        <label htmlFor="follow-up-status-filter" className="sr-only">
          Filter by status
        </label>
        <select
          id="follow-up-status-filter"
          ref={statusRef}
          name="status"
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as FollowUpFilters["status"])
          }
          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
        >
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="all">All statuses</option>
        </select>
      </div>
      <div>
        <label htmlFor="follow-up-timing-filter" className="sr-only">
          Filter by due timing
        </label>
        <select
          id="follow-up-timing-filter"
          ref={timingRef}
          name="timing"
          value={timing}
          onChange={(event) =>
            setTiming(event.target.value as FollowUpFilters["timing"])
          }
          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
        >
          <option value="all">All due dates</option>
          <option value="overdue">Overdue</option>
          <option value="today">Due today</option>
          <option value="upcoming">Upcoming</option>
        </select>
      </div>
      <div>
        <label htmlFor="follow-up-assignee-filter" className="sr-only">
          Filter by assignee
        </label>
        <select
          id="follow-up-assignee-filter"
          ref={assigneeRef}
          name="assignee"
          value={assignee}
          onChange={(event) => setAssignee(event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
        >
          <option value="all">All assignees</option>
          <option value="unassigned">Unassigned</option>
          {members.map((member) => (
            <option key={member.userId} value={member.userId}>
              {member.displayName}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="follow-up-customer-filter" className="sr-only">
          Filter by customer
        </label>
        <select
          id="follow-up-customer-filter"
          ref={customerRef}
          name="customer"
          value={customerId}
          onChange={(event) => setCustomerId(event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
        >
          <option value="">All customers</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
              {customer.isActive ? "" : " (inactive)"}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2 md:col-span-2 xl:col-span-1">
        <button
          type="submit"
          className="flex-1 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          Apply
        </button>
        {hasActiveFilters ? (
          <Link
            href="/follow-ups"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            Clear
          </Link>
        ) : null}
      </div>
    </Form>
  );
}

export function FollowUpFiltersForm(props: FollowUpFiltersProps) {
  const searchParams = useSearchParams();
  const requestedFilters = parseFollowUpFilters({
    assignee: searchParams.get("assignee") ?? undefined,
    customer: searchParams.get("customer") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    timing: searchParams.get("timing") ?? undefined,
  });
  const memberIds = new Set(props.members.map((member) => member.userId));
  const customerIds = new Set(props.customers.map((customer) => customer.id));
  const assignee: FollowUpAssigneeFilter =
    requestedFilters.assignee === "all" ||
    requestedFilters.assignee === "unassigned" ||
    memberIds.has(requestedFilters.assignee)
      ? requestedFilters.assignee
      : "all";
  const customerId =
    requestedFilters.customerId && customerIds.has(requestedFilters.customerId)
      ? requestedFilters.customerId
      : null;
  const filters: FollowUpFilters = {
    ...requestedFilters,
    assignee,
    customerId,
  };
  const hasActiveFilters =
    filters.query.length > 0 ||
    filters.status !== "pending" ||
    filters.timing !== "all" ||
    filters.assignee !== "all" ||
    filters.customerId !== null;
  const formKey = JSON.stringify([
    filters.query,
    filters.status,
    filters.timing,
    filters.assignee,
    filters.customerId,
  ]);

  return (
    <FollowUpFilterFields
      key={formKey}
      {...props}
      filters={filters}
      hasActiveFilters={hasActiveFilters}
    />
  );
}
