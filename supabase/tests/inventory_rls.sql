-- Run only in a non-production Supabase SQL Editor after applying the Phase 2,
-- Phase 3, and Phase 4 migrations. All temporary users, workspaces, inventory
-- items, and movements are rolled back.

begin;

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'inventory-owner@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'inventory-member@example.test'),
  ('33333333-3333-3333-3333-333333333333', 'other-inventory-owner@example.test');

insert into public.workspaces (id, name)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Inventory test workspace'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Other inventory workspace');

insert into public.workspace_members (workspace_id, user_id, role, display_name)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'owner',
    'Inventory Owner'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '22222222-2222-2222-2222-222222222222',
    'member',
    'Inventory Member'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '33333333-3333-3333-3333-333333333333',
    'owner',
    'Other Inventory Owner'
  );

insert into public.inventory_items (
  id,
  workspace_id,
  name,
  sku,
  category,
  unit_of_measure,
  reorder_threshold,
  created_by
)
values
  (
    'aaaaaaaa-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Tracked filters',
    'SHARED-01',
    'Filters',
    'units',
    8,
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'aaaaaaaa-2222-2222-2222-222222222222',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Empty cleaning solution',
    null,
    'Consumables',
    'litres',
    0,
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'bbbbbbbb-1111-1111-1111-111111111111',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Other workspace filters',
    'SHARED-01',
    'Filters',
    'units',
    2,
    '33333333-3333-3333-3333-333333333333'
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
    'aaaaaaaa-aaaa-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'aaaaaaaa-1111-1111-1111-111111111111',
    'stock_in',
    10,
    'Initial delivery',
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'aaaaaaaa-aaaa-2222-2222-222222222222',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'aaaaaaaa-1111-1111-1111-111111111111',
    'stock_out',
    -2,
    'Used on a service visit',
    '22222222-2222-2222-2222-222222222222'
  ),
  (
    'bbbbbbbb-bbbb-1111-1111-111111111111',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'bbbbbbbb-1111-1111-1111-111111111111',
    'stock_in',
    5,
    null,
    '33333333-3333-3333-3333-333333333333'
  );

do $$
declare
  balances_options text[];
  creation_function_is_definer boolean;
  item_rls_enabled boolean;
  movement_rls_enabled boolean;
  movement_item_delete_action "char";
begin
  if has_table_privilege('anon', 'public.inventory_items', 'select') then
    raise exception 'RLS test failed: anon unexpectedly has inventory item SELECT privileges';
  end if;

  if has_table_privilege('anon', 'public.inventory_movements', 'insert') then
    raise exception 'RLS test failed: anon unexpectedly has inventory movement INSERT privileges';
  end if;

  if has_table_privilege('authenticated', 'public.inventory_items', 'delete') then
    raise exception 'RLS test failed: authenticated users unexpectedly have inventory item DELETE privileges';
  end if;

  if has_table_privilege('authenticated', 'public.inventory_movements', 'update')
    or has_table_privilege('authenticated', 'public.inventory_movements', 'delete')
  then
    raise exception 'RLS test failed: inventory movement history is not immutable';
  end if;

  select constraint_record.confdeltype
  into movement_item_delete_action
  from pg_constraint as constraint_record
  where constraint_record.conname = 'inventory_movements_item_fkey'
    and constraint_record.conrelid = 'public.inventory_movements'::regclass;

  if movement_item_delete_action is distinct from 'a' then
    raise exception 'RLS test failed: deleting an inventory item can cascade its movement history';
  end if;

  select relation.reloptions
  into balances_options
  from pg_class as relation
  join pg_namespace as namespace on namespace.oid = relation.relnamespace
  where namespace.nspname = 'public'
    and relation.relname = 'inventory_item_balances';

  if balances_options is null
    or not balances_options @> array['security_invoker=true']
  then
    raise exception 'RLS test failed: inventory balance view is not security invoker';
  end if;

  select procedure.prosecdef
  into creation_function_is_definer
  from pg_proc as procedure
  join pg_namespace as namespace on namespace.oid = procedure.pronamespace
  where namespace.nspname = 'public'
    and procedure.proname = 'create_inventory_item_with_opening_stock';

  if creation_function_is_definer is distinct from false then
    raise exception 'RLS test failed: opening-stock function bypasses caller permissions';
  end if;

  select relation.relrowsecurity
  into item_rls_enabled
  from pg_class as relation
  where relation.oid = 'public.inventory_items'::regclass;

  select relation.relrowsecurity
  into movement_rls_enabled
  from pg_class as relation
  where relation.oid = 'public.inventory_movements'::regclass;

  if not item_rls_enabled or not movement_rls_enabled then
    raise exception 'RLS test failed: inventory RLS is not enabled';
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
  created_item_id uuid;
  before_failed_creation integer;
  after_failed_creation integer;
  visible_items integer;
  visible_movements integer;
  visible_balances integer;
  derived_quantity numeric;
  empty_quantity numeric;
  low_stock boolean;
  opening_movement_count integer;
  changed_rows integer;
  invalid_quantity numeric;
