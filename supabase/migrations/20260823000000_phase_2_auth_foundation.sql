begin;

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_email text,
  contact_phone text,
  address text,
  timezone text not null default 'Asia/Singapore',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspaces_name_length
    check (char_length(btrim(name)) between 2 and 120),
  constraint workspaces_contact_email_length
    check (contact_email is null or char_length(contact_email) <= 320),
  constraint workspaces_contact_phone_length
    check (contact_phone is null or char_length(contact_phone) <= 40),
  constraint workspaces_address_length
    check (address is null or char_length(address) <= 500),
  constraint workspaces_timezone_length
    check (char_length(btrim(timezone)) between 1 and 100)
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id),
  constraint workspace_members_role_check check (role in ('owner', 'member')),
  constraint workspace_members_one_workspace_per_user unique (user_id)
);

create function public.set_workspace_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_workspace_updated_at
before update on public.workspaces
for each row execute function public.set_workspace_updated_at();

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

revoke all on table public.workspaces from anon, authenticated;
revoke all on table public.workspace_members from anon, authenticated;

grant select on table public.workspaces to authenticated;
grant update (name, contact_email, contact_phone, address, timezone)
  on table public.workspaces to authenticated;
grant select on table public.workspace_members to authenticated;

create policy "Users can view their own workspace membership"
on public.workspace_members
for select
to authenticated
using (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
);

create policy "Members can view their workspace"
on public.workspaces
for select
to authenticated
using (
  exists (
    select 1
    from public.workspace_members as membership
    where membership.workspace_id = workspaces.id
      and membership.user_id = (select auth.uid())
  )
);

create policy "Owners can update their workspace profile"
on public.workspaces
for update
to authenticated
using (
  exists (
    select 1
    from public.workspace_members as membership
    where membership.workspace_id = workspaces.id
      and membership.user_id = (select auth.uid())
      and membership.role = 'owner'
  )
)
with check (
  exists (
    select 1
    from public.workspace_members as membership
    where membership.workspace_id = workspaces.id
      and membership.user_id = (select auth.uid())
      and membership.role = 'owner'
  )
);

comment on table public.workspaces is
  'The single configured business profile for this deployment.';
comment on table public.workspace_members is
  'Links authenticated users to the configured workspace. Phase 2 permits one workspace per user.';

commit;
