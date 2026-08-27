begin;

reset role;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{}', true);

insert into auth.users (id, email) values
  ('71000000-0000-0000-0000-000000000001', 'owner-one@phase7a.test'),
  ('71000000-0000-0000-0000-000000000002', 'owner-two@phase7a.test'),
  ('71000000-0000-0000-0000-000000000003', 'employee@phase7a.test'),
  ('71000000-0000-0000-0000-000000000004', 'invitee@phase7a.test'),
  ('71000000-0000-0000-0000-000000000005', 'final-delete@phase7a.test'),
  ('71000000-0000-0000-0000-000000000006', 'workspace-cascade@phase7a.test'),
  ('71000000-0000-0000-0000-000000000007', 'expired-invite@phase7a.test'),
  ('71000000-0000-0000-0000-000000000008', 'cascade-employee@phase7a.test');

insert into public.workspaces (id, name) values
  ('71000000-0000-0000-0000-000000000101', 'Phase 7A primary workspace'),
  ('71000000-0000-0000-0000-000000000102', 'Final owner delete workspace'),
  ('71000000-0000-0000-0000-000000000103', 'Full cascade workspace');

insert into public.workspace_members (workspace_id, user_id, role, display_name) values
  ('71000000-0000-0000-0000-000000000101', '71000000-0000-0000-0000-000000000001', 'owner', 'Owner One'),
  ('71000000-0000-0000-0000-000000000101', '71000000-0000-0000-0000-000000000002', 'owner', 'Owner Two'),
  ('71000000-0000-0000-0000-000000000101', '71000000-0000-0000-0000-000000000003', 'member', 'Employee'),
  ('71000000-0000-0000-0000-000000000102', '71000000-0000-0000-0000-000000000005', 'owner', 'Final Delete Owner'),
  ('71000000-0000-0000-0000-000000000103', '71000000-0000-0000-0000-000000000006', 'owner', 'Cascade Owner');

insert into public.workspace_members (
  workspace_id,
  user_id,
  role,
  display_name,
  status,
  deactivated_at,
  deactivated_by
) values (
  '71000000-0000-0000-0000-000000000103',
  '71000000-0000-0000-0000-000000000008',
  'member',
  'Cascade Employee',
  'deactivated',
  clock_timestamp(),
  '71000000-0000-0000-0000-000000000006'
);

-- Final active owner deletion, deactivation, and demotion are all rejected.
do $$
begin
  begin
    delete from public.workspace_members
    where workspace_id = '71000000-0000-0000-0000-000000000102'
      and user_id = '71000000-0000-0000-0000-000000000005';
    raise exception 'Phase 7A test failed: final owner deletion succeeded';
  exception when check_violation then null;
  end;

  begin
    update public.workspace_members
    set status = 'deactivated',
        deactivated_at = clock_timestamp(),
        deactivated_by = '71000000-0000-0000-0000-000000000005'
    where workspace_id = '71000000-0000-0000-0000-000000000102'
      and user_id = '71000000-0000-0000-0000-000000000005';
    raise exception 'Phase 7A test failed: final owner deactivation succeeded';
  exception when check_violation then null;
  end;

  begin
    update public.workspace_members
    set role = 'member'
    where workspace_id = '71000000-0000-0000-0000-000000000102'
      and user_id = '71000000-0000-0000-0000-000000000005';
    raise exception 'Phase 7A test failed: final owner demotion succeeded';
  exception when check_violation then null;
  end;
end;
$$;

-- A second active owner permits one owner to be removed.
delete from public.workspace_members
where workspace_id = '71000000-0000-0000-0000-000000000101'
  and user_id = '71000000-0000-0000-0000-000000000002';

do $$
begin
  if exists (
    select 1 from public.workspace_members
    where workspace_id = '71000000-0000-0000-0000-000000000101'
      and user_id = '71000000-0000-0000-0000-000000000002'
  ) then
    raise exception 'Phase 7A test failed: removable second owner was retained';
  end if;
end;
$$;

-- Restore the second owner so Team RPC tests can prove that neither the
-- current owner nor another owner can be renamed through employee management.
insert into public.workspace_members (workspace_id, user_id, role, display_name)
values (
  '71000000-0000-0000-0000-000000000101',
  '71000000-0000-0000-0000-000000000002',
  'owner',
  'Owner Two'
);

