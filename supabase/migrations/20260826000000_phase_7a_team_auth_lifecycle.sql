begin;

create function app_private.assert_all_workspaces_have_owner()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  ownerless_workspace_id uuid;
begin
  select workspace.id
  into ownerless_workspace_id
  from public.workspaces as workspace
  where not exists (
    select 1
    from public.workspace_members as membership
    where membership.workspace_id = workspace.id
      and membership.role = 'owner'
  )
  order by workspace.id
  limit 1;

  if ownerless_workspace_id is not null then
    raise exception using
      message = format(
        'Phase 7A preflight failed: workspace %s has no owner membership.',
        ownerless_workspace_id
      );
  end if;
end;
$$;

revoke all on function app_private.assert_all_workspaces_have_owner()
  from public, anon, authenticated;

select app_private.assert_all_workspaces_have_owner();

-- Gate 7A keeps the initial invitation lifetime in one database function. The
-- stored expires_at value is authoritative; changing the policy later requires
-- changing this function rather than every invitation path.
create or replace function app_private.workspace_invitation_ttl()
returns interval
language sql
immutable
set search_path = ''
as $$
  select interval '24 hours';
$$;

revoke all on function app_private.workspace_invitation_ttl()
  from public, anon, authenticated;

alter table public.workspace_members
  add column status text not null default 'active',
  add column updated_at timestamptz not null default now(),
  add column deactivated_at timestamptz,
  add column deactivated_by uuid,
  add constraint workspace_members_status_check
    check (status in ('active', 'deactivated')),
  add constraint workspace_members_deactivation_state_check
    check (
      (status = 'active' and deactivated_at is null and deactivated_by is null)
      or
      (status = 'deactivated' and deactivated_at is not null and deactivated_by is not null)
    ),
  add constraint workspace_members_deactivated_by_fkey
    foreign key (workspace_id, deactivated_by)
    references public.workspace_members(workspace_id, user_id);

create function app_private.set_workspace_member_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = clock_timestamp();
  return new;
end;
$$;

revoke all on function app_private.set_workspace_member_updated_at()
  from public, anon, authenticated;

create trigger set_workspace_member_updated_at
before update on public.workspace_members
for each row execute function app_private.set_workspace_member_updated_at();

create or replace function app_private.current_workspace_role(target_workspace_id uuid)
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
    and membership.status = 'active'
  limit 1;
$$;

-- CREATE OR REPLACE retains the Phase 3 ACL, but reapply it explicitly so the
-- active-aware replacement cannot accidentally widen helper access.
revoke all on function app_private.current_workspace_role(uuid)
  from public, anon, authenticated;
grant execute on function app_private.current_workspace_role(uuid)
  to authenticated;

-- Serialize every operation that could remove an active owner. The advisory
-- lock is acquired before the membership change and the workspace row lock
-- provides an additional, visible serialization point. During an intentional
-- workspace delete the parent row is already invisible to its cascade trigger,
-- so the cascade is allowed to continue.
create function app_private.protect_final_active_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  workspace_still_exists boolean;
begin
  if tg_op = 'UPDATE' then
    if old.role <> 'owner' or old.status <> 'active' then
      return new;
    end if;

    if new.workspace_id = old.workspace_id
      and new.user_id = old.user_id
      and new.role = 'owner'
      and new.status = 'active'
    then
      return new;
    end if;
  elsif tg_op = 'DELETE' then
    if old.role <> 'owner' or old.status <> 'active' then
      return old;
    end if;
  else
    raise exception using
      message = format('Unexpected trigger operation: %s.', tg_op);
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(old.workspace_id::text, 71001)
  );

  select true
  into workspace_still_exists
  from public.workspaces
  where id = old.workspace_id
  for update;

  if not coalesce(workspace_still_exists, false) then
    if tg_op = 'DELETE' then
      return old;
    elsif tg_op = 'UPDATE' then
      return new;
    end if;
  end if;

  if not exists (
    select 1
    from public.workspace_members as other_owner
    where other_owner.workspace_id = old.workspace_id
      and other_owner.user_id <> old.user_id
      and other_owner.role = 'owner'
      and other_owner.status = 'active'
  ) then
    raise check_violation
      using message = 'A workspace must retain at least one active owner.';
  end if;

  if tg_op = 'DELETE' then
    return old;
  elsif tg_op = 'UPDATE' then
    return new;
  end if;

  return null;
