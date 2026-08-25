begin;

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  contact_name text,
  email text,
  phone text,
  address text,
  notes text,
  is_active boolean not null default true,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_workspace_id_id_key unique (workspace_id, id),
  constraint customers_name_length
    check (
      name = btrim(name)
      and char_length(name) between 1 and 160
    ),
  constraint customers_contact_name_length
    check (
      contact_name is null
      or (
        contact_name = btrim(contact_name)
        and char_length(contact_name) between 1 and 120
      )
    ),
  constraint customers_email_length
    check (
      email is null
      or (
        email = btrim(email)
        and char_length(email) between 3 and 320
      )
    ),
  constraint customers_phone_length
    check (
      phone is null
      or (
        phone = btrim(phone)
        and char_length(phone) between 1 and 40
      )
    ),
  constraint customers_address_length
    check (
      address is null
      or (
        address = btrim(address)
        and char_length(address) between 1 and 500
      )
    ),
  constraint customers_notes_length
    check (
      notes is null
      or (
        notes = btrim(notes)
        and char_length(notes) between 1 and 2000
      )
    ),
  constraint customers_created_member_fkey
    foreign key (workspace_id, created_by)
    references public.workspace_members(workspace_id, user_id)
);

create index customers_workspace_active_name_idx
  on public.customers (workspace_id, is_active, name);

create table public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  customer_id uuid not null,
  title text not null,
  due_date date not null,
  due_time time without time zone,
  assigned_to uuid,
  status text not null default 'pending',
  notes text,
  outcome text,
  created_by uuid not null,
  completed_by uuid,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint follow_ups_customer_fkey
    foreign key (workspace_id, customer_id)
    references public.customers(workspace_id, id),
  constraint follow_ups_assigned_member_fkey
    foreign key (workspace_id, assigned_to)
    references public.workspace_members(workspace_id, user_id),
  constraint follow_ups_created_member_fkey
    foreign key (workspace_id, created_by)
    references public.workspace_members(workspace_id, user_id),
  constraint follow_ups_completed_member_fkey
    foreign key (workspace_id, completed_by)
    references public.workspace_members(workspace_id, user_id),
  constraint follow_ups_title_length
    check (
      title = btrim(title)
      and char_length(title) between 1 and 160
    ),
  constraint follow_ups_status_check
    check (status in ('pending', 'completed')),
  constraint follow_ups_notes_length
    check (
      notes is null
      or (
        notes = btrim(notes)
        and char_length(notes) between 1 and 2000
      )
    ),
  constraint follow_ups_outcome_length
    check (
      outcome is null
      or (
        outcome = btrim(outcome)
        and char_length(outcome) between 1 and 1000
      )
    ),
  constraint follow_ups_completion_state_check
    check (
      (
        status = 'pending'
        and outcome is null
        and completed_by is null
        and completed_at is null
      )
      or (
        status = 'completed'
        and outcome is not null
        and completed_by is not null
        and completed_at is not null
      )
    )
);

create index follow_ups_workspace_status_due_idx
  on public.follow_ups (workspace_id, status, due_date, due_time);
create index follow_ups_workspace_customer_status_due_idx
  on public.follow_ups (workspace_id, customer_id, status, due_date);
create index follow_ups_workspace_assignee_status_due_idx
  on public.follow_ups (workspace_id, assigned_to, status, due_date);
create index follow_ups_workspace_completed_at_idx
  on public.follow_ups (workspace_id, completed_at desc)
  where status = 'completed';

create function app_private.set_customer_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = clock_timestamp();
  return new;
end;
$$;

create function app_private.ensure_active_follow_up_customer()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.customer_id is not distinct from old.customer_id
      and new.workspace_id is not distinct from old.workspace_id
    then
      return new;
    end if;
  end if;

  if not exists (
    select 1
    from public.customers as customer
    where customer.workspace_id = new.workspace_id
      and customer.id = new.customer_id
      and customer.is_active
  ) then
    raise check_violation
      using message = 'New follow-ups require an active customer in the same workspace.';
  end if;

  return new;
end;
$$;

create function app_private.prepare_follow_up_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  caller_id uuid;
  caller_role text;