-- Auth-user deletion/cascade cannot remove the final owner while its workspace remains.
do $$
begin
  begin
    delete from auth.users
    where id = '71000000-0000-0000-0000-000000000005';
    raise exception 'Phase 7A test failed: Auth cascade removed the final owner';
  exception when check_violation then null;
  end;

  if not exists (
    select 1 from auth.users where id = '71000000-0000-0000-0000-000000000005'
  ) or not exists (
    select 1 from public.workspace_members
    where workspace_id = '71000000-0000-0000-0000-000000000102'
      and user_id = '71000000-0000-0000-0000-000000000005'
  ) then
    raise exception 'Phase 7A test failed: failed Auth cascade was not atomic';
  end if;
end;
$$;

-- Intentional deletion of the complete workspace must retain existing cascades.
delete from public.workspaces
where id = '71000000-0000-0000-0000-000000000103';

do $$
begin
  if exists (
    select 1 from public.workspace_members
    where workspace_id = '71000000-0000-0000-0000-000000000103'
  ) then
    raise exception 'Phase 7A test failed: complete workspace deletion did not cascade';
  end if;
end;
$$;

-- Seed work so deactivation can prove open assignments are removed while
-- completed assignment and audit references survive.
insert into public.tasks (
  id, workspace_id, title, status, assigned_to, created_by
) values
  ('71000000-0000-0000-0000-000000000201', '71000000-0000-0000-0000-000000000101', 'Open employee task', 'todo', '71000000-0000-0000-0000-000000000003', '71000000-0000-0000-0000-000000000001'),
  ('71000000-0000-0000-0000-000000000202', '71000000-0000-0000-0000-000000000101', 'Completed employee task', 'completed', '71000000-0000-0000-0000-000000000003', '71000000-0000-0000-0000-000000000003');

insert into public.customers (id, workspace_id, name, created_by)
values ('71000000-0000-0000-0000-000000000301', '71000000-0000-0000-0000-000000000101', 'Phase 7A Customer', '71000000-0000-0000-0000-000000000001');

insert into public.follow_ups (
  id, workspace_id, customer_id, title, due_date, assigned_to, status,
  outcome, created_by, completed_by, completed_at
) values
  ('71000000-0000-0000-0000-000000000401', '71000000-0000-0000-0000-000000000101', '71000000-0000-0000-0000-000000000301', 'Pending employee follow-up', current_date, '71000000-0000-0000-0000-000000000003', 'pending', null, '71000000-0000-0000-0000-000000000001', null, null),
  ('71000000-0000-0000-0000-000000000402', '71000000-0000-0000-0000-000000000101', '71000000-0000-0000-0000-000000000301', 'Completed employee follow-up', current_date, '71000000-0000-0000-0000-000000000003', 'completed', 'Historical outcome', '71000000-0000-0000-0000-000000000003', '71000000-0000-0000-0000-000000000003', clock_timestamp());

do $$
begin
  begin
    update public.workspace_members
    set status = 'deactivated',
        deactivated_at = clock_timestamp(),
        deactivated_by = '71000000-0000-0000-0000-000000000005'
    where workspace_id = '71000000-0000-0000-0000-000000000101'
      and user_id = '71000000-0000-0000-0000-000000000003';
    raise exception 'Phase 7A test failed: foreign-workspace deactivation actor was stored';
  exception when foreign_key_violation then null;
  end;

  begin
    update public.workspace_members
    set status = 'deactivated',
        deactivated_at = clock_timestamp(),
        deactivated_by = 'ffffffff-ffff-ffff-ffff-ffffffffffff'
    where workspace_id = '71000000-0000-0000-0000-000000000101'
      and user_id = '71000000-0000-0000-0000-000000000003';
    raise exception 'Phase 7A test failed: nonexistent deactivation actor was stored';
  exception when foreign_key_violation then null;
  end;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '71000000-0000-0000-0000-000000000001', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"71000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