end;
$$;

revoke all on function app_private.protect_final_active_owner()
  from public, anon, authenticated;

create trigger protect_final_active_owner
before delete or update of workspace_id, user_id, role, status on public.workspace_members
for each row execute function app_private.protect_final_active_owner();

create function app_private.ensure_active_assignee()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.assigned_to is not distinct from old.assigned_to
      and new.workspace_id is not distinct from old.workspace_id
    then
      return new;
    end if;
  elsif tg_op <> 'INSERT' then
    raise exception using
      message = format('Unexpected trigger operation: %s.', tg_op);
  end if;

  if new.assigned_to is not null and not exists (
    select 1
    from public.workspace_members as assignee
    where assignee.workspace_id = new.workspace_id
      and assignee.user_id = new.assigned_to
      and assignee.status = 'active'
  ) then
    raise check_violation
      using message = 'Work can only be assigned to an active workspace member.';
  end if;

  return new;
end;
$$;

revoke all on function app_private.ensure_active_assignee()
  from public, anon, authenticated;

create trigger ensure_active_task_assignee
before insert or update of assigned_to, workspace_id on public.tasks
for each row execute function app_private.ensure_active_assignee();

create trigger ensure_active_follow_up_assignee
before insert or update of assigned_to, workspace_id on public.follow_ups
for each row execute function app_private.ensure_active_assignee();

drop policy "Members can view their workspace" on public.workspaces;
drop policy "Owners can update their workspace profile" on public.workspaces;

create policy "Active members can view their workspace"
on public.workspaces
for select
to authenticated
using (
  (select auth.uid()) is not null
  and app_private.current_workspace_role(id) in ('owner', 'member')
);

create policy "Active owners can update their workspace profile"
on public.workspaces
for update
to authenticated
using (
  (select auth.uid()) is not null
  and app_private.current_workspace_role(id) = 'owner'
)
with check (
  (select auth.uid()) is not null
  and app_private.current_workspace_role(id) = 'owner'
);

create table public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  display_name text not null,
  role text not null default 'member',
  status text not null default 'pending',
  auth_user_id uuid references auth.users(id) on delete set null,
  activation_mode text,
  send_count integer not null default 0,
  last_sent_at timestamptz,
  last_error_code text,
  expires_at timestamptz not null,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  accepted_at timestamptz,
  accepted_by uuid,
  cancelled_at timestamptz,
  cancelled_by uuid,
  constraint workspace_invitations_email_check
    check (
      email = lower(btrim(email))
      and char_length(email) between 3 and 320
      and position('@' in email) > 1
    ),
  constraint workspace_invitations_display_name_check
    check (
      display_name = btrim(display_name)
      and char_length(display_name) between 1 and 100
    ),
  constraint workspace_invitations_role_check check (role = 'member'),
  constraint workspace_invitations_status_check
    check (status in ('pending', 'accepted', 'cancelled')),
  constraint workspace_invitations_activation_mode_check
    check (activation_mode is null or activation_mode in ('existing_account', 'set_password')),
  constraint workspace_invitations_send_count_check check (send_count >= 0),
  constraint workspace_invitations_last_error_code_check
    check (last_error_code is null or char_length(last_error_code) <= 80),
  constraint workspace_invitations_created_member_fkey
    foreign key (workspace_id, created_by)
    references public.workspace_members(workspace_id, user_id),
  constraint workspace_invitations_accepted_member_fkey
    foreign key (workspace_id, accepted_by)
    references public.workspace_members(workspace_id, user_id),
  constraint workspace_invitations_cancelled_member_fkey
    foreign key (workspace_id, cancelled_by)
    references public.workspace_members(workspace_id, user_id),
  constraint workspace_invitations_lifecycle_check
    check (
      (status = 'pending' and accepted_at is null and accepted_by is null and cancelled_at is null and cancelled_by is null)
      or
      (status = 'accepted' and accepted_at is not null and accepted_by is not null and cancelled_at is null and cancelled_by is null)
      or
      (status = 'cancelled' and accepted_at is null and accepted_by is null and cancelled_at is not null and cancelled_by is not null)
    )
);

-- Expiry is derived, so an expired row deliberately remains the one global
-- unresolved invitation while status is pending. Its workspace may reuse and
-- resend it; cancellation or acceptance releases the email for a later invite.
create unique index workspace_invitations_pending_email_key
  on public.workspace_invitations (email)
  where status = 'pending';
