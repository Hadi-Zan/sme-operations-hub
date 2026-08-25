-- Run only in a non-production Supabase SQL Editor after applying the Phase 2,
-- Phase 3, Phase 4, and Phase 5 migrations. All fixtures are rolled back.

begin;

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'phase5-owner@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'phase5-member@example.test'),
  ('33333333-3333-3333-3333-333333333333', 'phase5-other-owner@example.test');

insert into public.workspaces (id, name)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Phase 5 test workspace'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Other Phase 5 workspace');

insert into public.workspace_members (workspace_id, user_id, role, display_name)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'owner',
    'Phase 5 Owner'
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

insert into public.customers (
  id,
  workspace_id,
  name,
  contact_name,
  email,
  is_active,
  created_by
)
values
  (
    'aaaaaaaa-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Active workspace customer',
    'Primary Contact',
    'customer@example.test',
    true,
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'aaaaaaaa-2222-2222-2222-222222222222',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Inactive workspace customer',
    null,
    null,
    false,
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'bbbbbbbb-1111-1111-1111-111111111111',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Other workspace customer',
    null,
    null,
    true,
    '33333333-3333-3333-3333-333333333333'
  );

insert into public.follow_ups (
  id,
  workspace_id,
  customer_id,
  title,
  due_date,
  due_time,
  assigned_to,
  status,
  notes,
  outcome,
  created_by,
  completed_by,
  completed_at
)
values
  (
    'aaaaaaaa-aaaa-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'aaaaaaaa-1111-1111-1111-111111111111',
    'Assigned pending follow-up',
    current_date,
    '10:30',
    '22222222-2222-2222-2222-222222222222',
    'pending',
    'Member should be able to complete this.',
    null,
    '11111111-1111-1111-1111-111111111111',
    null,
    null
  ),
  (
    'aaaaaaaa-aaaa-2222-2222-222222222222',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'aaaaaaaa-1111-1111-1111-111111111111',
    'Unassigned pending follow-up',
    current_date + 1,
    null,
    null,
    'pending',
    null,
    null,
    '11111111-1111-1111-1111-111111111111',
    null,
    null
  ),
  (
    'aaaaaaaa-aaaa-3333-3333-333333333333',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'aaaaaaaa-1111-1111-1111-111111111111',
    'Completed history follow-up',
    current_date - 1,
    null,
    '11111111-1111-1111-1111-111111111111',
    'completed',
    null,
    'Customer approved the next service visit.',
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    clock_timestamp() - interval '1 hour'
  ),
  (
    'bbbbbbbb-bbbb-1111-1111-111111111111',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'bbbbbbbb-1111-1111-1111-111111111111',
    'Other workspace follow-up',
    current_date,
    null,
    '33333333-3333-3333-3333-333333333333',
    'pending',
    null,
    null,
    '33333333-3333-3333-3333-333333333333',
    null,
    null
  );

do $$
declare
  customer_rls_enabled boolean;
  follow_up_rls_enabled boolean;
  active_customer_function_is_definer boolean;
  update_function_is_definer boolean;
  customer_delete_action "char";
