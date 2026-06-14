# SideKick Studioss Security Audit

## Executive Summary

Phase 1 audit only. No RLS policies or runtime code were changed.

Biggest risks:

- **P0: unauthenticated lead mutations.** `updateLeadStatusAction` and `updateLeadNotesAction` in `app/actions.ts` use the Supabase service-role client and update by `leadId` without checking the current user or workspace ownership.
- **P0: public lead submission trusts hidden IDs.** `submitLeadAction` accepts `campaignId`, `funnelId`, and `userId` from client-controlled hidden fields, then writes with the service-role client. It checks the campaign's workspace after reading `campaignId`, but does not prove that the submitted funnel belongs to the campaign or that the submitted user owns the campaign.
- **P1: many sensitive mutations rely on service-role bypass.** Most writes are server-side and many include ownership/admin checks, but the pattern is easy to misuse and should be centralized.
- **P1: no app-level rate limiting, CSRF/origin checks, or security headers were found.** Login/signup are partially protected by Supabase Auth itself, but app routes/actions that write data are not rate-limited.
- **P1: public Meta webhook POST does not verify request signature.** Verification token is used for webhook setup, but POST accepts JSON and writes via service role without validating Meta's signed request header.

## Current Architecture

- Router: **Next.js App Router**. Routes live under `app/`; API routes use `app/api/**/route.ts`; server actions live in `app/actions.ts`.
- Supabase clients:
  - Browser client: `lib/supabase/browser.ts`, `createBrowserClient`, public anon key.
  - Server client: `lib/supabase/server.ts`, `createServerClient`, public anon key and cookies.
  - Admin client: `lib/supabase/admin.ts`, `createClient` with `SUPABASE_SERVICE_ROLE_KEY`.
- Auth helpers: `lib/auth.ts` exposes `getCurrentUser`, `getCurrentProfile`, `requireUser`, and `requireAdmin`.
- Main auth flow:
  - Email/password signup and login through `signUpAction` and `signInAction`.
  - Google OAuth starts in `components/social-auth-buttons.tsx` and returns through `app/auth/callback/route.ts`.
  - Meta/CRM OAuth use separate routes under `app/api/meta/*` and `app/api/integrations/crm/*`.

Main folders/files inspected:

- Routes/pages: `app/**/page.tsx`, `app/auth/callback/route.ts`, `app/api/**/route.ts`
- Server actions: `app/actions.ts`
- Supabase/env/auth: `lib/env.ts`, `lib/auth.ts`, `lib/supabase/*.ts`
- Data/service helpers: `lib/data.ts`, `lib/workspaces.ts`, `lib/meta*.ts`, `lib/crm*.ts`, `lib/support.ts`, `services/storage.ts`, `services/follow-up.ts`
- Database: `supabase/migrations/*.sql`, `supabase/seed.sql`
- Config: `next.config.ts`, `.gitignore`, `.env.example`, `.env.local`

## Database and RLS Findings

Migration files:

- `001_initial.sql`
- `002_roles_and_template_admin.sql`
- `003_user_onboarding.sql`
- `004_workspaces_and_profiles.sql`
- `005_profile_name_persistence.sql`
- `006_profiles_first_last_name.sql`
- `007_campaign_launch_wizard.sql`
- `008_meta_integrations.sql`
- `009_workspace_invitations.sql`
- `010_workspace_membership_recents.sql`
- `011_meta_publish_restart.sql`
- `012_template_industry_offer_type.sql`
- `013_campaign_lifecycle.sql`
- `014_campaign_meta_ids.sql`
- `015_meta_leads_system.sql`
- `016_workspace_business_identity.sql`
- `017_profile_avatar.sql`
- `018_template_library_hierarchy.sql`
- `019_premium_exterior_detail_template.sql`
- `020_car_detailing_category_structure.sql`
- `021_crm_integrations.sql`
- `022_support_tickets.sql`
- `023_support_ticket_threads.sql`

