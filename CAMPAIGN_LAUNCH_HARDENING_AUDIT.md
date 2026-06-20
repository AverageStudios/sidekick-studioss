# Campaign Launch Hardening Audit

## Scope

- Template/campaign selection
- Campaign draft save
- Campaign edit/resume
- Meta preflight
- Meta publish
- CRM handoff setup visibility
- Launch-template integrity

## Launch Flow Map

1. `/templates/new`
2. `TemplateLaunchWizard`
3. `POST /api/campaign-drafts`
4. `ensureCampaignDraft(...)`
5. `POST /api/meta/preflight`
6. `runMetaLaunchPreflight(...)`
7. `POST /api/meta/publish`
8. `publishMetaFromPreflight(...)`
9. Campaign status display in `/campaigns` and `/campaigns/[id]`

## Templates Audited

- Full Detail Promo
- Interior Detail Promo
- Ceramic Coating Promo
- Paint Correction Promo
- Monthly Maintenance Promo

## Fixes Applied

### 1. Publish-state consistency

Problem:
- Meta publish state was being persisted in `lib/meta-launch.ts`, then written again in `app/api/meta/publish/route.ts`.
- A second bookkeeping failure could make the UI return an error after Meta objects were already created and the campaign had already been marked published.

Fix:
- Moved `published_at` persistence into the main publish-state write in `lib/meta-launch.ts`.
- Removed the redundant second campaign update from `app/api/meta/publish/route.ts`.

Result:
- Publish success/failure state is now less likely to drift between Meta object creation, DB status, and API response.

### 2. Empty-template safety

Problem:
- `/templates/new` assumed published templates were available and could still enter the launch surface even if the template list was empty.

Fix:
- Added a safe empty state in `app/templates/new/page.tsx` when no launch-ready templates exist.

Result:
- The launch flow now fails safely instead of risking a broken wizard entry.

### 3. Fallback template launch metadata

Problem:
- Fallback templates did not explicitly define `supportedAdTypes` and `defaultAdType`.

Fix:
- Added explicit ad-type metadata to all fallback launch templates in `data/templates.ts`.

Result:
- Fallback/template-dev environments now have explicit, validated launch defaults instead of relying on implicit behavior.

### 4. CRM launch/setup navigation safety

Problem:
- Some launch-adjacent CRM redirects still defaulted to stale `/integrations` paths.

Fix:
- Updated campaign page CRM handoff link to `/workspace/settings?section=integrations`.
- Updated CRM OAuth state fallback redirect to `/workspace/settings?section=integrations`.

Result:
- Launch/setup flows are less likely to send users into the wrong configuration surface.

### 5. Validation helper

Added:
- `scripts/validate-campaign-launch-flow.mjs`

Checks:
- Fallback launch templates are structurally complete
- Default launch state/blueprint generation works for all visible templates
- Wizard step validation catches missing industry/template cases
- Visible CRM provider list matches launch-intended providers

## Current Visible CRM Providers Verified

- Pipedrive
- Zoho CRM
- Monday CRM
- Keap
- Close CRM

## Hidden CRM Providers Verified

- GoHighLevel
- HubSpot
- Freshsales
- Salesforce

## Checks Run

- `node scripts/validate-campaign-launch-flow.mjs`
- `./node_modules/.bin/tsc --noEmit`
- `./node_modules/.bin/eslint app/templates/new/page.tsx app/campaigns/page.tsx app/api/meta/publish/route.ts lib/meta-launch.ts lib/crm-oauth-state.ts data/templates.ts scripts/validate-campaign-launch-flow.mjs`
- `./node_modules/.bin/next build`

## Browser Smoke Status

Attempted:
- Local dev server on `http://localhost:3001`

Blocked by:
- In-app browser runtime bootstrap error before browser attachment:
  - missing `sandboxPolicy` in browser runtime metadata

Impact:
- Code/build validation completed
- True browser-driven smoke verification still needs one manual pass after the in-app browser runtime issue is resolved

## Remaining Risks

1. Live Meta publish still depends on real workspace Meta credentials and asset readiness.
2. Browser-level launch verification remains pending because the in-app browser runtime could not attach.
3. Supabase-published templates beyond the fallback catalog should still be spot-checked in production data if custom admin-created templates are live.
