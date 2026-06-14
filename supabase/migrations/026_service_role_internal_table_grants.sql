-- Ensure trusted server/admin paths can see internal tables through PostgREST
-- after the RLS hardening migrations. These grants do not expose rows to anon
-- or authenticated browser clients.

do $$
begin
  if to_regclass('public.workspace_meta_connections') is not null then
    execute 'grant all on public.workspace_meta_connections to service_role';
  end if;

  if to_regclass('public.workspace_provider_connections') is not null then
    execute 'grant all on public.workspace_provider_connections to service_role';
  end if;

  if to_regclass('public.workspace_provider_assets') is not null then
    execute 'grant all on public.workspace_provider_assets to service_role';
  end if;

  if to_regclass('public.campaign_publish_jobs') is not null then
    execute 'grant all on public.campaign_publish_jobs to service_role';
  end if;

  if to_regclass('public.campaign_launch_snapshots') is not null then
    execute 'grant all on public.campaign_launch_snapshots to service_role';
  end if;

  if to_regclass('public.crm_routing_rules') is not null then
    execute 'grant all on public.crm_routing_rules to service_role';
  end if;

  if to_regclass('public.lead_deliveries') is not null then
    execute 'grant all on public.lead_deliveries to service_role';
  end if;

  if to_regclass('public.lead_delivery_attempts') is not null then
    execute 'grant all on public.lead_delivery_attempts to service_role';
  end if;
end $$;

notify pgrst, 'reload schema';
