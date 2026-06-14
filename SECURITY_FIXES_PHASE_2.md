# SideKick Studioss Security Fixes Phase 2

## Scope

Focused P0 remediation from `SECURITY_AUDIT.md`. No broad RLS, rate limiting, header, or architecture changes were made.

## Files Changed

- `app/actions.ts`
- `app/api/meta/webhook/route.ts`
- `components/public-lead-form.tsx`
- `SECURITY_FIXES_PHASE_2.md`

## Fixes

### Lead Status and Notes Mutations

Protected:

- `updateLeadStatusAction`
- `updateLeadNotesAction`

Changes:

- Require an authenticated Supabase user before mutation.
- Validate `leadId` as a UUID.
- Load the lead server-side with the service-role client.
- Allow mutation only when the authenticated user owns the lead or has access to the lead workspace.
- Limit lead notes to 5,000 characters.

### Public Lead Submission

Protected:

- `submitLeadAction`
- `components/public-lead-form.tsx` flow

Changes:

- Validate submitted lead fields with Zod.
- Treat hidden `campaignId` and `funnelId` only as consistency checks.
- Stop submitting hidden owner/business fields from the public form.
- Derive `user_id`, `workspace_id`, `campaign_id`, and `funnel_id` from a server-side lookup of a published funnel.
- Require the matched campaign to be `published`.
- Attach leads only to the verified campaign/funnel owner.

### Legacy Funnel Publishing

Protected:

- Removed unused `publishFunnelAction`.

Changes:

- The exported legacy action had no call sites and allowed service-role publishing by arbitrary `funnelId`.
- Removing it prevents normal users or anonymous callers from invoking it.

### CRM Delivery Retry

Protected:

- `retryCrmDeliveryAction`

Changes:

- Continue requiring authenticated user.
- Load the delivery server-side.
- Require active workspace access or admin role before retrying.
- Reject missing/unknown delivery IDs with safe errors.

### Meta Webhook Signature Verification

Protected:

- `app/api/meta/webhook/route.ts` POST

Changes:

- Verify `X-Hub-Signature-256` using `META_APP_SECRET` before parsing the JSON payload.
- Reject missing, malformed, or invalid signatures.
- Fail closed in production when `META_APP_SECRET` is missing.
- Allow dev-only unsigned payloads only when `META_APP_SECRET` is not configured and `NODE_ENV !== "production"`.

## Environment Variables

No new environment variables are required.

Existing variable required for production webhook security:

- `META_APP_SECRET`

## Manual Verification Steps

- Anonymous user cannot update lead status/notes:
  - Submit a direct server-action request without auth cookies to `updateLeadStatusAction` or `updateLeadNotesAction`.
  - Expected: redirected to `/login`; no database update.
- User A cannot update User B's lead:
  - Sign in as User A.
  - Submit User B's lead UUID to lead status/notes actions.
  - Expected: redirected with an authorization error; no database update.
- Public lead form cannot spoof owner/business/funnel IDs:
  - Open a published funnel form.
  - Change hidden `campaignId`, `funnelId`, or any removed/legacy owner fields before submit.
  - Expected: invalid combinations are rejected; accepted submissions attach to the server-verified published funnel and campaign.
- Normal user cannot call `publishFunnelAction`:
  - Confirm `publishFunnelAction` is no longer exported from `app/actions.ts`.
  - Expected: no callable server action exists for this legacy publish path.
- CRM retry fails without ownership:
  - Sign in as User A.
  - Submit a `deliveryId` from another workspace to `retryCrmDeliveryAction`.
  - Expected: redirected with an authorization error; delivery is not retried.
- Meta webhook rejects invalid signatures:
  - POST JSON to `/api/meta/webhook` with no `X-Hub-Signature-256`, malformed signature, or signature generated from the wrong secret.
  - Expected in production or with `META_APP_SECRET` configured: HTTP 403 and no lead ingestion.
  - POST the same body with `sha256=` HMAC generated from `META_APP_SECRET`.
  - Expected: request proceeds to normal webhook ingestion.
