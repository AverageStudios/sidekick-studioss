alter table workspaces
  add column if not exists business_name text,
  add column if not exists business_email text,
  add column if not exists business_phone text,
  add column if not exists website text,
  add column if not exists industry text;

alter table business_profiles
  add column if not exists website text default '',
  add column if not exists industry text default '',
  add column if not exists privacy_policy_url text default '';

update workspaces w
set
  business_name = coalesce(nullif(w.business_name, ''), nullif(bp.business_name, ''), w.name),
  business_email = coalesce(nullif(w.business_email, ''), nullif(bp.email, '')),
  business_phone = coalesce(nullif(w.business_phone, ''), nullif(bp.phone, '')),
  website = coalesce(nullif(w.website, ''), nullif(bp.website, '')),
  industry = coalesce(nullif(w.industry, ''), nullif(bp.industry, ''))
from business_profiles bp
where bp.workspace_id = w.id;

create index if not exists workspaces_business_name_idx on workspaces(business_name);
create index if not exists business_profiles_industry_idx on business_profiles(industry);
