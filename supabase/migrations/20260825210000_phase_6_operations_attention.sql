begin;

do $$
begin
  if exists (
    select 1
    from public.workspaces as workspace
    where not exists (
      select 1
      from pg_catalog.pg_timezone_names as timezone_name
      where timezone_name.name = workspace.timezone
    )
  ) then
    raise check_violation
      using message = 'Every workspace must use a valid PostgreSQL timezone before Phase 6 is applied.';
  end if;
end;
$$;

create function app_private.validate_workspace_timezone()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_timezone_names as timezone_name
    where timezone_name.name = new.timezone
  ) then
    raise check_violation
      using message = 'Workspace timezone must be a valid PostgreSQL timezone name.';
  end if;

  return new;
end;
$$;

revoke all on function app_private.validate_workspace_timezone()
  from public, anon, authenticated;

create trigger validate_workspace_timezone
before insert or update of timezone on public.workspaces
for each row execute function app_private.validate_workspace_timezone();

create view public.operations_attention_items
with (security_invoker = true, security_barrier = true)
as
with workspace_dates as (
  select
    workspace.id as workspace_id,
    workspace.timezone,
    (current_timestamp at time zone workspace.timezone)::date as local_date
  from public.workspaces as workspace
)
select
  task.workspace_id,
  'task_overdue'::text as alert_type,
  'task'::text as source_type,
  task.id as source_id,
  md5(concat_ws(
    '|',
    'task_overdue',
    task.id::text,
    task.due_date::text,
    to_char(
      task.updated_at at time zone 'UTC',
      'YYYY-MM-DD"T"HH24:MI:SS.US'
    )
  )) as condition_fingerprint,
  'high'::text as severity,
  20 as sort_rank,
  task.title,
  format('Task was due %s', to_char(task.due_date, 'DD Mon YYYY')) as detail,
  task.assigned_to,
  task.due_date as effective_date,
  task.updated_at as source_updated_at,
  '/tasks?status=active'::text as action_path
from public.tasks as task
join workspace_dates as workspace_date
  on workspace_date.workspace_id = task.workspace_id
where task.status <> 'completed'
  and task.due_date is not null
  and task.due_date < workspace_date.local_date

union all

select
  task.workspace_id,
  'task_urgent_today'::text as alert_type,
  'task'::text as source_type,
  task.id as source_id,
  md5(concat_ws(
    '|',
    'task_urgent_today',
    task.id::text,
    task.due_date::text,
    to_char(
      task.updated_at at time zone 'UTC',
      'YYYY-MM-DD"T"HH24:MI:SS.US'
    )
  )) as condition_fingerprint,
  'high'::text as severity,
  30 as sort_rank,
  task.title,
  'Urgent task due today'::text as detail,
  task.assigned_to,
  task.due_date as effective_date,
  task.updated_at as source_updated_at,
  '/tasks?status=active&priority=urgent'::text as action_path
from public.tasks as task
join workspace_dates as workspace_date
  on workspace_date.workspace_id = task.workspace_id
where task.status <> 'completed'
  and task.priority = 'urgent'
  and task.due_date = workspace_date.local_date

union all

select
  balance.workspace_id,
  'inventory_low_stock'::text as alert_type,
  'inventory'::text as source_type,
  balance.id as source_id,
  md5(concat_ws(
    '|',
    'inventory_low_stock',
    balance.id::text,
    balance.current_quantity::text,
    balance.reorder_threshold::text,
    to_char(
      balance.updated_at at time zone 'UTC',
      'YYYY-MM-DD"T"HH24:MI:SS.US'
    ),
    coalesce(
      to_char(
        balance.last_movement_at at time zone 'UTC',
        'YYYY-MM-DD"T"HH24:MI:SS.US'
      ),
      'no-movement'
    )
  )) as condition_fingerprint,
  case when balance.current_quantity <= 0 then 'critical' else 'medium' end
    as severity,
  40 as sort_rank,
  balance.name as title,
  format(
    '%s %s remaining; reorder at %s %s',
    balance.current_quantity,
    balance.unit_of_measure,
    balance.reorder_threshold,
    balance.unit_of_measure
  ) as detail,
  null::uuid as assigned_to,
  (
    coalesce(balance.last_movement_at, balance.updated_at)
      at time zone workspace_date.timezone
  )::date as effective_date,
  greatest(
    balance.updated_at,
    coalesce(balance.last_movement_at, balance.updated_at)
  ) as source_updated_at,
  '/inventory?stock=low'::text as action_path
from public.inventory_item_balances as balance
join workspace_dates as workspace_date
  on workspace_date.workspace_id = balance.workspace_id
where balance.is_low_stock

union all

