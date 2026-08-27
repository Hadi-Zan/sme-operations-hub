-- Run only in a non-production Supabase SQL Editor after applying the Phase 7B
-- migration. All probe objects and fixture rows are rolled back.

begin;

reset role;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{}', true);

do $$
declare
  expected_indexes text[] := array[
    'customers_workspace_created_by_idx',
    'follow_ups_workspace_completed_by_idx',
    'follow_ups_workspace_created_by_idx',
    'inventory_items_workspace_created_by_idx',
    'inventory_movements_workspace_recorded_by_idx',
    'tasks_workspace_created_by_idx',
    'workspace_invitations_workspace_accepted_by_idx',
    'workspace_invitations_workspace_cancelled_by_idx',
    'workspace_invitations_workspace_created_by_idx',
    'workspace_members_workspace_deactivated_by_idx'
  ];
  index_name text;
begin
  if has_function_privilege('anon', 'public.rls_auto_enable()', 'execute')
    or has_function_privilege('authenticated', 'public.rls_auto_enable()', 'execute')
    or has_function_privilege('service_role', 'public.rls_auto_enable()', 'execute')
  then
    raise exception 'Phase 7B test failed: an API role can execute rls_auto_enable directly';
  end if;

  foreach index_name in array expected_indexes loop
    if to_regclass(format('public.%I', index_name)) is null then
      raise exception 'Phase 7B test failed: expected index % is missing', index_name;
    end if;
  end loop;

  if (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename = 'workspace_members'
      and cmd = 'SELECT'
      and permissive = 'PERMISSIVE'
      and 'authenticated' = any (roles)
  ) <> 1 then
    raise exception 'Phase 7B test failed: membership SELECT policies were not consolidated';
  end if;
end;
$$;

-- Revoking direct EXECUTE must not disable the owner-driven event trigger.
create table public.phase_7b_rls_probe (id bigint primary key);

do $$
begin
  if not (
    select relation.relrowsecurity
    from pg_class as relation
    where relation.oid = 'public.phase_7b_rls_probe'::regclass
  ) then
    raise exception 'Phase 7B test failed: ensure_rls no longer enables RLS';
  end if;
end;
$$;

insert into auth.users (id, email) values
  ('7b000000-0000-0000-0000-000000000001', 'owner@phase7b.test'),
  ('7b000000-0000-0000-0000-000000000002', 'active-member@phase7b.test'),
  ('7b000000-0000-0000-0000-000000000003', 'inactive-member@phase7b.test'),
  ('7b000000-0000-0000-0000-000000000004', 'other-owner@phase7b.test');

insert into public.workspaces (id, name) values
  ('7b000000-0000-0000-0000-000000000101', 'Phase 7B policy workspace'),
  ('7b000000-0000-0000-0000-000000000102', 'Phase 7B other workspace');

insert into public.workspace_members (
  workspace_id,
  user_id,
  role,
  display_name,
  status,
  deactivated_at,
  deactivated_by
) values
  ('7b000000-0000-0000-0000-000000000101', '7b000000-0000-0000-0000-000000000001', 'owner', 'Phase 7B Owner', 'active', null, null),
  ('7b000000-0000-0000-0000-000000000101', '7b000000-0000-0000-0000-000000000002', 'member', 'Active Member', 'active', null, null),
  ('7b000000-0000-0000-0000-000000000101', '7b000000-0000-0000-0000-000000000003', 'member', 'Inactive Member', 'deactivated', clock_timestamp(), '7b000000-0000-0000-0000-000000000001'),
  ('7b000000-0000-0000-0000-000000000102', '7b000000-0000-0000-0000-000000000004', 'owner', 'Other Owner', 'active', null, null);

set local role authenticated;
select set_config('request.jwt.claim.sub', '7b000000-0000-0000-0000-000000000002', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"7b000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);

do $$
declare
  visible_members integer;
begin
  select count(*) into visible_members from public.workspace_members;
  if visible_members <> 3 then
    raise exception 'Phase 7B test failed: active member directory visibility changed';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '7b000000-0000-0000-0000-000000000003', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"7b000000-0000-0000-0000-000000000003","role":"authenticated"}',
  true
);

do $$
declare
  visible_members integer;
  visible_user uuid;
begin
  select count(*), min(user_id::text)::uuid
  into visible_members, visible_user
  from public.workspace_members;

  if visible_members <> 1
    or visible_user <> '7b000000-0000-0000-0000-000000000003'::uuid
  then
    raise exception 'Phase 7B test failed: deactivated self-membership visibility changed';
  end if;
end;
$$;

reset role;
rollback;
