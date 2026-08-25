"use client";

import { useId, useMemo, useRef, useState } from "react";
import type { FollowUpCustomerOption } from "@/lib/follow-ups";

const resultLimit = 25;

type CustomerComboboxProps = {
  customers: FollowUpCustomerOption[];
  describedBy?: string;
  disabled?: boolean;
  initialCustomerId: string;
  onValidityChange: (isValid: boolean) => void;
};

function customerSearchText(customer: FollowUpCustomerOption) {
  return [customer.name, customer.contactName, customer.email, customer.phone]
    .filter((value): value is string => Boolean(value))
    .join("\n")
    .toLocaleLowerCase("en");
}

function CustomerDetails({ customer }: { customer: FollowUpCustomerOption }) {
  const contactDetails = [customer.email, customer.phone].filter(
    (value): value is string => Boolean(value),
  );

  return (
    <>
      {customer.contactName ? (
        <span className="block truncate text-xs text-slate-500">
          Contact: {customer.contactName}
        </span>
      ) : null}
      {contactDetails.length ? (
        <span className="mt-0.5 block truncate text-xs text-slate-400">
          {contactDetails.join(" · ")}
        </span>
      ) : null}
    </>
  );
}

export function CustomerCombobox({
  customers,
  describedBy,
  disabled = false,
  initialCustomerId,
  onValidityChange,
}: CustomerComboboxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const descriptionId = `${listboxId}-description`;
  const activeCustomers = useMemo(
    () => customers.filter((customer) => customer.isActive),
    [customers],
  );
  const initialCustomer = customers.find(
    (customer) => customer.id === initialCustomerId,
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    initialCustomer?.id ?? "",
  );
  const [query, setQuery] = useState(initialCustomer?.name ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const selectedCustomer = customers.find(
    (customer) => customer.id === selectedCustomerId,
  );
  const normalizedQuery = query.trim().toLocaleLowerCase("en");
  const matchingCustomers = activeCustomers.filter(
    (customer) =>
      !normalizedQuery || customerSearchText(customer).includes(normalizedQuery),
  );
  const visibleCustomers = matchingCustomers.slice(0, resultLimit);
  const safeActiveIndex = visibleCustomers.length
    ? Math.min(activeIndex, visibleCustomers.length - 1)
    : 0;
  const selectionIsCurrent = Boolean(
    selectedCustomer && query === selectedCustomer.name,
  );
  const selectedValue = selectionIsCurrent ? selectedCustomerId : "";
  const activeOptionId = isOpen
    ? visibleCustomers[safeActiveIndex]
      ? `${listboxId}-option-${visibleCustomers[safeActiveIndex].id}`
      : undefined
    : undefined;

  function restoreSelection() {
    setQuery(selectedCustomer?.name ?? "");
    onValidityChange(Boolean(selectedCustomer));
  }

  function selectCustomer(customer: FollowUpCustomerOption) {
    setSelectedCustomerId(customer.id);
    setQuery(customer.name);
    setIsOpen(false);
    setActiveIndex(0);
    onValidityChange(true);
    inputRef.current?.focus();
  }

  return (
    <div
      className="relative mt-2"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
          restoreSelection();
        }
      }}
    >
      <input name="customerId" type="hidden" value={selectedValue} />
      <div className="relative">
        <input
          ref={inputRef}
          id="follow-up-customer"
          type="text"
          role="combobox"
          autoComplete="off"
          autoFocus
          disabled={disabled}
          value={query}
          aria-activedescendant={activeOptionId}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-describedby={[descriptionId, describedBy].filter(Boolean).join(" ")}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-required="true"
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
            setActiveIndex(0);
            onValidityChange(false);
          }}
          onFocus={(event) => {
            setIsOpen(true);
            event.currentTarget.select();
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setIsOpen(true);
              setActiveIndex((index) =>
                visibleCustomers.length
                  ? (Math.min(index, visibleCustomers.length - 1) + 1) %
                    visibleCustomers.length
                  : 0,
              );
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setIsOpen(true);
              setActiveIndex((index) =>
                visibleCustomers.length
                  ? (Math.min(index, visibleCustomers.length - 1) - 1 +
                      visibleCustomers.length) % visibleCustomers.length
                  : 0,
              );
            } else if (event.key === "Enter" && isOpen) {
              event.preventDefault();
              const customer = visibleCustomers[safeActiveIndex];
              if (customer) selectCustomer(customer);
            } else if (event.key === "Escape" && isOpen) {
              event.preventDefault();
              setIsOpen(false);
              restoreSelection();
            }
          }}
          placeholder="Search by customer, contact, email, or phone"
          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 pr-11 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 disabled:opacity-70"
        />
        <button
          type="button"
          disabled={disabled}
          aria-label={isOpen ? "Close customer results" : "Open customer results"}
          onClick={() => {
            if (isOpen) {
              setIsOpen(false);
              restoreSelection();
            } else {
              setIsOpen(true);
              inputRef.current?.focus();
              inputRef.current?.select();
            }
          }}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-slate-400 outline-none transition hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 disabled:opacity-60"
        >
          <span aria-hidden="true" className={`text-xs transition ${isOpen ? "rotate-180" : ""}`}>
            ▼
          </span>
        </button>
      </div>

      <p id={descriptionId} className="mt-2 text-xs leading-5 text-slate-500">
        Search active customers by name, contact, email, or phone.
      </p>

      {selectedCustomer && selectionIsCurrent ? (
        <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold text-slate-700">Selected: {selectedCustomer.name}</p>
            {!selectedCustomer.isActive ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                Inactive current customer
              </span>
            ) : null}
          </div>
          <CustomerDetails customer={selectedCustomer} />
        </div>
      ) : null}

      {isOpen ? (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.16)]">
          {visibleCustomers.length ? (
            <ul
              id={listboxId}
              role="listbox"
              aria-label="Active customer results"
              className="max-h-72 overflow-y-auto p-1.5"
            >
              {visibleCustomers.map((customer, index) => (
                <li
                  key={customer.id}
                  id={`${listboxId}-option-${customer.id}`}
                  role="option"
                  aria-selected={customer.id === selectedValue}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectCustomer(customer)}
                  className={`cursor-pointer rounded-lg px-3 py-2.5 outline-none transition ${
                    index === safeActiveIndex
                      ? "bg-emerald-50 text-emerald-950"
                      : "text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <span className="block truncate text-sm font-semibold">{customer.name}</span>
                  <CustomerDetails customer={customer} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-5 text-center text-sm text-slate-500">
              No active customers match this search.
            </p>
          )}
          {matchingCustomers.length > resultLimit ? (
            <p className="border-t border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Showing the first {resultLimit} of {matchingCustomers.length} matches. Refine the search to narrow the list.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
