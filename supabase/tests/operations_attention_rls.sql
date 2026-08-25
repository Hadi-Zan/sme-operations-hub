-- Run only in a non-production Supabase SQL Editor after applying the Phase 2
-- through Phase 6 migrations. All fixtures are rolled back.

begin;

insert into auth.users (id, email)
values
  ('61000000-0000-0000-0000-000000000001', 'phase6-owner@example.test'),
  ('62000000-0000-0000-0000-000000000002', 'phase6-member@example.test'),
  ('63000000-0000-0000-0000-000000000003', 'phase6-other-owner@example.test'),
  ('64000000-0000-0000-0000-000000000004', 'phase6-cascade-owner@example.test');

insert into public.workspaces (id, name, timezone)
values
  ('6a000000-0000-0000-0000-000000000001', 'Phase 6 workspace', 'Asia/Singapore'),
  ('6b000000-0000-0000-0000-000000000002', 'Other Phase 6 workspace', 'UTC'),
  ('6c000000-0000-0000-0000-000000000003', 'Cascade Phase 6 workspace', 'UTC');

insert into public.workspace_members (workspace_id, user_id, role, display_name)
values
  (
    '6a000000-0000-0000-0000-000000000001',
    '61000000-0000-0000-0000-000000000001',
    'owner',
    'Phase 6 Owner'
  ),
  (
    '6a000000-0000-0000-0000-000000000001',
    '62000000-0000-0000-0000-000000000002',
    'member',
    'Phase 6 Member'
  ),
  (
    '6b000000-0000-0000-0000-000000000002',
    '63000000-0000-0000-0000-000000000003',
    'owner',
    'Other Owner'
  ),
  (
    '6c000000-0000-0000-0000-000000000003',
    '64000000-0000-0000-0000-000000000004',
    'owner',
    'Cascade Owner'
  );

insert into public.tasks (
  id,
  workspace_id,
  title,
  status,
  priority,
  due_date,
  assigned_to,
  created_by
)
values
  (
    '61100000-0000-0000-0000-000000000001',
    '6a000000-0000-0000-0000-000000000001',
    'Overdue workspace task',
    'todo',
    'high',
    (current_timestamp at time zone 'Asia/Singapore')::date - 2,
    '62000000-0000-0000-0000-000000000002',
    '61000000-0000-0000-0000-000000000001'
  ),
  (
    '61200000-0000-0000-0000-000000000002',
    '6a000000-0000-0000-0000-000000000001',
    'Urgent task due today',
    'in_progress',
    'urgent',
    (current_timestamp at time zone 'Asia/Singapore')::date,
    null,
    '61000000-0000-0000-0000-000000000001'
  ),
  (
    '61300000-0000-0000-0000-000000000003',
    '6a000000-0000-0000-0000-000000000001',
    'Normal task due today',
    'todo',
    'medium',
    (current_timestamp at time zone 'Asia/Singapore')::date,
    null,
    '61000000-0000-0000-0000-000000000001'
  ),
  (
    '61400000-0000-0000-0000-000000000004',
    '6a000000-0000-0000-0000-000000000001',
    'Completed overdue task',
    'completed',
    'urgent',
    (current_timestamp at time zone 'Asia/Singapore')::date - 4,
    null,
    '61000000-0000-0000-0000-000000000001'
  ),
  (
    '61500000-0000-0000-0000-000000000005',
    '6a000000-0000-0000-0000-000000000001',
    'Task without a due date',
    'todo',
    'urgent',
    null,
    null,
    '61000000-0000-0000-0000-000000000001'
  ),
  (
    '61600000-0000-0000-0000-000000000006',
    '6b000000-0000-0000-0000-000000000002',
    'Other workspace overdue task',
    'todo',
    'high',
    (current_timestamp at time zone 'UTC')::date - 1,
    null,
    '63000000-0000-0000-0000-000000000003'
  ),
  (
    '61700000-0000-0000-0000-000000000007',
    '6c000000-0000-0000-0000-000000000003',
    'Cascade workspace overdue task',
    'todo',
    'high',
    (current_timestamp at time zone 'UTC')::date - 1,
    null,
    '64000000-0000-0000-0000-000000000004'
  );

