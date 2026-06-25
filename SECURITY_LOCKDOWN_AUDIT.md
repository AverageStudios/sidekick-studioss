# SideKick Studioss Security Lockdown Audit

Audit date: 2026-06-25

Scope: static code review, local repo/history checks, public GitHub visibility check, dependency audit, secret scanning, and focused review of auth, authorization, RLS-facing server code, public lead capture, Meta, Stripe, CRM, uploads, logging, rate limiting, and security headers.

No app behavior was intentionally changed in this audit. Only safe guardrails and documentation were added.

## Executive Answer

1. Am I safe to leave this alone tonight?
   - Mostly yes for an overnight pause. I did not find an obvious active P0 such as committed production secrets, unauthenticated lead mutation, unsigned Meta webhook processing, or direct token table exposure in the reviewed code.
   - I would not call it launch-ready yet. The public repo status plus the shared env module/client import and dependency advisories should be handled before launch.

2. Anything could get hacked right now?
   - I did not confirm a "drop everything" active exploit in the current app code.
   - The highest practical risks are hardening risks: public repository hygiene, shared server/client env boundaries, broad `next` redirect allowlists, upload validation gaps in older actions, external API abuse on un-rate-limited location search, and known dependency advisories.

3. Secrets found in repo/history?
   - Tracked files now: no real `.env` file is tracked besides `.env.example`.
   - Git history filename scan: no `.env.local` or equivalent secret env file was found in history.
   - Targeted high-confidence history scan: no SideKick production-style API keys were confirmed. The scan did return noisy historical `UPHEX-PREVIEW` JavaScript matches that look like public/minified JS false positives rather than credentials.
   - Local working tree: real secrets were found in ignored `.env.local` only: Supabase service role key, Resend key, and Meta app secret. They were redacted by the scanner and are not tracked.

4. Safe safeguards added?
   - Added local secret-scan ignore patterns to `.gitignore`.
   - Added `scripts/scan-secrets.js`.
   - Added `npm run security:secrets`.
   - Created this audit report.

5. Actual app functionality changed?
   - No. Runtime app/auth/database/Meta/CRM/billing/public lead behavior was not changed.

6. Top 3 before launch?
   - Split client-safe env from server-only env so client bundles never import a module that references secret env names.
   - Patch dependency advisories, especially Next.js and `ws`, and rerun build/regression checks.
   - Replace all `startsWith("/")` redirect/next checks with a shared safe-relative-path helper that rejects `//host`, backslash paths, and encoded protocol-relative paths.

## Files Changed By This Audit

- `.gitignore`
  - Added local backup/report/secret-scan output ignore patterns.
- `package.json`
  - Added `security:secrets` script.
- `scripts/scan-secrets.js`
  - Added a local high-confidence secret scanner with redacted output.
- `SECURITY_LOCKDOWN_AUDIT.md`
  - Added this report.

## Public Repo And Git Safety

- GitHub remote: `https://github.com/AverageStudios/sidekick-studioss.git`
- Visibility from `gh repo view`: `PUBLIC`
- Current branch: `main`
- Tracked env-like files: `.env.example` only.
- Tracked export-like files: `exports/sidekick-public-website-text.pdf` is tracked.

Assessment:
- Public repo is acceptable only if secrets never enter git. The current tracked tree did not show real env secrets.
- Because the repo is public, secret scanning should run before every push.
- The tracked `exports/sidekick-public-website-text.pdf` does not appear to be an active secret issue from the quick scan, but public export artifacts should be reviewed and removed if not intentionally public.

## Route Inventory

API routes reviewed and classification:

- `app/api/admin/template-media-upload/route.ts` - app admin only
- `app/api/admin/template-preview-upload/route.ts` - app admin only
- `app/api/billing/create-checkout-session/route.ts` - authenticated user
- `app/api/billing/create-portal-session/route.ts` - authenticated user
- `app/api/billing/sync-checkout-session/route.ts` - authenticated user
- `app/api/billing/sync-subscription/route.ts` - authenticated user
- `app/api/campaign-drafts/route.ts` - authenticated paid user
- `app/api/integrations/*/connect/route.ts` - authenticated user/workspace member, OAuth redirect
- `app/api/integrations/*/callback/route.ts` - authenticated user/workspace member, OAuth callback
- `app/api/integrations/crm/connect/route.ts` - authenticated paid workspace member
- `app/api/integrations/crm/callback/route.ts` - authenticated paid workspace member, OAuth callback
- `app/api/location-search/route.ts` - authenticated workspace member with Meta connection
- `app/api/meta/budget-guidance/route.ts` - authenticated paid workspace member
- `app/api/meta/callback/route.ts` - authenticated workspace member, OAuth callback
- `app/api/meta/connect/route.ts` - authenticated workspace member
- `app/api/meta/preflight/route.ts` - authenticated paid user
- `app/api/meta/publish/route.ts` - authenticated paid user
- `app/api/meta/webhook/route.ts` - webhook only
- `app/api/stripe/webhook/route.ts` - webhook only

