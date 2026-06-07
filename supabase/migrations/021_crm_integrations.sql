do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'workspace_provider_connections_provider_check'
  ) then
    alter table workspace_provider_connections
      drop constraint workspace_provider_connections_provider_check;
  end if;
end $$;

alter table workspace_provider_connections
  add constraint workspace_provider_connections_provider_check
  check (provider in ('meta', 'gohighlevel', 'hubspot', 'pipedrive', 'salesforce'));

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'workspace_provider_assets_provider_check'
  ) then
    alter table workspace_provider_assets
      drop constraint workspace_provider_assets_provider_check;
  end if;
end $$;

alter table workspace_provider_assets
  add constraint workspace_provider_assets_provider_check
  check (provider in ('meta', 'gohighlevel', 'hubspot', 'pipedrive', 'salesforce'));

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'workspace_provider_assets_type_check'
  ) then
    alter table workspace_provider_assets
      drop constraint workspace_provider_assets_type_check;
  end if;
end $$;

alter table workspace_provider_assets
  add constraint workspace_provider_assets_type_check
  check (asset_type in ('ad_account', 'page', 'instagram_actor', 'pixel', 'lead_form', 'crm_destination'));

create table if not exists crm_routing_rules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  campaign_id uuid references campaigns(id) on delete cascade,
  provider text not null,
  connection_id uuid not null references workspace_provider_connections(id) on delete cascade,
  destination_asset_id uuid references workspace_provider_assets(id) on delete set null,
  rule_scope text not null default 'workspace_default',
  priority integer not null default 100,
  is_active boolean not null default true,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'crm_routing_rules_provider_check'
  ) then
    alter table crm_routing_rules
      add constraint crm_routing_rules_provider_check
      check (provider in ('gohighlevel', 'hubspot', 'pipedrive', 'salesforce'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'crm_routing_rules_scope_check'
  ) then
    alter table crm_routing_rules
      add constraint crm_routing_rules_scope_check
      check (rule_scope in ('workspace_default', 'campaign_override'));
  end if;
end $$;

create unique index if not exists crm_routing_rules_workspace_default_idx
  on crm_routing_rules(workspace_id, rule_scope)
  where is_active = true and campaign_id is null and rule_scope = 'workspace_default';

create unique index if not exists crm_routing_rules_campaign_override_idx
  on crm_routing_rules(workspace_id, campaign_id, rule_scope)
  where is_active = true and campaign_id is not null and rule_scope = 'campaign_override';

create index if not exists crm_routing_rules_workspace_idx
  on crm_routing_rules(workspace_id);

drop trigger if exists crm_routing_rules_updated_at on crm_routing_rules;
create trigger crm_routing_rules_updated_at
before update on crm_routing_rules
for each row execute function set_updated_at();

alter table crm_routing_rules enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'crm_routing_rules'
      and policyname = 'crm routing rules membership access'
  ) then
    create policy "crm routing rules membership access"
      on crm_routing_rules
      for all
      using (
        exists (
          select 1
          from workspace_memberships wm
          where wm.workspace_id = crm_routing_rules.workspace_id
            and wm.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1
          from workspace_memberships wm
          where wm.workspace_id = crm_routing_rules.workspace_id
            and wm.user_id = auth.uid()
        )
      );
  end if;
end $$;

create table if not exists lead_deliveries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  campaign_id uuid references campaigns(id) on delete set null,
  provider text not null,
  connection_id uuid not null references workspace_provider_connections(id) on delete cascade,
  destination_asset_id uuid references workspace_provider_assets(id) on delete set null,
  state text not null default 'pending',
  external_record_id text,
  attempts_count integer not null default 0,
  last_attempt_at timestamptz,
  last_error text,
  last_error_detail_json jsonb not null default '{}'::jsonb,
  request_payload_json jsonb not null default '{}'::jsonb,
  response_payload_json jsonb not null default '{}'::jsonb,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'lead_deliveries_provider_check'
  ) then
    alter table lead_deliveries
      add constraint lead_deliveries_provider_check
      check (provider in ('gohighlevel', 'hubspot', 'pipedrive', 'salesforce'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'lead_deliveries_state_check'
  ) then
    alter table lead_deliveries
      add constraint lead_deliveries_state_check
      check (state in ('pending', 'delivered', 'failed', 'retrying', 'skipped'));
  end if;
end $$;

create unique index if not exists lead_deliveries_unique_target_idx
  on lead_deliveries(lead_id, provider, connection_id);

create index if not exists lead_deliveries_workspace_idx
  on lead_deliveries(workspace_id, updated_at desc);

drop trigger if exists lead_deliveries_updated_at on lead_deliveries;
create trigger lead_deliveries_updated_at
before update on lead_deliveries
for each row execute function set_updated_at();

alter table lead_deliveries enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'lead_deliveries'
      and policyname = 'lead deliveries membership access'
  ) then
    create policy "lead deliveries membership access"
      on lead_deliveries
      for all
      using (
        exists (
          select 1
          from workspace_memberships wm
          where wm.workspace_id = lead_deliveries.workspace_id
            and wm.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1
          from workspace_memberships wm
          where wm.workspace_id = lead_deliveries.workspace_id
            and wm.user_id = auth.uid()
        )
      );
  end if;
end $$;

create table if not exists lead_delivery_attempts (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references lead_deliveries(id) on delete cascade,
  attempt_number integer not null,
  state text not null,
  http_status integer,
  request_payload_json jsonb not null default '{}'::jsonb,
  response_payload_json jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'lead_delivery_attempts_state_check'
  ) then
    alter table lead_delivery_attempts
      add constraint lead_delivery_attempts_state_check
      check (state in ('pending', 'delivered', 'failed', 'retrying', 'skipped'));
  end if;
end $$;

create index if not exists lead_delivery_attempts_delivery_idx
  on lead_delivery_attempts(delivery_id, attempt_number desc);

alter table lead_delivery_attempts enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'lead_delivery_attempts'
      and policyname = 'lead delivery attempts membership access'
  ) then
    create policy "lead delivery attempts membership access"
      on lead_delivery_attempts
      for all
      using (
        exists (
          select 1
          from lead_deliveries delivery
          join workspace_memberships wm on wm.workspace_id = delivery.workspace_id
          where delivery.id = lead_delivery_attempts.delivery_id
            and wm.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1
          from lead_deliveries delivery
          join workspace_memberships wm on wm.workspace_id = delivery.workspace_id
          where delivery.id = lead_delivery_attempts.delivery_id
            and wm.user_id = auth.uid()
        )
      );
  end if;
end $$;
