import type { Metadata } from "next";
import { CustomerFiltersForm } from "@/components/customer-filters";
import { CustomerManager } from "@/components/customer-manager";
import { requireAccountContext } from "@/lib/auth";
import { getCustomersPageData } from "@/lib/customer-data";
import { parseCustomerFilters } from "@/lib/customers";

export const metadata: Metadata = {
  title: "Customers",
};

type CustomersPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    status?: string | string[];
  }>;
};

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const context = await requireAccountContext();
  if (context.status !== "configured") return null;

  const filters = parseCustomerFilters(await searchParams);
  const { filteredCustomers, summary } = await getCustomersPageData(
    context.workspace.id,
    filters,
  );
  const hasActiveFilters = filters.query.length > 0 || filters.status !== "active";
  const summaryItems = [
    { label: "Active customers", value: summary.active, detail: "Available for new follow-ups", tone: "bg-emerald-50 text-emerald-700" },
    { label: "Inactive customers", value: summary.inactive, detail: "Retained with their follow-up history", tone: "bg-slate-100 text-slate-600" },
    { label: "Total records", value: summary.total, detail: "Workspace-scoped customer directory", tone: "bg-sky-50 text-sky-700" },
  ];

  return (
    <div className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8">
      <section aria-labelledby="customers-heading" className="flex flex-col gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
            <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            Live workspace data
          </div>
          <h1 id="customers-heading" className="text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-4xl">Customers</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Keep practical contact details, service context, and customer follow-up history together.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <p className="font-semibold text-slate-800">{context.workspace.name}</p>
          <p className="mt-0.5 text-xs text-slate-500">{context.role === "owner" ? "Owner customer controls" : "Member read access"}</p>
        </div>
      </section>

      <section aria-labelledby="customer-summary-heading" className="mt-6">
        <h2 id="customer-summary-heading" className="sr-only">Customer summary</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {summaryItems.map((item) => (
            <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm font-medium text-slate-600">{item.label}</p>
                <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${item.tone}`}>{item.value}</span>
              </div>
              <p className="mt-5 text-xs leading-5 text-slate-500">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="customer-filters-heading" className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-5">
        <h2 id="customer-filters-heading" className="sr-only">Filter customers</h2>
        <CustomerFiltersForm />
      </section>

      <div className="mt-6">
        <CustomerManager customers={filteredCustomers} hasActiveFilters={hasActiveFilters} role={context.role} totalCustomers={summary.total} />
      </div>
    </div>
  );
}
