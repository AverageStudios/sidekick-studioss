# Security Fixes Phase 7

Phase 7 hardens SideKick Studioss around secrets, environment variables, OAuth redirect safety, deployment setup, and logging hygiene without changing core product behavior.

## Files Changed

- `lib/meta.ts`
- `README.md`
- `.env.example`
- `SECURITY_FIXES_PHASE_7.md`

## Environment Variable Inventory

### Public frontend-safe

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_DEMO_MODE`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Why these are public-safe:

- they are used by browser code or client bootstrap flows
- they do not grant elevated database or provider access on their own

### Server-only

- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `META_APP_ID`
- `META_APP_SECRET`
- `META_REDIRECT_URI`
- `META_SCOPES`
- `META_WEBHOOK_VERIFY_TOKEN`
- `META_GRAPH_API_VERSION`
- `META_TOKEN_ENCRYPTION_KEY`
- `CRM_TOKEN_ENCRYPTION_KEY`
- `CRM_OAUTH_REDIRECT_URI`
- `GHL_REDIRECT_URI`
- `GHL_CLIENT_ID`
- `GHL_CLIENT_SECRET`
- `GHL_INSTALL_URL`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

### Production required

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Required when the corresponding feature is enabled in production:

- Meta:
  - `META_APP_ID`
  - `META_APP_SECRET`
  - `META_REDIRECT_URI`
  - `META_WEBHOOK_VERIFY_TOKEN`
  - `META_TOKEN_ENCRYPTION_KEY`
- CRM handoff:
  - `CRM_TOKEN_ENCRYPTION_KEY`
  - `CRM_OAUTH_REDIRECT_URI`
- GoHighLevel OAuth:
  - `GHL_CLIENT_ID`
  - `GHL_CLIENT_SECRET`
  - `GHL_INSTALL_URL`
- shared production rate limiting:
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
- confirmation email:
  - `RESEND_API_KEY`
  - `RESEND_FROM_EMAIL`

### Optional / dev fallback

- `NEXT_PUBLIC_DEMO_MODE`
- `DEMO_MODE`
- `SUPABASE_STORAGE_BUCKET` if using the default `assets`
- `META_SCOPES`
- `META_GRAPH_API_VERSION`
- `GHL_REDIRECT_URI` as a legacy alias for `CRM_OAUTH_REDIRECT_URI`
- missing Upstash vars fall back to in-memory rate limiting

## NEXT_PUBLIC Safety Review

Confirmed browser-exposed vars are limited to:

- app URL
- demo mode flag
- Supabase project URL
- Supabase anon key

No server secret in the current repo uses a `NEXT_PUBLIC_` prefix.

`SUPABASE_SERVICE_ROLE_KEY` is read only from server code and is not referenced from browser components.

## Service Role Usage Table

`SUPABASE_SERVICE_ROLE_KEY` is loaded through `lib/env.ts` and instantiated only in `lib/supabase/admin.ts`.

Current service-role usage patterns:

- `lib/auth.ts`
  - profile bootstrap and workspace context initialization after auth
- `app/auth/callback/route.ts`
  - post-login workspace setup after Supabase session exchange
- authenticated app routes and server actions in `app/actions.ts`
  - workspace changes
  - campaign mutations
  - support ticket creation and replies
  - CRM retry actions
  - admin template and library mutations
- workspace-scoped settings/data pages
  - `app/workspace/settings/page.tsx`
  - `app/dashboard/page.tsx`
  - `app/performance/page.tsx`
  - support/admin pages
- protected API routes
  - Meta publish, preflight, budget guidance, location search, campaign drafts
  - CRM OAuth callback persistence
- verified webhook/public automation path
  - `app/api/meta/webhook/route.ts`

Safety notes:

- authenticated routes/actions generally verify the current user first
- workspace-scoped routes check membership or ownership before writes
- admin-only paths rely on existing admin role checks
- the Meta webhook path is the main verified public exception and requires signed webhook validation before admin access is used

## OAuth Redirect Checklist

### Google / Supabase auth

- browser login starts from `components/social-auth-buttons.tsx`
- redirect target is built from `new URL("/auth/callback", env.appUrl)`
- callback safety is enforced in `app/auth/callback/route.ts`
- `next` is constrained to internal paths with `next?.startsWith("/") ? next : "/dashboard"`
- no open redirect behavior was found in the auth callback

### Meta OAuth

- connect route: `/api/meta/connect`
- callback route: `/api/meta/callback`
- callback target is based on `META_REDIRECT_URI` or `env.appUrl`
- post-connect redirect is constrained to internal paths

### CRM OAuth

- connect route: `/api/integrations/crm/connect`
- neutral callback route: `/api/integrations/crm/callback`
- provider is carried in signed state/cookie context, not the URL path
- post-connect redirect is constrained to internal paths

### Local vs production callback values

- local auth callback:
  - `http://localhost:3000/auth/callback`