do $$
begin
  if not public.deactivate_workspace_member('71000000-0000-0000-0000-000000000003') then
    raise exception 'Phase 7A test failed: owner could not deactivate employee';
  end if;

  if not exists (
    select 1
    from public.workspace_members
    where workspace_id = '71000000-0000-0000-0000-000000000101'
      and user_id = '71000000-0000-0000-0000-000000000003'
      and status = 'deactivated'
      and deactivated_by = '71000000-0000-0000-0000-000000000001'
  ) then
    raise exception 'Phase 7A test failed: valid same-workspace deactivation actor was not retained';
  end if;

  if exists (
    select 1 from public.tasks
    where id = '71000000-0000-0000-0000-000000000201' and assigned_to is not null
  ) or exists (
    select 1 from public.follow_ups
    where id = '71000000-0000-0000-0000-000000000401' and assigned_to is not null
  ) then
    raise exception 'Phase 7A test failed: open work remained assigned after deactivation';
  end if;

  if not exists (
    select 1 from public.tasks
    where id = '71000000-0000-0000-0000-000000000202'
      and assigned_to = '71000000-0000-0000-0000-000000000003'
      and created_by = '71000000-0000-0000-0000-000000000003'
  ) or not exists (
    select 1 from public.follow_ups
    where id = '71000000-0000-0000-0000-000000000402'
      and assigned_to = '71000000-0000-0000-0000-000000000003'
      and completed_by = '71000000-0000-0000-0000-000000000003'
  ) then
    raise exception 'Phase 7A test failed: completed history was not preserved';
  end if;

  if not public.reactivate_workspace_member('71000000-0000-0000-0000-000000000003') then
    raise exception 'Phase 7A test failed: owner could not reactivate employee';
  end if;

  if exists (
    select 1 from public.tasks
    where id = '71000000-0000-0000-0000-000000000201' and assigned_to is not null
  ) or exists (
    select 1 from public.follow_ups
    where id = '71000000-0000-0000-0000-000000000401' and assigned_to is not null
  ) then
    raise exception 'Phase 7A test failed: reactivation restored old assignments';
  end if;

  if not public.update_workspace_member_display_name(
    '71000000-0000-0000-0000-000000000003',
    'Renamed Employee'
  ) then
    raise exception 'Phase 7A test failed: owner could not edit employee display name';
  end if;

  if public.update_workspace_member_display_name(
    '71000000-0000-0000-0000-000000000001',
    'Renamed Current Owner'
  ) then
    raise exception 'Phase 7A test failed: Team RPC renamed the current owner';
  end if;

  if public.update_workspace_member_display_name(
    '71000000-0000-0000-0000-000000000002',
    'Renamed Other Owner'
  ) then
    raise exception 'Phase 7A test failed: Team RPC renamed another owner';
  end if;

  if public.update_workspace_member_display_name(
    '71000000-0000-0000-0000-000000000005',
    'Renamed Cross Workspace Owner'
  ) then
    raise exception 'Phase 7A test failed: Team RPC renamed a cross-workspace user';
  end if;

  if exists (
    select 1 from public.workspace_members
    where user_id = '71000000-0000-0000-0000-000000000001'
      and display_name <> 'Owner One'
  ) or exists (
    select 1 from public.workspace_members
    where user_id = '71000000-0000-0000-0000-000000000002'
      and display_name <> 'Owner Two'
  ) then
    raise exception 'Phase 7A test failed: an owner display name changed through the Team RPC';
  end if;

  if not public.deactivate_workspace_member('71000000-0000-0000-0000-000000000003') then
    raise exception 'Phase 7A test failed: employee could not be deactivated again';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '71000000-0000-0000-0000-000000000003', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"71000000-0000-0000-0000-000000000003","role":"authenticated"}',
  true
);

do $$
declare
  visible_workspaces integer;
  visible_tasks integer;
begin
  select count(*) into visible_workspaces from public.workspaces;
  select count(*) into visible_tasks from public.tasks;

  if app_private.current_workspace_role('71000000-0000-0000-0000-000000000101') is not null
    or visible_workspaces <> 0
    or visible_tasks <> 0
  then
    raise exception 'Phase 7A test failed: deactivated member retained workspace data access';
  end if;

  if not exists (
    select 1 from public.workspace_members
    where user_id = '71000000-0000-0000-0000-000000000003'
      and status = 'deactivated'
  ) then
    raise exception 'Phase 7A test failed: deactivated member cannot identify account state';
  end if;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{}', true);