Public tables created or materially altered:

| Table | Columns | PK | FKs | Ownership | Classification | RLS/policies |
|---|---|---|---|---|---|---|
| `business_profiles` | `id`, `user_id`, `business_name`, `location`, `phone`, `email`, `description`, `logo_url`, `brand_color`, `default_cta`, `created_at`, `updated_at`, later `workspace_id`, `website`, `industry`, `privacy_policy_url` | `id` | `workspace_id -> workspaces.id` | `user_id`, `workspace_id` | User/workspace-owned | RLS enabled in `001`; owner policy by `user_id`; later workspace-member select policy only. |
| `templates` | `id`, `slug`, `name`, `description`, `category`, `preview_image_url`, `config_json`, `created_at`, later `status`, `is_featured`, `version`, `created_by`, `published_at`, `archived_at`, `updated_at`, `source_template_version`, `industry`, `offer_type`, `industry_id`, `category_id` | `id` | `created_by -> auth.users.id`, `industry_id`, `category_id` | Admin-managed | Public read/admin write | RLS enabled in `002`; published read; admin insert/update/delete. |
| `campaigns` | `id`, `user_id`, `template_id`, `name`, `slug`, prices, copy fields, image JSON, `status`, timestamps, later `workspace_id`, launch/meta/lifecycle fields | `id` | `template_id -> templates.id`, `workspace_id -> workspaces.id` | `user_id`, `workspace_id` | User/workspace-owned | RLS enabled in `001`; owner policy by `user_id`. Workspace policies not fully mirrored for all write operations. |
| `funnels` | `id`, `user_id`, `campaign_id`, `slug`, `is_published`, `published_at`, `config_json`, timestamps, later `workspace_id` | `id` | `campaign_id -> campaigns.id`, `workspace_id -> workspaces.id` | `user_id`, `workspace_id` | User/workspace-owned; public published read is served via service role | RLS enabled in `001`; owner policy by `user_id`. |
| `leads` | `id`, `user_id`, `campaign_id`, `funnel_id`, `name`, `phone`, `email`, `service_interest`, `message`, `status`, timestamps, later `workspace_id`, Meta fields, `notes`, normalized/raw JSON | `id` | `campaign_id -> campaigns.id`, `funnel_id -> funnels.id`, `workspace_id -> workspaces.id` | `user_id`, `workspace_id` | User/workspace-owned PII | RLS enabled in `001`; owner policy by `user_id`. Service-role app writes bypass RLS. |
| `follow_up_settings` | `id`, `user_id`, `campaign_id`, `email_enabled`, `sms_enabled`, `confirmation_subject`, `confirmation_body`, timestamps, later `workspace_id` | `id` | `campaign_id -> campaigns.id`, `workspace_id -> workspaces.id` | `user_id`, `workspace_id` | User/workspace-owned | RLS enabled in `001`; owner policy by `user_id`. |
| `profiles` | `id`, `user_id`, `role`, timestamps, later onboarding fields, names, `active_workspace_id`, `avatar_url` | `id` | `user_id -> auth.users.id`, `active_workspace_id -> workspaces.id`, `starting_template_id -> templates.id` | `user_id` | User-owned/system role | RLS enabled in `002`; self/admin select; admin manage. |
| `workspaces` | `id`, `name`, `owner_user_id`, timestamps, later business identity columns | `id` | none explicit for `owner_user_id` | `owner_user_id` | Workspace-owned | RLS enabled in `004`; members can read; owner can manage. |
| `workspace_memberships` | `id`, `workspace_id`, `user_id`, `role`, timestamps, `last_accessed_at` | `id` | `workspace_id -> workspaces.id` | `workspace_id`, `user_id` | Workspace-owned access control | RLS enabled in `004`; members read; owners manage. |
| `workspace_meta_connections` | OAuth Meta token/account/page fields | `id` | `workspace_id -> workspaces.id` | `workspace_id`, `user_id` | Sensitive integration token store | RLS enabled in `008`; owner access by `user_id`. |
| `workspace_invitations` | invitation email, role, token, status, expiry, accepted metadata | `id` | `workspace_id -> workspaces.id` | `workspace_id` | Workspace access control | RLS enabled in `009`; members read; owner/admin manage. |
| `workspace_provider_connections` | provider token ciphertext fields, refresh token fields, scopes, metadata, status | `id` | `workspace_id -> workspaces.id` | `workspace_id`, `user_id` | Sensitive integration token store | RLS enabled in `011`; workspace membership access. |
| `workspace_provider_assets` | provider assets/ad accounts/pages/CRM destinations | `id` | `workspace_id -> workspaces.id`, `connection_id -> workspace_provider_connections.id` | `workspace_id` | Workspace integration state | RLS enabled in `011`; workspace membership access. |
| `campaign_publish_jobs` | provider publish job state, request/response JSON, external IDs | `id` | `workspace_id -> workspaces.id`, `campaign_id -> campaigns.id` | `workspace_id`, `campaign_id` | System/internal with sensitive API payloads | RLS enabled in `011`; workspace membership access. |
| `campaign_launch_snapshots` | template slug, launch step, snapshot JSON, creator | `id` | `workspace_id -> workspaces.id`, `campaign_id -> campaigns.id` | `workspace_id`, `campaign_id` | Workspace-owned | RLS enabled in `011`; workspace membership access. |
| `template_industries` | `id`, `name`, `slug`, `description`, `status`, `sort_order`, timestamps | `id` | none | none | Admin-managed/public library | RLS enabled in `018`; active read; admin write/delete. |
| `template_categories` | `id`, `industry_id`, `name`, `slug`, `description`, `status`, `sort_order`, timestamps | `id` | `industry_id -> template_industries.id` | none | Admin-managed/public library | RLS enabled in `018`; active read; admin write/delete. |
| `crm_routing_rules` | workspace/campaign/provider/connection/destination/rule metadata | `id` | workspace/campaign/connection/destination FKs | `workspace_id` | Workspace-owned integration config | RLS enabled in `021`; workspace membership access. |
| `lead_deliveries` | workspace/lead/campaign/provider/connection/destination delivery state, request/response JSON | `id` | workspace/lead/campaign/connection/destination FKs | `workspace_id`, `lead_id` | Workspace-owned system/PII | RLS enabled in `021`; workspace membership access. |
| `lead_delivery_attempts` | delivery attempt number/state/http/request/response/error | `id` | `delivery_id -> lead_deliveries.id` | via delivery | Workspace-owned system/PII | RLS enabled in `021`; workspace membership access through delivery. |
| `support_tickets` | workspace/user/subject/category/priority/status/message/context/thread fields | `id` | `workspace_id -> workspaces.id` | `workspace_id`, `user_id` | User/workspace-owned support data | RLS enabled in `022`/`023`; workspace members view/create. |
| `support_ticket_messages` | ticket/workspace/author/body/timestamp | `id` | `ticket_id -> support_tickets.id`, `workspace_id -> workspaces.id` | `workspace_id`, `author_user_id` | User/workspace-owned support data | RLS enabled in `023`; workspace members view/create. |