- local CRM OAuth callback:
  - `http://localhost:3000/api/integrations/crm/callback`
- production auth callback:
  - `https://sidekickstudioss.com/auth/callback`
- production CRM OAuth callback:
  - `https://sidekickstudioss.com/api/integrations/crm/callback`
- production Meta callback:
  - `https://sidekickstudioss.com/api/meta/callback`

No hardcoded localhost redirect was found in production OAuth code paths. Localhost references remain in docs and development-only CSP allowances, which is expected.

## Logging Hygiene Patch

`lib/meta.ts` now redacts these request fields before logging Meta API failures:

- `access_token`
- `client_secret`
- `code`
- `fb_exchange_token`
- `input_token`
- `refresh_token`

This keeps provider error diagnostics useful without leaking OAuth exchange data into server logs.

## Secret Leak Check

### Tracked files reviewed

- `README.md`
- `UPHEX-PREVIEW/index.html` before removal

### Findings

- No committed Supabase service-role key was found in tracked source files.
- No committed Upstash token, Meta app secret, GoHighLevel client secret, or Resend API key was found in tracked source files.
- `UPHEX-PREVIEW/index.html` contained a live-looking publishable key pattern before removal.

Assessment:

- this appeared to be a publishable frontend key pattern rather than a server secret
- it was not used by the SideKick runtime
- the entire unused preview artifact was removed from tracked source

If any real server secret was ever committed outside the current working tree, it should be treated as P0 and rotated immediately in the upstream provider.

## Vercel Production Env Checklist

### Core app

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`

### Auth

- Supabase project auth settings:
  - Site URL = production app URL
  - redirect URLs include `/auth/callback`

### Meta

- `META_APP_ID`
- `META_APP_SECRET`
- `META_REDIRECT_URI`
- `META_SCOPES`
- `META_WEBHOOK_VERIFY_TOKEN`
- `META_GRAPH_API_VERSION`
- `META_TOKEN_ENCRYPTION_KEY`

### CRM

- `CRM_TOKEN_ENCRYPTION_KEY`
- `CRM_OAUTH_REDIRECT_URI`
- `GHL_CLIENT_ID`
- `GHL_CLIENT_SECRET`
- `GHL_INSTALL_URL`

### Rate limiting

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

### Email

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

## Deployment Safety Notes

- HSTS remains production-only
- CSP keeps development-only localhost and websocket allowances out of production
- Upstash Redis remains optional in development and shared in production when env vars are present
- OAuth redirects depend on `NEXT_PUBLIC_APP_URL`, `META_REDIRECT_URI`, and `CRM_OAUTH_REDIRECT_URI` being set correctly per environment

## Manual Deploy Checklist

1. Set `NEXT_PUBLIC_APP_URL` to the canonical production origin.
2. Confirm Supabase Auth Site URL and redirect URLs match production.
3. Confirm Google sign-in is configured in Supabase and returns through `/auth/callback`.
4. Confirm Meta App OAuth redirect URI exactly matches `META_REDIRECT_URI`.
5. Confirm GoHighLevel marketplace app redirect URI exactly matches `CRM_OAUTH_REDIRECT_URI`.
6. Add Upstash production env vars for shared rate limiting.
7. Redeploy.
8. Smoke test:
   - `/login`
   - `/signup`
   - `/auth/callback`
   - `/workspace/settings?section=integrations`
   - Meta connect
   - GoHighLevel connect
   - public lead capture
   - Meta webhook delivery

## Remaining Risks / Follow-Ups

- `NEXT_PUBLIC_APP_URL` is security-sensitive configuration even though it is public-safe. A wrong value can still misroute OAuth and email confirmation callbacks.
- Future static preview/export bundles are now ignored through `.gitignore` rules for `*-PREVIEW/` and `*-EXPORT/`.
- Some server logs still intentionally include sanitized provider error context for operational debugging. Continue avoiding raw provider payload logging in future integrations.