begin
  caller_id := auth.uid();
  caller_role := app_private.current_workspace_role(old.workspace_id);

  if new.id is distinct from old.id
    or new.workspace_id is distinct from old.workspace_id
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at
  then
    raise insufficient_privilege
      using message = 'Follow-up identity and creation audit fields are immutable.';
  end if;

  if caller_role = 'owner' then
    null;
  elsif caller_role = 'member'
    and old.assigned_to = caller_id
    and new.assigned_to = caller_id
    and new.customer_id is not distinct from old.customer_id
    and new.title is not distinct from old.title
    and new.due_date is not distinct from old.due_date
    and new.due_time is not distinct from old.due_time
    and new.notes is not distinct from old.notes
  then
    null;
  else
    raise insufficient_privilege
      using message = 'Members may only complete or reopen follow-ups assigned to themselves.';
  end if;

  if new.status = 'completed' then
    if nullif(btrim(new.outcome), '') is null then
      raise check_violation
        using message = 'A completed follow-up requires a concise outcome.';
    end if;

    if old.status <> 'completed' then
      new.completed_at = clock_timestamp();
      new.completed_by = caller_id;
    else
      new.completed_at = old.completed_at;
      new.completed_by = old.completed_by;
    end if;
  elsif new.status = 'pending' then
    new.outcome = null;
    new.completed_at = null;
    new.completed_by = null;
  end if;

  new.updated_at = clock_timestamp();
  return new;
end;
$$;

revoke all on function app_private.set_customer_updated_at()
  from public, anon, authenticated;
revoke all on function app_private.ensure_active_follow_up_customer()
  from public, anon, authenticated;
revoke all on function app_private.prepare_follow_up_update()
  from public, anon, authenticated;

create trigger set_customer_updated_at
before update on public.customers
for each row execute function app_private.set_customer_updated_at();

create trigger ensure_active_follow_up_customer
before insert or update of customer_id on public.follow_ups
for each row execute function app_private.ensure_active_follow_up_customer();

create trigger prepare_follow_up_update
before update on public.follow_ups
for each row execute function app_private.prepare_follow_up_update();

alter table public.customers enable row level security;
alter table public.follow_ups enable row level security;

revoke all on table public.customers from anon, authenticated;
revoke all on table public.follow_ups from anon, authenticated;

grant select on table public.customers to authenticated;
grant insert (
  workspace_id,
  name,
  contact_name,
  email,
  phone,
  address,
  notes,
  created_by
) on table public.customers to authenticated;
grant update (
  name,
  contact_name,
  email,
  phone,
  address,
  notes,
  is_active
) on table public.customers to authenticated;

grant select on table public.follow_ups to authenticated;
grant insert (
  workspace_id,
  customer_id,
  title,
  due_date,
  due_time,
  assigned_to,
  notes,
  created_by
) on table public.follow_ups to authenticated;
grant update (
  customer_id,
  title,
  due_date,
  due_time,
  assigned_to,
  status,
  notes,
  outcome
) on table public.follow_ups to authenticated;

create policy "Workspace members can view customers"
on public.customers
for select
to authenticated
using (
  (select auth.uid()) is not null
  and app_private.current_workspace_role(workspace_id) in ('owner', 'member')
);

create policy "Workspace owners can create customers"
on public.customers
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and app_private.current_workspace_role(workspace_id) = 'owner'
  and created_by = (select auth.uid())
);

create policy "Workspace owners can update customers"
on public.customers
for update
to authenticated
using (
  (select auth.uid()) is not null
  and app_private.current_workspace_role(workspace_id) = 'owner'
)
with check (
  (select auth.uid()) is not null
  and app_private.current_workspace_role(workspace_id) = 'owner'
);

create policy "Workspace members can view follow-ups"
on public.follow_ups
for select
to authenticated
using (
  (select auth.uid()) is not null
  and app_private.current_workspace_role(workspace_id) in ('owner', 'member')
);

create policy "Workspace owners can create follow-ups"
on public.follow_ups
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and app_private.current_workspace_role(workspace_id) = 'owner'
  and created_by = (select auth.uid())
);

create policy "Owners and assigned members can update follow-ups"
on public.follow_ups
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

comment on table public.customers is
  'Workspace-scoped customer contact records introduced in Phase 5. Customers are deactivated rather than deleted.';
comment on table public.follow_ups is
  'Workspace-scoped customer follow-up commitments introduced in Phase 5. Due state is derived from the workspace-local due date.';
comment on column public.follow_ups.due_time is
  'Optional business-local time interpreted using the workspace timezone.';
comment on column public.follow_ups.completed_at is
  'Database-owned completion timestamp. Cleared when the follow-up is reopened.';
comment on column public.follow_ups.completed_by is
  'Database-owned completing workspace member. Cleared when the follow-up is reopened.';

commit;