insert into public.inventory_items (
  id,
  workspace_id,
  name,
  unit_of_measure,
  reorder_threshold,
  created_by
)
values
  (
    '62100000-0000-0000-0000-000000000001',
    '6a000000-0000-0000-0000-000000000001',
    'Low-stock filters',
    'units',
    3,
    '61000000-0000-0000-0000-000000000001'
  ),
  (
    '62200000-0000-0000-0000-000000000002',
    '6a000000-0000-0000-0000-000000000001',
    'Healthy-stock filters',
    'units',
    3,
    '61000000-0000-0000-0000-000000000001'
  );

insert into public.inventory_movements (
  id,
  workspace_id,
  inventory_item_id,
  movement_type,
  quantity_change,
  note,
  recorded_by
)
values
  (
    '62900000-0000-0000-0000-000000000001',
    '6a000000-0000-0000-0000-000000000001',
    '62100000-0000-0000-0000-000000000001',
    'stock_in',
    2,
    'Phase 6 fixture',
    '61000000-0000-0000-0000-000000000001'
  ),
  (
    '62900000-0000-0000-0000-000000000002',
    '6a000000-0000-0000-0000-000000000001',
    '62200000-0000-0000-0000-000000000002',
    'stock_in',
    5,
    'Phase 6 fixture',
    '61000000-0000-0000-0000-000000000001'
  );

insert into public.customers (
  id,
  workspace_id,
  name,
  created_by
)
values
  (
    '63100000-0000-0000-0000-000000000001',
    '6a000000-0000-0000-0000-000000000001',
    'Phase 6 Customer',
    '61000000-0000-0000-0000-000000000001'
  );

insert into public.follow_ups (
  id,
  workspace_id,
  customer_id,
  title,
  due_date,
  assigned_to,
  status,
  outcome,
  completed_by,
  completed_at,
  created_by
)
values
  (
    '64100000-0000-0000-0000-000000000001',
    '6a000000-0000-0000-0000-000000000001',
    '63100000-0000-0000-0000-000000000001',
    'Overdue customer call',
    (current_timestamp at time zone 'Asia/Singapore')::date - 1,
    '62000000-0000-0000-0000-000000000002',
    'pending',
    null,
    null,
    null,
    '61000000-0000-0000-0000-000000000001'
  ),
  (
    '64200000-0000-0000-0000-000000000002',
    '6a000000-0000-0000-0000-000000000001',
    '63100000-0000-0000-0000-000000000001',
    'Customer call due today',
    (current_timestamp at time zone 'Asia/Singapore')::date,
    null,
    'pending',
    null,
    null,
    null,
    '61000000-0000-0000-0000-000000000001'
  ),
  (
    '64300000-0000-0000-0000-000000000003',
    '6a000000-0000-0000-0000-000000000001',
    '63100000-0000-0000-0000-000000000001',
    'Completed customer call',
    (current_timestamp at time zone 'Asia/Singapore')::date - 3,
    null,
    'completed',
    'Completed fixture',
    '61000000-0000-0000-0000-000000000001',
    clock_timestamp(),
    '61000000-0000-0000-0000-000000000001'
  );

do $$
declare
  view_options text[];
  acknowledgement_rls boolean;