begin
  select count(*) into visible_items from public.inventory_items;
  select count(*) into visible_movements from public.inventory_movements;
  select count(*) into visible_balances from public.inventory_item_balances;

  if visible_items <> 2 or visible_movements <> 2 or visible_balances <> 2 then
    raise exception 'RLS test failed: owner can see inventory outside their workspace';
  end if;

  select current_quantity, is_low_stock
  into derived_quantity, low_stock
  from public.inventory_item_balances
  where id = 'aaaaaaaa-1111-1111-1111-111111111111';

  if derived_quantity <> 8 or not low_stock then
    raise exception 'RLS test failed: movement-derived balance or low-stock state is incorrect';
  end if;

  select current_quantity
  into empty_quantity
  from public.inventory_item_balances
  where id = 'aaaaaaaa-2222-2222-2222-222222222222';

  if empty_quantity <> 0 then
    raise exception 'RLS test failed: item without movements did not start at zero';
  end if;

  created_item_id := public.create_inventory_item_with_opening_stock(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Owner-created belts',
    'BELT-01',
    'Parts',
    'units',
    3,
    5
  );

  select current_quantity
  into derived_quantity
  from public.inventory_item_balances
  where id = created_item_id;

  select count(*)
  into opening_movement_count
  from public.inventory_movements
  where inventory_item_id = created_item_id
    and movement_type = 'stock_in'
    and quantity_change = 5
    and note = 'Opening stock';

  if derived_quantity <> 5 or opening_movement_count <> 1 then
    raise exception 'RLS test failed: opening stock was not recorded atomically as a movement';
  end if;

  update public.inventory_items
  set category = 'Service parts'
  where id = created_item_id;
  get diagnostics changed_rows = row_count;

  if changed_rows <> 1 then
    raise exception 'RLS test failed: owner could not edit inventory metadata';
  end if;

  update public.inventory_items
  set unit_of_measure = 'bottles'
  where id = 'aaaaaaaa-2222-2222-2222-222222222222';
  get diagnostics changed_rows = row_count;

  if changed_rows <> 1 then
    raise exception 'RLS test failed: owner could not change a unit before movements existed';
  end if;

  begin
    update public.inventory_items
    set unit_of_measure = 'boxes'
    where id = 'aaaaaaaa-1111-1111-1111-111111111111';
    raise exception 'RLS test failed: owner changed a unit after movements existed';
  exception
    when check_violation then null;
  end;

  begin
    insert into public.inventory_items (
      workspace_id,
      name,
      sku,
      unit_of_measure,
      created_by
    )
    values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'Duplicate SKU item',
      'shared-01',
      'units',
      '11111111-1111-1111-1111-111111111111'
    );
    raise exception 'RLS test failed: duplicate workspace SKU unexpectedly succeeded';
  exception
    when unique_violation then null;
  end;

  foreach invalid_quantity in array array[
    'NaN'::numeric,
    'Infinity'::numeric,
    '-Infinity'::numeric
  ]
  loop
    begin
      insert into public.inventory_items (
        workspace_id,
        name,
        unit_of_measure,
        reorder_threshold,
        created_by
      )
      values (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'Invalid reorder threshold',
        'units',
        invalid_quantity,
        '11111111-1111-1111-1111-111111111111'
      );
      raise exception 'RLS test failed: non-finite reorder threshold % unexpectedly succeeded', invalid_quantity;
    exception
      when check_violation or numeric_value_out_of_range then null;
    end;
  end loop;

  select count(*) into before_failed_creation from public.inventory_items;

  begin
    perform public.create_inventory_item_with_opening_stock(
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'Invalid negative opening stock',
      null,
      null,
      'units',
      0,
      -1
    );
    raise exception 'RLS test failed: negative opening stock unexpectedly succeeded';
  exception
    when check_violation then null;
  end;

  foreach invalid_quantity in array array[
    'NaN'::numeric,
    'Infinity'::numeric,
    '-Infinity'::numeric
  ]
  loop
    begin
      perform public.create_inventory_item_with_opening_stock(
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'Invalid non-finite opening stock',
        null,
        null,
        'units',
        0,
        invalid_quantity
      );
      raise exception 'RLS test failed: non-finite opening stock % unexpectedly succeeded', invalid_quantity;
    exception
      when check_violation then null;
    end;
  end loop;

  select count(*) into after_failed_creation from public.inventory_items;

  if before_failed_creation <> after_failed_creation then
    raise exception 'RLS test failed: failed opening-stock creation left a partial item';
  end if;

  begin
    delete from public.inventory_items where id = created_item_id;
    raise exception 'RLS test failed: owner deleted an inventory item';
  exception
    when insufficient_privilege then null;
  end;

  begin
    update public.inventory_movements
    set note = 'Changed history'
    where inventory_item_id = created_item_id;
    raise exception 'RLS test failed: owner edited inventory movement history';
  exception
    when insufficient_privilege then null;
  end;

  begin
    delete from public.inventory_movements where inventory_item_id = created_item_id;
    raise exception 'RLS test failed: owner deleted inventory movement history';
  exception
    when insufficient_privilege then null;
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
  visible_items integer;
  visible_movements integer;
  visible_balances integer;
  changed_rows integer;
  derived_quantity numeric;
  item_count_before_rpc integer;
  item_count_after_rpc integer;
  invalid_quantity numeric;
