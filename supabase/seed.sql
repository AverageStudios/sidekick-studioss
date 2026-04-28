insert into templates (
  id,
  slug,
  name,
  description,
  category,
  industry,
  offer_type,
  preview_image_url,
  config_json,
  status,
  is_featured,
  published_at,
  updated_at
)
values
  ('tpl-full-detail', 'full-detail-promo', 'Full Detail Promo', 'A fast-launch offer for drivers who want the full interior and exterior reset.', 'Car Detailing', 'Car Detailing', 'Service Booking', '/placeholders/full-detail.jpg', $${
    "positioning": "Best for shops pushing a flagship full detail with a clean entry offer.",
    "ctaDefault": "Claim My Detail",
    "benefits": [
      "Simple offer positioning that works for paid traffic",
      "High-trust before and after story",
      "Quick form that is easy to complete on mobile"
    ],
    "faq": [
      { "question": "What does a full detail include?", "answer": "Interior reset, exterior wash, wheels, trim care, and a polished presentation depending on your package." },
      { "question": "How long does it take?", "answer": "Most full details take half a day to a full day depending on vehicle size and condition." }
    ],
    "adCopy": {
      "primary": "Need your car looking sharp again in {{city}}? {{businessName}} is running a limited full detail offer for drivers who want a full reset without the usual back-and-forth.",
      "headlines": ["Book a full detail in {{city}}", "Get your car fully reset", "Limited full detail offer"],
      "descriptions": ["Built for busy drivers who want a simple before-and-after result.", "Fast quote. Clean finish. Easy booking."],
      "targeting": "Target local drivers within 10-20 miles, recent car buyers, busy professionals, and luxury vehicle owners.",
      "budget": "Start with $20-$35/day for 5 days and move budget toward the best performing audience.",
      "creativeGuidance": ["Lead with a clean hood reflection or interior refresh shot", "Use one strong before-and-after pair", "Keep text minimal and offer-focused"]
    },
    "funnel": {
      "heroHeadline": "Full detail offers made simple for drivers in {{city}}",
      "heroSubheadline": "A clean, polished detail package from {{businessName}} with fast lead capture and easy follow-up.",
      "offerLabel": "Limited full detail offer",
      "whyChooseUs": ["Fast response for paid traffic leads", "Clear package without confusing upsells", "Mobile-friendly page designed to convert"],
      "finalCta": "Get your detail quote"
    }
  }$$::jsonb, 'published', true, now(), now()),
  ('tpl-interior', 'interior-detail-promo', 'Interior Detail Promo', 'A focused funnel for detailers selling interior recovery, stain removal, and refresh jobs.', 'Car Detailing', 'Car Detailing', 'Quote Request', '/placeholders/interior-detail.jpg', $${
    "positioning": "Best for shops booking family vehicles, work trucks, or rideshare interiors.",
    "ctaDefault": "Get Interior Pricing",
    "benefits": [
      "Clear pain-point messaging for messy interiors",
      "Works well with dirty-to-clean creative",
      "Strong lead magnet for practical buyers"
    ],
    "faq": [
      { "question": "Can you remove odors and stains?", "answer": "Most shops can dramatically improve stains, odors, and buildup, with results depending on condition." },
      { "question": "Do you need to see the vehicle first?", "answer": "A quick lead form is enough to start. Shops can confirm specifics after the first contact." }
    ],
    "adCopy": {
      "primary": "Spills, pet hair, crumbs, and daily mess add up fast. {{businessName}} helps drivers in {{city}} get a cleaner interior without a complicated booking process.",
      "headlines": ["Interior details in {{city}}", "Reset your car interior", "Remove stains and buildup"],
      "descriptions": ["Built for busy drivers with family cars, work trucks, and daily drivers.", "Simple quote flow with a clear next step."],
      "targeting": "Target parents, rideshare drivers, commuters, and local service workers with daily-use vehicles.",
      "budget": "Use $15-$30/day to test family-focused and practical value-focused ad angles.",
      "creativeGuidance": ["Show seats, carpets, and center console before and after", "Use close-up proof shots", "Keep the offer grounded and practical"]
    },
    "funnel": {
      "heroHeadline": "Make your interior feel clean again",
      "heroSubheadline": "{{businessName}} helps drivers in {{city}} reset messy interiors with a simple quote-first flow.",
      "offerLabel": "Interior detail special",
      "whyChooseUs": ["Designed for high-intent local traffic", "Perfect for dirty daily-driver pain points", "Easy form completion on mobile"],
      "finalCta": "See interior pricing"
    }
  }$$::jsonb, 'published', true, now(), now()),
  ('tpl-ceramic', 'ceramic-coating-promo', 'Ceramic Coating Promo', 'A premium-feeling campaign for high-ticket coating jobs and paint protection offers.', 'Car Detailing', 'Car Detailing', 'High-Ticket Offer', '/placeholders/ceramic.jpg', $${
    "positioning": "Best for detailers selling higher-ticket paint protection with a premium brand feel.",
    "ctaDefault": "Request Coating Quote",
    "benefits": [
      "Premium landing flow for higher-ticket services",
      "Supports price anchoring against regular pricing",
      "Helps shops communicate long-term value quickly"
    ],
    "faq": [
      { "question": "How long does ceramic coating last?", "answer": "Longevity depends on the package and maintenance routine, but coatings are positioned as long-term protection." },
      { "question": "Is paint correction included?", "answer": "Many ceramic packages include prep or correction work before coating application." }
    ],
    "adCopy": {
      "primary": "Want your paint protected and easier to maintain? {{businessName}} is running a ceramic coating offer for drivers in {{city}} who want a premium finish that lasts.",
      "headlines": ["Ceramic coating in {{city}}", "Protect your paint properly", "Premium shine. Less upkeep."],
      "descriptions": ["Built for premium buyers who want lasting results.", "Clean quote flow with a stronger value story."],
      "targeting": "Target luxury vehicle owners, enthusiasts, recent buyers, and drivers interested in paint protection.",
      "budget": "Start at $30-$50/day because higher-ticket services need enough room for signal.",
      "creativeGuidance": ["Use glossy paint reflections and close-up finish shots", "Anchor the regular price visually", "Keep the page quiet and premium"]
    },
    "funnel": {
      "heroHeadline": "Premium ceramic coating offers for {{city}} drivers",
      "heroSubheadline": "{{businessName}} helps local drivers protect paint, keep gloss longer, and book faster with one clean page.",
      "offerLabel": "Ceramic coating offer",
      "whyChooseUs": ["Premium positioning without a bloated funnel", "Clean value communication for high-ticket buyers", "Built to convert mobile paid traffic"],
      "finalCta": "Request my coating quote"
    }
  }$$::jsonb, 'published', true, now(), now()),
  ('tpl-paint-correction', 'paint-correction-promo', 'Paint Correction Promo', 'A polished campaign for swirl removal, gloss restoration, and paint correction leads.', 'Car Detailing', 'Car Detailing', 'Inspection', '/placeholders/paint-correction.jpg', $${
    "positioning": "Best for detailers selling transformation-focused correction work.",
    "ctaDefault": "See Correction Options",
    "benefits": [
      "Strong fit for visual transformation ads",
      "Helps explain value with simple copy",
      "Works well with one or two elite before-and-after examples"
    ],
    "faq": [
      { "question": "Will every scratch come out?", "answer": "Results depend on paint condition, but the goal is visible gloss improvement and defect reduction." },
      { "question": "Is this for every vehicle?", "answer": "This offer is best for owners who care about appearance and want a higher-end finish." }
    ],
    "adCopy": {
      "primary": "If your paint looks dull, swirled, or tired, {{businessName}} offers paint correction in {{city}} with a simple quote flow and cleaner positioning.",
      "headlines": ["Bring your paint back", "Paint correction in {{city}}", "Gloss restoration made simple"],
      "descriptions": ["For owners who want a cleaner, sharper finish.", "Use one page to explain the offer and collect the lead."],
      "targeting": "Target vehicle owners interested in car care, detailing, enthusiast pages, and luxury or sports models.",
      "budget": "Start at $25-$40/day and optimize against the creative angle with the strongest proof.",
      "creativeGuidance": ["Use light-angle paint shots to show defect removal", "Keep the hero clean and premium", "Lead with transformation proof over feature lists"]
    },
    "funnel": {
      "heroHeadline": "A cleaner finish starts with proper paint correction",
      "heroSubheadline": "{{businessName}} helps drivers in {{city}} restore gloss and remove the dull, tired look with a focused correction offer.",
      "offerLabel": "Paint correction offer",
      "whyChooseUs": ["Simple premium offer flow", "Built for transformation-led creative", "Clear quote step without clutter"],
      "finalCta": "Get my paint quote"
    }
  }$$::jsonb, 'published', false, now(), now()),
  ('tpl-maintenance', 'monthly-maintenance-promo', 'Monthly Maintenance Promo', 'A recurring-revenue funnel for maintenance washes and simple monthly membership style offers.', 'Car Detailing', 'Car Detailing', 'Recurring Maintenance', '/placeholders/maintenance.jpg', $${
    "positioning": "Best for detailers wanting steadier repeat business with a lightweight offer.",
    "ctaDefault": "Join The Wash Plan",
    "benefits": [
      "Supports repeatable local revenue",
      "Simple offer format for existing customers and new traffic",
      "Easy follow-up angle for monthly service"
    ],
    "faq": [
      { "question": "How often should I book maintenance?", "answer": "Most drivers do best with a regular monthly cadence depending on use and parking conditions." },
      { "question": "Is this only for existing customers?", "answer": "No. It can work for new leads or customers stepping down from bigger detail packages." }
    ],
    "adCopy": {
      "primary": "Want to keep your car looking clean without booking from scratch every time? {{businessName}} is offering a simple maintenance plan for drivers in {{city}}.",
      "headlines": ["Monthly detail maintenance", "Keep your car consistently clean", "Simple wash plan in {{city}}"],
      "descriptions": ["A clean recurring offer for drivers who want less hassle.", "Great for repeat business and easy follow-up."],
      "targeting": "Target current customers, local commuters, professionals, and drivers who recently engaged with higher-ticket ads.",
      "budget": "Use $10-$20/day and retarget previous visitors or past lead audiences first.",
      "creativeGuidance": ["Show clean maintenance visuals over heavy restoration shots", "Position it as convenience and consistency", "Use clean recurring-value language"]
    },
    "funnel": {
      "heroHeadline": "Stay clean without starting over every month",
      "heroSubheadline": "{{businessName}} makes it easy for drivers in {{city}} to keep their vehicles consistently clean with a lightweight recurring offer.",
      "offerLabel": "Monthly maintenance offer",
      "whyChooseUs": ["Simple recurring offer for steady revenue", "Fast mobile quote and lead capture flow", "Easy to retarget and follow up"],
      "finalCta": "Join the plan"
    }
  }$$::jsonb, 'published', false, now(), now())
on conflict (id) do update
set
  slug = excluded.slug,
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  industry = excluded.industry,
  offer_type = excluded.offer_type,
  preview_image_url = excluded.preview_image_url,
  config_json = excluded.config_json,
  status = excluded.status,
  is_featured = excluded.is_featured,
  published_at = excluded.published_at,
  updated_at = excluded.updated_at;
