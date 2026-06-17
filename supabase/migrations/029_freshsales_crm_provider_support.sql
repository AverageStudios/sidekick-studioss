do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'workspace_provider_connections_provider_check'
  ) then
    alter table public.workspace_provider_connections
      drop constraint workspace_provider_connections_provider_check;
  end if;
end $$;

alter table public.workspace_provider_connections
  add constraint workspace_provider_connections_provider_check
  check (provider in ('meta', 'gohighlevel', 'hubspot', 'pipedrive', 'salesforce', 'zoho', 'freshsales'));

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'workspace_provider_assets_provider_check'
  ) then
    alter table public.workspace_provider_assets
      drop constraint workspace_provider_assets_provider_check;
  end if;
end $$;

alter table public.workspace_provider_assets
  add constraint workspace_provider_assets_provider_check
  check (provider in ('meta', 'gohighlevel', 'hubspot', 'pipedrive', 'salesforce', 'zoho', 'freshsales'));

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'crm_routing_rules_provider_check'
  ) then
    alter table public.crm_routing_rules
      drop constraint crm_routing_rules_provider_check;
  end if;
end $$;

alter table public.crm_routing_rules
  add constraint crm_routing_rules_provider_check
  check (provider in ('gohighlevel', 'hubspot', 'pipedrive', 'salesforce', 'zoho', 'freshsales'));

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'lead_deliveries_provider_check'
  ) then
    alter table public.lead_deliveries
      drop constraint lead_deliveries_provider_check;
  end if;
end $$;

alter table public.lead_deliveries
  add constraint lead_deliveries_provider_check
  check (provider in ('gohighlevel', 'hubspot', 'pipedrive', 'salesforce', 'zoho', 'freshsales'));
