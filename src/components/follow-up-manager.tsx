"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FollowUpForm } from "@/components/follow-up-form";
import { FollowUpOutcomeForm } from "@/components/follow-up-outcome-form";
import {
  followUpTimingLabel,
  followUpTimingTone,
  formatFollowUpDate,
  formatFollowUpTime,
  type FollowUpCustomerOption,
  type FollowUpListItem,
  type FollowUpMemberOption,
} from "@/lib/follow-ups";
import type { WorkspaceRole } from "@/lib/supabase/database.types";

type FollowUpDialog =
  | { kind: "create" }
  | { followUp: FollowUpListItem; kind: "edit" | "complete" | "reopen" };

type FollowUpManagerProps = {
  currentUserId: string;
  customers: FollowUpCustomerOption[];
  defaultCustomerId: string | null;
  followUps: FollowUpListItem[];
  hasActiveFilters: boolean;
  members: FollowUpMemberOption[];
  role: WorkspaceRole;
  today: string;
  totalFollowUps: number;
};

export function FollowUpManager({
  currentUserId,
  customers,
  defaultCustomerId,
  followUps,
  hasActiveFilters,
  members,
  role,
  today,
  totalFollowUps,
}: FollowUpManagerProps) {
  const [dialog, setDialog] = useState<FollowUpDialog | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isOwner = role === "owner";
  const activeCustomerCount = customers.filter((customer) => customer.isActive).length;
  const groups = [
    { label: "Overdue", items: followUps.filter((followUp) => followUp.isOverdue), tone: "text-rose-700" },
    { label: "Due today", items: followUps.filter((followUp) => followUp.isDueToday), tone: "text-amber-700" },
    { label: "Upcoming", items: followUps.filter((followUp) => followUp.isUpcoming), tone: "text-sky-700" },
    { label: "Completed history", items: followUps.filter((followUp) => followUp.status === "completed"), tone: "text-emerald-700" },
  ].filter((group) => group.items.length > 0);

  useEffect(() => {
    const element = dialogRef.current;
    if (dialog && element && !element.open) element.showModal();
    if (!dialog && element?.open) element.close();
  }, [dialog]);

  const closeDialog = useCallback(() => setDialog(null), []);
  const handleSaved = useCallback((message: string) => {
    setNotice(message);
    setDialog(null);
  }, []);

  return (
    <div>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Customer commitments</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">
              {followUps.length} {followUps.length === 1 ? "follow-up" : "follow-ups"}
            </h2>
          </div>
          {isOwner ? (
            <button
              type="button"
              onClick={() => setDialog({ kind: "create" })}
              disabled={activeCustomerCount === 0}
              className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              New follow-up
            </button>
          ) : (
            <p className="max-w-sm text-xs leading-5 text-slate-500">You can complete or reopen follow-ups assigned to you.</p>
          )}
        </div>

        {isOwner && activeCustomerCount === 0 ? (
          <p className="mx-5 mt-5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-900 sm:mx-6">
            Create or reactivate a customer before scheduling a new follow-up.
          </p>
        ) : null}
        {notice ? (
          <p role="status" className="mx-5 mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800 sm:mx-6">{notice}</p>
        ) : null}

        {groups.length ? (
          <div>
            {groups.map((group) => (
              <section key={group.label} aria-labelledby={`follow-up-group-${group.label.replaceAll(" ", "-").toLowerCase()}`}>
                <div className="border-y border-slate-100 bg-slate-50 px-5 py-2.5 first:border-t-0 sm:px-6">
                  <h3 id={`follow-up-group-${group.label.replaceAll(" ", "-").toLowerCase()}`} className={`text-xs font-semibold uppercase tracking-[0.14em] ${group.tone}`}>
                    {group.label} · {group.items.length}
                  </h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {group.items.map((followUp) => {
                    const canAct = isOwner || followUp.assignedTo === currentUserId;
                    const time = formatFollowUpTime(followUp.dueTime);
                    return (
                      <article key={followUp.id} className="grid gap-5 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.7fr)]">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${followUpTimingTone(followUp)}`}>
                              {followUpTimingLabel(followUp)}
                            </span>
                            {!followUp.customerIsActive ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">Inactive customer</span> : null}
                          </div>
                          <h4 className="mt-3 text-sm font-semibold leading-6 text-slate-950 sm:text-base">{followUp.title}</h4>
                          <p className="mt-1 text-xs font-semibold text-sky-700">{followUp.customerName}</p>
                          {followUp.customerContactName ? <p className="mt-1 text-xs text-slate-500">Contact: {followUp.customerContactName}</p> : null}
                          {followUp.notes ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{followUp.notes}</p> : null}
                          {followUp.outcome ? (
                            <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-3.5">
                              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Outcome</p>
                              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-emerald-950">{followUp.outcome}</p>
                              {followUp.formattedCompletedAt ? <p className="mt-2 text-[11px] text-emerald-700">Completed {followUp.formattedCompletedAt} by {followUp.completedByName ?? "Workspace member"}</p> : null}
                            </div>
                          ) : null}
                        </div>

                        <div className="flex flex-col justify-between gap-4 border-t border-slate-100 pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                          <div>
                            <p className="text-xs font-medium text-slate-400">Due</p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">{formatFollowUpDate(followUp.dueDate)}{time ? ` · ${time}` : " · Any time"}</p>
                            <p className="mt-2 text-xs text-slate-500">Assigned to {followUp.assigneeName}</p>
                          </div>
                          <div className="flex flex-wrap gap-2 lg:justify-end">
                            {isOwner ? <button type="button" onClick={() => setDialog({ followUp, kind: "edit" })} className="rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-600 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-500">Edit</button> : null}
                            {followUp.status === "pending" && canAct ? <button type="button" onClick={() => setDialog({ followUp, kind: "complete" })} className="rounded-lg bg-emerald-50 px-2.5 py-2 text-xs font-semibold text-emerald-800 outline-none transition hover:bg-emerald-100 focus-visible:ring-2 focus-visible:ring-emerald-500">Complete</button> : null}
                            {followUp.status === "completed" && canAct ? (
                              <>
                                <button type="button" onClick={() => setDialog({ followUp, kind: "complete" })} className="rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-600 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-500">Edit outcome</button>
                                <button type="button" onClick={() => setDialog({ followUp, kind: "reopen" })} className="rounded-lg bg-amber-50 px-2.5 py-2 text-xs font-semibold text-amber-800 outline-none transition hover:bg-amber-100 focus-visible:ring-2 focus-visible:ring-amber-500">Reopen</button>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-slate-950 text-xs font-black text-emerald-300">FU</span>
            <h3 className="mt-4 text-base font-semibold text-slate-900">
              {hasActiveFilters && totalFollowUps > 0 ? "No matching follow-ups" : "No follow-ups yet"}
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              {hasActiveFilters && totalFollowUps > 0
                ? "Clear or change the filters to see other customer follow-ups."
                : isOwner
                  ? activeCustomerCount > 0
                    ? "Schedule the first customer promise to start the shared queue."
                    : "Create an active customer before scheduling a follow-up."
                  : "The workspace owner can schedule the first follow-up."}
            </p>
          </div>
        )}
      </section>

      <dialog ref={dialogRef} aria-labelledby="follow-up-dialog-heading" onClose={() => setDialog(null)} onClick={(event) => { if (event.target === event.currentTarget) closeDialog(); }} className="m-auto w-[calc(100%-2rem)] max-w-2xl rounded-2xl border border-slate-200 bg-white p-0 text-slate-950 shadow-[0_24px_70px_rgba(15,23,42,0.24)] backdrop:bg-slate-950/55">
        {dialog ? (
          <div>
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Customer follow-up</p>
                <h2 id="follow-up-dialog-heading" className="mt-1 text-xl font-semibold text-slate-950">
                  {dialog.kind === "create" ? "Create follow-up" : dialog.kind === "edit" ? "Edit follow-up" : dialog.kind === "reopen" ? "Reopen follow-up" : dialog.followUp.status === "completed" ? "Edit outcome" : "Complete follow-up"}
                </h2>
              </div>
              <button type="button" onClick={closeDialog} aria-label="Close follow-up dialog" className="flex size-9 items-center justify-center rounded-lg text-lg text-slate-400 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-500">×</button>
            </div>
            <div className="max-h-[calc(100vh-10rem)] overflow-y-auto p-5 sm:p-6">
              {dialog.kind === "complete" || dialog.kind === "reopen" ? (
                <FollowUpOutcomeForm key={`${dialog.followUp.id}-${dialog.kind}`} followUp={dialog.followUp} mode={dialog.kind} onCancel={closeDialog} onSaved={handleSaved} />
              ) : (
                <FollowUpForm key={dialog.kind === "edit" ? dialog.followUp.id : "new"} customers={customers} defaultCustomerId={defaultCustomerId} followUp={dialog.kind === "edit" ? dialog.followUp : undefined} members={members} onCancel={closeDialog} onSaved={handleSaved} today={today} />
              )}
            </div>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
