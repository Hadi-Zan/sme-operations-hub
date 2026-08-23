-- Run only in a non-production Supabase SQL Editor after applying the Phase 2
-- migration. All temporary users and workspaces are rolled back.

begin;

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'rls-owner@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'rls-member@example.test');

insert into public.workspaces (id, name)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Owner test workspace'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Member test workspace');

insert into public.workspace_members (workspace_id, user_id, role)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'owner'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '22222222-2222-2222-2222-222222222222',
    'member'
  );

do $$
begin
  if has_table_privilege('anon', 'public.workspaces', 'select') then
    raise exception 'RLS test failed: anon unexpectedly has workspace SELECT privileges';
  end if;

  if has_table_privilege('anon', 'public.workspace_members', 'select') then
    raise exception 'RLS test failed: anon unexpectedly has membership SELECT privileges';
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
  visible_workspaces integer;
  visible_memberships integer;
  updated_rows integer;
begin
  select count(*) into visible_workspaces from public.workspaces;
  select count(*) into visible_memberships from public.workspace_members;

  if visible_workspaces <> 1 or visible_memberships <> 1 then
    raise exception 'RLS test failed: owner can see data outside their workspace';
  end if;

  update public.workspaces
  set name = 'Owner updated workspace'
  where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  get diagnostics updated_rows = row_count;

  if updated_rows <> 1 then
    raise exception 'RLS test failed: owner could not update their workspace';
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
  visible_workspaces integer;
  visible_memberships integer;
  updated_rows integer;
begin
  select count(*) into visible_workspaces from public.workspaces;
  select count(*) into visible_memberships from public.workspace_members;

  if visible_workspaces <> 1 or visible_memberships <> 1 then
    raise exception 'RLS test failed: member can see data outside their workspace';
  end if;

  update public.workspaces
  set name = 'Member should not update this'
  where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  get diagnostics updated_rows = row_count;

  if updated_rows <> 0 then
    raise exception 'RLS test failed: a non-owner updated the workspace';
  end if;
end;
$$;

reset role;
rollback;
