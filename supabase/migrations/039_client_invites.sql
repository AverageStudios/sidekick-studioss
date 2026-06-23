create table if not exists public.client_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  user_id uuid references public.profiles(user_id) on delete set null,
  workspace_id uuid references public.workspaces(id) on delete set null,
  invited_by uuid references public.profiles(user_id) on delete set null,
  role text not null default 'owner',
  tier text not null default 'done_for_you',
  status text not null default 'pending',
  invite_type text not null default 'invite',
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint client_invites_email_format_check check (email ~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' and char_length(email) <= 254),
  constraint client_invites_role_check check (role in ('owner')),
  constraint client_invites_tier_check check (tier in ('done_for_you')),
  constraint client_invites_status_check check (status in ('pending', 'sent', 'email_skipped', 'email_failed', 'accepted', 'revoked', 'expired')),
  constraint client_invites_invite_type_check check (invite_type in ('invite', 'recovery'))
);

create index if not exists client_invites_email_idx
  on public.client_invites(lower(email));

create index if not exists client_invites_workspace_id_idx
  on public.client_invites(workspace_id);

create index if not exists client_invites_user_id_idx
  on public.client_invites(user_id);

create index if not exists client_invites_status_idx
  on public.client_invites(status);

alter table public.client_invites enable row level security;

revoke all on public.client_invites from anon;
grant select, insert, update, delete on public.client_invites to authenticated;

drop policy if exists "client_invites_admin_select" on public.client_invites;
drop policy if exists "client_invites_admin_insert" on public.client_invites;
drop policy if exists "client_invites_admin_update" on public.client_invites;
drop policy if exists "client_invites_admin_delete" on public.client_invites;

create policy "client_invites_admin_select"
  on public.client_invites
  for select
  to authenticated
  using (public.is_admin());

create policy "client_invites_admin_insert"
  on public.client_invites
  for insert
  to authenticated
  with check (public.is_admin());

create policy "client_invites_admin_update"
  on public.client_invites
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "client_invites_admin_delete"
  on public.client_invites
  for delete
  to authenticated
  using (public.is_admin());

drop trigger if exists client_invites_updated_at on public.client_invites;
create trigger client_invites_updated_at
before update on public.client_invites
for each row execute function set_updated_at();

select pg_notify('pgrst', 'reload schema');
