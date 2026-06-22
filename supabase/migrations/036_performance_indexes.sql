-- Performance indexes for common app queries.
-- Notes:
-- - leads(workspace_id, campaign_id, created_at desc) already exists as
--   leads_workspace_campaign_created_idx from 015_meta_leads_system.sql.
-- - user_billing(stripe_customer_id) is already backed by the unique constraint
--   on stripe_customer_id from 035_user_billing.sql.

create index if not exists campaigns_workspace_created_at_desc_idx
  on public.campaigns(workspace_id, created_at desc);

create index if not exists leads_workspace_created_at_desc_idx
  on public.leads(workspace_id, created_at desc);

create index if not exists workspace_provider_connections_workspace_provider_idx
  on public.workspace_provider_connections(workspace_id, provider);