set local role authenticated;
select set_config('request.jwt.claim.sub', '71000000-0000-0000-0000-000000000001', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"71000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

do $$
declare
  assignment_error_message text;
begin
  begin
    insert into public.tasks (
      workspace_id, title, assigned_to, created_by
    ) values (
      '71000000-0000-0000-0000-000000000101',
      'Inserted inactive assignment',
      '71000000-0000-0000-0000-000000000003',
      '71000000-0000-0000-0000-000000000001'
    );
    raise exception 'Phase 7A test failed: INSERT assigned a task to an inactive member';
  exception
    when check_violation then
      get stacked diagnostics assignment_error_message = message_text;
      if assignment_error_message <> 'Work can only be assigned to an active workspace member.' then
        raise exception 'Phase 7A test failed: task INSERT reached an unexpected check: %',
          assignment_error_message;
      end if;
  end;

  begin
    insert into public.follow_ups (
      workspace_id, customer_id, title, due_date, assigned_to, created_by
    ) values (
      '71000000-0000-0000-0000-000000000101',
      '71000000-0000-0000-0000-000000000301',
      'Inserted inactive follow-up assignment',
      current_date,
      '71000000-0000-0000-0000-000000000003',
      '71000000-0000-0000-0000-000000000001'
    );
    raise exception 'Phase 7A test failed: INSERT assigned a follow-up to an inactive member';
  exception
    when check_violation then
      get stacked diagnostics assignment_error_message = message_text;
      if assignment_error_message <> 'Work can only be assigned to an active workspace member.' then
        raise exception 'Phase 7A test failed: follow-up INSERT reached an unexpected check: %',
          assignment_error_message;
      end if;
  end;

  begin
    update public.tasks
    set assigned_to = '71000000-0000-0000-0000-000000000003'
    where id = '71000000-0000-0000-0000-000000000201';
    raise exception 'Phase 7A test failed: inactive member received a new task assignment';
  exception
    when check_violation then
      get stacked diagnostics assignment_error_message = message_text;
      if assignment_error_message <> 'Work can only be assigned to an active workspace member.' then
        raise exception 'Phase 7A test failed: task UPDATE reached an unexpected check: %',
          assignment_error_message;
      end if;
  end;

  begin
    update public.follow_ups
    set assigned_to = '71000000-0000-0000-0000-000000000003'
    where id = '71000000-0000-0000-0000-000000000401';
    raise exception 'Phase 7A test failed: inactive member received a new follow-up assignment';
  exception
    when check_violation then
      get stacked diagnostics assignment_error_message = message_text;
      if assignment_error_message <> 'Work can only be assigned to an active workspace member.' then
        raise exception 'Phase 7A test failed: follow-up UPDATE reached an unexpected check: %',
          assignment_error_message;
      end if;
  end;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{}', true);
set local role authenticated;
select set_config('request.jwt.claim.sub', '71000000-0000-0000-0000-000000000001', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"71000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

do $$
declare
  invitation_id uuid;
  duplicate_invitation_id uuid;
  cancellation_id uuid;
  initial_expiry timestamptz;
  conflict_message text;
begin
  invitation_id := public.create_workspace_invitation('INVITEE@phase7a.test', 'Invited Employee');
  duplicate_invitation_id := public.create_workspace_invitation(
    'invitee@phase7a.test',
    'Invited Employee Updated'
  );

  if duplicate_invitation_id <> invitation_id then
    raise exception 'Phase 7A test failed: same-workspace pending invitation was not idempotent';
  end if;

  select expires_at into initial_expiry from public.workspace_invitations where id = invitation_id;

  if initial_expiry not between clock_timestamp() + interval '23 hours 59 minutes'
    and clock_timestamp() + interval '24 hours 1 minute'
  then
    raise exception 'Phase 7A test failed: centralized initial invitation TTL was not used';
  end if;

  perform set_config('phase7a.invitation_id', invitation_id::text, true);

  cancellation_id := public.create_workspace_invitation(
    'cancelled-invite@phase7a.test',
    'Cancelled Invitee'
  );
  if not public.cancel_workspace_invitation(cancellation_id) then
    raise exception 'Phase 7A test failed: owner could not cancel a pending invitation';
  end if;
  if not exists (
    select 1 from public.workspace_invitation_lifecycle
    where id = cancellation_id and lifecycle_status = 'cancelled'
  ) then
    raise exception 'Phase 7A test failed: cancellation lifecycle was not retained';
  end if;

  if public.accept_workspace_invitation(cancellation_id) <> 'unavailable' then
    raise exception 'Phase 7A test failed: a cancelled invitation became consumable';
  end if;

  begin
    perform public.create_workspace_invitation(
      'final-delete@phase7a.test',
      'Existing Foreign Account'
    );
    raise exception 'Phase 7A test failed: existing cross-workspace account was invited';
  exception
    when raise_exception then
      get stacked diagnostics conflict_message = message_text;
      if conflict_message <> 'This email cannot be invited.' then
        raise exception 'Phase 7A test failed: existing-account conflict was not generic';
      end if;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', '71000000-0000-0000-0000-000000000005', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"71000000-0000-0000-0000-000000000005","role":"authenticated"}',
  true
);

do $$
begin
  perform public.create_workspace_invitation(
    'shared-pending@phase7a.test',
    'Foreign Pending Invite'
  );
end;
$$;

select set_config('request.jwt.claim.sub', '71000000-0000-0000-0000-000000000001', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"71000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

do $$
declare
  conflict_message text;
begin
  begin
    perform public.create_workspace_invitation(
      'shared-pending@phase7a.test',
      'Local Pending Invite'
    );
    raise exception 'Phase 7A test failed: foreign pending email was invited';
  exception
    when raise_exception then
      get stacked diagnostics conflict_message = message_text;
      if conflict_message <> 'This email cannot be invited.' then
        raise exception 'Phase 7A test failed: pending invitation conflict was not generic';
      end if;
  end;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
set local role service_role;

do $$
declare
  invitation_id uuid;
begin
  invitation_id := current_setting('phase7a.invitation_id', true)::uuid;

  if has_table_privilege(current_user, 'public.workspace_invitations', 'SELECT') then
    raise exception 'Phase 7A test failed: service role received direct invitation table SELECT';
  end if;

  begin
    perform 1 from public.workspace_invitations limit 1;
    raise exception 'Phase 7A test failed: service role directly selected workspace invitations';
  exception when insufficient_privilege then null;
  end;

  if not has_function_privilege(
    current_user,
    'public.record_workspace_invitation_send(uuid,uuid,text)',
    'EXECUTE'
  ) or not has_function_privilege(
    current_user,
    'public.record_workspace_invitation_error(uuid,uuid,text)',
    'EXECUTE'
  ) then
    raise exception 'Phase 7A test failed: service role cannot execute invitation recording RPCs';
  end if;

  if not public.record_workspace_invitation_error(
    invitation_id,
    '71000000-0000-0000-0000-000000000004',
    'test_immediate_failure'
  ) then
    raise exception 'Phase 7A test failed: service invitation error was not recorded';
  end if;

  if not public.record_workspace_invitation_send(
    invitation_id,
    '71000000-0000-0000-0000-000000000004',
    'set_password'
  ) then
    raise exception 'Phase 7A test failed: service send state was not recorded';
  end if;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{}', true);
set local role authenticated;
select set_config('request.jwt.claim.sub', '71000000-0000-0000-0000-000000000001', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"71000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

do $$
declare
  invitation_id uuid := current_setting('phase7a.invitation_id', true)::uuid;
begin
  if not exists (
    select 1
    from public.workspace_invitations
    where id = invitation_id
      and auth_user_id = '71000000-0000-0000-0000-000000000004'
      and activation_mode = 'set_password'
      and send_count = 1
      and last_sent_at is not null
      and last_error_code is null
      and expires_at > clock_timestamp()
  ) then
    raise exception 'Phase 7A test failed: owner could not verify service recording effects';
  end if;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{}', true);
set local role authenticated;
select set_config('request.jwt.claim.sub', '71000000-0000-0000-0000-000000000004', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"71000000-0000-0000-0000-000000000004","role":"authenticated"}',
  true
);

do $$
declare
  invitation_id uuid;
  membership_count integer;
begin
  select result.invitation_id
  into invitation_id
  from public.get_current_workspace_invitation() as result;

  if public.accept_workspace_invitation(invitation_id) <> 'accepted' then
    raise exception 'Phase 7A test failed: matching valid invitation was not accepted';
  end if;

  if public.accept_workspace_invitation(invitation_id) <> 'already_accepted' then
    raise exception 'Phase 7A test failed: repeated same-user acceptance was not idempotent';
  end if;

  select count(*)
  into membership_count
  from public.workspace_members
  where user_id = '71000000-0000-0000-0000-000000000004';

  if membership_count <> 1 then
    raise exception 'Phase 7A test failed: repeated acceptance created duplicate membership';
  end if;

  if not exists (
    select 1 from public.workspace_members
    where user_id = '71000000-0000-0000-0000-000000000004'
      and role = 'member' and status = 'active'
  ) then
    raise exception 'Phase 7A test failed: acceptance did not create active member';
  end if;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{}', true);
set local role authenticated;
select set_config('request.jwt.claim.sub', '71000000-0000-0000-0000-000000000007', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"71000000-0000-0000-0000-000000000007","role":"authenticated"}',
  true
);

do $$
declare
  accepted_invitation_id uuid;
begin
  select id
  into accepted_invitation_id
  from public.workspace_invitations
  where email = 'invitee@phase7a.test';

  if public.accept_workspace_invitation(accepted_invitation_id) <> 'unavailable' then
    raise exception 'Phase 7A test failed: accepted invitation was consumable by another user';
  end if;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{}', true);

insert into public.workspace_invitations (
  workspace_id, email, display_name, expires_at, created_by, auth_user_id, activation_mode
) values (
  '71000000-0000-0000-0000-000000000101',
  'expired-invite@phase7a.test',
  'Expired Invitee',
  clock_timestamp() - interval '1 minute',
  '71000000-0000-0000-0000-000000000001',
  '71000000-0000-0000-0000-000000000007',
  'set_password'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '71000000-0000-0000-0000-000000000007', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"71000000-0000-0000-0000-000000000007","role":"authenticated"}',
  true
);

