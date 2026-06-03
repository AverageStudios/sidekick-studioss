create table if not exists template_industries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  status text not null default 'active',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists template_categories (
  id uuid primary key default gen_random_uuid(),
  industry_id uuid not null references template_industries(id) on delete restrict,
  name text not null,
  slug text not null,
  description text,
  status text not null default 'active',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint template_categories_industry_slug_key unique (industry_id, slug)
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'template_industries_status_check'
  ) then
    alter table template_industries
      add constraint template_industries_status_check
      check (status in ('active', 'archived'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'template_categories_status_check'
  ) then
    alter table template_categories
      add constraint template_categories_status_check
      check (status in ('active', 'archived'));
  end if;
end $$;

alter table templates
  add column if not exists industry_id uuid references template_industries(id) on delete set null,
  add column if not exists category_id uuid references template_categories(id) on delete set null;

create index if not exists template_industries_status_idx on template_industries(status, sort_order, name);
create index if not exists template_categories_industry_status_idx on template_categories(industry_id, status, sort_order, name);
create index if not exists templates_industry_id_idx on templates(industry_id);
create index if not exists templates_category_id_idx on templates(category_id);

with distinct_industries as (
  select distinct
    trim(coalesce(nullif(industry, ''), nullif(category, ''))) as name
  from templates
  where trim(coalesce(nullif(industry, ''), nullif(category, ''))) <> ''
)
insert into template_industries (name, slug, status)
select
  name,
  regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'),
  'active'
from distinct_industries
on conflict (slug) do update
set name = excluded.name;

with distinct_categories as (
  select distinct
    trim(coalesce(nullif(industry, ''), nullif(category, ''))) as industry_name,
    trim(coalesce(nullif(category, ''), nullif(industry, ''))) as category_name
  from templates
  where trim(coalesce(nullif(industry, ''), nullif(category, ''))) <> ''
    and trim(coalesce(nullif(category, ''), nullif(industry, ''))) <> ''
)
insert into template_categories (industry_id, name, slug, status)
select
  industries.id,
  distinct_categories.category_name,
  regexp_replace(lower(distinct_categories.category_name), '[^a-z0-9]+', '-', 'g'),
  'active'
from distinct_categories
join template_industries as industries
  on industries.slug = regexp_replace(lower(distinct_categories.industry_name), '[^a-z0-9]+', '-', 'g')
on conflict (industry_id, slug) do update
set name = excluded.name;

update templates
set
  industry_id = industries.id,
  category_id = categories.id
from template_industries as industries
left join template_categories as categories
  on categories.industry_id = industries.id
 and categories.slug = regexp_replace(lower(trim(coalesce(nullif(templates.category, ''), nullif(templates.industry, '')))), '[^a-z0-9]+', '-', 'g')
where industries.slug = regexp_replace(lower(trim(coalesce(nullif(templates.industry, ''), nullif(templates.category, '')))), '[^a-z0-9]+', '-', 'g')
  and (templates.industry_id is null or templates.category_id is null);

alter table template_industries enable row level security;
alter table template_categories enable row level security;

create policy "template industries published read" on template_industries
  for select
  using (
    status = 'active'
    or public.is_admin()
  );

create policy "template industries admin insert" on template_industries
  for insert
  with check (public.is_admin());

create policy "template industries admin update" on template_industries
  for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "template industries admin delete" on template_industries
  for delete
  using (public.is_admin());

create policy "template categories published read" on template_categories
  for select
  using (
    status = 'active'
    or public.is_admin()
  );

create policy "template categories admin insert" on template_categories
  for insert
  with check (public.is_admin());

create policy "template categories admin update" on template_categories
  for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "template categories admin delete" on template_categories
  for delete
  using (public.is_admin());

drop trigger if exists template_industries_updated_at on template_industries;
create trigger template_industries_updated_at
before update on template_industries
for each row execute function set_updated_at();

drop trigger if exists template_categories_updated_at on template_categories;
create trigger template_categories_updated_at
before update on template_categories
for each row execute function set_updated_at();