select
  follow_up.workspace_id,
  'follow_up_overdue'::text as alert_type,
  'follow_up'::text as source_type,
  follow_up.id as source_id,
  md5(concat_ws(
    '|',
    'follow_up_overdue',
    follow_up.id::text,
    follow_up.due_date::text,
    to_char(
      follow_up.updated_at at time zone 'UTC',
      'YYYY-MM-DD"T"HH24:MI:SS.US'
    )
  )) as condition_fingerprint,
  'high'::text as severity,
  10 as sort_rank,
  follow_up.title,
  format(
    '%s; follow-up was due %s',
    customer.name,
    to_char(follow_up.due_date, 'DD Mon YYYY')
  ) as detail,
  follow_up.assigned_to,
  follow_up.due_date as effective_date,
  follow_up.updated_at as source_updated_at,
  '/follow-ups?status=pending&timing=overdue'::text as action_path
from public.follow_ups as follow_up
join workspace_dates as workspace_date
  on workspace_date.workspace_id = follow_up.workspace_id
join public.customers as customer
  on customer.workspace_id = follow_up.workspace_id
  and customer.id = follow_up.customer_id
where follow_up.status = 'pending'
  and follow_up.due_date < workspace_date.local_date

union all

select
  follow_up.workspace_id,
  'follow_up_due_today'::text as alert_type,
  'follow_up'::text as source_type,
  follow_up.id as source_id,
  md5(concat_ws(
    '|',
    'follow_up_due_today',
    follow_up.id::text,
    follow_up.due_date::text,
    to_char(
      follow_up.updated_at at time zone 'UTC',
      'YYYY-MM-DD"T"HH24:MI:SS.US'
    )
  )) as condition_fingerprint,
  'medium'::text as severity,
  50 as sort_rank,
  follow_up.title,
  format('%s; follow-up due today', customer.name) as detail,
  follow_up.assigned_to,
  follow_up.due_date as effective_date,
  follow_up.updated_at as source_updated_at,
  '/follow-ups?status=pending&timing=today'::text as action_path
from public.follow_ups as follow_up
join workspace_dates as workspace_date
  on workspace_date.workspace_id = follow_up.workspace_id
join public.customers as customer
  on customer.workspace_id = follow_up.workspace_id
  and customer.id = follow_up.customer_id
where follow_up.status = 'pending'
  and follow_up.due_date = workspace_date.local_date;

revoke all on table public.operations_attention_items
  from public, anon, authenticated;
grant select on table public.operations_attention_items to authenticated;

create table public.alert_acknowledgements (
  workspace_id uuid not null,
  user_id uuid not null,
  alert_type text not null,
  source_id uuid not null,
  condition_fingerprint text not null,
  acknowledged_at timestamptz not null default now(),
  primary key (
    workspace_id,
    user_id,
    alert_type,
    source_id,
    condition_fingerprint
  ),
  constraint alert_acknowledgements_member_fkey
    foreign key (workspace_id, user_id)
    references public.workspace_members(workspace_id, user_id)
    on delete cascade,
  constraint alert_acknowledgements_type_check
    check (
      alert_type in (
        'task_overdue',
        'task_urgent_today',
        'inventory_low_stock',
        'follow_up_overdue',
        'follow_up_due_today'
      )
    ),
  constraint alert_acknowledgements_fingerprint_check
    check (
      char_length(condition_fingerprint) = 32
      and condition_fingerprint ~ '^[0-9a-f]{32}$'
    )
);

create index alert_acknowledgements_user_acknowledged_at_idx
  on public.alert_acknowledgements (workspace_id, user_id, acknowledged_at desc);

alter table public.alert_acknowledgements enable row level security;

revoke all on table public.alert_acknowledgements from anon, authenticated;

grant select on table public.alert_acknowledgements to authenticated;
grant insert (
  workspace_id,
  user_id,
  alert_type,
  source_id,
  condition_fingerprint
) on table public.alert_acknowledgements to authenticated;
grant delete on table public.alert_acknowledgements to authenticated;

create policy "Users can view their own alert acknowledgements"
on public.alert_acknowledgements
for select
to authenticated
using (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
  and app_private.current_workspace_role(workspace_id) in ('owner', 'member')
);

create policy "Users can acknowledge current workspace alerts"
on public.alert_acknowledgements
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
  and app_private.current_workspace_role(workspace_id) in ('owner', 'member')
  and exists (
    select 1
    from public.operations_attention_items as attention_item
    where attention_item.workspace_id = alert_acknowledgements.workspace_id
      and attention_item.alert_type = alert_acknowledgements.alert_type
      and attention_item.source_id = alert_acknowledgements.source_id
      and attention_item.condition_fingerprint =
        alert_acknowledgements.condition_fingerprint
  )
);

create policy "Users can remove their own alert acknowledgements"
on public.alert_acknowledgements
for delete
to authenticated
using (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
  and app_private.current_workspace_role(workspace_id) in ('owner', 'member')
);

comment on view public.operations_attention_items is
  'Live workspace-scoped operational attention conditions derived from Tasks, Inventory, and Follow-ups.';
comment on table public.alert_acknowledgements is
  'Per-user acknowledgement state for an exact live attention episode. Acknowledgement does not resolve the source condition.';
comment on function app_private.validate_workspace_timezone() is
  'Rejects invalid PostgreSQL timezone names used by workspace-local attention conditions.';

commit;
