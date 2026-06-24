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

insert into template_categories (
  industry_id,
  name,
  slug,
  description,
  status,
  sort_order
)
select
  industries.id,
  'Car Detailing',
  'car-detailing',
  'Campaign templates for mobile and shop-based auto detailing businesses.',
  'active',
  2
from template_industries industries
where industries.slug = 'car-detailing'
on conflict (industry_id, slug) do update
set
  name = excluded.name,
  description = excluded.description,
  status = excluded.status,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into templates (
  id,
  slug,
  name,
  description,
  category,
  industry,
  category_id,
  industry_id,
  offer_type,
  preview_image_url,
  config_json,
  status,
  is_featured,
  version,
  created_by,
  published_at,
  updated_at
)
values (
  'tpl-premium-exterior-detail',
  'premium-exterior-detail',
  'Premium Exterior Detail',
  'Promote premium exterior detailing for drivers who care about how their car looks.',
  'Car Detailing',
  'Car Detailing',
  (
    select categories.id
    from template_categories categories
    join template_industries industries on industries.id = categories.industry_id
    where industries.slug = 'car-detailing'
      and categories.slug = 'car-detailing'
    limit 1
  ),
  (
    select industries.id
    from template_industries industries
    where industries.slug = 'car-detailing'
    limit 1
  ),
  'Quote Request',
  '/template-creatives/car-detailing/because-clean-turns-heads.webp',
  jsonb_build_object(
    'industry', 'Car Detailing',
    'positioning', 'Best for premium exterior detail and paint-enhancement offers that need a polished, high-status feel.',
    'campaignType', 'standard',
    'audienceType', 'b2c',
    'offerFramework', 'direct_response',
    'displayLink', 'sidekickstudioss.com',
    'adFormat', 'individual',
    'mediaType', 'image',
    'supportedAdTypes', to_jsonb(array['lead_form']::text[]),
    'defaultAdType', 'lead_form',
    'promoDetails', 'Luxury, bold, high-status automotive creative built for premium exterior detail services.',
    'ctaDefault', 'Request Quote',
    'offerStructure', jsonb_build_array(
      'Lead with the status and finish angle',
      'Use the visual transformation as proof',
      'Route the lead into a short quote request'
    ),
    'benefits', jsonb_build_array(
      'Premium exterior positioning for higher-intent local buyers',
      'Clean visual hierarchy with strong status cues',
      'Simple lead form flow for quote requests'
    ),
    'faq', jsonb_build_array(
      jsonb_build_object(
        'question', 'What does a premium exterior detail include?',
        'answer', 'Exterior wash, paint-safe cleaning, wheels, tires, trim, and finish-focused detailing depending on the package.'
      ),
      jsonb_build_object(
        'question', 'Is this good for high-end vehicles?',
        'answer', 'Yes. This template is designed for premium detailing, paint enhancement, and drivers who care about presentation.'
      )
    ),
    'creativeAngle', 'status_transformation',
    'creativePackage', jsonb_build_object(
      'name', 'Because Clean Turns Heads',
      'slug', 'because-clean-turns-heads',
      'ad_type', 'lead_form',
      'image_url', '/template-creatives/car-detailing/because-clean-turns-heads.webp',
      'image_text', 'BECAUSE CLEAN TURNS HEADS\nBOOK NOW',
      'primary_text', 'Your car should look as good as it drives.\n\nGet a premium detail that brings back the shine, removes buildup, and gives your vehicle that clean, head-turning finish.\n\n✅ Exterior wash & detail\n✅ Wheels, tires, trim & shine\n✅ Paint-safe cleaning\n✅ Interior add-ons available\n\n⚡ Request a free quote today.\n{{urgency_text}}',
      'headline', 'Because Clean Turns Heads',
      'link_description', 'Bring back the clean, polished look.',
      'cta', 'GET_QUOTE',
      'form_headline', 'Request Your Premium Detail Quote',
      'form_description', '{{business_name}} will follow up with pricing and availability after reviewing your vehicle details.',
      'thank_you_headline', 'Thanks — we received your request!',
      'thank_you_description', '{{business_name}} will reach out soon with availability, pricing, and next steps.'
    ),
    'adCopy', jsonb_build_object(
      'primary', 'Your car should look as good as it drives.\n\nGet a premium detail that brings back the shine, removes buildup, and gives your vehicle that clean, head-turning finish.\n\n✅ Exterior wash & detail\n✅ Wheels, tires, trim & shine\n✅ Paint-safe cleaning\n✅ Interior add-ons available\n\n⚡ Request a free quote today.\n{{urgency_text}}',
      'headlines', jsonb_build_array(
        'Because Clean Turns Heads',
        'Make Your Car Stand Out Again',
        'Book a Premium Exterior Detail'
      ),
      'descriptions', jsonb_build_array(
        'Built for drivers who care about presentation and finish quality.',
        'Clean, high-status exterior detailing with a simple quote flow.'
      ),
      'targeting', 'Target local drivers, luxury vehicle owners, and drivers who care about their car''s appearance and finish.',
      'budget', 'Start with $20-$40/day and optimize for the strongest premium-intent response.',
      'creativeGuidance', jsonb_build_array(
        'Keep the visual premium and uncluttered',
        'Use large typography with strong contrast',
        'Avoid discount language or budget positioning'
      )
    ),
    'funnel', jsonb_build_object(
      'heroHeadline', 'Because clean turns heads',
      'heroSubheadline', 'A premium exterior detail for drivers in {{city}} who want a sharper, cleaner finish.',
      'offerLabel', 'Premium exterior detail',
      'whyChooseUs', jsonb_build_array(
        'Designed for high-intent local buyers',
        'Built around premium finish and presentation',
        'Simple quote flow that feels polished and fast'
      ),
      'finalCta', 'Request my quote',
      'pageIntro', 'Tell us a little about your vehicle and what kind of finish you want.',
      'formCta', 'Request your premium detail quote',
      'formFields', to_jsonb(array['Full name', 'Phone number', 'Email', 'Vehicle type', 'Service interest', 'Timeline']::text[]),
      'nextStepFlow', jsonb_build_array(
        'Submit the form',
        'We review the vehicle and service needs',
        'Our team follows up with pricing and availability'
      )
    ),
    'leadFlowDefaults', jsonb_build_object(
      'pageIntro', 'Tell us about your vehicle and the kind of detail you need.',
      'formCta', 'Request your premium detail quote',
      'formFields', to_jsonb(array['Full name', 'Phone number', 'Email', 'Vehicle type', 'Service interest', 'Timeline']::text[]),
      'nextStepFlow', jsonb_build_array(
        'Submit the form',
        'We review your request',
        'We follow up with pricing and availability'
      )
    ),
    'leadFormSettings', jsonb_build_object(
      'formType', 'higher_intent',
      'locale', 'EN_US',
      'sameLeadForm', false,
      'enablePhoneOtp', false,
      'backgroundImageSource', 'default',
      'greetingTitle', 'Request Your Premium Detail Quote',
      'greetingBody', 'Tell us about your vehicle and what kind of detail you need.',
      'multipleChoiceQuestions', jsonb_build_array(
        jsonb_build_object(
          'label', 'What type of vehicle do you need detailed?',
          'options', jsonb_build_array('Sedan', 'SUV', 'Truck', 'Van', 'Luxury / Exotic', 'Other')
        ),
        jsonb_build_object(
          'label', 'What service are you interested in?',
          'options', jsonb_build_array('Exterior detail', 'Interior detail', 'Full interior & exterior', 'Paint correction / polish', 'Not sure yet')
        ),
        jsonb_build_object(
          'label', 'When are you looking to book?',
          'options', jsonb_build_array('As soon as possible', 'This week', 'This month', 'Just getting pricing')
        )
      ),
      'shortQuestions', jsonb_build_array(),
      'standardQuestions', jsonb_build_array('FULL_NAME', 'PHONE', 'EMAIL'),
      'disclaimerTitle', 'Quote request',
      'disclaimerBody', 'By submitting this form, you agree to be contacted about your vehicle detail request.',
      'disclaimerConsent', 'I agree to be contacted about my quote request.',
      'privacyPolicyUrl', '',
      'enableMessenger', false
    ),
    'adTypeConfig', jsonb_build_object(
      'lead_form', jsonb_build_object(
        'thankYouEnabled', true,
        'thankYouHeadline', 'Thanks — we received your request!',
        'thankYouDescription', '{{business_name}} will reach out soon with availability, pricing, and next steps.',
        'thankYouButtonLabel', 'Back to site',
        'thankYouWebsiteUrl', ''
      ),
      'landing_page', jsonb_build_object(
        'landingPageUrl', ''
      ),
      'call_now', jsonb_build_object(
        'phoneNumber', ''
      ),
      'messenger_leads', jsonb_build_object(
        'messengerWelcomeMessage', '',
        'messengerReplyPrompt', ''
      ),
      'messenger_engagement', jsonb_build_object(
        'messengerWelcomeMessage', '',
        'messengerReplyPrompt', ''
      )
    ),
    'creativeAssets', jsonb_build_object(
      'imageUrls', to_jsonb(array['/template-creatives/car-detailing/because-clean-turns-heads.webp']::text[]),
      'videoUrls', '[]'::jsonb
    ),
    'placeholderFields', jsonb_build_array(
      jsonb_build_object(
        'id', 'business_name',
        'label', 'Business Name',
        'type', 'text',
        'required', true
      ),
      jsonb_build_object(
        'id', 'city',
        'label', 'City / Service Area',
        'type', 'text',
        'required', true
      ),
      jsonb_build_object(
        'id', 'urgency_text',
        'label', 'Urgency Text',
        'type', 'text',
        'required', false,
        'defaultValue', 'Limited openings this week.'
      )
    ),
    'mediaGuidance', jsonb_build_object(
      'uploaded_asset_name', 'Black and Red Modern automotive Flyer.png',
      'recommended_format', '4:5 static image',
      'recommended_size', '1080x1350',
      'creative_style', 'Luxury, bold, high-status automotive creative with large white typography over a premium vehicle image.',
      'image_notes', 'This creative is best for premium exterior detail, ceramic coating, paint correction, luxury detailing, or high-end full detail offers. Do not use it for budget/detail-discount positioning.'
    ),
    'testingNotes', 'This ad tests a status and visual transformation angle. It is designed to attract drivers who care about appearance, pride of ownership, and premium vehicle presentation. It may generate fewer leads than a discount ad, but should attract higher-intent and higher-ticket detail customers.',
    'expectedLeadQuality', 'high',
    'expectedVolume', 'medium'
  ),
  'published',
  true,
  1,
  null,
  now(),
  now()
)
on conflict (id) do update
set
  slug = excluded.slug,
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  industry = excluded.industry,
  category_id = excluded.category_id,
  industry_id = excluded.industry_id,
  offer_type = excluded.offer_type,
  preview_image_url = excluded.preview_image_url,
  config_json = excluded.config_json,
  status = excluded.status,
  is_featured = excluded.is_featured,
  version = excluded.version,
  created_by = excluded.created_by,
  published_at = excluded.published_at,
  updated_at = excluded.updated_at;
