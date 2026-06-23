-- Split admin client subaccount creation from user invites.
-- Workspaces remain the core tenant table; this table stores admin-only
-- subaccount metadata before any client user is invited.

create table if not exists public.client_subaccounts (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  tier text not null default 'done_for_you',
  status text not null default 'active',
  industry text,
  service_area text,
  notes text,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint client_subaccounts_tier_check check (tier in ('done_for_you')),
  constraint client_subaccounts_status_check check (status in ('active', 'inactive', 'requested', 'canceled')),
  constraint client_subaccounts_industry_length_check check (industry is null or char_length(industry) <= 120),
  constraint client_subaccounts_service_area_length_check check (service_area is null or char_length(service_area) <= 160),
  constraint client_subaccounts_notes_length_check check (notes is null or char_length(notes) <= 1000)
);

alter table public.client_subaccounts enable row level security;

revoke all on public.client_subaccounts from anon;
grant select, insert, update, delete on public.client_subaccounts to authenticated;

drop policy if exists "client_subaccounts_admin_select" on public.client_subaccounts;
drop policy if exists "client_subaccounts_admin_insert" on public.client_subaccounts;
drop policy if exists "client_subaccounts_admin_update" on public.client_subaccounts;
drop policy if exists "client_subaccounts_admin_delete" on public.client_subaccounts;

create policy "client_subaccounts_admin_select"
  on public.client_subaccounts
  for select
  to authenticated
  using (public.is_admin());

create policy "client_subaccounts_admin_insert"
  on public.client_subaccounts
  for insert
  to authenticated
  with check (public.is_admin());

create policy "client_subaccounts_admin_update"
  on public.client_subaccounts
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "client_subaccounts_admin_delete"
  on public.client_subaccounts
  for delete
  to authenticated
  using (public.is_admin());

drop trigger if exists client_subaccounts_updated_at on public.client_subaccounts;
create trigger client_subaccounts_updated_at
before update on public.client_subaccounts
for each row execute function set_updated_at();

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'client_invites_role_check'
      and conrelid = 'public.client_invites'::regclass
  ) then
    alter table public.client_invites drop constraint client_invites_role_check;
  end if;

  alter table public.client_invites
    add constraint client_invites_role_check
    check (role in ('owner', 'admin', 'member'));
exception
  when undefined_table then
    null;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'client_invites'
  ) then
    alter table public.client_invites enable row level security;
  end if;
end $$;

notify pgrst, 'reload schema';
