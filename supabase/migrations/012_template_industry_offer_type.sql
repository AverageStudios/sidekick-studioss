alter table templates
  add column if not exists industry text,
  add column if not exists offer_type text;

create index if not exists templates_industry_idx on templates(industry);
create index if not exists templates_offer_type_idx on templates(offer_type);

update templates
set
  industry = coalesce(
    nullif(industry, ''),
    nullif(config_json->>'industry', ''),
    case slug
      when 'full-detail-promo' then 'Car Detailing'
      when 'interior-detail-promo' then 'Car Detailing'
      when 'ceramic-coating-promo' then 'Car Detailing'
      when 'paint-correction-promo' then 'Car Detailing'
      when 'monthly-maintenance-promo' then 'Car Detailing'
      else null
    end,
    category
  ),
  offer_type = coalesce(
    nullif(offer_type, ''),
    nullif(config_json->>'offerType', ''),
    case slug
      when 'full-detail-promo' then 'Service Booking'
      when 'interior-detail-promo' then 'Quote Request'
      when 'ceramic-coating-promo' then 'High-Ticket Offer'
      when 'paint-correction-promo' then 'Inspection'
      when 'monthly-maintenance-promo' then 'Recurring Maintenance'
      else null
    end
  );

update templates
set category = coalesce(category, industry);

alter table campaigns
  add column if not exists launch_industry text,
  add column if not exists launch_offer_type text;

create index if not exists campaigns_launch_industry_idx on campaigns(launch_industry);
create index if not exists campaigns_launch_offer_type_idx on campaigns(launch_offer_type);

update campaigns
set
  launch_industry = coalesce(
    nullif(launch_industry, ''),
    nullif(launch_state_json->>'industry', ''),
    nullif(launch_category, '')
  ),
  launch_offer_type = coalesce(
    nullif(launch_offer_type, ''),
    nullif(launch_state_json->>'offerType', '')
  );

update campaigns
set launch_category = coalesce(launch_category, launch_industry);