do $$
declare
  invitation_id uuid;
  effective_status text;
begin
  select result.invitation_id, result.lifecycle_status into invitation_id, effective_status
  from public.get_current_workspace_invitation() as result;
  if effective_status <> 'expired' then
    raise exception 'Phase 7A test failed: pending expired invitation was not derived as expired';
  end if;
  if public.accept_workspace_invitation(invitation_id) <> 'expired' then
    raise exception 'Phase 7A test failed: authoritative database expiry did not block acceptance';
  end if;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{}', true);
set local role authenticated;
select set_config('request.jwt.claim.sub', '71000000-0000-0000-0000-000000000001', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"71000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

do $$
declare
  expired_invitation_id uuid;
  reused_invitation_id uuid;
begin
  select id
  into expired_invitation_id
  from public.workspace_invitation_lifecycle
  where email = 'expired-invite@phase7a.test'
    and status = 'pending'
    and lifecycle_status = 'expired';

  reused_invitation_id := public.create_workspace_invitation(
    'expired-invite@phase7a.test',
    'Expired Invitee Reused'
  );

  if reused_invitation_id is distinct from expired_invitation_id then
    raise exception 'Phase 7A test failed: same workspace did not reuse its expired pending invitation';
  end if;

  if not exists (
    select 1
    from public.workspace_invitation_lifecycle
    where id = expired_invitation_id
      and status = 'pending'
      and lifecycle_status = 'expired'
  ) then
    raise exception 'Phase 7A test failed: expired invitation stopped occupying its pending row';
  end if;

  perform set_config('phase7a.expired_invitation_id', expired_invitation_id::text, true);
end;
$$;

select set_config('request.jwt.claim.sub', '71000000-0000-0000-0000-000000000005', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"71000000-0000-0000-0000-000000000005","role":"authenticated"}',
  true
);

