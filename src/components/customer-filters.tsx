"use client";

import Link from "next/link";
import Form from "next/form";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  parseCustomerFilters,
  type CustomerFilters,
} from "@/lib/customers";

type CustomerFilterFieldsProps = {
  filters: CustomerFilters;
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

function CustomerFilterFields({
  filters,
  hasActiveFilters,
}: CustomerFilterFieldsProps) {
  const [query, setQuery] = useState(filters.query);
  const [status, setStatus] = useState(filters.status);
  const queryRef = useUrlSyncedControl<HTMLInputElement>(filters.query);
  const statusRef = useUrlSyncedControl<HTMLSelectElement>(filters.status);

  return (
    <Form
      action="/customers"
      autoComplete="off"
      className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_210px_auto]"
    >
      <div>
        <label htmlFor="customer-search" className="sr-only">
          Search customers
        </label>
        <input
          id="customer-search"
          ref={queryRef}
          name="q"
          type="search"
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          maxLength={100}
          placeholder="Search name, contact, phone, address, or notes"
          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
        />
      </div>
      <div>
        <label htmlFor="customer-status-filter" className="sr-only">
          Filter by customer status
        </label>
        <select
          id="customer-status-filter"
          ref={statusRef}
          name="status"
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as CustomerFilters["status"])
          }
          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
        >
          <option value="active">Active customers</option>
          <option value="inactive">Inactive customers</option>
          <option value="all">All customers</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          Apply
        </button>
        {hasActiveFilters ? (
          <Link
            href="/customers"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            Clear
          </Link>
        ) : null}
      </div>
    </Form>
  );
}

export function CustomerFiltersForm() {
  const searchParams = useSearchParams();
  const filters = parseCustomerFilters({
    q: searchParams.get("q") ?? undefined,
    status: searchParams.get("status") ?? undefined,
  });
  const hasActiveFilters = filters.query.length > 0 || filters.status !== "active";
  const formKey = JSON.stringify([filters.query, filters.status]);

  return (
    <CustomerFilterFields
      key={formKey}
      filters={filters}
      hasActiveFilters={hasActiveFilters}
    />
  );
}
