create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_role_check'
  ) then
    alter table profiles
      add constraint profiles_role_check
      check (role in ('admin', 'user'));
  end if;
end $$;

insert into profiles (user_id)
select id
from auth.users
on conflict (user_id) do nothing;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, role)
  values (new.id, 'user')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where user_id = auth.uid()
      and role = 'admin'
  );
$$;

alter table templates
  add column if not exists status text not null default 'draft',
  add column if not exists is_featured boolean not null default false,
  add column if not exists version integer not null default 1,
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists published_at timestamptz,
  add column if not exists archived_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'templates_status_check'
  ) then
    alter table templates
      add constraint templates_status_check
      check (status in ('draft', 'published', 'archived'));
  end if;
end $$;

update templates
set
  status = case
    when status is null or status = '' then 'published'
    when status = 'draft' and created_by is null and published_at is null and archived_at is null then 'published'
    else status
  end,
  published_at = case
    when (status is null or status = '' or (status = 'draft' and created_by is null and published_at is null and archived_at is null))
      then coalesce(published_at, created_at)
    else published_at
  end,
  updated_at = coalesce(updated_at, created_at)
where status is null
   or status = ''
   or (status = 'draft' and created_by is null and published_at is null and archived_at is null)
   or published_at is null
   or updated_at is null;

alter table campaigns
  add column if not exists source_template_version integer;

update campaigns
set source_template_version = templates.version
from templates
where campaigns.template_id = templates.id
  and campaigns.source_template_version is null;

create index if not exists profiles_user_id_idx on profiles(user_id);
create index if not exists profiles_role_idx on profiles(role);
create index if not exists templates_status_idx on templates(status);
create index if not exists templates_status_featured_idx on templates(status, is_featured);
create index if not exists templates_created_by_idx on templates(created_by);
create index if not exists campaigns_source_template_version_idx on campaigns(source_template_version);

alter table profiles enable row level security;
alter table templates enable row level security;

create policy "profiles select self or admin" on profiles
  for select
  using (auth.uid() = user_id or public.is_admin());

create policy "profiles admin manage" on profiles
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "templates published read" on templates
  for select
  using (
    (auth.role() = 'authenticated' and status = 'published')
    or public.is_admin()
  );

create policy "templates admin insert" on templates
  for insert
  with check (public.is_admin());

create policy "templates admin update" on templates
  for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "templates admin delete" on templates
  for delete
  using (public.is_admin());

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at
before update on profiles
for each row execute function set_updated_at();

drop trigger if exists templates_updated_at on templates;
create trigger templates_updated_at
before update on templates
for each row execute function set_updated_at();