do $$
declare
  conflict_message text;
begin
  begin
    perform public.create_workspace_invitation(
      'expired-invite@phase7a.test',
      'Competing Expired Invite'
    );
    raise exception 'Phase 7A test failed: another workspace reused a foreign expired invitation';
  exception
    when raise_exception then
      get stacked diagnostics conflict_message = message_text;
      if conflict_message <> 'This email cannot be invited.' then
        raise exception 'Phase 7A test failed: expired invitation lock conflict was not generic';
      end if;
  end;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
set local role service_role;

do $$
declare
  expired_invitation_id uuid;
begin
  expired_invitation_id := current_setting(
    'phase7a.expired_invitation_id',
    true
  )::uuid;

  if not public.record_workspace_invitation_send(
    expired_invitation_id,
    '71000000-0000-0000-0000-000000000007',
    'set_password'
  ) then
    raise exception 'Phase 7A test failed: expired invitation could not be resent';
  end if;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{}', true);
set local role authenticated;
select set_config('request.jwt.claim.sub', '71000000-0000-0000-0000-000000000001', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"71000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

do $$
declare
  expired_invitation_id uuid;
begin
  expired_invitation_id := current_setting(
    'phase7a.expired_invitation_id',
    true
  )::uuid;

  if not exists (
    select 1
    from public.workspace_invitation_lifecycle
    where id = expired_invitation_id
      and status = 'pending'
      and lifecycle_status = 'pending'
      and send_count = 1
      and last_sent_at is not null
      and last_error_code is null
  ) then
    raise exception 'Phase 7A test failed: owner could not verify expired invitation resend';
  end if;

  if not public.cancel_workspace_invitation(expired_invitation_id) then
    raise exception 'Phase 7A test failed: expired invitation could not be cancelled after resend';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', '71000000-0000-0000-0000-000000000005', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"71000000-0000-0000-0000-000000000005","role":"authenticated"}',
  true
);