begin
  if has_table_privilege('anon', 'public.operations_attention_items', 'select')
    or has_table_privilege('anon', 'public.alert_acknowledgements', 'select')
    or has_table_privilege('anon', 'public.alert_acknowledgements', 'insert')
  then
    raise exception 'RLS test failed: anon has unexpected Phase 6 privileges';
  end if;

  if not has_table_privilege(
    'authenticated',
    'public.operations_attention_items',
    'select'
  ) then
    raise exception 'RLS test failed: authenticated users cannot read attention items';
  end if;

  if has_table_privilege(
    'authenticated',
    'public.alert_acknowledgements',
    'update'
  ) then
    raise exception 'RLS test failed: acknowledgement rows are directly mutable';
  end if;

  select relation.reloptions
  into view_options
  from pg_catalog.pg_class as relation
  join pg_catalog.pg_namespace as namespace
    on namespace.oid = relation.relnamespace
  where namespace.nspname = 'public'
    and relation.relname = 'operations_attention_items';

  if view_options is null
    or not view_options @> array['security_invoker=true']
    or not view_options @> array['security_barrier=true']
  then
    raise exception 'RLS test failed: attention view is not security invoker and barrier';
  end if;

  select relation.relrowsecurity
  into acknowledgement_rls
  from pg_catalog.pg_class as relation
  join pg_catalog.pg_namespace as namespace
    on namespace.oid = relation.relnamespace
  where namespace.nspname = 'public'
    and relation.relname = 'alert_acknowledgements';

  if not acknowledgement_rls then
    raise exception 'RLS test failed: acknowledgement RLS is not enabled';
  end if;

  if has_function_privilege(
    'authenticated',
    'app_private.validate_workspace_timezone()',
    'execute'
  ) then
    raise exception 'RLS test failed: timezone trigger helper is directly executable';
  end if;
end;
$$;

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '61000000-0000-0000-0000-000000000001',
  true
);

do $$
declare
  visible_items integer;
  stable_fingerprint text;
  repeated_fingerprint text;
  changed_fingerprint text;
  reopened_fingerprint text;
  inventory_fingerprint text;
  renewed_inventory_fingerprint text;
  follow_up_fingerprint text;
  reopened_follow_up_fingerprint text;