create index workspace_invitations_workspace_status_created_idx
  on public.workspace_invitations (workspace_id, status, created_at desc);
create index workspace_invitations_auth_user_idx
  on public.workspace_invitations (auth_user_id)
  where status = 'pending';

create function app_private.set_workspace_invitation_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = clock_timestamp();
  return new;
end;
$$;

revoke all on function app_private.set_workspace_invitation_updated_at()
  from public, anon, authenticated;

create trigger set_workspace_invitation_updated_at
before update on public.workspace_invitations
for each row execute function app_private.set_workspace_invitation_updated_at();

create view public.workspace_invitation_lifecycle
with (security_invoker = true, security_barrier = true)
as
select
  invitation.*,
  case
    when invitation.status = 'pending' and invitation.expires_at <= clock_timestamp() then 'expired'
    else invitation.status
  end as lifecycle_status
from public.workspace_invitations as invitation;

alter table public.workspace_invitations enable row level security;
revoke all on table public.workspace_invitations from public, anon, authenticated;
revoke all on table public.workspace_invitation_lifecycle from public, anon, authenticated;
grant select on table public.workspace_invitations to authenticated;
grant select on table public.workspace_invitation_lifecycle to authenticated;

create policy "Active owners can view workspace invitations"
on public.workspace_invitations
for select
to authenticated
using (
  (select auth.uid()) is not null
  and app_private.current_workspace_role(workspace_id) = 'owner'
);

