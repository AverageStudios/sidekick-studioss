-- Meta/Facebook publishing restart foundation (workspace-scoped, extensible).

create table if not exists workspace_provider_connections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  provider text not null,
  user_id uuid not null,
  provider_user_id text,
  provider_user_name text,
  token_ciphertext text,
  token_iv text,
  token_tag text,
  refresh_token_ciphertext text,
  refresh_token_iv text,
  refresh_token_tag text,
  token_type text,
  token_expires_at timestamptz,
  scopes text[] not null default '{}'::text[],
  status text not null default 'connected',
  metadata_json jsonb not null default '{}'::jsonb,
  connected_at timestamptz not null default now(),
  disconnected_at timestamptz,
  last_synced_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, provider, id)
);

do $$
begin
  if not exists (
    select 1
    from information_schema.constraint_column_usage
    where table_name = 'workspace_provider_connections'
      and constraint_name = 'workspace_provider_connections_provider_check'
  ) then
    alter table workspace_provider_connections
      add constraint workspace_provider_connections_provider_check
      check (provider in ('meta'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from information_schema.constraint_column_usage
    where table_name = 'workspace_provider_connections'
      and constraint_name = 'workspace_provider_connections_status_check'
  ) then
    alter table workspace_provider_connections
      add constraint workspace_provider_connections_status_check
      check (status in ('connected', 'expired', 'revoked', 'disconnected', 'error'));
  end if;
end $$;

create unique index if not exists workspace_provider_connections_active_idx
  on workspace_provider_connections(workspace_id, provider)
  where is_active = true;

create index if not exists workspace_provider_connections_workspace_idx
  on workspace_provider_connections(workspace_id);

create index if not exists workspace_provider_connections_user_idx
  on workspace_provider_connections(user_id);

create index if not exists workspace_provider_connections_provider_idx
  on workspace_provider_connections(provider);

drop trigger if exists workspace_provider_connections_updated_at on workspace_provider_connections;
create trigger workspace_provider_connections_updated_at
before update on workspace_provider_connections
for each row execute function set_updated_at();

alter table workspace_provider_connections enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'workspace_provider_connections'
      and policyname = 'workspace provider connections membership access'
  ) then
    create policy "workspace provider connections membership access"
      on workspace_provider_connections
      for all
      using (
        exists (
          select 1
          from workspace_memberships wm
          where wm.workspace_id = workspace_provider_connections.workspace_id
            and wm.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1
          from workspace_memberships wm
          where wm.workspace_id = workspace_provider_connections.workspace_id
            and wm.user_id = auth.uid()
        )
      );
  end if;
end $$;

create table if not exists workspace_provider_assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  provider text not null,
  connection_id uuid references workspace_provider_connections(id) on delete cascade,
  asset_type text not null,
  asset_id text not null,
  name text,
  metadata_json jsonb not null default '{}'::jsonb,
  is_available boolean not null default true,
  is_selected boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, provider, asset_type, asset_id)
);

do $$
begin
  if not exists (
    select 1
    from information_schema.constraint_column_usage
    where table_name = 'workspace_provider_assets'
      and constraint_name = 'workspace_provider_assets_provider_check'
  ) then
    alter table workspace_provider_assets
      add constraint workspace_provider_assets_provider_check
      check (provider in ('meta'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from information_schema.constraint_column_usage
    where table_name = 'workspace_provider_assets'
      and constraint_name = 'workspace_provider_assets_type_check'
  ) then
    alter table workspace_provider_assets
      add constraint workspace_provider_assets_type_check
      check (asset_type in ('ad_account', 'page', 'instagram_actor', 'pixel', 'lead_form'));
  end if;
end $$;

create index if not exists workspace_provider_assets_workspace_idx
  on workspace_provider_assets(workspace_id);

create index if not exists workspace_provider_assets_type_idx
  on workspace_provider_assets(asset_type);

create index if not exists workspace_provider_assets_selected_idx
  on workspace_provider_assets(workspace_id, provider, asset_type)
  where is_selected = true;

drop trigger if exists workspace_provider_assets_updated_at on workspace_provider_assets;
create trigger workspace_provider_assets_updated_at
before update on workspace_provider_assets
for each row execute function set_updated_at();

alter table workspace_provider_assets enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'workspace_provider_assets'
      and policyname = 'workspace provider assets membership access'
  ) then
    create policy "workspace provider assets membership access"
      on workspace_provider_assets
      for all
      using (
        exists (
          select 1
          from workspace_memberships wm
          where wm.workspace_id = workspace_provider_assets.workspace_id
            and wm.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1
          from workspace_memberships wm
          where wm.workspace_id = workspace_provider_assets.workspace_id
            and wm.user_id = auth.uid()
        )
      );
  end if;
