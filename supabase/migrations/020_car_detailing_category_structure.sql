insert into template_industries (
  name,
  slug,
  description,
  status,
  sort_order
)
values (
  'Car Detailing',
  'car-detailing',
  'Campaign templates for mobile and shop-based auto detailing businesses.',
  'active',
  2
)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  status = excluded.status,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into template_categories (industry_id, name, slug, description, status, sort_order)
select
  industries.id,
  category_definitions.name,
  category_definitions.slug,
  category_definitions.description,
  'active',
  category_definitions.sort_order
from template_industries industries
cross join (
  values
    ('Full Details', 'full-details', 'Full interior and exterior detail offers.', 1),
    ('Interior Only', 'interior-only', 'Interior recovery, stain removal, and cabin refresh offers.', 2),
    ('Exterior Only', 'exterior-only', 'Exterior-only wash, shine, and finish-focused offers.', 3),
    ('Paint Correction & Protection', 'paint-correction-protection', 'Paint correction, ceramic coating, and protection services.', 4),
    ('Seasonal Specials', 'seasonal-specials', 'Seasonal promotion and limited-time detailing offers.', 5),
    ('Maintenance / Membership', 'maintenance-membership', 'Recurring wash plans, maintenance offers, and memberships.', 6),
    ('Quick Offers / Lead Drivers', 'quick-offers-lead-drivers', 'Fast-converting low-friction lead generation offers.', 7)
) as category_definitions(name, slug, description, sort_order)
where industries.slug = 'car-detailing'
on conflict (industry_id, slug) do update
set
  name = excluded.name,
  description = excluded.description,
  status = excluded.status,
  sort_order = excluded.sort_order,
  updated_at = now();

with template_category_map as (
  select *
  from (
    values
      ('full-detail-promo', 'Full Details', 'full-details'),
      ('interior-detail-promo', 'Interior Only', 'interior-only'),
      ('ceramic-coating-promo', 'Paint Correction & Protection', 'paint-correction-protection'),
      ('paint-correction-promo', 'Paint Correction & Protection', 'paint-correction-protection'),
      ('monthly-maintenance-promo', 'Maintenance / Membership', 'maintenance-membership'),
      ('premium-exterior-detail', 'Full Details', 'full-details')
  ) as mappings(template_slug, category_name, category_slug)
)
update templates
set
  category = mappings.category_name,
  industry = 'Car Detailing',
  industry_id = industries.id,
  category_id = categories.id
from template_category_map mappings
join template_industries industries
  on industries.slug = 'car-detailing'
join template_categories categories
  on categories.industry_id = industries.id
 and categories.slug = mappings.category_slug
where templates.slug = mappings.template_slug;

update templates
set industry_id = industries.id
from template_industries industries
where industries.slug = 'car-detailing'
  and templates.industry = 'Car Detailing'
  and templates.industry_id is distinct from industries.id;

update templates
set category_id = categories.id
from template_industries industries
join template_categories categories
  on categories.industry_id = industries.id
where industries.slug = 'car-detailing'
  and templates.industry = 'Car Detailing'
  and categories.slug = regexp_replace(lower(trim(templates.category)), '[^a-z0-9]+', '-', 'g')
  and (
    templates.category_id is null
    or templates.category_id is distinct from categories.id
  );