do $$
declare
  released_invitation_id uuid;
begin
  released_invitation_id := public.create_workspace_invitation(
    'expired-invite@phase7a.test',
    'Invitation After Cancellation'
  );

  if released_invitation_id is null then
    raise exception 'Phase 7A test failed: cancellation did not release the invitation email';
  end if;
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{}', true);

do $$
begin
  if not exists (
    select 1
    from public.workspace_invitations
    where email = 'expired-invite@phase7a.test'
      and workspace_id = '71000000-0000-0000-0000-000000000101'
      and status = 'cancelled'
  ) or not exists (
    select 1
    from public.workspace_invitations
    where email = 'expired-invite@phase7a.test'
      and workspace_id = '71000000-0000-0000-0000-000000000102'
      and status = 'pending'
  ) then
    raise exception 'Phase 7A test failed: cancellation did not transfer the email lock cleanly';
  end if;
end;
$$;

do $$
declare
  invitation_function_definition text;
  preflight_message text;
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'workspaces'
      and policyname in ('Members can view their workspace', 'Owners can update their workspace profile')
  ) then
    raise exception 'Phase 7A test failed: Phase 2 direct-membership policies remain installed';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'workspaces'
      and policyname = 'Active members can view their workspace'
  ) then
    raise exception 'Phase 7A test failed: active workspace policy is missing';
  end if;

  if not has_function_privilege(
    'authenticated',
    'app_private.current_workspace_role(uuid)',
    'EXECUTE'
  ) or has_function_privilege(
    'anon',
    'app_private.current_workspace_role(uuid)',
    'EXECUTE'
  ) then
    raise exception 'Phase 7A test failed: current workspace role privileges changed';
  end if;

  if exists (
    select 1
    from pg_proc as procedure
    cross join lateral pg_catalog.aclexplode(
      coalesce(
        procedure.proacl,
        pg_catalog.acldefault('f', procedure.proowner)
      )
    ) as privilege
    where procedure.oid = 'app_private.current_workspace_role(uuid)'::regprocedure
      and privilege.grantee = 0
      and privilege.privilege_type = 'EXECUTE'
  ) then
    raise exception 'Phase 7A test failed: PUBLIC can execute current workspace role';
  end if;

  if has_function_privilege('anon', 'public.create_workspace_invitation(text,text)', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.record_workspace_invitation_send(uuid,uuid,text)', 'EXECUTE')
  then
    raise exception 'Phase 7A test failed: invitation function grants are too broad';
  end if;

  select lower(pg_get_functiondef(
    'public.create_workspace_invitation(text,text)'::regprocedure
  )) into invitation_function_definition;

  if position('when unique_violation' in invitation_function_definition) = 0
    or position('this email cannot be invited.' in invitation_function_definition) = 0
  then
    raise exception 'Phase 7A test failed: unique invitation races are not sanitized';
  end if;

  if to_regprocedure('app_private.assert_all_workspaces_have_owner()') is null then
    raise exception 'Phase 7A test failed: owner preflight function is missing';
  end if;

  insert into public.workspaces (id, name)
  values ('71000000-0000-0000-0000-000000000104', 'Ownerless preflight workspace');

  begin
    perform app_private.assert_all_workspaces_have_owner();
    raise exception 'Phase 7A test failed: ownerless workspace passed migration preflight';
  exception
    when raise_exception then
      get stacked diagnostics preflight_message = message_text;
      if preflight_message not like 'Phase 7A preflight failed:%has no owner membership.' then
        raise exception 'Phase 7A test failed: ownerless preflight message was unclear';
      end if;
  end;

  delete from public.workspaces
  where id = '71000000-0000-0000-0000-000000000104';

  perform app_private.assert_all_workspaces_have_owner();
end;
$$;

rollback;
