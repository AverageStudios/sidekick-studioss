# Security Fixes Phase 3 - Supabase RLS Hardening

## Files changed

- `supabase/migrations/024_security_rls_hardening.sql`
- `supabase/migrations/025_post_rls_smoke_fixes.sql`
- `supabase/migrations/026_service_role_internal_table_grants.sql`
- `supabase/migrations/027_crm_delivery_table_postgrest_repair.sql`
- `SECURITY_FIXES_PHASE_3.md`

## What changed

- Replaced ad hoc workspace policy checks with SECURITY DEFINER helper functions that use a fixed `search_path`.
- Enabled RLS on all current public application tables.
- Rebuilt policies for profiles, templates, template taxonomy, workspaces, workspace memberships, invitations, business profiles, campaigns, funnels, leads, follow-up settings, CRM routing rules, support tickets, and support ticket messages.
- Added column-level update grants for `profiles` so authenticated direct clients can only update user-editable profile fields.
- Kept public lead capture dependent on trusted server code. Anonymous clients do not get direct `leads` insert access through RLS.
- Removed direct authenticated-user access to legacy plaintext Meta tokens in `workspace_meta_connections`.
- Removed direct authenticated-user access to encrypted provider token rows in `workspace_provider_connections`.
- Removed direct authenticated-user access to campaign publish jobs, launch snapshots, lead delivery payload rows, and delivery attempt payload rows.
- Left provider assets and CRM routing rules readable to authenticated members of the workspace, while keeping their writes server-owned.
- Added a default public-read storage object policy for the `assets` bucket when the Supabase `storage.objects` table is present. The app still uploads and deletes storage assets through the service role.
- Added a post-smoke repair migration to restore public published-template reads and remove legacy recursive/sensitive integration policies if a manual Phase 3 apply left old policies in place.
- Added a service-role-only internal table grant/reload migration so trusted server paths can keep using internal integration and CRM delivery tables through PostgREST without exposing them to browser roles.
- Added a CRM delivery PostgREST repair migration that normalizes `lead_deliveries` and `lead_delivery_attempts`, keeps them RLS-protected, grants only `service_role`, and reloads the schema cache.

## Protected surfaces

- **Profiles:** users can read and update their own safe profile fields, but cannot change their `role`, `user_id`, or primary key; admins can manage profiles through trusted server-side code.
- **Templates:** published templates and active template taxonomy remain readable; only admins can write template library data.
- **Workspace data:** workspace-owned business profiles, campaigns, funnels, leads, and follow-up settings require authenticated ownership or workspace membership.
- **Public lead submissions:** direct anonymous table inserts remain blocked; the existing server action must validate the published funnel and attach server-derived IDs.
- **Integrations:** token rows, publish jobs, CRM delivery records, and provider request/response payloads are not exposed to browser clients.
- **Support:** authenticated workspace users can create and read support tickets/messages scoped to their workspace; manager updates require workspace manager/admin access.

## Manual verification checklist

1. Anonymous Supabase client cannot select private rows from `business_profiles`, `campaigns`, `funnels`, `leads`, `follow_up_settings`, `workspaces`, or `workspace_memberships`.
2. Anonymous Supabase client cannot insert directly into `leads`.
3. Public lead form still submits through the server action for a published funnel.
4. Public lead form rejects fake or unpublished funnel identifiers through the Phase 2 server validation.
5. User A cannot select, update, or delete User B's `leads`, `campaigns`, `funnels`, or `business_profiles` by changing IDs.
6. Workspace member can read rows for their workspace and cannot read rows from another workspace.
7. Normal authenticated user cannot insert, update, or delete `templates`, `template_industries`, or `template_categories`.
8. Admin user can insert, update, and delete template library records.
9. Normal authenticated user cannot select `workspace_meta_connections` or `workspace_provider_connections`.
10. Normal authenticated user cannot select `campaign_publish_jobs`, `campaign_launch_snapshots`, `lead_deliveries`, or `lead_delivery_attempts`.
11. CRM retry still works through the authenticated server action for the delivery owner/admin.
12. Meta publishing and CRM connection flows still work through server-side admin clients.
13. Storage assets in the default `assets` bucket remain publicly readable, while uploads/deletes continue through server-side service-role code.

## Follow-up before Phase 4

- Apply `supabase/migrations/024_security_rls_hardening.sql` to a disposable Supabase project and run the manual checklist with two test users and two workspaces.
- If `SUPABASE_STORAGE_BUCKET` is set to a bucket name other than `assets`, add the same public-read storage policy for that bucket or make the bucket public through Supabase storage settings.
- If storage uses a private bucket in the future, replace the default public-read storage policy with signed URL delivery and narrower object policies.

## Potential Breakages

- `/dashboard`: low risk. Current dashboard reads use server-side admin clients, but verify funnel, lead, and campaign counts after applying.
- `/templates`: low risk. Published templates and active taxonomy are readable to `anon` and `authenticated`; verify the public and logged-in template pages.
- Admin templates: low risk through existing server actions/admin clients. Direct authenticated Supabase clients cannot write templates unless `public.is_admin()` is true and database grants permit the write.
- Public lead form: low risk. Funnel lookup and lead insert use the server action/admin client. Direct anonymous `leads` access is intentionally blocked.
- Lead notes/status update: low risk. Phase 2 server actions authenticate and verify ownership before using the admin client.
- CRM retry: low risk. Retry uses authenticated server-side ownership checks plus admin/service-role database access.
- Business profile/settings: medium-low risk. Existing server actions use admin clients; direct authenticated clients must satisfy workspace ownership/membership policies.
- Campaign/funnel pages: low risk. Existing page data loaders use admin clients and explicit workspace access checks.
- Storage assets: medium risk if production uses a bucket other than `assets`; add an equivalent storage policy for the configured `SUPABASE_STORAGE_BUCKET`.

## Post-RLS Smoke Findings

- The configured Supabase project still returned zero published templates to the anonymous client even though the service role saw published templates. That matches the legacy authenticated-only template policy, so `025_post_rls_smoke_fixes.sql` re-grants public published-template reads.
- Anonymous reads against `workspace_provider_connections` triggered `infinite recursion detected in policy for relation "workspace_memberships"`. That matches the legacy provider connection membership policy, so `025_post_rls_smoke_fixes.sql` drops it and revokes direct browser access to provider connection rows.
- Direct anonymous reads from `leads` returned no rows, which is the intended public lead-table posture.
- Service-role published-funnel lookup succeeded, so the public funnel and lead submission server paths should not be blocked by RLS.
- The default `assets` storage bucket exists and is public in the configured project.
- After applying `025`, published templates and provider-connection recursion were fixed. `lead_deliveries` still appeared missing from the PostgREST schema cache for service-role reads, so `026_service_role_internal_table_grants.sql` explicitly grants internal integration/CRM tables to `service_role` and requests a PostgREST schema reload.
- After applying `027`, service-role reads for `lead_deliveries` and `lead_delivery_attempts` passed, anonymous and authenticated browser-role reads were denied, provider/token tables remained unexposed, and no RLS recursion errors appeared.

## Phase 3 Completion

Phase 3 RLS hardening is complete as of the post-`027` smoke test:

- Public published-template reads work.
- Public lead table access remains blocked.
- Service-role public funnel, CRM, provider, and admin-template paths can access their required tables.
- Anonymous and authenticated browser roles cannot directly read CRM delivery payload tables or provider token tables.
- CRM retry lookup no longer hits PostgREST schema-cache errors.
- No RLS recursion errors appeared in the final probes.
