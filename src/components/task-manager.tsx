"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import {
  deleteTask,
  updateTaskStatus,
  type TaskActionState,
} from "@/app/(app)/tasks/actions";
import { TaskForm } from "@/components/task-form";
import type { WorkspaceRole } from "@/lib/supabase/database.types";
import {
  formatTaskDate,
  taskPriorityLabels,
  taskPriorityTone,
  taskStatuses,
  taskStatusLabels,
  type TaskListItem,
  type WorkspaceMemberOption,
} from "@/lib/tasks";

const initialActionState: TaskActionState = { message: null, status: "idle" };

type EditorState = { mode: "create" } | { mode: "edit"; task: TaskListItem } | null;

type TaskManagerProps = {
  currentUserId: string;
  hasActiveFilters: boolean;
  members: WorkspaceMemberOption[];
  role: WorkspaceRole;
  tasks: TaskListItem[];
  today: string;
  totalTasks: number;
};

function StatusControl({ taskId, value }: { taskId: string; value: TaskListItem["status"] }) {
  const action = updateTaskStatus.bind(null, taskId);
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (state.status === "error" && selectRef.current) {
      selectRef.current.value = value;
    }
  }, [state.status, value]);

  return (
    <form action={formAction} className="min-w-36">
      <label htmlFor={`task-status-${taskId}`} className="sr-only">
        Change task status
      </label>
      <select
        ref={selectRef}
        id={`task-status-${taskId}`}
        name="status"
        defaultValue={value}
        disabled={pending}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:cursor-wait disabled:opacity-60"
      >
        {taskStatuses.map((status) => (
          <option key={status} value={status}>
            {taskStatusLabels[status]}
          </option>
        ))}
      </select>
      {state.status === "error" && state.message ? (
        <p role="alert" className="mt-1 max-w-52 text-[11px] leading-4 text-rose-700">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

type DeleteTaskDialogProps = {
  onClose: () => void;
  onDeleted: (message: string) => void;
  task: TaskListItem;
};

function DeleteTaskDialog({ onClose, onDeleted, task }: DeleteTaskDialogProps) {
  const action = deleteTask.bind(null, task.id);
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  }, []);

  useEffect(() => {
    if (state.status === "success") {
      onDeleted(state.message ?? "Task deleted.");
    }
  }, [onDeleted, state.message, state.status]);

  const closeDialog = () => {
    if (pending) return;
    dialogRef.current?.close();
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="delete-task-dialog-heading"
      aria-describedby="delete-task-dialog-description"
      onCancel={(event) => {
        if (pending) {
          event.preventDefault();
          return;
        }
        onClose();
      }}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) closeDialog();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-slate-200 bg-white p-0 text-slate-950 shadow-[0_24px_70px_rgba(15,23,42,0.24)] backdrop:bg-slate-950/55"
    >
      <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
        <div className="flex size-10 items-center justify-center rounded-xl bg-rose-50 text-sm font-black text-rose-700">
          !
        </div>
        <h2 id="delete-task-dialog-heading" className="mt-4 text-xl font-semibold text-slate-950">
          Permanently delete task?
        </h2>
        <p id="delete-task-dialog-description" className="mt-2 text-sm leading-6 text-slate-600">
          <span className="font-semibold text-slate-900">“{task.title}”</span> will be removed from
          this workspace. This action cannot be undone.
        </p>
      </div>

      <form action={formAction} className="px-5 py-4 sm:px-6">
        {state.status === "error" && state.message ? (
          <p
            role="alert"
            className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800"
          >
            {state.message}
          </p>
        ) : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            autoFocus
            disabled={pending}
            onClick={closeDialog}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-wait disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white outline-none transition hover:bg-rose-800 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
          >
            {pending ? "Deleting…" : "Delete permanently"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

function dueDatePresentation(task: TaskListItem, today: string) {
  if (!task.dueDate) {
    return { label: "No due date", tone: "text-slate-400" };
  }

  if (task.status !== "completed" && task.dueDate < today) {
    return { label: `Overdue · ${formatTaskDate(task.dueDate)}`, tone: "text-rose-700" };
  }

  if (task.status !== "completed" && task.dueDate === today) {
    return { label: "Due today", tone: "text-amber-700" };
  }

  return { label: formatTaskDate(task.dueDate), tone: "text-slate-500" };
}

export function TaskManager({
  currentUserId,
  hasActiveFilters,
  members,
  role,
  tasks,
  today,
  totalTasks,
}: TaskManagerProps) {
  const [editor, setEditor] = useState<EditorState>(null);
  const [taskToDelete, setTaskToDelete] = useState<TaskListItem | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isOwner = role === "owner";

  const closeEditor = useCallback(() => {
    dialogRef.current?.close();
    setEditor(null);
  }, []);

  const handleSaved = useCallback(
    (message: string) => {
      setNotice(message);
      closeEditor();
    },
    [closeEditor],
  );

  const handleDeleted = useCallback((message: string) => {
    setNotice(message);
    setTaskToDelete(null);
  }, []);

  useEffect(() => {
    if (editor && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  }, [editor]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  return (
    <section
      aria-labelledby="task-list-heading"
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
    >
      <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
            Workspace tasks
          </p>
          <h2 id="task-list-heading" className="mt-1 text-lg font-semibold text-slate-950">
            {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
          </h2>
        </div>
        {isOwner ? (
          <button
            type="button"
            onClick={() => setEditor({ mode: "create" })}
            className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            New task
          </button>
        ) : (
          <p className="max-w-sm text-xs leading-5 text-slate-500">
            You can change the status of tasks assigned to you. Task details are managed by the
            workspace owner.
          </p>
        )}
      </div>

      {notice ? (
        <p
          role="status"
          className="mx-5 mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800 sm:mx-6"
        >
          {notice}
        </p>
      ) : null}

      {tasks.length ? (
        <div className="divide-y divide-slate-100">
          {tasks.map((task) => {
            const dueDate = dueDatePresentation(task, today);
            const canChangeStatus = isOwner || task.assignedTo === currentUserId;

            return (
              <article
                key={task.id}
                className="grid gap-5 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(330px,0.72fr)] lg:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${taskPriorityTone(task.priority)}`}
                    >
                      {taskPriorityLabels[task.priority]}
                    </span>
                    {!canChangeStatus ? (
                      <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                        Read only
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-3 text-sm font-semibold leading-6 text-slate-950 sm:text-base">
                    {task.title}
                  </h3>
                  {task.description ? (
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
                      {task.description}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-slate-400">No description</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs">
                    <span className={dueDate.tone}>{dueDate.label}</span>
                    <span className="text-slate-500">Assigned to {task.assigneeName}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-start sm:justify-between lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                  {canChangeStatus ? (
                    <StatusControl key={`${task.id}-${task.status}`} taskId={task.id} value={task.status} />
                  ) : (
                    <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
                      {taskStatusLabels[task.status]}
                    </span>
                  )}

                  {isOwner ? (
                    <div className="flex items-start justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setEditor({ mode: "edit", task })}
                        className="rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-600 outline-none transition hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-emerald-500"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaskToDelete(task)}
                        className="rounded-lg px-2.5 py-2 text-xs font-semibold text-rose-700 outline-none transition hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-500"
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-slate-950 text-xs font-black text-emerald-300">
            TK
          </span>
          <h3 className="mt-4 text-base font-semibold text-slate-900">
            {hasActiveFilters
              ? "No matching tasks"
              : totalTasks > 0
                ? "No active tasks"
                : "No tasks yet"}
          </h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            {hasActiveFilters && totalTasks > 0
              ? "Try clearing or changing the filters to see other workspace tasks."
              : totalTasks > 0
                ? "Completed tasks remain available whenever you choose Completed or All statuses."
              : isOwner
                ? "Create the first real task for this workspace when work is ready to be planned."
                : "The workspace owner can create the first task when work is ready to be planned."}
          </p>
          {isOwner ? (
            <button
              type="button"
              onClick={() => setEditor({ mode: "create" })}
              className="mt-5 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              Create a task
            </button>
          ) : null}
        </div>
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby="task-dialog-heading"
        onClose={() => setEditor(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeEditor();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-2xl rounded-2xl border border-slate-200 bg-white p-0 text-slate-950 shadow-[0_24px_70px_rgba(15,23,42,0.24)] backdrop:bg-slate-950/55"
      >
        {editor ? (
          <div>
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                  {editor.mode === "edit" ? "Task details" : "New workspace task"}
                </p>
                <h2 id="task-dialog-heading" className="mt-1 text-xl font-semibold text-slate-950">
                  {editor.mode === "edit" ? "Edit task" : "Create task"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                aria-label="Close task form"
                className="flex size-9 items-center justify-center rounded-lg text-lg text-slate-400 outline-none transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                ×
              </button>
            </div>
            <div className="max-h-[calc(100vh-10rem)] overflow-y-auto p-5 sm:p-6">
              <TaskForm
                key={editor.mode === "edit" ? editor.task.id : "new"}
                members={members}
                task={editor.mode === "edit" ? editor.task : undefined}
                onCancel={closeEditor}
                onSaved={handleSaved}
              />
            </div>
          </div>
        ) : null}
      </dialog>

      {taskToDelete ? (
        <DeleteTaskDialog
          key={taskToDelete.id}
          task={taskToDelete}
          onClose={() => setTaskToDelete(null)}
          onDeleted={handleDeleted}
        />
      ) : null}
    </section>
  );
}
