insert into templates (id, slug, name, description, category, preview_image_url, config_json)
values
  ('tpl-full-detail', 'full-detail-promo', 'Full Detail Promo', 'A fast-launch offer for drivers who want the full interior and exterior reset.', 'Lead Generation', '/placeholders/full-detail.jpg', '{"ctaDefault":"Claim My Detail"}'::jsonb),
  ('tpl-interior', 'interior-detail-promo', 'Interior Detail Promo', 'A focused funnel for detailers selling interior recovery, stain removal, and refresh jobs.', 'Lead Generation', '/placeholders/interior-detail.jpg', '{"ctaDefault":"Get Interior Pricing"}'::jsonb),
  ('tpl-ceramic', 'ceramic-coating-promo', 'Ceramic Coating Promo', 'A premium-feeling campaign for high-ticket coating jobs and paint protection offers.', 'Premium Service', '/placeholders/ceramic.jpg', '{"ctaDefault":"Request Coating Quote"}'::jsonb),
  ('tpl-paint-correction', 'paint-correction-promo', 'Paint Correction Promo', 'A polished campaign for swirl removal, gloss restoration, and paint correction leads.', 'Premium Service', '/placeholders/paint-correction.jpg', '{"ctaDefault":"See Correction Options"}'::jsonb),
  ('tpl-maintenance', 'monthly-maintenance-promo', 'Monthly Maintenance Promo', 'A recurring-revenue funnel for maintenance washes and simple monthly membership style offers.', 'Recurring Revenue', '/placeholders/maintenance.jpg', '{"ctaDefault":"Join The Wash Plan"}'::jsonb)
on conflict (id) do update
set
  slug = excluded.slug,
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  preview_image_url = excluded.preview_image_url,
  config_json = excluded.config_json;