begin
  if has_table_privilege('anon', 'public.customers', 'select')
    or has_table_privilege('anon', 'public.customers', 'insert')
    or has_table_privilege('anon', 'public.follow_ups', 'select')
    or has_table_privilege('anon', 'public.follow_ups', 'update')
  then
    raise exception 'RLS test failed: anon has unexpected Phase 5 privileges';
  end if;

  if has_table_privilege('authenticated', 'public.customers', 'delete')
    or has_table_privilege('authenticated', 'public.follow_ups', 'delete')
  then
    raise exception 'RLS test failed: Phase 5 records are hard-deletable';
  end if;

  if has_column_privilege('authenticated', 'public.follow_ups', 'completed_at', 'insert')
    or has_column_privilege('authenticated', 'public.follow_ups', 'completed_at', 'update')
    or has_column_privilege('authenticated', 'public.follow_ups', 'completed_by', 'insert')
    or has_column_privilege('authenticated', 'public.follow_ups', 'completed_by', 'update')
    or has_column_privilege('authenticated', 'public.follow_ups', 'status', 'insert')
    or has_column_privilege('authenticated', 'public.follow_ups', 'outcome', 'insert')
  then
    raise exception 'RLS test failed: clients can forge initial completion state or audit fields';
  end if;

  if has_column_privilege('authenticated', 'public.follow_ups', 'workspace_id', 'update')
    or has_column_privilege('authenticated', 'public.follow_ups', 'created_by', 'update')
    or has_column_privilege('authenticated', 'public.follow_ups', 'created_at', 'insert')
    or has_column_privilege('authenticated', 'public.follow_ups', 'created_at', 'update')
    or has_column_privilege('authenticated', 'public.customers', 'workspace_id', 'update')
    or has_column_privilege('authenticated', 'public.customers', 'created_by', 'update')
    or has_column_privilege('authenticated', 'public.customers', 'created_at', 'insert')
    or has_column_privilege('authenticated', 'public.customers', 'created_at', 'update')
  then
    raise exception 'RLS test failed: creation or workspace audit fields are freely mutable';
  end if;

  if has_function_privilege(
    'authenticated',
    'app_private.ensure_active_follow_up_customer()',
    'execute'
  ) or has_function_privilege(
    'authenticated',
    'app_private.prepare_follow_up_update()',
    'execute'
  ) then
    raise exception 'RLS test failed: trigger helpers have unnecessary direct execution grants';
  end if;

  select procedure.prosecdef
  into active_customer_function_is_definer
  from pg_proc as procedure
  join pg_namespace as namespace on namespace.oid = procedure.pronamespace
  where namespace.nspname = 'app_private'
    and procedure.proname = 'ensure_active_follow_up_customer';

  select procedure.prosecdef
  into update_function_is_definer
  from pg_proc as procedure
  join pg_namespace as namespace on namespace.oid = procedure.pronamespace
  where namespace.nspname = 'app_private'
    and procedure.proname = 'prepare_follow_up_update';

  if active_customer_function_is_definer is distinct from false
    or update_function_is_definer is distinct from false
  then
    raise exception 'RLS test failed: Phase 5 trigger helpers bypass caller RLS';
  end if;

  select relation.relrowsecurity
  into customer_rls_enabled
  from pg_class as relation
  where relation.oid = 'public.customers'::regclass;

  select relation.relrowsecurity
  into follow_up_rls_enabled
  from pg_class as relation
  where relation.oid = 'public.follow_ups'::regclass;

  if not customer_rls_enabled or not follow_up_rls_enabled then
    raise exception 'RLS test failed: Phase 5 RLS is not enabled';
  end if;

  select constraint_record.confdeltype
  into customer_delete_action
  from pg_constraint as constraint_record
  where constraint_record.conname = 'follow_ups_customer_fkey'
    and constraint_record.conrelid = 'public.follow_ups'::regclass;

  if customer_delete_action is distinct from 'a' then
    raise exception 'RLS test failed: customer deletion can remove follow-up history';
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
  created_customer_id uuid;
  created_follow_up_id uuid;
  visible_customers integer;
  visible_follow_ups integer;
  changed_rows integer;
  first_completed_at timestamptz;
  second_completed_at timestamptz;
  first_completed_by uuid;
  second_completed_by uuid;
  reopened_status text;
  reopened_outcome text;