end $$;

create table if not exists campaign_publish_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  provider text not null default 'meta',
  mode text not null,
  status text not null default 'queued',
  preflight_blocking_issues_json jsonb not null default '[]'::jsonb,
  preflight_warnings_json jsonb not null default '[]'::jsonb,
  resolved_assets_json jsonb not null default '{}'::jsonb,
  normalized_payload_json jsonb not null default '{}'::jsonb,
  meta_request_json jsonb not null default '{}'::jsonb,
  meta_response_json jsonb not null default '{}'::jsonb,
  external_ids_json jsonb not null default '{}'::jsonb,
  error_message text,
  created_by uuid,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from information_schema.constraint_column_usage
    where table_name = 'campaign_publish_jobs'
      and constraint_name = 'campaign_publish_jobs_provider_check'
  ) then
    alter table campaign_publish_jobs
      add constraint campaign_publish_jobs_provider_check
      check (provider in ('meta'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from information_schema.constraint_column_usage
    where table_name = 'campaign_publish_jobs'
      and constraint_name = 'campaign_publish_jobs_mode_check'
  ) then
    alter table campaign_publish_jobs
      add constraint campaign_publish_jobs_mode_check
      check (mode in ('draft', 'live'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from information_schema.constraint_column_usage
    where table_name = 'campaign_publish_jobs'
      and constraint_name = 'campaign_publish_jobs_status_check'
  ) then
    alter table campaign_publish_jobs
      add constraint campaign_publish_jobs_status_check
      check (status in ('queued', 'preflight_failed', 'publishing', 'published', 'failed'));
  end if;
end $$;

create index if not exists campaign_publish_jobs_workspace_idx
  on campaign_publish_jobs(workspace_id, created_at desc);

create index if not exists campaign_publish_jobs_campaign_idx
  on campaign_publish_jobs(campaign_id, created_at desc);

drop trigger if exists campaign_publish_jobs_updated_at on campaign_publish_jobs;
create trigger campaign_publish_jobs_updated_at
before update on campaign_publish_jobs
for each row execute function set_updated_at();

alter table campaign_publish_jobs enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'campaign_publish_jobs'
      and policyname = 'campaign publish jobs membership access'
  ) then
    create policy "campaign publish jobs membership access"
      on campaign_publish_jobs
      for all
      using (
        exists (
          select 1
          from workspace_memberships wm
          where wm.workspace_id = campaign_publish_jobs.workspace_id
            and wm.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1
          from workspace_memberships wm
          where wm.workspace_id = campaign_publish_jobs.workspace_id
            and wm.user_id = auth.uid()
        )
      );
  end if;
end $$;

create table if not exists campaign_launch_snapshots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  template_slug text not null,
  launch_step text not null,
  details_step text,
  state_hash text not null,
  snapshot_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now()
);

create unique index if not exists campaign_launch_snapshots_campaign_hash_idx
  on campaign_launch_snapshots(campaign_id, state_hash);

create index if not exists campaign_launch_snapshots_campaign_created_idx
  on campaign_launch_snapshots(campaign_id, created_at desc);

create index if not exists campaign_launch_snapshots_workspace_created_idx
  on campaign_launch_snapshots(workspace_id, created_at desc);

alter table campaign_launch_snapshots enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'campaign_launch_snapshots'
      and policyname = 'campaign launch snapshots membership access'
  ) then
    create policy "campaign launch snapshots membership access"
      on campaign_launch_snapshots
      for all
      using (
        exists (
          select 1
          from workspace_memberships wm
          where wm.workspace_id = campaign_launch_snapshots.workspace_id
            and wm.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1
          from workspace_memberships wm
          where wm.workspace_id = campaign_launch_snapshots.workspace_id
            and wm.user_id = auth.uid()
        )
      );
  end if;