begin
  select count(*) into visible_items from public.inventory_items;
  select count(*) into visible_movements from public.inventory_movements;
  select count(*) into visible_balances from public.inventory_item_balances;

  if visible_items <> 3 or visible_movements <> 3 or visible_balances <> 3 then
    raise exception 'RLS test failed: member can see inventory outside their workspace';
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
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'aaaaaaaa-1111-1111-1111-111111111111',
    'stock_out',
    -3,
    'Used by the assigned technician',
    '22222222-2222-2222-2222-222222222222'
  );

  select current_quantity
  into derived_quantity
  from public.inventory_item_balances
  where id = 'aaaaaaaa-1111-1111-1111-111111111111';

  if derived_quantity <> 5 then
    raise exception 'RLS test failed: member movement did not affect the derived quantity';
  end if;

  update public.inventory_items
  set name = 'Member-edited item'
  where id = 'aaaaaaaa-1111-1111-1111-111111111111';
  get diagnostics changed_rows = row_count;

  if changed_rows <> 0 then
    raise exception 'RLS test failed: member edited inventory metadata';
  end if;

  begin
    insert into public.inventory_items (
      workspace_id,
      name,
      unit_of_measure,
      created_by
    )
    values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'Member-created item',
      'units',
      '22222222-2222-2222-2222-222222222222'
    );
    raise exception 'RLS test failed: member created an inventory item';
  exception
    when insufficient_privilege then null;
  end;

  select count(*) into item_count_before_rpc from public.inventory_items;

  begin
    perform public.create_inventory_item_with_opening_stock(
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'Member RPC item',
      null,
      null,
      'units',
      0,
      1
    );
    raise exception 'RLS test failed: member used the owner-only creation function';
  exception
    when insufficient_privilege then null;
  end;

  select count(*) into item_count_after_rpc from public.inventory_items;

  if item_count_before_rpc <> item_count_after_rpc then
    raise exception 'RLS test failed: failed member RPC creation left a partial item';
  end if;

  begin
    insert into public.inventory_movements (
      workspace_id,
      inventory_item_id,
      movement_type,
      quantity_change,
      recorded_by
    )
    values (
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      'bbbbbbbb-1111-1111-1111-111111111111',
      'stock_in',
      1,
      '22222222-2222-2222-2222-222222222222'
    );
    raise exception 'RLS test failed: member recorded a cross-workspace movement';
  exception
    when insufficient_privilege then null;
  end;

  begin
    insert into public.inventory_movements (
      workspace_id,
      inventory_item_id,
      movement_type,
      quantity_change,
      recorded_by
    )
    values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'aaaaaaaa-1111-1111-1111-111111111111',
      'stock_in',
      1,
      '11111111-1111-1111-1111-111111111111'
    );
    raise exception 'RLS test failed: member spoofed the movement recorder';
  exception
    when insufficient_privilege then null;
  end;

  begin
    insert into public.inventory_movements (
      workspace_id,
      inventory_item_id,
      movement_type,
      quantity_change,
      recorded_by
    )
    values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'aaaaaaaa-1111-1111-1111-111111111111',
      'stock_in',
      -1,
      '22222222-2222-2222-2222-222222222222'
    );
    raise exception 'RLS test failed: negative stock-in unexpectedly succeeded';
  exception
    when check_violation then null;
  end;

  foreach invalid_quantity in array array[
    'NaN'::numeric,
    'Infinity'::numeric,
    '-Infinity'::numeric
  ]
  loop
    begin
      insert into public.inventory_movements (
        workspace_id,
        inventory_item_id,
        movement_type,
        quantity_change,
        recorded_by
      )
      values (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'aaaaaaaa-1111-1111-1111-111111111111',
        'stock_in',
        invalid_quantity,
        '22222222-2222-2222-2222-222222222222'
      );
      raise exception 'RLS test failed: non-finite movement quantity % unexpectedly succeeded', invalid_quantity;
    exception
      when check_violation or numeric_value_out_of_range then null;
    end;
  end loop;

  begin
    insert into public.inventory_movements (
      workspace_id,
      inventory_item_id,
      movement_type,
      quantity_change,
      recorded_by
    )
    values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'aaaaaaaa-1111-1111-1111-111111111111',
      'stock_out',
      1,
      '22222222-2222-2222-2222-222222222222'
    );
    raise exception 'RLS test failed: positive stock-out unexpectedly succeeded';
  exception
    when check_violation then null;
  end;

  begin
    insert into public.inventory_movements (
      workspace_id,
      inventory_item_id,
      movement_type,
      quantity_change,
      recorded_by
    )
    values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'aaaaaaaa-1111-1111-1111-111111111111',
      'stock_in',
      0,
      '22222222-2222-2222-2222-222222222222'
    );
    raise exception 'RLS test failed: zero movement unexpectedly succeeded';
  exception
    when check_violation then null;
  end;

  begin
    insert into public.inventory_movements (
      workspace_id,
      inventory_item_id,
      movement_type,
      quantity_change,
      recorded_by
    )
    values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'aaaaaaaa-1111-1111-1111-111111111111',
      'transfer',
      1,
      '22222222-2222-2222-2222-222222222222'
    );
    raise exception 'RLS test failed: invalid movement type unexpectedly succeeded';
  exception
    when check_violation then null;
  end;

  begin
    insert into public.inventory_movements (
      workspace_id,
      inventory_item_id,
      movement_type,
      quantity_change,
      note,
      recorded_by
    )
    values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'aaaaaaaa-1111-1111-1111-111111111111',
      'adjustment',
      -1,
      null,
      '22222222-2222-2222-2222-222222222222'
    );
    raise exception 'RLS test failed: adjustment without a note unexpectedly succeeded';
  exception
    when check_violation then null;
  end;

  begin
    update public.inventory_movements
    set note = 'Member changed history'
    where id = 'aaaaaaaa-aaaa-1111-1111-111111111111';
    raise exception 'RLS test failed: member edited inventory movement history';
  exception
    when insufficient_privilege then null;
  end;

  begin
    delete from public.inventory_movements
    where id = 'aaaaaaaa-aaaa-1111-1111-111111111111';
    raise exception 'RLS test failed: member deleted inventory movement history';
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
  visible_items integer;
  visible_movements integer;
  visible_balances integer;
  other_quantity numeric;
