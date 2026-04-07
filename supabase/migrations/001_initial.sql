create extension if not exists "pgcrypto";

create table if not exists business_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  business_name text not null,
  location text not null,
  phone text not null,
  email text not null,
  description text not null default '',
  logo_url text,
  brand_color text,
  default_cta text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists templates (
  id text primary key,
  slug text not null unique,
  name text not null,
  description text not null,
  category text not null,
  preview_image_url text,
  config_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  template_id text not null references templates(id),
  name text not null,
  slug text not null unique,
  offer_price numeric,
  regular_price numeric,
  cta_text text not null,
  headline text not null,
  subheadline text not null,
  business_description text not null default '',
  testimonial_text text,
  before_images_json jsonb not null default '[]'::jsonb,
  after_images_json jsonb not null default '[]'::jsonb,
  ad_copy_json jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists funnels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  slug text not null unique,
  is_published boolean not null default false,
  published_at timestamptz,
  config_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  funnel_id uuid not null references funnels(id) on delete cascade,
  name text not null,
  phone text not null,
  email text not null,
  service_interest text not null,
  message text,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists follow_up_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  campaign_id uuid not null unique references campaigns(id) on delete cascade,
  email_enabled boolean not null default true,
  sms_enabled boolean not null default false,
  confirmation_subject text,
  confirmation_body text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists campaigns_user_id_idx on campaigns(user_id);
create index if not exists funnels_user_id_idx on funnels(user_id);
create index if not exists leads_user_id_idx on leads(user_id);
create index if not exists leads_status_idx on leads(status);

alter table business_profiles enable row level security;
alter table campaigns enable row level security;
alter table funnels enable row level security;
alter table leads enable row level security;
alter table follow_up_settings enable row level security;

create policy "business profiles owner access" on business_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "campaign owner access" on campaigns
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "funnel owner access" on funnels
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "lead owner access" on leads
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "follow up owner access" on follow_up_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists business_profiles_updated_at on business_profiles;
create trigger business_profiles_updated_at before update on business_profiles
for each row execute function set_updated_at();

drop trigger if exists campaigns_updated_at on campaigns;
create trigger campaigns_updated_at before update on campaigns
for each row execute function set_updated_at();

drop trigger if exists funnels_updated_at on funnels;
create trigger funnels_updated_at before update on funnels
for each row execute function set_updated_at();

drop trigger if exists leads_updated_at on leads;
create trigger leads_updated_at before update on leads
for each row execute function set_updated_at();

drop trigger if exists follow_up_settings_updated_at on follow_up_settings;
create trigger follow_up_settings_updated_at before update on follow_up_settings
for each row execute function set_updated_at();

