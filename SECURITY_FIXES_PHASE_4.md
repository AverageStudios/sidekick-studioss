# Security Fixes Phase 4 - API Routes and Server Actions

## API Route Inventory

| Route | Method | Classification | Notes |
| --- | --- | --- | --- |
| `app/api/admin/template-media-upload/route.ts` | `POST` | app admin only | Requires authenticated admin; uploads via trusted storage helper. |
| `app/api/admin/template-preview-upload/route.ts` | `POST` | app admin only | Requires authenticated admin; uploads via trusted storage helper. |
| `app/api/campaign-drafts/route.ts` | `POST` | authenticated user | Saves/updates user campaign drafts through server-side user context. |
| `app/api/integrations/crm/callback/route.ts` | `GET` | authenticated user / OAuth callback | Requires signed-in user, validates OAuth state/cookie, verifies workspace membership. |
| `app/api/integrations/crm/connect/route.ts` | `GET` | authenticated user | Requires signed-in user and active workspace; creates short-lived OAuth state cookies. |
| `app/api/location-search/route.ts` | `GET` | workspace member | Requires signed-in user, active workspace, and workspace Meta token. |
| `app/api/meta/budget-guidance/route.ts` | `GET` | workspace member | Requires signed-in user, active workspace, and workspace Meta token. |
| `app/api/meta/callback/route.ts` | `GET` | authenticated user / OAuth callback | Requires signed-in user, validates OAuth state/cookie, verifies workspace membership. |
| `app/api/meta/connect/route.ts` | `GET` | authenticated user | Requires signed-in user and active workspace; creates short-lived OAuth state cookies. |
| `app/api/meta/preflight/route.ts` | `POST` | authenticated workspace user | Saves draft and runs preflight through server-side ownership checks. |
| `app/api/meta/publish/route.ts` | `POST` | authenticated workspace user | Publishes only after draft/campaign ownership checks in launch helpers. |
| `app/api/meta/webhook/route.ts` | `GET`/`POST` | webhook only | GET verifies Meta challenge token; POST verifies `X-Hub-Signature-256` before parsing/processing. |

## Server Action Inventory

Public/auth actions:
- `signUpAction` - public safe.
- `resendConfirmationAction` - public safe.
- `signInAction` - public safe.
- `signOutAction` - authenticated/session action.
- `submitLeadAction` - public but sensitive; validates submitted fields and verifies published funnel/campaign server-side before service-role insert.

Authenticated user actions:
- `cancelSubscriptionAction`
- `deleteAccountAction`
- `submitSupportTicketAction`
- `replyToSupportTicketAction`
- `pauseCampaignAction`
- `resumeCampaignAction`
- `archiveCampaignAction`
- `deleteCampaignAction`
- `deleteDraftCampaignAction`
- `syncCampaignStatusAction`
- `switchWorkspaceAction`
- `createWorkspaceAction`
- `acceptWorkspaceInvitationAction`
- `createCampaignAction`
- `updateLeadStatusAction`
- `updateLeadNotesAction`
- `syncMetaLeadsAction`
- `updateWorkspaceGeneralAction`
- `updateWorkspaceIconAction`
- `updateWorkspacePreviewAction`
- `updateWorkspaceFunnelsAction`
- `updateSettingsAction`
- `updateProfileSettingsAction`
- `completeOnboardingAction`

Workspace owner/admin actions:
- `deleteWorkspaceAction`
- `inviteWorkspaceMemberAction`
- `revokeWorkspaceInvitationAction`
- `updateWorkspaceMemberRoleAction`
- `removeWorkspaceMemberAction`
- `refreshMetaIntegrationAssetsAction`
- `saveMetaIntegrationSelectionsAction`
- `disconnectMetaIntegrationAction`
- `saveCrmConnectionAction`
- `disconnectCrmConnectionAction`
- `saveCrmRoutingAction`
- `retryCrmDeliveryAction`
- `retryFailedCrmDeliveriesAction`

App admin actions:
- `adminReplyToSupportTicketAction`
- `adminUpdateSupportTicketStatusAction`
- `createAdminTemplateAction`
- `updateAdminTemplateAction`
- `duplicateAdminTemplateAction`
- `createTemplateIndustryAction`
- `updateTemplateIndustryAction`
- `deleteTemplateIndustryAction`
- `createTemplateCategoryAction`
- `updateTemplateCategoryAction`
- `deleteTemplateCategoryAction`
- `createTemplateFromCategoryAction`
- `updateTemplateLibraryTemplateAction`
- `deleteTemplateLibraryTemplateAction`

Utility action:
- `createSlugAction` - public-safe deterministic slug helper; does not read/write data.

## Changes Made

- Added `lib/api-security.ts` with safe JSON parsing, generic JSON error responses, and secret-safe route logging helpers.
- Added explicit file-size limits to admin media upload APIs:
  - Template preview images: 10 MB.
  - Template media images/videos: 50 MB.
- Stopped admin upload APIs from returning raw storage/database errors to clients.
- Added malformed JSON handling to `campaign-drafts`, `meta/preflight`, and `meta/publish`.
- Added max length validation to template slugs in draft/preflight/publish APIs.
- Tightened Meta budget guidance `adAccountId` validation to expected numeric/`act_` formats and max length.
- Bounded location-search query input to 120 characters.
- Moved Meta webhook service-role client creation until after signature verification and JSON parsing.
- Removed full `metaError` object from Meta publish API responses.
- Replaced raw OAuth/provider callback errors in Meta and CRM callbacks/connect routes with generic client-safe errors while logging server-side.
- Replaced several user-facing server-action database error redirects with generic messages while logging server-side.
- Added UUID validation before campaign and draft campaign delete operations query or mutate records.

## Service Role Usage

- API routes and server actions use `createSupabaseAdminClient()` only on the server.
- User-facing service-role operations are preceded by `getCurrentUser()`, role checks, workspace context checks, record ownership checks, or admin checks.
- Public lead submission uses service role only after validating the submitted fields and resolving a published funnel/campaign server-side.
- Meta webhook uses service role only after `X-Hub-Signature-256` verification and JSON parsing.
- Storage uploads use service role because Supabase storage writes are server-owned; upload routes are admin-only or authenticated workspace/profile actions.
- Integration/token tables remain direct-browser inaccessible from Phase 3 RLS; server actions use service role after workspace ownership checks.

## Remaining Risks

- Several admin-only server actions still surface database error text to app admins. This is lower risk than public/user-facing exposure but should be normalized in a future cleanup.
- There is no rate limiting yet on public auth, webhook, OAuth, or lead-submission endpoints.
- OAuth callback state validation relies on HTTP-only cookies plus encoded state; monitor for provider edge cases.
- Public lead submission still allows hidden `campaignId`/`funnelId` consistency hints, but Phase 2 server-side lookup prevents spoofing owner/workspace IDs.

## Manual Test Checklist

- Anonymous user cannot call protected API routes such as `/api/campaign-drafts`, `/api/meta/preflight`, `/api/meta/publish`, `/api/meta/budget-guidance`, or admin upload routes.
- User A cannot mutate User B's campaign, lead, workspace, CRM delivery, or integration resources by changing IDs.
- Normal user cannot perform admin template or support-admin actions.
- Admin template create/edit/publish/upload still works for admins.
- Workspace owner/admin can invite/remove members and manage CRM/Meta integration settings.
- Public lead form still works for a published funnel.
- Meta webhook rejects missing/invalid signatures.
- Dashboard, templates, public templates, workspace settings, and public funnel pages still load.
- Storage assets still load from the configured `assets` bucket.
