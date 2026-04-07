# SideKick Studioss

SideKick Studioss is a focused MVP for car detailers who want plug-and-play ads and funnels without a bloated CRM.

The product is intentionally narrow:

1. Sign up
2. Pick a template
3. Customize a few fields
4. Publish a simple funnel
5. Capture leads
6. Optionally send a confirmation email

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- Supabase for auth, database, and storage
- Resend for lightweight confirmation emails
- Vercel-ready deployment

## Features implemented

- Marketing site with hero, benefits, how it works, template preview, FAQ, CTA, and footer
- Auth flow for sign up, sign in, and sign out
- Protected dashboard, templates, leads, campaign, funnel, and settings pages
- Seeded campaign templates for detailing offers
- Template setup flow with business info, offer details, branding, proof, and publish settings
- Generated campaign output with ad copy, headlines, descriptions, targeting notes, and budget guidance
- Public funnel publishing at `/f/[slug]`
- Lead capture and status updates
- Optional confirmation email plumbing via Resend
- Demo fallback mode when Supabase env vars are not configured

## Intentionally left out of V1

- Full CRM
- Conversation inbox
- Calendar booking system
- Direct Facebook ad publishing
- Drag-and-drop page builder
- Deep analytics
- Team or agency admin complexity
- Full SMS automation

## Install

Use Node 20+.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase setup

1. Create a Supabase project.
2. Add the values from `.env.example` to `.env.local`.
3. Create a public storage bucket named `assets`.
4. Run the SQL in `supabase/migrations/001_initial.sql`.
5. Run the SQL in `supabase/seed.sql`.

Required env vars:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

If Supabase is not configured yet, the app still runs in demo mode so you can review the UX and structure.

## Resend setup

Confirmation email is optional.

```bash
RESEND_API_KEY=
RESEND_FROM_EMAIL=hello@yourdomain.com
```

If those values are missing, lead confirmation email is skipped without breaking the lead flow.

## Local development

```bash
npm run dev
```

## Deploy to Vercel

1. Import the `sidekick-studioss` folder into Vercel.
2. Add the environment variables from `.env.example`.
3. Make sure the Supabase `assets` bucket exists.
4. Deploy.

## Project structure

- `app/` routes and server actions
- `components/` reusable UI
- `data/` seeded template content
- `lib/` auth, Supabase helpers, template generation, demo data, and utilities
- `services/` uploads and follow-up services
- `supabase/` migrations and template seed SQL
- `types/` shared types