begin
  select count(*) into visible_customers from public.customers;
  select count(*) into visible_follow_ups from public.follow_ups;

  if visible_customers <> 2 or visible_follow_ups <> 3 then
    raise exception 'RLS test failed: owner sees Phase 5 data outside their workspace';
  end if;

  insert into public.customers (
    workspace_id,
    name,
    contact_name,
    email,
    phone,
    address,
    notes,
    created_by
  )
  values (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Owner-created customer',
    'Operations Contact',
    'owner-created@example.test',
    '+65 6000 0000',
    'Test service location',
    'Created by the Phase 5 RLS test.',
    '11111111-1111-1111-1111-111111111111'
  )
  returning id into created_customer_id;

  update public.customers
  set notes = 'Owner-updated notes'
  where id = created_customer_id;
  get diagnostics changed_rows = row_count;

  if changed_rows <> 1 then
    raise exception 'RLS test failed: owner could not update a customer';
  end if;

  insert into public.follow_ups (
    workspace_id,
    customer_id,
    title,
    due_date,
    due_time,
    assigned_to,
    notes,
    created_by
  )
  values (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    created_customer_id,
    'Owner-created follow-up',
    current_date + 2,
    '14:00',
    '22222222-2222-2222-2222-222222222222',
    'Owner-created operational context.',
    '11111111-1111-1111-1111-111111111111'
  )
  returning id into created_follow_up_id;

  update public.follow_ups
  set status = 'completed', outcome = 'Customer confirmed the proposed visit.'
  where id = created_follow_up_id;

  select completed_at, completed_by
  into first_completed_at, first_completed_by
  from public.follow_ups
  where id = created_follow_up_id;

  if first_completed_at is null
    or first_completed_by <> '11111111-1111-1111-1111-111111111111'
  then
    raise exception 'RLS test failed: database did not own completion audit fields';
  end if;

  update public.follow_ups
  set outcome = 'Corrected outcome without a new completion event.'
  where id = created_follow_up_id;

  select completed_at, completed_by
  into second_completed_at, second_completed_by
  from public.follow_ups
  where id = created_follow_up_id;

  if second_completed_at is distinct from first_completed_at
    or second_completed_by is distinct from first_completed_by
  then
    raise exception 'RLS test failed: outcome-only edit changed completion audit fields';
  end if;

  update public.follow_ups
  set status = 'pending'
  where id = created_follow_up_id;

  select status, outcome, completed_at, completed_by
  into reopened_status, reopened_outcome, second_completed_at, second_completed_by
  from public.follow_ups
  where id = created_follow_up_id;

  if reopened_status <> 'pending'
    or reopened_outcome is not null
    or second_completed_at is not null
    or second_completed_by is not null
  then
    raise exception 'RLS test failed: reopening did not clear completion state';
  end if;

end;
$$;

do $$
begin
  begin
    insert into public.customers (workspace_id, name, created_by)
    values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'Spoofed customer creator',
      '22222222-2222-2222-2222-222222222222'
    );
    raise exception 'RLS test failed: owner spoofed customer created_by';
  exception
    when insufficient_privilege then null;
  end;

  begin
    insert into public.follow_ups (
      workspace_id,
      customer_id,
      title,
      due_date,
      created_by
    )
    values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'aaaaaaaa-1111-1111-1111-111111111111',
      'Spoofed follow-up creator',
      current_date,
      '22222222-2222-2222-2222-222222222222'
    );
    raise exception 'RLS test failed: owner spoofed follow-up created_by';
  exception
    when insufficient_privilege then null;
  end;

  begin
    insert into public.follow_ups (
      workspace_id,
      customer_id,
      title,
      due_date,
      created_by
    )
    values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'aaaaaaaa-2222-2222-2222-222222222222',
      'Inactive customer follow-up',
      current_date,
      '11111111-1111-1111-1111-111111111111'
    );
    raise exception 'RLS test failed: follow-up created for an inactive customer';
  exception
    when check_violation then null;
  end;

  begin
    insert into public.follow_ups (
      workspace_id,
      customer_id,
      title,
      due_date,
      created_by
    )
    values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'bbbbbbbb-1111-1111-1111-111111111111',
      'Cross-workspace customer reference',
      current_date,
      '11111111-1111-1111-1111-111111111111'
    );
    raise exception 'RLS test failed: cross-workspace customer reference succeeded';
  exception
    when check_violation or foreign_key_violation then null;
  end;

  begin
    insert into public.follow_ups (
      workspace_id,
      customer_id,
      title,
      due_date,
      assigned_to,
      created_by
    )
    values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'aaaaaaaa-1111-1111-1111-111111111111',
      'Cross-workspace assignee',
      current_date,
      '33333333-3333-3333-3333-333333333333',
      '11111111-1111-1111-1111-111111111111'
    );
    raise exception 'RLS test failed: cross-workspace assignee succeeded';
  exception
    when foreign_key_violation then null;
  end;

  begin
    update public.follow_ups
    set status = 'completed', outcome = '   '
    where id = 'aaaaaaaa-aaaa-2222-2222-222222222222';
    raise exception 'RLS test failed: blank completion outcome succeeded';
  exception
    when check_violation then null;
  end;

  begin
    update public.follow_ups
    set status = 'cancelled'
    where id = 'aaaaaaaa-aaaa-2222-2222-222222222222';
    raise exception 'RLS test failed: invalid follow-up status succeeded';
  exception
    when check_violation then null;
  end;

  begin
    delete from public.customers
    where id = 'aaaaaaaa-2222-2222-2222-222222222222';
    raise exception 'RLS test failed: owner hard-deleted a customer';
  exception
    when insufficient_privilege then null;
  end;

  begin
    delete from public.follow_ups
    where id = 'aaaaaaaa-aaaa-3333-3333-333333333333';
    raise exception 'RLS test failed: owner hard-deleted follow-up history';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