end $$;

-- Backfill from legacy integration table when present.
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'workspace_meta_connections'
  ) then
    insert into workspace_provider_connections (
      workspace_id,
      provider,
      user_id,
      provider_user_id,
      provider_user_name,
      token_type,
      token_expires_at,
      scopes,
      status,
      metadata_json,
      connected_at,
      last_synced_at,
      is_active
    )
    select
      legacy.workspace_id,
      'meta',
      legacy.user_id,
      legacy.meta_user_id,
      legacy.meta_user_name,
      legacy.token_type,
      legacy.token_expires_at,
      coalesce(legacy.scopes, '{}'::text[]),
      case
        when legacy.access_token is not null and legacy.access_token <> '' then 'connected'
        else 'disconnected'
      end,
      jsonb_build_object(
        'legacy_migrated', true,
        'legacy_connected_at', legacy.connected_at
      ),
      coalesce(legacy.connected_at, now()),
      legacy.last_synced_at,
      true
    from workspace_meta_connections legacy
    where not exists (
      select 1
      from workspace_provider_connections existing
      where existing.workspace_id = legacy.workspace_id
        and existing.provider = 'meta'
        and existing.is_active = true
    );

    update workspace_provider_connections connection
    set
      status = 'disconnected',
      token_ciphertext = null,
      token_iv = null,
      token_tag = null
    where connection.provider = 'meta'
      and connection.metadata_json ->> 'legacy_migrated' = 'true'
      and (connection.token_ciphertext is null or connection.token_ciphertext = '');
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'workspace_meta_connections'
  ) then
    insert into workspace_provider_assets (
      workspace_id,
      provider,
      connection_id,
      asset_type,
      asset_id,
      name,
      metadata_json,
      is_available,
      is_selected
    )
    select
      legacy.workspace_id,
      'meta',
      connection.id,
      'ad_account',
      account.value ->> 'id',
      coalesce(
        account.value ->> 'name',
        case
          when account.value ->> 'account_id' is not null and account.value ->> 'account_id' <> ''
            then 'Ad Account ' || (account.value ->> 'account_id')
          else null
        end
      ),
      account.value,
      true,
      (account.value ->> 'id') = legacy.selected_ad_account_id
    from workspace_meta_connections legacy
    join workspace_provider_connections connection
      on connection.workspace_id = legacy.workspace_id
     and connection.provider = 'meta'
     and connection.is_active = true
    cross join lateral jsonb_array_elements(coalesce(legacy.ad_accounts_json, '[]'::jsonb)) as account(value)
    where coalesce(account.value ->> 'id', '') <> ''
    on conflict (workspace_id, provider, asset_type, asset_id)
    do update set
      name = excluded.name,
      metadata_json = excluded.metadata_json,
      is_available = true,
      is_selected = excluded.is_selected,
      updated_at = now();

    insert into workspace_provider_assets (
      workspace_id,
      provider,
      connection_id,
      asset_type,
      asset_id,
      name,
      metadata_json,
      is_available,
      is_selected
    )
    select
      legacy.workspace_id,
      'meta',
      connection.id,
      'page',
      page.value ->> 'id',
      page.value ->> 'name',
      page.value,
      true,
      (page.value ->> 'id') = legacy.selected_page_id
    from workspace_meta_connections legacy
    join workspace_provider_connections connection
      on connection.workspace_id = legacy.workspace_id
     and connection.provider = 'meta'
     and connection.is_active = true
    cross join lateral jsonb_array_elements(coalesce(legacy.pages_json, '[]'::jsonb)) as page(value)
    where coalesce(page.value ->> 'id', '') <> ''
    on conflict (workspace_id, provider, asset_type, asset_id)
    do update set
      name = excluded.name,
      metadata_json = excluded.metadata_json,
      is_available = true,
      is_selected = excluded.is_selected,
      updated_at = now();
  end if;
end $$;