begin
  select count(*) into visible_items from public.inventory_items;
  select count(*) into visible_movements from public.inventory_movements;
  select count(*) into visible_balances from public.inventory_item_balances;

  if visible_items <> 1 or visible_movements <> 1 or visible_balances <> 1 then
    raise exception 'RLS test failed: other workspace owner sees foreign inventory';
  end if;

  select current_quantity
  into other_quantity
  from public.inventory_item_balances
  where id = 'bbbbbbbb-1111-1111-1111-111111111111';

  if other_quantity <> 5 then
    raise exception 'RLS test failed: other workspace balance is incorrect';
  end if;
end;
$$;

reset role;

insert into auth.users (id, email)
values (
  '44444444-4444-4444-4444-444444444444',
  'inventory-cascade-owner@example.test'
);

insert into public.workspaces (id, name)
values (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'Workspace cascade lifecycle test'
);

insert into public.workspace_members (workspace_id, user_id, role, display_name)
values (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '44444444-4444-4444-4444-444444444444',
  'owner',
  'Cascade Test Owner'
);

insert into public.inventory_items (
  id,
  workspace_id,
  name,
  unit_of_measure,
  reorder_threshold,
  created_by
)
values (
  'cccccccc-1111-1111-1111-111111111111',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'Workspace cascade test item',
  'units',
  1,
  '44444444-4444-4444-4444-444444444444'
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
values (
  'cccccccc-cccc-1111-1111-111111111111',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'cccccccc-1111-1111-1111-111111111111',
  'stock_in',
  1,
  'Workspace cascade lifecycle test',
  '44444444-4444-4444-4444-444444444444'
);

delete from public.workspaces
where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

do $$
begin
  if exists (
    select 1
    from public.inventory_items
    where workspace_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
  ) then
    raise exception 'RLS test failed: workspace deletion did not cascade to inventory items';
  end if;

  if exists (
    select 1
    from public.inventory_movements
    where workspace_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
  ) then
    raise exception 'RLS test failed: workspace deletion did not cascade to inventory movements';
  end if;
end;
$$;

rollback;