do $$
begin
  update public.customers
  set is_active = false
  where id = 'aaaaaaaa-1111-1111-1111-111111111111';

  if not exists (
    select 1
    from public.follow_ups
    where id = 'aaaaaaaa-aaaa-1111-1111-111111111111'
      and status = 'pending'
  ) then
    raise exception 'RLS test failed: deactivation changed or removed a pending follow-up';
  end if;

  if not exists (
    select 1
    from public.follow_ups
    where id = 'aaaaaaaa-aaaa-3333-3333-333333333333'
      and status = 'completed'
      and outcome = 'Customer approved the next service visit.'
  ) then
    raise exception 'RLS test failed: deactivation changed or removed completed history';
  end if;
end;
$$;

select set_config(
  'request.jwt.claim.sub',
  '22222222-2222-2222-2222-222222222222',
  true
);

do $$
declare
  visible_customers integer;
  visible_follow_ups integer;
  changed_rows integer;
  completed_by_member uuid;
  completed_at_by_member timestamptz;
  reopened_outcome text;
begin
  select count(*) into visible_customers from public.customers;
  select count(*) into visible_follow_ups from public.follow_ups;

  if visible_customers <> 3 or visible_follow_ups <> 4 then
    raise exception 'RLS test failed: member sees Phase 5 data outside their workspace';
  end if;

  update public.follow_ups
  set status = 'completed', outcome = 'Member recorded a clear outcome.'
  where id = 'aaaaaaaa-aaaa-1111-1111-111111111111';
  get diagnostics changed_rows = row_count;

  if changed_rows <> 1 then
    raise exception 'RLS test failed: member could not complete their assigned follow-up';
  end if;

  select completed_by, completed_at
  into completed_by_member, completed_at_by_member
  from public.follow_ups
  where id = 'aaaaaaaa-aaaa-1111-1111-111111111111';

  if completed_by_member <> '22222222-2222-2222-2222-222222222222'
    or completed_at_by_member is null
  then
    raise exception 'RLS test failed: member completion audit was forged or missing';
  end if;

  update public.follow_ups
  set status = 'pending'
  where id = 'aaaaaaaa-aaaa-1111-1111-111111111111';

  select outcome, completed_by, completed_at
  into reopened_outcome, completed_by_member, completed_at_by_member
  from public.follow_ups
  where id = 'aaaaaaaa-aaaa-1111-1111-111111111111';

  if reopened_outcome is not null
    or completed_by_member is not null
    or completed_at_by_member is not null
  then
    raise exception 'RLS test failed: member reopen retained completion state';
  end if;

  update public.follow_ups
  set status = 'completed', outcome = 'Member should not complete unassigned work.'
  where id = 'aaaaaaaa-aaaa-2222-2222-222222222222';
  get diagnostics changed_rows = row_count;

  if changed_rows <> 0 then
    raise exception 'RLS test failed: member completed an unassigned follow-up';
  end if;

  update public.customers
  set notes = 'Member-edited customer'
  where id = 'aaaaaaaa-1111-1111-1111-111111111111';
  get diagnostics changed_rows = row_count;

  if changed_rows <> 0 then
    raise exception 'RLS test failed: member updated customer master data';
  end if;
