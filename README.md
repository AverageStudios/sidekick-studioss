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
- Admin-only template management routes for creating, editing, featuring, and publishing master templates
- Seeded campaign templates for detailing offers
- Template setup flow with business info, offer details, branding, proof, and publish settings
- Generated campaign output with ad copy, headlines, descriptions, targeting notes, and budget guidance
- Public funnel publishing at `/f/[slug]`
- Lead capture and status updates
- Optional confirmation email plumbing via Resend
- Optional explicit demo mode when `NEXT_PUBLIC_DEMO_MODE=1`

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

If you want the demo experience, set `NEXT_PUBLIC_DEMO_MODE=1`. Otherwise the app expects real Supabase auth and will not silently impersonate a demo user.

## Supabase setup

1. Create a Supabase project.
2. Add the values from `.env.example` to `.env.local`.
3. Create a public storage bucket named `assets`, or set `SUPABASE_STORAGE_BUCKET` if you want to use a different bucket name.
4. Run the SQL in `supabase/migrations/001_initial.sql`.
5. Run the SQL in `supabase/migrations/002_roles_and_template_admin.sql`.
6. Run the SQL in `supabase/migrations/003_user_onboarding.sql`.
7. Run the SQL in `supabase/seed.sql`.

Required env vars:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=assets
```

What each env var is used for:

- `NEXT_PUBLIC_APP_URL`: canonical app URL for local/dev links
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL for public and server clients
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: public anon key used by auth/public clients
- `SUPABASE_SERVICE_ROLE_KEY`: server-only key used for writes, storage uploads, and server data access
- `SUPABASE_STORAGE_BUCKET`: optional bucket name for uploaded assets; defaults to `assets`
- `RESEND_API_KEY`: optional email API key
- `RESEND_FROM_EMAIL`: optional sender address for confirmation emails

If Supabase public env vars are missing, auth will stay disabled unless you explicitly enable demo mode.

If the service-role key is missing, the app still renders safely, but writes, uploads, and persisted lead actions are skipped.

## Schema notes for Phase 2

- `profiles` stores app-level user roles tied to Supabase auth users.
- `profiles` also stores first-run onboarding state, selected industry, and the user's starting template.
- `templates` now supports admin workflow fields such as `status`, `is_featured`, `created_by`, `published_at`, and `updated_at`.
- `campaigns` now stores `source_template_version` so user campaign instances stay tied to the master template version they were created from.

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
3. Make sure the Supabase storage bucket exists, or leave `SUPABASE_STORAGE_BUCKET=assets` and let the app auto-create it with the service role.
4. Deploy.

## Project structure

- `app/` routes and server actions
- `components/` reusable UI
- `data/` seeded template content
- `lib/` auth, Supabase helpers, template generation, demo data, and utilities
- `services/` uploads and follow-up services
- `supabase/` migrations and template seed SQL
- `types/` shared types