RLS summary:

- RLS is enabled on every table created by migrations that stores user/workspace data or admin-managed library data.
- RLS policies exist, but app code frequently uses the service-role client, which bypasses RLS. The most important application-layer authorization gaps are listed below.
- The early owner policies are `user_id` based. Later migrations add `workspace_id`; application code must continue enforcing workspace membership when bypassing RLS.

## Auth and Route Protection Findings

Public routes:

- Marketing/legal/product/docs: `/`, `/login`, `/signup`, `/signup/confirm`, `/academy`, `/academy/[slug]`, `/docs` redirect, `/help` redirect, `/faq`, `/pricing`, `/privacy`, `/terms`, `/product`, `/product/[slug]`, `/product/templates`
- Auth/OAuth callbacks/connectors: `/auth/callback`, `/api/meta/connect`, `/api/meta/callback`, `/api/integrations/crm/connect`, `/api/integrations/crm/callback`, `/api/meta/webhook`
- Funnel/lead public flow appears partially removed in current tree (`app/f/[slug]/page.tsx` is deleted in git status), but `getFunnelBySlug` and `PublicLeadForm` still exist.

Protected user routes:

- `/dashboard`, `/templates`, `/templates/new`, `/templates/drafts`, `/campaigns`, `/campaigns/[id]`, `/settings`, `/workspace/settings`, `/workspaces`, `/workspaces/new`, `/support`, `/support/new`, `/support/[id]`, `/domains`, `/performance`.
- `/leads` currently redirects to `/integrations`.
- `/integrations`, `/workspace/members`, `/templates/[id]`, `/workspaces/invite` are redirect routes.