end;
$$;

select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-1111-1111-111111111111',
  true
);

update public.customers
set is_active = true
where id = 'aaaaaaaa-1111-1111-1111-111111111111';

select set_config(
  'request.jwt.claim.sub',
  '22222222-2222-2222-2222-222222222222',
  true
);

do $$
begin
  begin
    update public.follow_ups
    set title = 'Member-edited follow-up title'
    where id = 'aaaaaaaa-aaaa-1111-1111-111111111111';
    raise exception 'RLS test failed: member edited follow-up details';
  exception
    when insufficient_privilege then null;
  end;

  begin
    update public.follow_ups
    set assigned_to = '11111111-1111-1111-1111-111111111111'
    where id = 'aaaaaaaa-aaaa-1111-1111-111111111111';
    raise exception 'RLS test failed: member changed a follow-up assignee';
  exception
    when insufficient_privilege then null;
  end;

  begin
    update public.follow_ups
    set completed_by = '11111111-1111-1111-1111-111111111111'
    where id = 'aaaaaaaa-aaaa-1111-1111-111111111111';
    raise exception 'RLS test failed: member forged completed_by';
  exception
    when insufficient_privilege then null;
  end;

  begin
    insert into public.customers (workspace_id, name, created_by)
    values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'Member-created customer',
      '22222222-2222-2222-2222-222222222222'
    );
    raise exception 'RLS test failed: member created a customer';
  exception
    when insufficient_privilege then null;
  end;

  begin
    insert into public.follow_ups (
      workspace_id,
      customer_id,
      title,
      due_date,
      assigned_to,
      created_by
    )
    values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'aaaaaaaa-1111-1111-1111-111111111111',
      'Member-created follow-up',
      current_date,
      '22222222-2222-2222-2222-222222222222',
      '22222222-2222-2222-2222-222222222222'
    );
    raise exception 'RLS test failed: member created a follow-up';
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
  visible_customers integer;
  visible_follow_ups integer;
begin
  select count(*) into visible_customers from public.customers;
  select count(*) into visible_follow_ups from public.follow_ups;

  if visible_customers <> 1 or visible_follow_ups <> 1 then
    raise exception 'RLS test failed: other owner sees foreign Phase 5 data';
  end if;
end;
$$;

reset role;

insert into auth.users (id, email)
values ('44444444-4444-4444-4444-444444444444', 'phase5-cascade@example.test');

insert into public.workspaces (id, name)
values ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Phase 5 cascade workspace');

insert into public.workspace_members (workspace_id, user_id, role, display_name)
values (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '44444444-4444-4444-4444-444444444444',
  'owner',
  'Cascade Owner'
);

insert into public.customers (id, workspace_id, name, created_by)
values (
  'cccccccc-1111-1111-1111-111111111111',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'Cascade customer',
  '44444444-4444-4444-4444-444444444444'
);

insert into public.follow_ups (
  id,
  workspace_id,
  customer_id,
  title,
  due_date,
  created_by
)
values (
  'cccccccc-cccc-1111-1111-111111111111',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'cccccccc-1111-1111-1111-111111111111',
  'Cascade follow-up',
  current_date,
  '44444444-4444-4444-4444-444444444444'
);

delete from public.workspaces
where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

do $$
begin
  if exists (
    select 1 from public.customers
    where workspace_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
  ) or exists (
    select 1 from public.follow_ups
    where workspace_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
  ) then
    raise exception 'RLS test failed: workspace deletion did not cascade Phase 5 data';
  end if;
end;
$$;

rollback;
