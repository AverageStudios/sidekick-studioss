alter table if exists public.campaigns
  add column if not exists meta_campaign_id text,
  add column if not exists meta_adset_id text,
  add column if not exists meta_ad_id text,
  add column if not exists meta_lead_form_id text,
  add column if not exists meta_creative_id text;

update public.campaigns
set meta_campaign_id = coalesce(meta_campaign_id, external_ids_json->>'campaign_id'),
    meta_adset_id = coalesce(meta_adset_id, external_ids_json->>'adset_id'),
    meta_ad_id = coalesce(meta_ad_id, external_ids_json->>'ad_id'),
    meta_lead_form_id = coalesce(meta_lead_form_id, external_ids_json->>'lead_form_id')
where external_ids_json is not null;