Admin-only routes:

- `/admin`, `/admin/templates`, `/admin/templates/new`, `/admin/templates/[id]/edit`, `/admin/support`, `/admin/support/[id]`.
- These call `requireAdmin()` server-side before rendering.

Key findings:

- `/dashboard`, `/templates`, `/settings`, `/workspace/settings`, `/campaigns`, `/support`, `/performance` use server-side auth guards, not client-side only.
- Admin pages use server-side role checks through `requireAdmin()`.
- Google OAuth redirect uses `new URL("/auth/callback", env.appUrl)`. No hardcoded localhost Google redirect was found in code. `README.md` mentions localhost only for local development.
- `env.appUrl` falls back to `https://sidekickstudioss.com`; incorrect `NEXT_PUBLIC_APP_URL` in an environment would affect OAuth redirects.
- Login/signup use Zod email/password validation and Supabase Auth. No app-level rate limiting was found.

## API Route and Server Action Findings

| Route/action | Method | Auth required? | Ownership check? | Admin check? | Input validation? | Risk level | Notes |
|---|---:|---:|---:|---:|---:|---|---|
| `/api/campaign-drafts` | POST | Yes | Yes, via `ensureCampaignDraft` using `userId` | No | Zod for shape; `state` is arbitrary JSON | Medium | Writes campaign drafts with service role. |
| `/api/location-search` | GET | Yes | Active workspace context | No | Query length only | Low | Calls Meta/geocoder, cached in memory. No rate limit. |
| `/api/meta/budget-guidance` | GET | Yes | Active workspace token only | No | Zod | Medium | Does not verify submitted `adAccountId` is one of selected workspace assets before using token. |
| `/api/meta/connect` | GET | Yes | Active workspace context | No | Enum-ish scope handling | Medium | OAuth start; state is HMAC-protected and cookies are httpOnly/lax. |
| `/api/meta/callback` | GET | Yes | Workspace membership checked | No | OAuth state parsed/checked | Medium | Saves tokens through service role; logs scopes and workspace IDs, not tokens. |
| `/api/meta/preflight` | POST | Yes | Yes, inside draft/preflight helpers | No | Zod shape; arbitrary state JSON | Medium | No origin/rate limit. |
| `/api/meta/publish` | POST | Yes | Yes, via preflight/publish helpers | No | Zod shape; arbitrary state JSON | High | Sensitive external publish operation; no origin/rate limit. |
| `/api/meta/webhook` | GET | Public | N/A | N/A | Verify token | Low | Subscription verification checks token. |
| `/api/meta/webhook` | POST | Public | Provider-derived only | N/A | JSON parse only | High | Should verify Meta signature/header before ingesting leads with service role. |
| `/api/admin/template-preview-upload` | POST | Yes | N/A | Yes | MIME type only | Medium | No file size limit in route; storage upload path is admin-only. |
| `/api/admin/template-media-upload` | POST | Yes | N/A | Yes | MIME type only | Medium | No file size limit in route; allows videos. |
| `/api/integrations/crm/connect` | GET | Yes | Active workspace context | No | Provider allowlist | Medium | OAuth start; no rate limit. |
| `/api/integrations/crm/callback` | GET | Yes | Workspace membership checked | No | State/cookie checks | Medium | Saves encrypted CRM tokens through service role. |
| `signUpAction` | Server action | Public | N/A | No | Zod email/password/name | Medium | No app-level rate limit. |
| `resendConfirmationAction` | Server action | Public | N/A | No | Zod email | Medium | Should be rate-limited. |
| `signInAction` | Server action | Public | N/A | No | Zod email/password | Medium | Supabase rate limits may apply; no app-level limit. |
| `signOutAction` | Server action | Session if present | N/A | No | N/A | Low | Safe. |
| `cancelSubscriptionAction` | Server action | Yes | Active workspace context | No | Minimal | Medium | Creates support ticket/email. |
| `deleteAccountAction` | Server action | Yes | Own user/workspaces | No | N/A | High | Destructive service-role cleanup; no recent-login confirmation observed. |
| `submitSupportTicketAction` | Server action | Yes | Active workspace and access checked | No | Zod | Low | Writes support ticket. |
| `replyToSupportTicketAction` | Server action | Yes | Ticket `user_id` and workspace checked | No | Zod | Low | Good ownership check. |
| `adminReplyToSupportTicketAction` | Server action | Yes | N/A | Yes | Zod | Low | Admin-only. |
| `adminUpdateSupportTicketStatusAction` | Server action | Yes | N/A | Yes | Zod | Low | Admin-only. |
| Campaign lifecycle/delete/sync actions | Server action | Yes | Campaign workspace/user checked | No | Basic IDs | Medium | Good ownership checks; no rate/origin limit. |
| `switchWorkspaceAction` | Server action | Yes | Membership checked | No | Minimal | Low | Updates current user's profile only. |
| Workspace create/delete/member invite/member update actions | Server action | Yes | Owner/admin membership checks | No | Mixed, mostly manual | Medium | Good role checks; email validation is weak (`includes("@")`). |
| `createCampaignAction` | Server action | Should be yes, but uploads before auth fallback | Active workspace after upload | No | Minimal/manual | High | Uploads files before confirming server config/user; lacks robust validation on business fields/prices/URLs. |
| `submitLeadAction` | Server action | Public | Weak | No | HTML required only; no server Zod | High | Trusts hidden IDs and writes with service role. |
| `updateLeadStatusAction` | Server action | **No** | **No** | No | Status allowlist only | **Critical** | Any caller with a lead UUID can update status. |
| `updateLeadNotesAction` | Server action | **No** | **No** | No | None beyond trim | **Critical** | Any caller with a lead UUID can overwrite notes. |
| `syncMetaLeadsAction` | Server action | Yes | Active workspace | No | Mode allowlist | Medium | External sync; no rate limit. |
| Workspace settings/profile actions | Server action | Yes | Active workspace/current user | No | Mixed manual checks | Medium | Raw profile/business fields saved directly; files checked for type/size in some paths. |
| Meta/CRM integration selection/disconnect/routing actions | Server action | Yes | Active workspace | No | Provider/field checks are partial | Medium | Service-role token operations; no rate/origin limit. |
| `retryCrmDeliveryAction` | Server action | Yes | **No delivery ownership check observed** | No | Delivery ID present only | High | Calls `processLeadCrmDelivery` by arbitrary delivery ID. |
| `retryFailedCrmDeliveriesAction` | Server action | Yes | Active workspace | No | N/A | Medium | Safer than single delivery retry. |
| Onboarding action | Server action | Yes | Current user profile only | No | Basic template exists | Low | Safe. |
| Admin template/library actions | Server action | Yes | N/A | Yes | Zod for full template form; partial manual for quick library actions | Medium | Admin-only service-role writes. |
| `publishFunnelAction` | Server action | **No** | **No** | No | None | **Critical** | Publishes any funnel by ID with service role. May be legacy/unwired, but still exported. |
| `createSlugAction` | Server action | Public | N/A | No | None | Low | Returns slugified string only. |

