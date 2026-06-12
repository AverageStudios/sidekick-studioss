# Product

## Register

brand

(The repo contains both the public marketing site and the logged-in app. The marketing surface, `app/page.tsx` plus `/product`, `/pricing`, `/faq`, `/academy`, is brand register. App routes such as `/dashboard`, `/campaigns`, `/leads`, `/settings` are product register; treat them as product when working on them.)

## Users

Owners and operators of local service businesses (detailing shops, cleaners, contractors, salons) who want leads from Meta ads but have no time or appetite for Ads Manager. They evaluate the site quickly, on phone as often as desktop, and decide based on whether the product looks trustworthy and obviously faster than doing it themselves.

## Product Purpose

SideKick is a template-driven Meta campaign platform. A business picks an industry template, sets budget and service area, and launches a Facebook/Instagram lead campaign in minutes. Leads land in SideKick with status tracking and follow-up, and hand off to whatever CRM the business already uses. Success for the marketing site: a visitor understands the template-first model within one viewport and starts the 14-day trial.

## Brand Personality

Premium, calm, campaign-first. Confident and specific, never hype. Reference points (named): Stripe purple-on-white restraint, Linear's typographic discipline and product framing, Vercel's hairline structure. The violet (#6558f6) is the single committed accent; the product UI itself is the imagery.

## Anti-references

- Vibe-coded AI landing pages: floating gradient blobs, glassmorphism cards, uppercase tracked eyebrows above every section, count-up stat cards with invented metrics.
- Generic startup SaaS: endless identical icon-card grids, buzzword copy ("supercharge", "seamless"), oversized blob radii (30px+) on everything.
- Cheap urgency: fake social proof, fake logos, inflated numbers.

## Design Principles

1. The product is the hero. Show real-looking SideKick screens and real ad templates, not abstract illustration.
2. One accent, used deliberately. Violet marks action and brand moments; everything else is ink on warm white.
3. Hierarchy through type, not decoration. Sora display weight and scale carry sections; no eyebrow scaffolding.
4. Claims stay honest. Only say what the product does: templates, launch, leads, follow-up, CRM handoff, 14-day trial.
5. Motion is choreography, not garnish. One orchestrated hero load, fitted section reveals, full reduced-motion fallbacks.

## Accessibility & Inclusion

WCAG AA: body text ≥4.5:1 on the warm white background, interactive targets ≥44px, visible focus rings, semantic landmarks. Every animation has a `prefers-reduced-motion` alternative. Mobile-first: local business owners frequently evaluate on phones.
