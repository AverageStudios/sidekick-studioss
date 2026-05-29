alter table leads
  alter column campaign_id drop not null,
  alter column funnel_id drop not null,
  alter column name drop not null,
  alter column phone drop not null,
  alter column email drop not null,
  alter column service_interest drop not null;

alter table leads
  add column if not exists meta_lead_id text,
  add column if not exists meta_page_id text,
  add column if not exists meta_page_name text,
  add column if not exists meta_form_id text,
  add column if not exists meta_form_name text,
  add column if not exists meta_campaign_id text,
  add column if not exists meta_adset_id text,
  add column if not exists meta_ad_id text,
  add column if not exists source text not null default 'website_funnel',
  add column if not exists ad_type text,
  add column if not exists full_name text,
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists company_name text,
  add column if not exists job_title text,
  add column if not exists notes text,
  add column if not exists normalized_fields_json jsonb not null default '{}'::jsonb,
  add column if not exists field_data_json jsonb not null default '[]'::jsonb,
  add column if not exists raw_payload_json jsonb not null default '{}'::jsonb,
  add column if not exists meta_created_time timestamptz,
  add column if not exists last_synced_at timestamptz,
  add column if not exists is_test_lead boolean not null default false;

update leads
set status = 'qualified'
where status = 'booked';

update leads
set
  source = coalesce(nullif(source, ''), 'website_funnel'),
  full_name = coalesce(nullif(full_name, ''), nullif(name, '')),
  normalized_fields_json = case
    when normalized_fields_json = '{}'::jsonb then jsonb_strip_nulls(jsonb_build_object(
      'full_name', case when coalesce(nullif(full_name, ''), nullif(name, '')) is not null then jsonb_build_array(coalesce(nullif(full_name, ''), nullif(name, ''))) else null end,
      'email', case when nullif(email, '') is not null then jsonb_build_array(email) else null end,
      'phone', case when nullif(phone, '') is not null then jsonb_build_array(phone) else null end
    ))
    else normalized_fields_json
  end
where true;

create unique index if not exists leads_meta_lead_unique_idx
  on leads(meta_lead_id)
  where meta_lead_id is not null;

create index if not exists leads_workspace_status_created_idx
  on leads(workspace_id, status, created_at desc);

create index if not exists leads_workspace_campaign_created_idx
  on leads(workspace_id, campaign_id, created_at desc);

create index if not exists leads_workspace_form_created_idx
  on leads(workspace_id, meta_form_id, created_at desc);

create index if not exists leads_workspace_page_created_idx
  on leads(workspace_id, meta_page_id, created_at desc);
