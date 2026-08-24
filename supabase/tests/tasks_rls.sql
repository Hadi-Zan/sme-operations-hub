-- Run only in a non-production Supabase SQL Editor after applying the Phase 2
-- and Phase 3 migrations. All temporary users, workspaces, and tasks roll back.

begin;

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'tasks-owner@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'tasks-member@example.test'),
  ('33333333-3333-3333-3333-333333333333', 'other-owner@example.test');

insert into public.workspaces (id, name)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Tasks test workspace'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Other test workspace');

insert into public.workspace_members (workspace_id, user_id, role, display_name)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'owner',
    'Test Owner'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '22222222-2222-2222-2222-222222222222',
    'member',
    'Assigned Member'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '33333333-3333-3333-3333-333333333333',
    'owner',
    'Other Owner'
  );

insert into public.tasks (
  id,
  workspace_id,
  title,
  status,
  priority,
  assigned_to,
  created_by
)
values
  (
    'aaaaaaaa-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Assigned workspace task',
    'todo',
    'high',
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'aaaaaaaa-2222-2222-2222-222222222222',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Unassigned workspace task',
    'todo',
    'medium',
    null,
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'bbbbbbbb-1111-1111-1111-111111111111',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Other workspace task',
    'todo',
    'urgent',
    '33333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333'
  );

do $$
begin
  if has_table_privilege('anon', 'public.tasks', 'select') then
    raise exception 'RLS test failed: anon unexpectedly has task SELECT privileges';
  end if;

  if has_table_privilege('anon', 'public.tasks', 'insert') then
    raise exception 'RLS test failed: anon unexpectedly has task INSERT privileges';
  end if;

  if not has_table_privilege('authenticated', 'public.tasks', 'select') then
    raise exception 'RLS test failed: authenticated users lack task SELECT privileges';
  end if;
end;
$$;

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-1111-1111-111111111111',
  true
);

do $$
declare
  created_task_id uuid;
  visible_tasks integer;
  visible_members integer;
  changed_rows integer;
begin
  select count(*) into visible_tasks from public.tasks;
  select count(*) into visible_members from public.workspace_members;

  if visible_tasks <> 2 then
    raise exception 'RLS test failed: owner can see tasks outside their workspace';
  end if;

  if visible_members <> 2 then
    raise exception 'RLS test failed: owner cannot see their workspace member directory';
  end if;

  insert into public.tasks (
    workspace_id,
    title,
    description,
    status,
    priority,
    due_date,
    assigned_to,
    created_by
  )
  values (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Owner-created task',
    'Created by the RLS test.',
    'in_progress',
    'urgent',
    current_date,
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111'
  )
  returning id into created_task_id;

  update public.tasks
  set title = 'Owner-edited task', assigned_to = null
  where id = created_task_id;
  get diagnostics changed_rows = row_count;

  if changed_rows <> 1 then
    raise exception 'RLS test failed: owner could not edit a workspace task';
  end if;

  delete from public.tasks
  where id = created_task_id;
  get diagnostics changed_rows = row_count;

  if changed_rows <> 1 then
    raise exception 'RLS test failed: owner could not delete a workspace task';
  end if;
end;
$$;

do $$
begin
  begin
    insert into public.tasks (
      workspace_id,
      title,
      assigned_to,
      created_by
    )
    values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'Cross-workspace assignment',
      '33333333-3333-3333-3333-333333333333',
      '11111111-1111-1111-1111-111111111111'
    );
    raise exception 'RLS test failed: cross-workspace assignment unexpectedly succeeded';
  exception
    when foreign_key_violation then null;
  end;

  begin
    insert into public.tasks (workspace_id, title, created_by)
    values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'Spoofed creator',
      '22222222-2222-2222-2222-222222222222'
    );
    raise exception 'RLS test failed: owner spoofed created_by';
  exception
    when insufficient_privilege then null;
  end;

  begin
    insert into public.tasks (workspace_id, title, status, created_by)
    values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'Invalid status',
      'blocked',
      '11111111-1111-1111-1111-111111111111'
    );
    raise exception 'RLS test failed: invalid task status unexpectedly succeeded';
  exception
    when check_violation then null;
  end;

  begin
    insert into public.tasks (workspace_id, title, priority, created_by)
    values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'Invalid priority',
      'critical',
      '11111111-1111-1111-1111-111111111111'
    );
    raise exception 'RLS test failed: invalid task priority unexpectedly succeeded';
  exception
    when check_violation then null;
  end;
end;
$$;

select set_config(
  'request.jwt.claim.sub',
  '22222222-2222-2222-2222-222222222222',
  true
);

do $$
declare
  visible_tasks integer;
  visible_members integer;
  changed_rows integer;
  previous_updated_at timestamptz;
  current_updated_at timestamptz;
begin
  select count(*) into visible_tasks from public.tasks;
  select count(*) into visible_members from public.workspace_members;

  if visible_tasks <> 2 then
    raise exception 'RLS test failed: member cannot see all tasks in their workspace';
  end if;

  if visible_members <> 2 then
    raise exception 'RLS test failed: member cannot see their workspace member directory';
  end if;

  select updated_at into previous_updated_at
  from public.tasks
  where id = 'aaaaaaaa-1111-1111-1111-111111111111';

  update public.tasks
  set status = 'in_progress'
  where id = 'aaaaaaaa-1111-1111-1111-111111111111';
  get diagnostics changed_rows = row_count;

  if changed_rows <> 1 then
    raise exception 'RLS test failed: member could not update their assigned task status';
  end if;

  select updated_at into current_updated_at
  from public.tasks
  where id = 'aaaaaaaa-1111-1111-1111-111111111111';

  if current_updated_at <= previous_updated_at then
    raise exception 'RLS test failed: task updated_at was not refreshed';
  end if;

  update public.tasks
  set status = 'completed'
  where id = 'aaaaaaaa-2222-2222-2222-222222222222';
  get diagnostics changed_rows = row_count;

  if changed_rows <> 0 then
    raise exception 'RLS test failed: member updated an unassigned task';
  end if;

  delete from public.tasks
  where id = 'aaaaaaaa-1111-1111-1111-111111111111';
  get diagnostics changed_rows = row_count;

  if changed_rows <> 0 then
    raise exception 'RLS test failed: member deleted a task';
  end if;
end;
$$;

do $$
begin
  begin
    update public.tasks
    set title = 'Member-edited title'
    where id = 'aaaaaaaa-1111-1111-1111-111111111111';
    raise exception 'RLS test failed: member edited task details';
  exception
    when insufficient_privilege then null;
  end;

  begin
    update public.tasks
    set assigned_to = null
    where id = 'aaaaaaaa-1111-1111-1111-111111111111';
    raise exception 'RLS test failed: member reassigned a task';
  exception
    when insufficient_privilege then null;
  end;

  begin
    insert into public.tasks (workspace_id, title, created_by)
    values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'Member-created task',
      '22222222-2222-2222-2222-222222222222'
    );
    raise exception 'RLS test failed: member created a task';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

select set_config(
  'request.jwt.claim.sub',
  '33333333-3333-3333-3333-333333333333',
  true
);

do $$
declare
  visible_tasks integer;
  visible_members integer;
begin
  select count(*) into visible_tasks from public.tasks;
  select count(*) into visible_members from public.workspace_members;

  if visible_tasks <> 1 then
    raise exception 'RLS test failed: other workspace owner sees foreign tasks';
  end if;

  if visible_members <> 1 then
    raise exception 'RLS test failed: other workspace owner sees foreign members';
  end if;
end;
$$;

reset role;
rollback;
