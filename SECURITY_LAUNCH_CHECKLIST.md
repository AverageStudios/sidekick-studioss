# Security Launch Checklist

Final Phase 8 regression and launch-readiness pass for SideKick Studioss.

## Status Summary

- TypeScript build checks: pass
- Production Next.js build: pass
- ESLint: practical pass when run with the bundled Node runtime used for Next 16
- Security documentation set: present
- Security migrations 024 through 027: present and correctly ordered
- Unauthenticated protected page redirects: pass
- Unauthenticated protected API mutations: pass
- Unsigned Meta webhook rejection: pass
- Signed repeated Meta webhook rate limiting with `429` and `Retry-After`: pass

## Checks Passed

### Build / static verification

- `./node_modules/.bin/tsc --noEmit`
- `next build`
- ESLint via bundled Node runtime

### Security documentation present

- `SECURITY_AUDIT.md`
- `SECURITY_FIXES_PHASE_2.md`
- `SECURITY_FIXES_PHASE_3.md`
- `SECURITY_FIXES_PHASE_4.md`
- `SECURITY_FIXES_PHASE_5.md`
- `SECURITY_FIXES_PHASE_5_5.md`
- `SECURITY_FIXES_PHASE_6.md`
- `SECURITY_FIXES_PHASE_7.md`

### Migrations present and ordered

- `024_security_rls_hardening.sql`
- `025_post_rls_smoke_fixes.sql`
- `026_service_role_internal_table_grants.sql`
- `027_crm_delivery_table_postgrest_repair.sql`

No newer migration was found that appears required for the currently known security issues covered by Phases 2 through 7.

### Route smoke tests

Tested against a local production server:

- `/` -> `200`
- `/login` -> `200`
- `/signup` -> `200`
- `/dashboard` -> `307` to `/login`
- `/templates` -> `307` to `/login`
- `/product/templates` -> `200`
- `/admin/templates` -> `307` to `/login`
- `/workspace/settings` -> `307` to `/login`

### Auth callback safety

- `/auth/callback?code=fake` redirected to the login flow with a Supabase PKCE/session error
- no open redirect behavior was observed
- callback handling remained inside the configured app/auth flow

### API security smoke tests

Anonymous requests using the correct HTTP methods returned `401 Unauthorized`:

- `POST /api/campaign-drafts`
- `POST /api/meta/preflight`
- `POST /api/meta/publish`
- `POST /api/admin/template-media-upload`
- `POST /api/admin/template-preview-upload`

Meta webhook checks:

- unsigned `POST /api/meta/webhook` -> `403`
- repeated signed `POST /api/meta/webhook` -> `429`
- `Retry-After` header present on `429`

Observed rate-limit threshold during local test:

- rate limit hit on approximately attempt `241`
- `Retry-After: 60`

### RLS / data security review

Confirmed by migration review:

- anon cannot read `leads`
- anon cannot insert `leads` directly
- anon and authenticated users can read published templates
- normal users should not read unpublished templates unless admin
- provider token tables are revoked from anon/authenticated browser roles
- lead delivery tables are revoked from anon/authenticated and granted to `service_role`
- CRM routing and internal provider tables are narrowed to authenticated workspace access or service-role-only paths

Files supporting that review:

- `supabase/migrations/024_security_rls_hardening.sql`
- `supabase/migrations/025_post_rls_smoke_fixes.sql`
- `supabase/migrations/026_service_role_internal_table_grants.sql`
- `supabase/migrations/027_crm_delivery_table_postgrest_repair.sql`

## Manual Checks Still Needed

These require real browser/provider/database testing and were not fully proven by local static or unauthenticated smoke tests:

1. Google sign-in
2. email signup/login
3. Supabase auth callback after a real auth flow
4. dashboard load after sign-in
5. templates load after sign-in
6. template images load
7. admin template create/edit/publish
8. public lead form submit
9. Meta connect/callback
10. CRM connect/callback
11. lead status/notes update
12. CRM retry when real delivery rows exist
13. workspace settings integrations UI with real connected providers
14. support ticket user/admin flows

## Deployment Checklist

### Supabase

1. Apply migrations `024` through `027` in order.
2. Confirm PostgREST schema reload completed after migrations `026` and `027`.
3. Confirm Site URL matches production app domain.
4. Confirm auth redirect URLs include `/auth/callback`.

### OAuth / provider config

1. Confirm Google OAuth redirect URI is aligned with Supabase callback expectations.
2. Confirm `NEXT_PUBLIC_APP_URL` is the production domain.
3. Confirm `META_REDIRECT_URI` matches the production Meta callback exactly.
4. Confirm `CRM_OAUTH_REDIRECT_URI` matches the production CRM callback exactly.
5. Confirm GoHighLevel marketplace install settings match the production callback.

### Secrets / env vars

1. Set Vercel env vars from the current env inventory.
2. Add Upstash env vars:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. Confirm:
   - `META_APP_SECRET`
   - `META_WEBHOOK_VERIFY_TOKEN`
   - `META_TOKEN_ENCRYPTION_KEY`
   - `CRM_TOKEN_ENCRYPTION_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### Deploy

1. Redeploy after env var changes.
2. Run post-deploy smoke tests for:
   - `/`
   - `/login`
   - `/signup`
   - `/dashboard`
   - `/workspace/settings`
   - `/auth/callback`
   - Meta connect/callback
   - CRM connect/callback
   - public lead capture
   - webhook delivery path

## Known Remaining Risks

- Local regression confirmed route/API protection and migration intent, but full authenticated browser validation still depends on real Supabase, Google, Meta, and CRM provider flows.
- The `/auth/callback` smoke test with a fake code is useful for redirect safety, but it is not a substitute for a full end-to-end auth session test.
- RLS behavior was validated by migration/policy review, not by live SQL role simulation inside this pass.
- The repo still contains unrelated in-progress product changes outside this security phase, so launch should use an intentional release cut rather than assuming the whole worktree is production-ready as-is.

## Go / No-Go Recommendation

Recommendation: `GO`, with a short manual pre-launch verification pass.

Rationale:

- the major security hardening phases are present
- the production build is passing
- unauthenticated page and API boundaries are behaving correctly
- webhook signature enforcement and rate limiting are behaving correctly
- migration coverage for the known RLS/service-role issues is present

Hold launch only if:

- production env vars are incomplete
- migrations `024` through `027` are not applied in production
- real provider/browser smoke tests fail
