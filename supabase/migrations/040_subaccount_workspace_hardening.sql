-- Convert manual workspace creation to the admin/client-subaccount model.
-- Normal Self-Serve and Done-For-You workspace provisioning happens through
-- trusted server-side service-role paths after auth/billing/invite checks.

alter table if exists public.workspaces enable row level security;

drop policy if exists "workspace owners can manage workspaces" on public.workspaces;
drop policy if exists "workspaces_owner_insert" on public.workspaces;
drop policy if exists "workspaces_admin_insert" on public.workspaces;

create policy "workspaces_admin_insert"
  on public.workspaces
  for insert
  to authenticated
  with check (public.is_admin());

notify pgrst, 'reload schema';