create function public.create_workspace_invitation(
  invitation_email text,
  invitation_display_name text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_workspace_id uuid;
  normalized_email text := lower(btrim(invitation_email));
  normalized_name text := btrim(invitation_display_name);
  invitation_id uuid;
begin
  select membership.workspace_id
  into caller_workspace_id
  from public.workspace_members as membership
  where membership.user_id = caller_id
    and membership.role = 'owner'
    and membership.status = 'active';

  if caller_workspace_id is null then
    raise insufficient_privilege using message = 'An active workspace owner is required.';
  end if;

  if normalized_email is null
    or char_length(normalized_email) not between 3 and 320
    or position('@' in normalized_email) <= 1
  then
    raise check_violation using message = 'Enter a valid employee email address.';
  end if;

  if normalized_name is null or char_length(normalized_name) not between 1 and 100 then
    raise check_violation using message = 'Display name must be between 1 and 100 characters.';
  end if;

  if exists (
    select 1 from auth.users as auth_user
    join public.workspace_members as membership on membership.user_id = auth_user.id
    where lower(auth_user.email) = normalized_email
  ) then
    raise exception using message = 'This email cannot be invited.';
  end if;

  select invitation.id
  into invitation_id
  from public.workspace_invitations as invitation
  where invitation.workspace_id = caller_workspace_id
    and invitation.email = normalized_email
    and invitation.status = 'pending';

  if invitation_id is not null then
    update public.workspace_invitations
    set display_name = normalized_name
    where id = invitation_id;
    return invitation_id;
  end if;

  begin
    insert into public.workspace_invitations (
      workspace_id,
      email,
      display_name,
      expires_at,
      created_by
    ) values (
      caller_workspace_id,
      normalized_email,
      normalized_name,
      clock_timestamp() + app_private.workspace_invitation_ttl(),
      caller_id
    )
    returning id into invitation_id;
  exception
    when unique_violation then
      -- A concurrent request in the same workspace is idempotent. A conflict
      -- owned by any other workspace is deliberately indistinguishable from
      -- an existing membership conflict.
      select invitation.id
      into invitation_id
      from public.workspace_invitations as invitation
      where invitation.workspace_id = caller_workspace_id
        and invitation.email = normalized_email
        and invitation.status = 'pending';

      if invitation_id is null then
        raise exception using message = 'This email cannot be invited.';
      end if;
  end;

  return invitation_id;
end;
$$;

create function public.cancel_workspace_invitation(target_invitation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed_rows integer;
begin
  update public.workspace_invitations as invitation
  set status = 'cancelled',
      cancelled_at = clock_timestamp(),
      cancelled_by = auth.uid()
  where invitation.id = target_invitation_id
    and invitation.status = 'pending'
    and app_private.current_workspace_role(invitation.workspace_id) = 'owner';

  get diagnostics changed_rows = row_count;
  return changed_rows = 1;
end;
$$;

create function public.get_current_workspace_invitation()
returns table (
  invitation_id uuid,
  workspace_id uuid,
  workspace_name text,
  email text,
  display_name text,
  lifecycle_status text,
  activation_mode text,
  expires_at timestamptz
)
language sql
security definer
set search_path = ''
as $$
  select
    invitation.id,
    invitation.workspace_id,
    workspace.name,
    invitation.email,
    invitation.display_name,
    case when invitation.expires_at <= clock_timestamp() then 'expired' else invitation.status end,
    invitation.activation_mode,
    invitation.expires_at
  from public.workspace_invitations as invitation
  join public.workspaces as workspace on workspace.id = invitation.workspace_id
  join auth.users as auth_user on auth_user.id = auth.uid()
  where invitation.status = 'pending'
    and invitation.email = lower(auth_user.email)
    and (invitation.auth_user_id is null or invitation.auth_user_id = auth.uid())
  order by invitation.created_at desc
  limit 1;
$$;

create function public.accept_workspace_invitation(target_invitation_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_email text;
  invitation public.workspace_invitations%rowtype;
begin
  if caller_id is null then
    raise insufficient_privilege using message = 'Authentication is required.';
  end if;

  select lower(auth_user.email)
  into caller_email
  from auth.users as auth_user
  where auth_user.id = caller_id;

  select *
  into invitation
  from public.workspace_invitations
  where id = target_invitation_id
  for update;

  if not found then
    return 'unavailable';
  end if;

  if invitation.status = 'accepted' then
    if invitation.accepted_by = caller_id
      and invitation.auth_user_id = caller_id
    then
      return 'already_accepted';
    end if;

    return 'unavailable';
  end if;

  if invitation.status <> 'pending' then
    return 'unavailable';
  end if;

  if invitation.activation_mode is null or invitation.auth_user_id is null then
    return 'unavailable';
  end if;

  if invitation.expires_at <= clock_timestamp() then
    return 'expired';
  end if;

  if caller_email is null
    or caller_email <> invitation.email
    or (invitation.auth_user_id is not null and invitation.auth_user_id <> caller_id)
  then
    return 'mismatch';
  end if;

  if exists (select 1 from public.workspace_members where user_id = caller_id) then
    return 'unavailable';
  end if;

  insert into public.workspace_members (
    workspace_id,
    user_id,
    role,
    display_name,
    status
  ) values (
    invitation.workspace_id,
    caller_id,
    'member',
    invitation.display_name,
    'active'
  );

  update public.workspace_invitations
  set status = 'accepted',
      auth_user_id = caller_id,
      accepted_at = clock_timestamp(),
      accepted_by = caller_id
  where id = target_invitation_id;

  return 'accepted';
end;
$$;

create function public.deactivate_workspace_member(target_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_workspace_id uuid;
  changed_rows integer;
begin
  select membership.workspace_id
  into caller_workspace_id
  from public.workspace_members as membership
  where membership.user_id = caller_id
    and membership.role = 'owner'
    and membership.status = 'active';

  if caller_workspace_id is null then
    raise insufficient_privilege using message = 'An active workspace owner is required.';
  end if;

  if not exists (
    select 1 from public.workspace_members
    where workspace_id = caller_workspace_id
      and user_id = target_user_id
      and role = 'member'
      and status = 'active'
  ) then
    return false;
  end if;

  update public.tasks
  set assigned_to = null
  where workspace_id = caller_workspace_id
    and assigned_to = target_user_id
    and status <> 'completed';

  update public.follow_ups
  set assigned_to = null
  where workspace_id = caller_workspace_id
    and assigned_to = target_user_id
    and status = 'pending';

  update public.workspace_members
  set status = 'deactivated',
      deactivated_at = clock_timestamp(),
      deactivated_by = caller_id
  where workspace_id = caller_workspace_id
    and user_id = target_user_id
    and role = 'member'
    and status = 'active';

  get diagnostics changed_rows = row_count;
  return changed_rows = 1;
end;
$$;

create function public.reactivate_workspace_member(target_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_workspace_id uuid;
  changed_rows integer;
begin
  select membership.workspace_id
  into caller_workspace_id
  from public.workspace_members as membership
  where membership.user_id = auth.uid()
    and membership.role = 'owner'
    and membership.status = 'active';

  if caller_workspace_id is null then
    raise insufficient_privilege using message = 'An active workspace owner is required.';
  end if;

  update public.workspace_members
  set status = 'active',
      deactivated_at = null,
      deactivated_by = null
  where workspace_id = caller_workspace_id
    and user_id = target_user_id
    and role = 'member'
    and status = 'deactivated';

  get diagnostics changed_rows = row_count;
  return changed_rows = 1;
end;
$$;

create function public.update_workspace_member_display_name(
  target_user_id uuid,
  new_display_name text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_workspace_id uuid;
  normalized_name text := btrim(new_display_name);
  changed_rows integer;
begin
  select membership.workspace_id
  into caller_workspace_id
  from public.workspace_members as membership
  where membership.user_id = auth.uid()
    and membership.role = 'owner'
    and membership.status = 'active';

  if caller_workspace_id is null then
    raise insufficient_privilege using message = 'An active workspace owner is required.';
  end if;

  if normalized_name is null or char_length(normalized_name) not between 1 and 100 then
    raise check_violation using message = 'Display name must be between 1 and 100 characters.';
  end if;

  update public.workspace_members
  set display_name = normalized_name
  where workspace_id = caller_workspace_id
    and user_id = target_user_id
    and role = 'member';

  get diagnostics changed_rows = row_count;
  return changed_rows = 1;
end;
$$;

create function public.record_workspace_invitation_send(
  target_invitation_id uuid,
  target_auth_user_id uuid,
  target_activation_mode text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed_rows integer;
begin
  update public.workspace_invitations
  set auth_user_id = target_auth_user_id,
      activation_mode = target_activation_mode,
      send_count = send_count + 1,
      last_sent_at = clock_timestamp(),
      last_error_code = null,
      expires_at = clock_timestamp() + app_private.workspace_invitation_ttl()
  where id = target_invitation_id
    and status = 'pending';

  get diagnostics changed_rows = row_count;
  return changed_rows = 1;
end;
$$;

create function public.record_workspace_invitation_error(
  target_invitation_id uuid,
  target_auth_user_id uuid,
  sanitized_error_code text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed_rows integer;
begin
  update public.workspace_invitations
  set auth_user_id = coalesce(target_auth_user_id, auth_user_id),
      last_error_code = left(nullif(btrim(sanitized_error_code), ''), 80)
  where id = target_invitation_id
    and status = 'pending';

  get diagnostics changed_rows = row_count;
  return changed_rows = 1;
end;
$$;

revoke all on function public.create_workspace_invitation(text, text) from public, anon;
revoke all on function public.cancel_workspace_invitation(uuid) from public, anon;
revoke all on function public.get_current_workspace_invitation() from public, anon;
revoke all on function public.accept_workspace_invitation(uuid) from public, anon;
revoke all on function public.deactivate_workspace_member(uuid) from public, anon;
revoke all on function public.reactivate_workspace_member(uuid) from public, anon;
revoke all on function public.update_workspace_member_display_name(uuid, text) from public, anon;
revoke all on function public.record_workspace_invitation_send(uuid, uuid, text)
  from public, anon, authenticated;
revoke all on function public.record_workspace_invitation_error(uuid, uuid, text)
  from public, anon, authenticated;

grant execute on function public.create_workspace_invitation(text, text) to authenticated;
grant execute on function public.cancel_workspace_invitation(uuid) to authenticated;
grant execute on function public.get_current_workspace_invitation() to authenticated;
grant execute on function public.accept_workspace_invitation(uuid) to authenticated;
grant execute on function public.deactivate_workspace_member(uuid) to authenticated;
grant execute on function public.reactivate_workspace_member(uuid) to authenticated;
grant execute on function public.update_workspace_member_display_name(uuid, text) to authenticated;
grant execute on function public.record_workspace_invitation_send(uuid, uuid, text) to service_role;
grant execute on function public.record_workspace_invitation_error(uuid, uuid, text) to service_role;

comment on column public.workspace_members.status is
  'Active members may access workspace data. Deactivated memberships are retained for history.';
comment on table public.workspace_invitations is
  'Employee invitation lifecycle only. Provider delivery telemetry is intentionally out of scope.';
comment on function app_private.workspace_invitation_ttl() is
  'Single Gate 7A invitation lifetime policy. expires_at remains authoritative for acceptance.';
comment on function app_private.assert_all_workspaces_have_owner() is
  'Migration integrity preflight: every existing workspace must retain at least one owner membership.';

commit;