## Secrets and Environment Findings

Files with env variable names:

- `.env.example`: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_DEMO_MODE`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI`, `META_SCOPES`, `META_WEBHOOK_VERIFY_TOKEN`, `META_GRAPH_API_VERSION`, `META_TOKEN_ENCRYPTION_KEY`
- `.env.local`: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI`, `META_SCOPES`, `META_LEAD_FORM_SCOPES`
- `lib/env.ts`: central reads for public Supabase vars, service-role key, Resend, Meta, CRM/GHL vars.
- `lib/meta.ts`: direct `process.env` reads for Meta configuration.
- `next.config.ts`: reads `NEXT_PUBLIC_SUPABASE_URL` to allow Supabase storage images.

Findings:

- `.gitignore` ignores `.env*`, so `.env.local` should not be committed.
- No hardcoded secret values were printed or included in this report.
- No obvious hardcoded Stripe/Facebook private keys, GitHub tokens, PEM blocks, or OAuth secrets were found in source.
- `SUPABASE_SERVICE_ROLE_KEY` is used broadly via `createSupabaseAdminClient`; this is expected server-side, but risky where actions lack auth/ownership checks.
- Frontend-exposed config uses `NEXT_PUBLIC_*` for app URL, demo mode, Supabase URL, and anon key. Those are safe categories if values are non-secret.

## Input Validation Findings

Validation library:

- Zod is installed and used in `app/actions.ts` and several API routes.

Validated:

- Auth email/password: `authSchema`.
- Signup first/last name.
- Support ticket/reply/status.
- Admin template full form.
- Campaign draft/preflight/publish request shapes.
- Budget guidance query shape.
- Upload MIME type for admin template media.
- Some image data URLs and upload sizes for profile/workspace images.

Missing or partial:

- Lead form fields (`submitLeadAction`): email/phone/name/service/message are not server-validated; hidden `campaignId`, `funnelId`, `userId` are trusted.
- Lead notes: no length cap or ownership validation.
- Lead status: status allowlist exists, but no auth/ownership validation.
- Business/profile/workspace fields: many are only trimmed strings; email, phone, website, privacy policy URL, brand color, and lengths are not consistently validated.
- Campaign creation: prices, phone/email/URLs/business fields/file uploads are not robustly server-validated before writes.
- CRM manual connection: provider cast allows more providers than implementation; access token is accepted as raw form input for non-GHL flows.
- UUIDs: many IDs are only non-empty strings, not UUID-validated.
- Redirects: many `redirectTo` values are checked with `startsWith("/")`, but not all paths are normalized; this prevents absolute external redirects but still allows arbitrary internal paths.

## SQL Injection Findings

- No raw SQL execution or obvious string-interpolated SQL was found in app code.
- Supabase query builder is used for database access.
- No `.rpc()` calls were found in app code during audit.
- Risky dynamic query spots:
  - `verifyNoRemainingRowsByColumn` accepts table/column names, but callers use a static internal list.
  - `buildUniqueTemplateLibrarySlug` accepts a table name, but callers use static admin-controlled table names.
  - `admin.from(record.table)`/`admin.from(table)` are safe only as long as arguments remain internal constants.

## XSS Findings

- No `dangerouslySetInnerHTML` usage was found.
- User-generated or admin-generated content is rendered throughout React components as text nodes, which React escapes by default.
- Public/user-generated fields rendered include business names, campaign copy, ad copy, template descriptions, support messages, lead notes, and profile/workspace names.
- No HTML sanitizer is present, but no raw HTML rendering was identified.
- Remaining risk is stored content later being reused in contexts outside React text rendering, especially Meta payloads, email templates, or future rich-text/admin fields.

## Rate Limiting Findings

No app-level rate limiting middleware, utility, Redis/Upstash limiter, or route-specific throttling was found.

Should be rate-limited before launch:

- `signInAction`, `signUpAction`, `resendConfirmationAction`
- `submitLeadAction`
- `/api/meta/webhook` POST
- `/api/meta/preflight`, `/api/meta/publish`, `/api/meta/budget-guidance`, `/api/location-search`
- OAuth start/callback routes for Meta and CRM
- Admin upload routes
- Support ticket/reply actions
- CRM retry and Meta sync actions

## Security Headers Findings

Files checked: `next.config.ts`, middleware presence, `vercel.json`.

Findings:

- No `middleware.ts` was found.
- No `vercel.json` was found.
- `next.config.ts` configures image remote patterns only; no security headers are configured.

Missing headers:

- `Content-Security-Policy`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- `X-Frame-Options` or CSP `frame-ancestors`
- `Strict-Transport-Security`

## CORS/Origin Findings

- No explicit `Access-Control-Allow-Origin: *` or CORS helper was found.
- No sensitive mutation route/action was found verifying `Origin` or `Referer`.
- Server actions can be invoked by forms/fetches; rely on SameSite cookies and framework behavior today, but should add explicit origin checks for destructive service-role actions.
- `/api/meta/webhook` is intentionally public to Meta, but should verify Meta signatures rather than relying on generic JSON acceptance.

## Priority Fix Plan

P0 = must fix before launch:

- [ ] Add auth and workspace ownership checks to `updateLeadStatusAction` and `updateLeadNotesAction`.
- [ ] Lock down `submitLeadAction`: derive `user_id` and `workspace_id` from verified `funnelId`/`campaignId`, verify funnel belongs to campaign, reject tampered hidden IDs, validate email/phone/name/message server-side.
- [ ] Remove or protect `publishFunnelAction`; require auth and ownership before publishing a funnel.
- [ ] Add ownership validation to `retryCrmDeliveryAction` by loading the delivery and checking it belongs to the active workspace.
- [ ] Verify Meta webhook POST signatures before ingesting leads.

P1 = should fix soon:

- [ ] Add app-level rate limiting for auth, public lead submission, webhook ingestion, Meta publish/preflight, uploads, support, and CRM retry actions.
- [ ] Add origin/referer checks for service-role mutations and destructive server actions.
- [ ] Add security headers in `next.config.ts` or middleware.
- [ ] Centralize service-role authorization helpers so every admin-client write requires user, workspace, or admin context.
- [ ] Strengthen Zod validation for business/profile/campaign/template quick-edit/CRM inputs, including UUIDs, URLs, phone, email, lengths, status, and role fields.
- [ ] Add size limits to admin upload routes.
- [ ] Add recent-login or confirmation step for account deletion.

P2 = later hardening:

- [ ] Review and normalize workspace-based RLS policies for legacy `user_id` tables now that workspaces exist.
- [ ] Reduce service-role reads where anon/server client plus RLS is sufficient.
- [ ] Add audit logging for admin template changes, CRM token changes, Meta publish actions, and destructive account/workspace actions.
- [ ] Add CSP reporting and tune allowed image/media/connect sources.
- [ ] Add automated security tests for server actions with forged IDs.

## Recommended Next Phase

Phase 2 should implement the P0 fixes first, with focused tests around forged IDs and unauthenticated calls. Start by adding shared helpers for `requireActiveWorkspace`, `requireLeadAccess`, `requireCampaignAccess`, and `requireAdminActionUser`, then apply them to the vulnerable lead/funnel/CRM actions before changing any RLS policy. After that, add rate limiting and security headers as a separate hardening pass.
