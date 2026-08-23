"use client";

import { useActionState } from "react";
import {
  updateWorkspaceProfile,
  type WorkspaceProfileActionState,
} from "@/app/(app)/settings/actions";
import type { Workspace } from "@/lib/supabase/database.types";

const initialState: WorkspaceProfileActionState = { message: null, status: "idle" };

const commonTimezones = [
  "Asia/Singapore",
  "Asia/Kuala_Lumpur",
  "Asia/Bangkok",
  "Asia/Jakarta",
  "Asia/Manila",
  "UTC",
] as const;

type WorkspaceProfileFormProps = {
  canEdit: boolean;
  workspace: Workspace;
};

export function WorkspaceProfileForm({ canEdit, workspace }: WorkspaceProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateWorkspaceProfile, initialState);
  const timezones = commonTimezones.includes(workspace.timezone as (typeof commonTimezones)[number])
    ? commonTimezones
    : [workspace.timezone, ...commonTimezones];
  const describedBy = state.message ? "workspace-profile-message" : undefined;

  return (
    <form action={formAction} className="space-y-5">
      <fieldset disabled={!canEdit || pending} className="space-y-5 disabled:opacity-75">
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-slate-800">
            Business name
          </label>
          <input
            id="name"
            name="name"
            defaultValue={workspace.name}
            required
            maxLength={120}
            aria-describedby={describedBy}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-50"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="contactEmail" className="block text-sm font-semibold text-slate-800">
              Contact email
            </label>
            <input
              id="contactEmail"
              name="contactEmail"
              type="email"
              defaultValue={workspace.contact_email ?? ""}
              maxLength={320}
              aria-describedby={describedBy}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-50"
            />
          </div>
          <div>
            <label htmlFor="contactPhone" className="block text-sm font-semibold text-slate-800">
              Contact phone
            </label>
            <input
              id="contactPhone"
              name="contactPhone"
              type="tel"
              defaultValue={workspace.contact_phone ?? ""}
              maxLength={40}
              aria-describedby={describedBy}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-50"
            />
          </div>
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-semibold text-slate-800">
            Business address
          </label>
          <textarea
            id="address"
            name="address"
            defaultValue={workspace.address ?? ""}
            maxLength={500}
            rows={4}
            aria-describedby={describedBy}
            className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm leading-6 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-50"
          />
        </div>

        <div>
          <label htmlFor="timezone" className="block text-sm font-semibold text-slate-800">
            Business timezone
          </label>
          <select
            id="timezone"
            name="timezone"
            defaultValue={workspace.timezone}
            aria-describedby={describedBy}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-50"
          >
            {timezones.map((timezone) => (
              <option key={timezone} value={timezone}>
                {timezone}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      {state.message ? (
        <p
          id="workspace-profile-message"
          role={state.status === "error" ? "alert" : "status"}
          className={`rounded-xl border px-3.5 py-3 text-sm ${
            state.status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      {canEdit ? (
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-65"
        >
          {pending ? "Saving…" : "Save workspace profile"}
        </button>
      ) : (
        <p className="text-sm text-slate-500">Only the workspace owner can edit these details.</p>
      )}
    </form>
  );
}
