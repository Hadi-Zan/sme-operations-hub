"use client";

import { useActionState, useEffect } from "react";
import {
  createTask,
  updateTask,
  type TaskActionState,
} from "@/app/(app)/tasks/actions";
import {
  taskPriorities,
  taskPriorityLabels,
  taskStatuses,
  taskStatusLabels,
  type TaskListItem,
  type WorkspaceMemberOption,
} from "@/lib/tasks";

const initialState: TaskActionState = { message: null, status: "idle" };

type TaskFormProps = {
  members: WorkspaceMemberOption[];
  onCancel: () => void;
  onSaved: (message: string) => void;
  task?: TaskListItem;
};

export function TaskForm({ members, onCancel, onSaved, task }: TaskFormProps) {
  const action: (
    state: TaskActionState,
    formData: FormData,
  ) => Promise<TaskActionState> = task ? updateTask.bind(null, task.id) : createTask;
  const [state, formAction, pending] = useActionState(action, initialState);
  const messageId = "task-form-message";

  useEffect(() => {
    if (state.status === "success") {
      onSaved(state.message ?? (task ? "Task updated." : "Task created."));
    }
  }, [onSaved, state.message, state.status, task]);

  return (
    <form action={formAction} className="space-y-5">
      <fieldset disabled={pending} className="space-y-5 disabled:opacity-70">
        <div>
          <label htmlFor="task-title" className="block text-sm font-semibold text-slate-800">
            Task title
          </label>
          <input
            id="task-title"
            name="title"
            defaultValue={task?.title ?? ""}
            required
            maxLength={160}
            autoFocus
            aria-describedby={state.message ? messageId : undefined}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            placeholder="e.g. Confirm tomorrow's service visit"
          />
        </div>

        <div>
          <label htmlFor="task-description" className="block text-sm font-semibold text-slate-800">
            Description <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            id="task-description"
            name="description"
            defaultValue={task?.description ?? ""}
            maxLength={4000}
            rows={4}
            aria-describedby={state.message ? messageId : undefined}
            className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            placeholder="Add the information needed to complete this task."
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="task-status" className="block text-sm font-semibold text-slate-800">
              Status
            </label>
            <select
              id="task-status"
              name="status"
              defaultValue={task?.status ?? "todo"}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            >
              {taskStatuses.map((status) => (
                <option key={status} value={status}>
                  {taskStatusLabels[status]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="task-priority" className="block text-sm font-semibold text-slate-800">
              Priority
            </label>
            <select
              id="task-priority"
              name="priority"
              defaultValue={task?.priority ?? "medium"}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            >
              {taskPriorities.map((priority) => (
                <option key={priority} value={priority}>
                  {taskPriorityLabels[priority]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="task-due-date" className="block text-sm font-semibold text-slate-800">
              Due date <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="task-due-date"
              name="dueDate"
              type="date"
              defaultValue={task?.dueDate ?? ""}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label htmlFor="task-assignee" className="block text-sm font-semibold text-slate-800">
              Assignee <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <select
              id="task-assignee"
              name="assignedTo"
              defaultValue={task?.assignedTo ?? ""}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            >
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.displayName} · {member.role === "owner" ? "Owner" : "Member"}
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      {state.message && state.status === "error" ? (
        <p
          id={messageId}
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800"
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-65"
        >
          {pending ? "Saving…" : task ? "Save changes" : "Create task"}
        </button>
      </div>
    </form>
  );
}
