create or replace function public.can_manage_workspace(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select coalesce(
    public.is_admin()
    or exists (
      select 1
      from public.workspaces w
      where w.id = target_workspace_id
        and w.owner_user_id = auth.uid()
    )
    or exists (
      select 1
      from public.workspace_memberships wm
      where wm.workspace_id = target_workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'admin')
    ),
    false
  );
$$;

revoke all on function public.can_manage_workspace(uuid) from public;
grant execute on function public.can_manage_workspace(uuid) to authenticated, service_role;

create table if not exists public.account_plans (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  tier text not null default 'self_serve',
  status text not null default 'active',
  source text not null default 'stripe',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_plans_tier_check check (tier in ('self_serve', 'done_for_you')),
  constraint account_plans_status_check check (status in ('requested', 'trialing', 'active', 'canceled', 'inactive')),
  constraint account_plans_source_check check (source in ('stripe', 'manual', 'admin'))
);

create index if not exists account_plans_tier_status_idx
  on public.account_plans(tier, status);

alter table public.account_plans enable row level security;

revoke all on public.account_plans from anon;
grant select on public.account_plans to authenticated;

drop policy if exists "account_plans_select_self_or_admin" on public.account_plans;
drop policy if exists "account_plans_admin_manage" on public.account_plans;

create policy "account_plans_select_self_or_admin"
  on public.account_plans
  for select
  to authenticated
  using (auth.uid() = user_id or public.is_admin());

create policy "account_plans_admin_manage"
  on public.account_plans
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists account_plans_updated_at on public.account_plans;
create trigger account_plans_updated_at
before update on public.account_plans
for each row execute function set_updated_at();

create table if not exists public.workspace_branding (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  business_name text,
  logo_url text,
  primary_color text,
  accent_color text,
  website_url text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspace_branding_business_name_length_check check (business_name is null or char_length(business_name) <= 160),
  constraint workspace_branding_logo_url_length_check check (logo_url is null or char_length(logo_url) <= 500),
  constraint workspace_branding_website_url_length_check check (website_url is null or char_length(website_url) <= 240),
  constraint workspace_branding_phone_length_check check (phone is null or char_length(phone) <= 40),
  constraint workspace_branding_primary_color_check check (primary_color is null or primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint workspace_branding_accent_color_check check (accent_color is null or accent_color ~ '^#[0-9A-Fa-f]{6}$')
);

alter table public.workspace_branding enable row level security;

revoke all on public.workspace_branding from anon;
grant select, insert, update, delete on public.workspace_branding to authenticated;

drop policy if exists "workspace_branding_member_select" on public.workspace_branding;
drop policy if exists "workspace_branding_manager_insert" on public.workspace_branding;
drop policy if exists "workspace_branding_manager_update" on public.workspace_branding;
drop policy if exists "workspace_branding_manager_delete" on public.workspace_branding;

create policy "workspace_branding_member_select"
  on public.workspace_branding
  for select
  to authenticated
  using (public.has_workspace_access(workspace_id));

create policy "workspace_branding_manager_insert"
  on public.workspace_branding
  for insert
  to authenticated
  with check (public.can_manage_workspace(workspace_id));

create policy "workspace_branding_manager_update"
  on public.workspace_branding
  for update
  to authenticated
  using (public.can_manage_workspace(workspace_id))
  with check (public.can_manage_workspace(workspace_id));

create policy "workspace_branding_manager_delete"
  on public.workspace_branding
  for delete
  to authenticated
  using (public.can_manage_workspace(workspace_id));

drop trigger if exists workspace_branding_updated_at on public.workspace_branding;
create trigger workspace_branding_updated_at
before update on public.workspace_branding
for each row execute function set_updated_at();

create table if not exists public.done_for_you_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(user_id) on delete set null,
  name text,
  email text not null,
  phone text,
  business_name text,
  business_url text,
  service_area text,
  monthly_jobs text,
  message text,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  constraint done_for_you_requests_name_length_check check (name is null or char_length(name) <= 120),
  constraint done_for_you_requests_email_format_check check (email ~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' and char_length(email) <= 254),
  constraint done_for_you_requests_phone_length_check check (phone is null or char_length(phone) <= 40),
  constraint done_for_you_requests_business_name_length_check check (business_name is null or char_length(business_name) <= 160),
  constraint done_for_you_requests_business_url_length_check check (business_url is null or char_length(business_url) <= 240),
  constraint done_for_you_requests_service_area_length_check check (service_area is null or char_length(service_area) <= 160),
  constraint done_for_you_requests_monthly_jobs_length_check check (monthly_jobs is null or char_length(monthly_jobs) <= 120),
  constraint done_for_you_requests_message_length_check check (message is null or char_length(message) <= 1500),
  constraint done_for_you_requests_status_check check (status in ('new', 'contacted', 'qualified', 'closed', 'archived'))
);

create index if not exists done_for_you_requests_created_at_idx
  on public.done_for_you_requests(created_at desc);

create index if not exists done_for_you_requests_status_idx
  on public.done_for_you_requests(status);

alter table public.done_for_you_requests enable row level security;

revoke all on public.done_for_you_requests from anon;
grant insert on public.done_for_you_requests to anon, authenticated;
grant select, update, delete on public.done_for_you_requests to authenticated;

drop policy if exists "done_for_you_requests_public_insert" on public.done_for_you_requests;
drop policy if exists "done_for_you_requests_admin_select" on public.done_for_you_requests;
drop policy if exists "done_for_you_requests_admin_update" on public.done_for_you_requests;
drop policy if exists "done_for_you_requests_admin_delete" on public.done_for_you_requests;

create policy "done_for_you_requests_public_insert"
  on public.done_for_you_requests
  for insert
  to anon, authenticated
  with check (status = 'new' and (user_id is null or user_id = auth.uid()));

create policy "done_for_you_requests_admin_select"
  on public.done_for_you_requests
  for select
  to authenticated
  using (public.is_admin());

create policy "done_for_you_requests_admin_update"
  on public.done_for_you_requests
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "done_for_you_requests_admin_delete"
  on public.done_for_you_requests
  for delete
  to authenticated
  using (public.is_admin());

select pg_notify('pgrst', 'reload schema');
