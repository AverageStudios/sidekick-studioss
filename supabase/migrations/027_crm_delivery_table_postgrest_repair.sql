-- Repair CRM delivery table visibility for trusted server/service-role paths.
-- This keeps delivery payload tables private from browser roles.

create table if not exists public.lead_deliveries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  provider text not null,
  connection_id uuid not null references public.workspace_provider_connections(id) on delete cascade,
  destination_asset_id uuid references public.workspace_provider_assets(id) on delete set null,
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

create table if not exists public.lead_delivery_attempts (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.lead_deliveries(id) on delete cascade,
  attempt_number integer not null,
  state text not null,
  http_status integer,
  request_payload_json jsonb not null default '{}'::jsonb,
  response_payload_json jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists lead_deliveries_workspace_idx
  on public.lead_deliveries(workspace_id, updated_at desc);

create unique index if not exists lead_deliveries_unique_target_idx
  on public.lead_deliveries(lead_id, provider, connection_id);

create index if not exists lead_delivery_attempts_delivery_idx
  on public.lead_delivery_attempts(delivery_id, attempt_number desc);

alter table public.lead_deliveries enable row level security;
alter table public.lead_delivery_attempts enable row level security;

revoke all on public.lead_deliveries from anon, authenticated;
revoke all on public.lead_delivery_attempts from anon, authenticated;
grant all on public.lead_deliveries to service_role;
grant all on public.lead_delivery_attempts to service_role;

drop policy if exists "lead deliveries membership access" on public.lead_deliveries;
drop policy if exists "lead delivery attempts membership access" on public.lead_delivery_attempts;

notify pgrst, 'reload schema';
