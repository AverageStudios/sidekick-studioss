alter table if exists public.campaigns
  add column if not exists published_at timestamptz,
  add column if not exists archived_at timestamptz;

update public.campaigns
set published_at = coalesce(published_at, updated_at, created_at)
where status = 'published'
  and published_at is null;

update public.campaigns
set archived_at = coalesce(archived_at, updated_at)
where status = 'archived'
  and archived_at is null;