Server actions reviewed from `app/actions.ts` include auth, billing, support, campaign lifecycle, workspace membership, public lead submission, Done-For-You request, admin client invite/subaccount actions, lead status/notes, Meta integration, CRM connection/test/retry/routing, onboarding, and admin template/library actions.

## Security Findings

### P0/Critical

No current P0 was confirmed during this pass.

The prior P0 areas appear to remain protected:
- Lead status/notes mutations authenticate server-side and call ownership checks before service-role updates.
- Public lead submission validates input and derives ownership from a published campaign/funnel lookup.
- CRM retry authenticates and checks delivery workspace/admin access.
- Meta webhook verifies `X-Hub-Signature-256` against the raw request body before JSON parsing or processing.
- Stripe webhook verifies the Stripe signature against the raw request body before processing.

### High

1. Public repo plus local secrets means push hygiene is critical.
   - Evidence: GitHub visibility is `PUBLIC`; local `.env.local` contains real Supabase service role, Resend, and Meta app secrets.
   - Current status: not tracked, redacted by scanner.
   - Risk: any accidental future commit would be immediately exposed.
   - Fix: run `npm run security:secrets` before pushing; consider GitHub secret scanning/push protection and pre-commit scanning.

2. Client code imports the shared `lib/env.ts` module that also references server-only secrets.
   - Evidence: `components/social-auth-buttons.tsx` imports `env` from `@/lib/env`; `.next/static` contains server secret env variable names such as `SUPABASE_SERVICE_ROLE_KEY`, `META_APP_SECRET`, `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, `CRM_TOKEN_ENCRYPTION_KEY`, and `META_TOKEN_ENCRYPTION_KEY`.
   - I did not find high-confidence secret values in `.next/static`, but secret env names in client chunks show the boundary is not clean.
   - Risk: future edits or bundler behavior could accidentally expose values or make client/server env assumptions brittle.
   - Fix: split `lib/env.ts` into server-only env and a tiny `lib/public-env.ts` for `NEXT_PUBLIC_*` values; make browser/client components import only the public module.

### Medium

1. Several redirect/next allowlists accept any string starting with `/`.
   - Evidence: OAuth connect/callback routes, auth intent helper, billing return path, and several server actions use `startsWith("/")`.
   - Risk: values like `//example.com` can be treated as protocol-relative URLs by `new URL`, causing open redirects after auth/OAuth flows.
   - Fix: add a shared `getSafeRelativePath` helper that rejects `//`, `/\`, backslashes, control characters, and encoded protocol-relative variants. Use it consistently.

2. `app/api/location-search/route.ts` lacks rate limiting.
   - It does require an authenticated user, workspace context, and Meta token.
   - Risk: a signed-in user can generate excessive Meta/Nominatim traffic.
   - Fix: add `checkRateLimit` using IP and user ID.

3. Older upload paths rely on `File.type` and in some actions have weaker validation.
   - Admin template upload routes have role checks, size limits, and MIME allowlists.
   - Workspace icon/profile flows have type and size checks.
   - `createCampaignAction` uploads logo/before/after assets through `uploadAsset` without an obvious size/type allowlist at that call site.
   - `updateSettingsAction` uploads a logo through `uploadAsset` without the newer workspace icon validation path.
   - `uploadAsset` stores files in a public bucket and uses the submitted filename extension/content type.
   - Risk: authenticated users may upload unexpected file types to public storage through older flows.
   - Fix: centralize upload validation by intended kind, enforce max size and MIME before `uploadAsset`, and preferably sniff magic bytes for images.

4. Dependency advisories are present.
   - `npm audit --audit-level=moderate` reported 9 vulnerabilities: 2 high, 6 moderate, 1 low.
   - High: Next.js DoS/middleware-prefetch advisories and `ws` advisories.
   - Moderate includes PostCSS, js-yaml, uuid through Resend/Svix, brace-expansion, and Babel advisory.
   - Fix: upgrade carefully and run full regression tests. `npm audit fix --force` wants a Next major bump, so do not apply blindly.

5. Rate limiting falls back to in-memory storage when Upstash is unavailable.
   - Evidence: `lib/rate-limit.ts`.
   - Risk: in serverless/multi-instance production, in-memory limits are not globally reliable.
   - Fix: configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in production.

### Low / Informational

1. Public storage bucket is created as public by default.
   - Current app appears to use it for public-ish images/assets.
   - Risk if future private uploads reuse the same bucket.
   - Fix: keep private customer uploads in a separate private bucket.

2. Logs are mostly safe but include provider diagnostics, scopes, IDs, and error categories.
   - I did not see direct token value logging in the reviewed routes.
   - Keep provider error logging sanitized because upstream providers can sometimes echo request context.

3. `exports/sidekick-public-website-text.pdf` is tracked.
   - No secret was confirmed in the quick scan, but public export files should be intentionally tracked or removed.

## Auth And Authorization Review

Positive findings:
- Auth flows use server-side Supabase user lookup.
- Product/billing-gated paths commonly call product/billing helpers.
- Workspace-owned operations generally derive active workspace server-side or verify membership.
- Admin template/support/client actions use server-side role checks.
- Lead status and notes actions do not trust only client-provided IDs; they load the lead and verify workspace/user access before mutation.
- CRM retry verifies delivery workspace/admin access before retry processing.

Residual risks:
- Safe redirect validation is duplicated and too broad.
- Some older actions accept hidden `redirectTo` fields and only apply `startsWith("/")`; these should use the same safe-relative helper.
- Continued use of service-role client is acceptable only where auth/ownership/webhook signature checks have already happened.

## Supabase And RLS

Positive findings:
- Phase 3 RLS hardening and follow-up smoke fixes are present in migrations.
- Internal delivery/token table repair migrations are present.
- Browser clients should not rely on service-role access.
- Public lead submission uses a trusted server path after published lookup rather than direct anonymous lead insert.

Residual risks:
- Service role is widely used server-side. This is workable with the current app design, but every user-facing service-role path must keep explicit auth and ownership checks.
- Direct RLS behavior should still be periodically verified in Supabase SQL Editor after schema changes.

## Public Lead Form

Positive findings:
- Submission validates lead fields with length limits.
- Public submission derives user/workspace/campaign/funnel from a server-side published campaign/funnel lookup.
- Hidden campaign/funnel IDs are not treated as ownership authority.
- Leads are queued for CRM only after server-side insert context is built.

Residual risks:
- Keep rate limits active for public submissions.
- Keep no public read policy on leads and Done-For-You request data.

## Meta, Stripe, And CRM

Meta:
- Webhook POST verifies raw-body HMAC before JSON parse and processing.
- Production fails closed if `META_APP_SECRET` is missing.
- GET verification still supports Meta challenge flow.
- Meta OAuth state is signed.

Stripe:
- Webhook reads raw body and verifies `stripe-signature`.
- Billing routes require authenticated users and use safe generic errors.

CRM:
- OAuth connect/callback flows require auth and workspace access.
- Tokens are encrypted at rest in integration tables.
- Retry requires authenticated owner/admin path.
- Redirect `next` handling should be tightened as noted above.

## Uploads And Storage

Positive findings:
- Admin template media routes require app admin role, rate limit, type allowlist, and size limits.
- Profile and workspace logo crop paths validate data URL MIME and max size.

Risks:
- `uploadAsset` itself does not validate file type, size, or magic bytes.
- Some older actions call `uploadAsset` directly with user-provided `File` objects.
- Storage bucket is public by design.

Recommended next step:
- Add a small server-side upload validation helper and migrate older upload actions to it without changing UI.

## Headers And CSP

Positive findings:
- `next.config.ts` sets security headers including CSP, frame restrictions, referrer policy, permissions policy, content type options, DNS prefetch control, and production HSTS.
- Funnel HTML has a more permissive CSP for required embedded tools/CDNs, while app routes remain stricter.

Residual risks:
- `script-src 'unsafe-inline'` remains in the main CSP. This may be necessary for current Next/app behavior, but nonce/hash-based tightening should be considered later.
- Funnel-specific CSP is intentionally relaxed; keep it isolated.

## Checks Run

- `git status --short`
- `git remote -v`
- `gh repo view --json nameWithOwner,visibility,url`
- `git ls-files` checks for env/secret/export/key-like files
- `git log --all --name-only` checks for env/secret/export/key-like historical file names
- Targeted high-confidence git history grep for common secret patterns
- `.next/static` high-confidence secret pattern scan
- `npm run security:secrets`
- `./node_modules/.bin/tsc --noEmit`
- `npm audit --audit-level=moderate`
- `npm run lint -- scripts/scan-secrets.js`

Results:
- TypeScript: passed.
- Local secret scan: failed as expected because ignored `.env.local` contains real local secrets.
- `.next/static` scan: found secret env variable names, not high-confidence secret values.
- npm audit: failed with 9 advisories.
- ESLint: blocked by config/runtime error: `structuredClone is not defined` in the Next ESLint config.

## Recommended Before-Launch Checklist

- Split server-only env and public env modules.
- Replace all `startsWith("/")` redirect checks with a shared safe-relative-path helper.
- Add rate limiting to `app/api/location-search/route.ts`.
- Centralize upload validation and apply it to older campaign/settings upload actions.
- Upgrade vulnerable dependencies safely; do not blindly force a Next major upgrade without regression testing.
- Configure durable production rate limiting with Upstash.
- Decide whether `exports/sidekick-public-website-text.pdf` should remain public/tracked.
- Run Supabase SQL probes for token/internal tables after each migration.
- Run `npm run security:secrets` before every push.

## Remediation Pass - 2026-06-25

Fixed:
- Split browser-safe env reads into `lib/public-env.ts`.
- Moved server/private env reads behind `lib/server-env.ts` with `import "server-only"`.
- Kept `lib/env.ts` as a server-only compatibility export for existing server imports.
- Updated client/browser code to avoid importing `lib/env.ts` or `lib/server-env.ts`.
- Added `lib/safe-redirect.ts` and replaced broad `startsWith("/")` validation for auth, billing, OAuth, CRM, campaign, support, lead, and workspace redirect paths.
- Added existing project rate limiting to `app/api/location-search/route.ts`.
- Added narrow image upload validation before older `uploadAsset` call sites for campaign assets, admin template previews, and settings logos.
- Applied safe patch/minor dependency updates: Next.js, `eslint-config-next`, Supabase JS, Resend, Tailwind/PostCSS packages.

Files changed in remediation:
- `app/actions.ts`
- `app/api/location-search/route.ts`
- `app/api/meta/connect/route.ts`
- `app/api/meta/callback/route.ts`
- `app/api/integrations/*/connect/route.ts`
- `app/api/integrations/*/callback/route.ts`
- `app/billing-required/page.tsx`
- `components/billing-action-buttons.tsx`
- `components/social-auth-buttons.tsx`
- `lib/auth-intent.ts`
- `lib/billing.ts`
- `lib/crm-oauth-state.ts`
- `lib/crm-providers.ts`
- `lib/env.ts`
- `lib/meta-oauth-state.ts`
- `lib/public-env.ts`
- `lib/safe-redirect.ts`
- `lib/server-env.ts`
- `lib/supabase/browser.ts`
- `package.json`
- `package-lock.json`

Verification:
- `./node_modules/.bin/tsc --noEmit` passed.
- `npm run build` passed on Next.js 16.2.9.
- Rebuilt `.next/static` scan found no server secret env names and no high-confidence secret values.
- Client module scan found no `"use client"` modules importing `@/lib/env` or `@/lib/server-env`.
- `npm run security:secrets` still fails on real ignored local `.env.local` secrets, which is expected and confirms the scanner is working.
- `npm audit --audit-level=moderate` is improved from 9 advisories to 5 advisories.

Remaining:
- `npm audit` still reports transitive advisories for `@babel/core`, `brace-expansion`, `js-yaml`, and `postcss`.
- The remaining PostCSS advisory is inside Next.js' dependency tree; `npm audit fix --force` suggests a breaking downgrade and was not applied.
- Non-force `npm audit fix --dry-run` would churn many packages, so it was not applied in this narrow remediation pass.
- Local `.env.local` contains real secrets and must remain ignored; rotate only if that machine or file has been exposed.

Functionality changed:
- No intended user flow, database behavior, Meta/Facebook behavior, CRM/GHL behavior, or campaign publishing behavior was changed.
- Normal valid internal redirects and valid JPG/PNG/WEBP/GIF uploads are intended to keep working; unsafe redirect values and invalid/oversized image uploads are now rejected.

## Manual Security Test Plan

- Anonymous user cannot update lead status or notes.
- User A cannot update User B's lead by changing the lead ID.
- Public lead form cannot spoof owner, user, workspace, business, campaign, or funnel IDs.
- Fake or unpublished public funnel submission is rejected.
- Normal user cannot perform admin template/support/client actions.
- Admin template create/edit/publish still works for admins.
- CRM retry works for owner/admin and fails for unrelated users.
- Meta webhook rejects missing/invalid signatures.
- Stripe webhook rejects missing/invalid signatures.
- Browser anon/auth users cannot select provider token tables, delivery attempts, or encrypted token columns.
- Upload forms reject oversized and unsupported files.
- OAuth `next=//example.com` redirects are rejected after helper hardening is implemented.