begin
  select count(*) into visible_items
  from public.operations_attention_items;

  if visible_items <> 5 then
    raise exception 'RLS test failed: expected five live Phase 6 attention conditions, found %', visible_items;
  end if;

  if exists (
    select alert_type
    from public.operations_attention_items
    group by alert_type
    having count(*) <> 1
  ) or (
    select count(distinct alert_type)
    from public.operations_attention_items
  ) <> 5 then
    raise exception 'RLS test failed: the five attention types are not unique and complete';
  end if;

  if exists (
    select 1
    from public.operations_attention_items
    where source_id in (
      '61300000-0000-0000-0000-000000000003',
      '61400000-0000-0000-0000-000000000004',
      '61500000-0000-0000-0000-000000000005',
      '62200000-0000-0000-0000-000000000002',
      '64300000-0000-0000-0000-000000000003'
    )
  ) then
    raise exception 'RLS test failed: an excluded source produced an attention item';
  end if;

  select condition_fingerprint
  into stable_fingerprint
  from public.operations_attention_items
  where source_id = '61100000-0000-0000-0000-000000000001';

  select condition_fingerprint
  into repeated_fingerprint
  from public.operations_attention_items
  where source_id = '61100000-0000-0000-0000-000000000001';

  if stable_fingerprint is null
    or stable_fingerprint is distinct from repeated_fingerprint
  then
    raise exception 'RLS test failed: repeated reads changed an unchanged fingerprint';
  end if;

  insert into public.alert_acknowledgements (
    workspace_id,
    user_id,
    alert_type,
    source_id,
    condition_fingerprint
  )
  values (
    '6a000000-0000-0000-0000-000000000001',
    '61000000-0000-0000-0000-000000000001',
    'task_overdue',
    '61100000-0000-0000-0000-000000000001',
    stable_fingerprint
  );

  begin
    insert into public.alert_acknowledgements (
      workspace_id,
      user_id,
      alert_type,
      source_id,
      condition_fingerprint
    )
    values (
      '6a000000-0000-0000-0000-000000000001',
      '61000000-0000-0000-0000-000000000001',
      'task_overdue',
      '61100000-0000-0000-0000-000000000001',
      stable_fingerprint
    );
    raise exception 'RLS test failed: duplicate acknowledgement succeeded';
  exception
    when unique_violation then null;
  end;

  begin
    insert into public.alert_acknowledgements (
      workspace_id,
      user_id,
      alert_type,
      source_id,
      condition_fingerprint
    )
    values (
      '6a000000-0000-0000-0000-000000000001',
      '61000000-0000-0000-0000-000000000001',
      'task_overdue',
      '61100000-0000-0000-0000-000000000001',
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    );
    raise exception 'RLS test failed: fabricated fingerprint acknowledgement succeeded';
  exception
    when insufficient_privilege then null;
  end;

  begin
    insert into public.alert_acknowledgements (
      workspace_id,
      user_id,
      alert_type,
      source_id,
      condition_fingerprint
    )
    values (
      '6a000000-0000-0000-0000-000000000001',
      '62000000-0000-0000-0000-000000000002',
      'task_overdue',
      '61100000-0000-0000-0000-000000000001',
      stable_fingerprint
    );
    raise exception 'RLS test failed: owner acknowledged for another user';
  exception
    when insufficient_privilege then null;
  end;

  update public.tasks
  set title = 'Edited overdue workspace task'
  where id = '61100000-0000-0000-0000-000000000001';

  select condition_fingerprint
  into changed_fingerprint
  from public.operations_attention_items
  where source_id = '61100000-0000-0000-0000-000000000001';

  if changed_fingerprint is null
    or changed_fingerprint is not distinct from stable_fingerprint
  then
    raise exception 'RLS test failed: intentional source edit did not resurface the alert';
  end if;

  if exists (
    select 1
    from public.alert_acknowledgements as acknowledgement
    where acknowledgement.source_id = '61100000-0000-0000-0000-000000000001'
      and acknowledgement.condition_fingerprint = changed_fingerprint
  ) then
    raise exception 'RLS test failed: old acknowledgement matched a changed episode';
  end if;

  update public.tasks
  set status = 'completed'
  where id = '61100000-0000-0000-0000-000000000001';

  if exists (
    select 1
    from public.operations_attention_items
    where source_id = '61100000-0000-0000-0000-000000000001'
  ) then
    raise exception 'RLS test failed: completed task retained an attention item';
  end if;

  update public.tasks
  set status = 'todo'
  where id = '61100000-0000-0000-0000-000000000001';

  select condition_fingerprint
  into reopened_fingerprint
  from public.operations_attention_items
  where source_id = '61100000-0000-0000-0000-000000000001';

  if reopened_fingerprint is null
    or reopened_fingerprint in (stable_fingerprint, changed_fingerprint)
  then
    raise exception 'RLS test failed: reopened task did not create a new episode';
  end if;

  select condition_fingerprint
  into inventory_fingerprint
  from public.operations_attention_items
  where source_id = '62100000-0000-0000-0000-000000000001';

  insert into public.inventory_movements (
    workspace_id,
    inventory_item_id,
    movement_type,
    quantity_change,
    note,
    recorded_by
  )
  values (
    '6a000000-0000-0000-0000-000000000001',
    '62100000-0000-0000-0000-000000000001',
    'stock_in',
    10,
    'Resolve low stock',
    '61000000-0000-0000-0000-000000000001'
  );

  if exists (
    select 1
    from public.operations_attention_items
    where source_id = '62100000-0000-0000-0000-000000000001'
  ) then
    raise exception 'RLS test failed: replenished inventory retained a low-stock alert';
  end if;

  insert into public.inventory_movements (
    workspace_id,
    inventory_item_id,
    movement_type,
    quantity_change,
    note,
    recorded_by
  )
  values (
    '6a000000-0000-0000-0000-000000000001',
    '62100000-0000-0000-0000-000000000001',
    'stock_out',
    -11,
    'Renew low stock',
    '61000000-0000-0000-0000-000000000001'
  );

  select condition_fingerprint
  into renewed_inventory_fingerprint
  from public.operations_attention_items
  where source_id = '62100000-0000-0000-0000-000000000001';

  if renewed_inventory_fingerprint is null
    or renewed_inventory_fingerprint is not distinct from inventory_fingerprint
  then
    raise exception 'RLS test failed: renewed low stock did not create a new episode';
  end if;

  select condition_fingerprint
  into follow_up_fingerprint
  from public.operations_attention_items
  where source_id = '64100000-0000-0000-0000-000000000001';

  update public.follow_ups
  set status = 'completed', outcome = 'Phase 6 resolved follow-up'
  where id = '64100000-0000-0000-0000-000000000001';

  if exists (
    select 1
    from public.operations_attention_items
    where source_id = '64100000-0000-0000-0000-000000000001'
  ) then
    raise exception 'RLS test failed: completed follow-up retained an attention item';
  end if;

  update public.follow_ups
  set status = 'pending'
  where id = '64100000-0000-0000-0000-000000000001';

  select condition_fingerprint
  into reopened_follow_up_fingerprint
  from public.operations_attention_items
  where source_id = '64100000-0000-0000-0000-000000000001';

  if reopened_follow_up_fingerprint is null
    or reopened_follow_up_fingerprint is not distinct from follow_up_fingerprint
  then
    raise exception 'RLS test failed: reopened follow-up did not create a new episode';
  end if;

  begin
    update public.workspaces
    set timezone = 'Not/A_Real_Timezone'
    where id = '6a000000-0000-0000-0000-000000000001';
    raise exception 'RLS test failed: invalid workspace timezone succeeded';
  exception
    when check_violation then null;
  end;
