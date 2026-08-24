begin;

create schema if not exists app_private;

revoke all on schema app_private from public, anon, authenticated;
grant usage on schema app_private to authenticated;

alter table public.workspace_members
  add column display_name text;

update public.workspace_members as membership
set display_name = coalesce(
  nullif(btrim(auth_user.raw_user_meta_data ->> 'full_name'), ''),
  nullif(btrim(auth_user.raw_user_meta_data ->> 'display_name'), ''),
  nullif(btrim(auth_user.raw_user_meta_data ->> 'name'), ''),
  nullif(btrim(split_part(auth_user.email, '@', 1)), ''),
  'Workspace member'
)
from auth.users as auth_user
where auth_user.id = membership.user_id;

update public.workspace_members
set display_name = 'Workspace member'
where display_name is null;

alter table public.workspace_members
  alter column display_name set default 'Workspace member',
  alter column display_name set not null,
  add constraint workspace_members_display_name_length
    check (
      display_name = btrim(display_name)
      and char_length(display_name) between 1 and 100
    );

create function app_private.current_workspace_role(target_workspace_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select membership.role
  from public.workspace_members as membership
  where membership.workspace_id = target_workspace_id
    and membership.user_id = (select auth.uid())
  limit 1;
$$;

revoke all on function app_private.current_workspace_role(uuid)
  from public, anon, authenticated;
grant execute on function app_private.current_workspace_role(uuid)
  to authenticated;

create policy "Members can view their workspace member directory"
on public.workspace_members
for select
to authenticated
using (
  (select auth.uid()) is not null
  and app_private.current_workspace_role(workspace_id) in ('owner', 'member')
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo',
  priority text not null default 'medium',
  due_date date,
  assigned_to uuid,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_title_length
    check (
      title = btrim(title)
      and char_length(title) between 1 and 160
    ),
  constraint tasks_description_length
    check (
      description is null
      or (
        description = btrim(description)
        and char_length(description) between 1 and 4000
      )
    ),
  constraint tasks_status_check
    check (status in ('todo', 'in_progress', 'completed')),
  constraint tasks_priority_check
    check (priority in ('low', 'medium', 'high', 'urgent')),
  constraint tasks_assigned_member_fkey
    foreign key (workspace_id, assigned_to)
    references public.workspace_members(workspace_id, user_id),
  constraint tasks_created_member_fkey
    foreign key (workspace_id, created_by)
    references public.workspace_members(workspace_id, user_id)
);

create index tasks_workspace_status_due_date_idx
  on public.tasks (workspace_id, status, due_date);
create index tasks_workspace_priority_idx
  on public.tasks (workspace_id, priority);
create index tasks_workspace_assigned_to_idx
  on public.tasks (workspace_id, assigned_to);

create function app_private.set_task_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = clock_timestamp();
  return new;
end;
$$;

create function app_private.enforce_task_update_permissions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_role text;
begin
  caller_role := app_private.current_workspace_role(old.workspace_id);

  if caller_role = 'owner' then
    return new;
  end if;

  if caller_role = 'member'
    and old.assigned_to = (select auth.uid())
    and new.assigned_to = (select auth.uid())
    and new.title is not distinct from old.title
    and new.description is not distinct from old.description
    and new.priority is not distinct from old.priority
    and new.due_date is not distinct from old.due_date
  then
    return new;
  end if;

  raise insufficient_privilege
    using message = 'Members may only change the status of tasks assigned to themselves.';
end;
$$;

revoke all on function app_private.set_task_updated_at()
  from public, anon, authenticated;
revoke all on function app_private.enforce_task_update_permissions()
  from public, anon, authenticated;

create trigger enforce_task_update_permissions
before update on public.tasks
for each row execute function app_private.enforce_task_update_permissions();

create trigger set_task_updated_at
before update on public.tasks
for each row execute function app_private.set_task_updated_at();

alter table public.tasks enable row level security;

revoke all on table public.tasks from anon, authenticated;

grant select on table public.tasks to authenticated;
grant insert (
  workspace_id,
  title,
  description,
  status,
  priority,
  due_date,
  assigned_to,
  created_by
) on table public.tasks to authenticated;
grant update (
  title,
  description,
  status,
  priority,
  due_date,
  assigned_to
) on table public.tasks to authenticated;
grant delete on table public.tasks to authenticated;

create policy "Workspace members can view tasks"
on public.tasks
for select
to authenticated
using (
  (select auth.uid()) is not null
  and app_private.current_workspace_role(workspace_id) in ('owner', 'member')
);

create policy "Workspace owners can create tasks"
on public.tasks
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and app_private.current_workspace_role(workspace_id) = 'owner'
  and created_by = (select auth.uid())
);

create policy "Owners and assigned members can update tasks"
on public.tasks
for update
to authenticated
using (
  (select auth.uid()) is not null
  and (
    app_private.current_workspace_role(workspace_id) = 'owner'
    or (
      app_private.current_workspace_role(workspace_id) = 'member'
      and assigned_to = (select auth.uid())
    )
  )
)
with check (
  (select auth.uid()) is not null
  and (
    app_private.current_workspace_role(workspace_id) = 'owner'
    or (
      app_private.current_workspace_role(workspace_id) = 'member'
      and assigned_to = (select auth.uid())
    )
  )
);

create policy "Workspace owners can delete tasks"
on public.tasks
for delete
to authenticated
using (
  (select auth.uid()) is not null
  and app_private.current_workspace_role(workspace_id) = 'owner'
);

comment on table public.tasks is
  'Workspace-scoped operational tasks introduced in Phase 3.';
comment on column public.workspace_members.display_name is
  'Workspace-visible label used for task assignment; authentication remains managed by Supabase Auth.';

commit;
