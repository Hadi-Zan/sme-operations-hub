begin;

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  sku text,
  category text,
  unit_of_measure text not null,
  reorder_threshold numeric(14, 3) not null default 0,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inventory_items_workspace_id_id_key unique (workspace_id, id),
  constraint inventory_items_name_length
    check (
      name = btrim(name)
      and char_length(name) between 1 and 160
    ),
  constraint inventory_items_sku_length
    check (
      sku is null
      or (
        sku = btrim(sku)
        and char_length(sku) between 1 and 80
      )
    ),
  constraint inventory_items_category_length
    check (
      category is null
      or (
        category = btrim(category)
        and char_length(category) between 1 and 80
      )
    ),
  constraint inventory_items_unit_of_measure_length
    check (
      unit_of_measure = btrim(unit_of_measure)
      and char_length(unit_of_measure) between 1 and 40
    ),
  constraint inventory_items_reorder_threshold_check
    check (
      reorder_threshold not in (
        'NaN'::numeric,
        'Infinity'::numeric,
        '-Infinity'::numeric
      )
      and reorder_threshold >= 0
    ),
  constraint inventory_items_created_member_fkey
    foreign key (workspace_id, created_by)
    references public.workspace_members(workspace_id, user_id)
);

create unique index inventory_items_workspace_sku_key
  on public.inventory_items (workspace_id, lower(sku))
  where sku is not null;

create index inventory_items_workspace_name_idx
  on public.inventory_items (workspace_id, name);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  inventory_item_id uuid not null,
  movement_type text not null,
  quantity_change numeric(14, 3) not null,
  note text,
  recorded_by uuid not null,
  created_at timestamptz not null default now(),
  constraint inventory_movements_item_fkey
    foreign key (workspace_id, inventory_item_id)
    references public.inventory_items(workspace_id, id),
  constraint inventory_movements_recorded_member_fkey
    foreign key (workspace_id, recorded_by)
    references public.workspace_members(workspace_id, user_id),
  constraint inventory_movements_type_check
    check (movement_type in ('stock_in', 'stock_out', 'adjustment')),
  constraint inventory_movements_quantity_nonzero
    check (
      quantity_change not in (
        'NaN'::numeric,
        'Infinity'::numeric,
        '-Infinity'::numeric
      )
      and quantity_change <> 0
    ),
  constraint inventory_movements_type_direction_check
    check (
      (movement_type = 'stock_in' and quantity_change > 0)
      or (movement_type = 'stock_out' and quantity_change < 0)
      or movement_type = 'adjustment'
    ),
  constraint inventory_movements_note_length
    check (
      note is null
      or (
        note = btrim(note)
        and char_length(note) between 1 and 500
      )
    ),
  constraint inventory_movements_adjustment_note_required
    check (movement_type <> 'adjustment' or note is not null)
);

create index inventory_movements_workspace_created_at_idx
  on public.inventory_movements (workspace_id, created_at desc);
create index inventory_movements_workspace_item_created_at_idx
  on public.inventory_movements (workspace_id, inventory_item_id, created_at desc);

create function app_private.prepare_inventory_item_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.unit_of_measure is distinct from old.unit_of_measure
    and exists (
      select 1
      from public.inventory_movements as movement
      where movement.workspace_id = old.workspace_id
        and movement.inventory_item_id = old.id
    )
  then
    raise check_violation
      using message = 'Unit of measure cannot change after stock movements have been recorded.';
  end if;

  new.updated_at = clock_timestamp();
  return new;
end;
$$;

revoke all on function app_private.prepare_inventory_item_update()
  from public, anon, authenticated;

create trigger prepare_inventory_item_update
before update on public.inventory_items
for each row execute function app_private.prepare_inventory_item_update();

alter table public.inventory_items enable row level security;
alter table public.inventory_movements enable row level security;

revoke all on table public.inventory_items from anon, authenticated;
revoke all on table public.inventory_movements from anon, authenticated;

grant select on table public.inventory_items to authenticated;
grant insert (
  workspace_id,
  name,
  sku,
  category,
  unit_of_measure,
  reorder_threshold,
  created_by
) on table public.inventory_items to authenticated;
grant update (
  name,
  sku,
  category,
  unit_of_measure,
  reorder_threshold
) on table public.inventory_items to authenticated;

grant select on table public.inventory_movements to authenticated;
grant insert (
  workspace_id,
  inventory_item_id,
  movement_type,
  quantity_change,
  note,
  recorded_by
) on table public.inventory_movements to authenticated;

