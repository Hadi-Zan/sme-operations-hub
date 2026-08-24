import type { Metadata } from "next";
import Link from "next/link";
import { InventoryManager } from "@/components/inventory-manager";
import { requireAccountContext } from "@/lib/auth";
import { getInventoryPageData } from "@/lib/inventory-data";
import { parseInventoryFilters } from "@/lib/inventory";

export const metadata: Metadata = {
  title: "Inventory",
};

type InventoryPageProps = {
  searchParams: Promise<{
    category?: string | string[];
    history?: string | string[];
    q?: string | string[];
    stock?: string | string[];
  }>;
};

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  const context = await requireAccountContext();
  if (context.status !== "configured") return null;

  const filters = parseInventoryFilters(await searchParams);
  const {
    categories,
    filteredItems,
    historyItems,
    movements,
    selectedHistoryItem,
    summary,
  } = await getInventoryPageData(context.workspace.id, context.workspace.timezone, filters);
  const hasActiveFilters =
    filters.query.length > 0 || filters.stock !== "all" || filters.category !== null;
  const filterFormKey = JSON.stringify([filters.query, filters.stock, filters.category]);
  const summaryItems = [
    {
      detail: "Items maintained in this workspace",
      label: "Inventory items",
      tone: "bg-sky-50 text-sky-700",
      value: summary.total,
    },
    {
      detail: "At or below their reorder threshold",
      label: "Low stock",
      tone: "bg-amber-50 text-amber-800",
      value: summary.lowStock,
    },
    {
      detail: "Items with zero or negative stock",
      label: "Out of stock",
      tone: "bg-rose-50 text-rose-700",
      value: summary.outOfStock,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8">
      <section
        aria-labelledby="inventory-heading"
        className="flex flex-col gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
            <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            Live workspace data
          </div>
          <h1
            id="inventory-heading"
            className="text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-4xl"
          >
            Inventory
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Keep supplies and parts visible, with every stock change preserved as a movement.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <p className="font-semibold text-slate-800">{context.workspace.name}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {context.role === "owner" ? "Owner inventory controls" : "Member stock access"}
          </p>
        </div>
      </section>

      <section aria-labelledby="inventory-summary-heading" className="mt-6">
        <h2 id="inventory-summary-heading" className="sr-only">
          Inventory summary
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {summaryItems.map((item) => (
            <article
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
            >
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm font-medium text-slate-600">{item.label}</p>
                <span className={`rounded-lg px-2.5 py-1 text-xs font-bold ${item.tone}`}>
                  {item.value}
                </span>
              </div>
              <p className="mt-5 text-xs leading-5 text-slate-500">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="inventory-filters-heading"
        className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-5"
      >
        <h2 id="inventory-filters-heading" className="sr-only">
          Filter inventory
        </h2>
        <form
          key={filterFormKey}
          action="/inventory"
          method="get"
          className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_190px_210px_auto]"
        >
          <div>
            <label htmlFor="inventory-search" className="sr-only">
              Search inventory
            </label>
            <input
              id="inventory-search"
              name="q"
              type="search"
              defaultValue={filters.query}
              maxLength={100}
              placeholder="Search name, SKU, or category"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            />
          </div>
          <div>
            <label htmlFor="inventory-stock-filter" className="sr-only">
              Filter by stock level
            </label>
            <select
              id="inventory-stock-filter"
              name="stock"
              defaultValue={filters.stock}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            >
              <option value="all">All stock levels</option>
              <option value="low">Low stock only</option>
            </select>
          </div>
          <div>
            <label htmlFor="inventory-category-filter" className="sr-only">
              Filter by category
            </label>
            <select
              id="inventory-category-filter"
              name="category"
              defaultValue={filters.category ?? ""}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              Apply
            </button>
            {hasActiveFilters ? (
              <Link
                href="/inventory"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 outline-none transition hover:bg-slate-50 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                Clear
              </Link>
            ) : null}
          </div>
        </form>
      </section>

      <div className="mt-6">
        <InventoryManager
          filters={filters}
          hasActiveFilters={hasActiveFilters}
          historyItems={historyItems}
          items={filteredItems}
          movements={movements}
          role={context.role}
          selectedHistoryItem={selectedHistoryItem}
          totalItems={summary.total}
        />
      </div>
    </div>
  );
}
