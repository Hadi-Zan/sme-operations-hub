begin;

-- This function is the official Supabase auto-enable-RLS event-trigger recipe.
-- The ensure_rls event trigger invokes it as its postgres owner; no API role
-- needs direct EXECUTE access to the SECURITY DEFINER function.
revoke execute on function public.rls_auto_enable()
  from public, anon, authenticated, service_role;

-- Cover the remaining composite membership foreign keys. These indexes bound
-- the work required when referenced membership rows are updated or deleted and
-- also support audit/member-history lookups as the workspace grows.
create index customers_workspace_created_by_idx
  on public.customers (workspace_id, created_by);

create index follow_ups_workspace_completed_by_idx
  on public.follow_ups (workspace_id, completed_by);

create index follow_ups_workspace_created_by_idx
  on public.follow_ups (workspace_id, created_by);

create index inventory_items_workspace_created_by_idx
  on public.inventory_items (workspace_id, created_by);

create index inventory_movements_workspace_recorded_by_idx
  on public.inventory_movements (workspace_id, recorded_by);

create index tasks_workspace_created_by_idx
  on public.tasks (workspace_id, created_by);

create index workspace_invitations_workspace_accepted_by_idx
  on public.workspace_invitations (workspace_id, accepted_by);

create index workspace_invitations_workspace_cancelled_by_idx
  on public.workspace_invitations (workspace_id, cancelled_by);

create index workspace_invitations_workspace_created_by_idx
  on public.workspace_invitations (workspace_id, created_by);

create index workspace_members_workspace_deactivated_by_idx
  on public.workspace_members (workspace_id, deactivated_by);

-- PostgreSQL ORs permissive policies. Combining these two predicates preserves
-- the exact model: active members can read their workspace directory, while a
-- deactivated user can still read only their own membership state.
drop policy "Members can view their workspace member directory"
  on public.workspace_members;
drop policy "Users can view their own workspace membership"
  on public.workspace_members;

create policy "Users can view permitted workspace memberships"
on public.workspace_members
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (
    user_id = (select auth.uid())
    or app_private.current_workspace_role(workspace_id) in ('owner', 'member')
  )
);

comment on function public.rls_auto_enable() is
  'Supabase ensure_rls event-trigger function. Direct API execution is intentionally revoked.';

commit;