end;
$$;

select set_config(
  'request.jwt.claim.sub',
  '62000000-0000-0000-0000-000000000002',
  true
);

do $$
declare
  visible_items integer;
  owner_acknowledgements integer;
  member_fingerprint text;
begin
  select count(*) into visible_items
  from public.operations_attention_items;

  if visible_items <> 5 then
    raise exception 'RLS test failed: member sees attention outside their workspace';
  end if;

  select count(*) into owner_acknowledgements
  from public.alert_acknowledgements;

  if owner_acknowledgements <> 0 then
    raise exception 'RLS test failed: member can see another user acknowledgement';
  end if;

  select condition_fingerprint
  into member_fingerprint
  from public.operations_attention_items
  where source_id = '61100000-0000-0000-0000-000000000001';

  insert into public.alert_acknowledgements (
    workspace_id,
    user_id,
    alert_type,
    source_id,
    condition_fingerprint
  )
  values (
    '6a000000-0000-0000-0000-000000000001',
    '62000000-0000-0000-0000-000000000002',
    'task_overdue',
    '61100000-0000-0000-0000-000000000001',
    member_fingerprint
  );

  if (select count(*) from public.alert_acknowledgements) <> 1 then
    raise exception 'RLS test failed: member could not acknowledge a current alert';
  end if;

  begin
    insert into public.alert_acknowledgements (
      workspace_id,
      user_id,
      alert_type,
      source_id,
      condition_fingerprint
    )
    values (
      '6a000000-0000-0000-0000-000000000001',
      '61000000-0000-0000-0000-000000000001',
      'task_overdue',
      '61100000-0000-0000-0000-000000000001',
      member_fingerprint
    );
    raise exception 'RLS test failed: member acknowledged for the owner';
  exception
    when insufficient_privilege then null;
  end;

  delete from public.alert_acknowledgements
  where source_id = '61100000-0000-0000-0000-000000000001';

  if (select count(*) from public.alert_acknowledgements) <> 0 then
    raise exception 'RLS test failed: member could not unacknowledge their own alert';
  end if;
end;
$$;

select set_config(
  'request.jwt.claim.sub',
  '63000000-0000-0000-0000-000000000003',
  true
);

do $$
begin
  if (select count(*) from public.operations_attention_items) <> 1 then
    raise exception 'RLS test failed: other owner sees foreign attention items';
  end if;
end;
$$;

select set_config(
  'request.jwt.claim.sub',
  '64000000-0000-0000-0000-000000000004',
  true
);

insert into public.alert_acknowledgements (
  workspace_id,
  user_id,
  alert_type,
  source_id,
  condition_fingerprint
)
select
  workspace_id,
  '64000000-0000-0000-0000-000000000004',
  alert_type,
  source_id,
  condition_fingerprint
from public.operations_attention_items
where source_id = '61700000-0000-0000-0000-000000000007';

reset role;

delete from public.workspaces
where id = '6c000000-0000-0000-0000-000000000003';

do $$
begin
  if exists (
    select 1
    from public.alert_acknowledgements
    where workspace_id = '6c000000-0000-0000-0000-000000000003'
  ) then
    raise exception 'RLS test failed: workspace deletion retained acknowledgements';
  end if;
end;
$$;

rollback;