create policy "Workspace members can view inventory items"
on public.inventory_items
for select
to authenticated
using (
  (select auth.uid()) is not null
  and app_private.current_workspace_role(workspace_id) in ('owner', 'member')
);

create policy "Workspace owners can create inventory items"
on public.inventory_items
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and app_private.current_workspace_role(workspace_id) = 'owner'
  and created_by = (select auth.uid())
);

create policy "Workspace owners can update inventory items"
on public.inventory_items
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

create policy "Workspace members can view inventory movements"
on public.inventory_movements
for select
to authenticated
using (
  (select auth.uid()) is not null
  and app_private.current_workspace_role(workspace_id) in ('owner', 'member')
);

create policy "Workspace members can record inventory movements"
on public.inventory_movements
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and app_private.current_workspace_role(workspace_id) in ('owner', 'member')
  and recorded_by = (select auth.uid())
);

create view public.inventory_item_balances
with (security_invoker = true, security_barrier = true)
as
select
  item.id,
  item.workspace_id,
  item.name,
  item.sku,
  item.category,
  item.unit_of_measure,
  item.reorder_threshold,
  item.created_by,
  item.created_at,
  item.updated_at,
  coalesce(movement_summary.current_quantity, 0::numeric) as current_quantity,
  coalesce(movement_summary.movement_count, 0::bigint) as movement_count,
  movement_summary.last_movement_at,
  coalesce(movement_summary.current_quantity, 0::numeric) <= item.reorder_threshold
    as is_low_stock
from public.inventory_items as item
left join lateral (
  select
    sum(movement.quantity_change) as current_quantity,
    count(*) as movement_count,
    max(movement.created_at) as last_movement_at
  from public.inventory_movements as movement
  where movement.workspace_id = item.workspace_id
    and movement.inventory_item_id = item.id
) as movement_summary on true;

revoke all on table public.inventory_item_balances from public, anon, authenticated;
grant select on table public.inventory_item_balances to authenticated;

create function public.create_inventory_item_with_opening_stock(
  target_workspace_id uuid,
  item_name text,
  item_sku text,
  item_category text,
  item_unit_of_measure text,
  item_reorder_threshold numeric,
  opening_quantity numeric default 0
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  caller_id uuid;
  new_item_id uuid;
begin
  caller_id := auth.uid();

  if caller_id is null then
    raise insufficient_privilege using message = 'Authentication is required.';
  end if;

  if opening_quantity is null
    or opening_quantity in (
      'NaN'::numeric,
      'Infinity'::numeric,
      '-Infinity'::numeric
    )
    or opening_quantity < 0
  then
    raise check_violation using message = 'Opening stock must be a finite, non-negative number.';
  end if;

  insert into public.inventory_items (
    workspace_id,
    name,
    sku,
    category,
    unit_of_measure,
    reorder_threshold,
    created_by
  )
  values (
    target_workspace_id,
    item_name,
    item_sku,
    item_category,
    item_unit_of_measure,
    item_reorder_threshold,
    caller_id
  )
  returning id into new_item_id;

  if opening_quantity > 0 then
    insert into public.inventory_movements (
      workspace_id,
      inventory_item_id,
      movement_type,
      quantity_change,
      note,
      recorded_by
    )
    values (
      target_workspace_id,
      new_item_id,
      'stock_in',
      opening_quantity,
      'Opening stock',
      caller_id
    );
  end if;

  return new_item_id;
end;
$$;

revoke all on function public.create_inventory_item_with_opening_stock(
  uuid,
  text,
  text,
  text,
  text,
  numeric,
  numeric
) from public, anon, authenticated;
grant execute on function public.create_inventory_item_with_opening_stock(
  uuid,
  text,
  text,
  text,
  text,
  numeric,
  numeric
) to authenticated;

comment on table public.inventory_items is
  'Workspace-scoped inventory metadata introduced in Phase 4. Stock quantity is derived from movements.';
comment on table public.inventory_movements is
  'Immutable, workspace-scoped stock movement history. Authenticated users receive no update or delete privileges.';
comment on view public.inventory_item_balances is
  'Security-invoker inventory balances derived from RLS-protected inventory items and movements.';
comment on function public.create_inventory_item_with_opening_stock(
  uuid,
  text,
  text,
  text,
  text,
  numeric,
  numeric
) is
  'Creates an inventory item and optional opening stock movement atomically with caller permissions and RLS.';

commit;
