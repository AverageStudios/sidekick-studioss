create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workspace_memberships (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

do $$
begin
  if not exists (
    select 1
    from information_schema.constraint_column_usage
    where table_name = 'workspace_memberships'
      and constraint_name = 'workspace_memberships_role_check'
  ) then
    alter table workspace_memberships
      add constraint workspace_memberships_role_check
      check (role in ('owner', 'admin', 'member'));
  end if;
end $$;

alter table profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists display_name text,
  add column if not exists active_workspace_id uuid references workspaces(id) on delete set null;

alter table business_profiles
  add column if not exists workspace_id uuid references workspaces(id) on delete cascade;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'business_profiles_user_id_key'
  ) then
    alter table business_profiles drop constraint business_profiles_user_id_key;
  end if;
end $$;

create unique index if not exists business_profiles_workspace_id_idx on business_profiles(workspace_id);
create index if not exists business_profiles_user_id_idx on business_profiles(user_id);

alter table business_profiles
  alter column location set default '',
  alter column phone set default '',
  alter column email set default '',
  alter column description set default '';

update profiles p
set
  first_name = coalesce(
    p.first_name,
    nullif(u.raw_user_meta_data ->> 'first_name', ''),
    nullif(split_part(coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', ''), ' ', 1), '')
  ),
  last_name = coalesce(
    p.last_name,
    nullif(u.raw_user_meta_data ->> 'last_name', ''),
    nullif(
      regexp_replace(coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', ''), '^\S+\s*', ''),
      ''
    )
  ),
  display_name = coalesce(
    p.display_name,
    nullif(u.raw_user_meta_data ->> 'full_name', ''),
    nullif(u.raw_user_meta_data ->> 'name', '')
  )
from auth.users u
where u.id = p.user_id;

insert into workspaces (name, owner_user_id, created_at, updated_at)
select
  coalesce(
    nullif(bp.business_name, ''),
    case
      when nullif(p.first_name, '') is not null then p.first_name || '''s Workspace'
      else 'My Workspace'
    end
  ),
  p.user_id,
  now(),
  now()
from profiles p
left join business_profiles bp on bp.user_id = p.user_id
where not exists (
  select 1
  from workspaces w
  where w.owner_user_id = p.user_id
);

insert into workspace_memberships (workspace_id, user_id, role, created_at, updated_at)
select w.id, w.owner_user_id, 'owner', now(), now()
from workspaces w
where not exists (
  select 1
  from workspace_memberships wm
  where wm.workspace_id = w.id
    and wm.user_id = w.owner_user_id
);

update profiles p
set active_workspace_id = coalesce(
  p.active_workspace_id,
  (
    select w.id
    from workspaces w
    where w.owner_user_id = p.user_id
    order by w.created_at asc
    limit 1
  )
)
where p.active_workspace_id is null;

update business_profiles bp
set workspace_id = (
  select w.id
  from workspaces w
  where w.owner_user_id = bp.user_id
  order by w.created_at asc
  limit 1
)
where bp.workspace_id is null;

insert into business_profiles (
  user_id,
  workspace_id,
  business_name,
  location,
  phone,
  email,
  description,
  brand_color,
  default_cta
)
select
  p.user_id,
  p.active_workspace_id,
  coalesce(
    case
      when nullif(p.first_name, '') is not null then p.first_name || '''s Workspace'
      else null
    end,
    'My Workspace'
  ),
  '',
  '',
  coalesce(u.email, ''),
  '',
  '#6D5EF8',
  'Get My Quote'
from profiles p
left join auth.users u on u.id = p.user_id
where p.active_workspace_id is not null
  and not exists (
    select 1
    from business_profiles bp
    where bp.workspace_id = p.active_workspace_id
  );

alter table campaigns
  add column if not exists workspace_id uuid references workspaces(id) on delete set null;

alter table funnels
  add column if not exists workspace_id uuid references workspaces(id) on delete set null;

alter table leads
  add column if not exists workspace_id uuid references workspaces(id) on delete set null;

alter table follow_up_settings
  add column if not exists workspace_id uuid references workspaces(id) on delete set null;

update campaigns c
set workspace_id = p.active_workspace_id
from profiles p
where p.user_id = c.user_id
  and c.workspace_id is null;

update funnels f
set workspace_id = c.workspace_id
from campaigns c
where c.id = f.campaign_id
  and f.workspace_id is null;

update leads l
set workspace_id = c.workspace_id
from campaigns c
where c.id = l.campaign_id
  and l.workspace_id is null;

update follow_up_settings s
set workspace_id = c.workspace_id
from campaigns c
where c.id = s.campaign_id
  and s.workspace_id is null;

create index if not exists profiles_active_workspace_id_idx on profiles(active_workspace_id);
create index if not exists workspaces_owner_user_id_idx on workspaces(owner_user_id);
create index if not exists workspace_memberships_user_id_idx on workspace_memberships(user_id);
create index if not exists workspace_memberships_workspace_id_idx on workspace_memberships(workspace_id);
create index if not exists campaigns_workspace_id_idx on campaigns(workspace_id);
create index if not exists funnels_workspace_id_idx on funnels(workspace_id);
create index if not exists leads_workspace_id_idx on leads(workspace_id);
create index if not exists follow_up_settings_workspace_id_idx on follow_up_settings(workspace_id);

alter table workspaces enable row level security;
alter table workspace_memberships enable row level security;

create policy "workspace members can read workspaces" on workspaces
  for select using (
    exists (
      select 1
      from workspace_memberships wm
      where wm.workspace_id = workspaces.id
        and wm.user_id = auth.uid()
    )
  );

create policy "workspace owners can manage workspaces" on workspaces
  for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

create policy "workspace members can read memberships" on workspace_memberships
  for select using (
    user_id = auth.uid()
    or exists (
      select 1
      from workspaces w
      where w.id = workspace_memberships.workspace_id
        and w.owner_user_id = auth.uid()
    )
  );

create policy "workspace owners can manage memberships" on workspace_memberships
  for all using (
    exists (
      select 1
      from workspaces w
      where w.id = workspace_memberships.workspace_id
        and w.owner_user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1
      from workspaces w
      where w.id = workspace_memberships.workspace_id
        and w.owner_user_id = auth.uid()
    )
  );

create policy "workspace members can access business profiles" on business_profiles
  for select using (
    exists (
      select 1
      from workspace_memberships wm
      where wm.workspace_id = business_profiles.workspace_id
        and wm.user_id = auth.uid()
    )
  );

drop trigger if exists workspaces_updated_at on workspaces;
create trigger workspaces_updated_at before update on workspaces
for each row execute function set_updated_at();

drop trigger if exists workspace_memberships_updated_at on workspace_memberships;
create trigger workspace_memberships_updated_at before update on workspace_memberships
for each row execute function set_updated_at();
