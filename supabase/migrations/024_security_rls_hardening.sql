-- Phase 3 security hardening: normalize RLS helpers and close direct access to
-- sensitive integration rows. Server-side service-role actions continue to own
-- public lead capture, provider token handling, CRM delivery, and publish jobs.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'admin'
  );
$$;

create or replace function public.profile_role_for_user(target_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select p.role
  from public.profiles p
  where p.user_id = target_user_id
  limit 1;
$$;

create or replace function public.has_workspace_access(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select coalesce(
    exists (
      select 1
      from public.workspace_memberships wm
      where wm.workspace_id = target_workspace_id
        and wm.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.workspaces w
      where w.id = target_workspace_id
        and w.owner_user_id = auth.uid()
    ),
    false
  );
$$;

create or replace function public.can_manage_workspace(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select coalesce(
    public.is_admin()
    or exists (
      select 1
      from public.workspaces w
      where w.id = target_workspace_id
        and w.owner_user_id = auth.uid()
    )
    or exists (
      select 1
      from public.workspace_memberships wm
      where wm.workspace_id = target_workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'admin')
    ),
    false
  );
$$;

create or replace function public.owns_user_or_workspace(target_user_id uuid, target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select coalesce(
    public.is_admin()
    or auth.uid() = target_user_id
    or public.has_workspace_access(target_workspace_id),
    false
  );
$$;

create or replace function public.can_access_support_ticket(target_ticket_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select coalesce(
    public.is_admin()
    or exists (
      select 1
      from public.support_tickets t
      where t.id = target_ticket_id
        and (
          t.user_id = auth.uid()
          or public.has_workspace_access(t.workspace_id)
        )
    ),
    false
  );
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.profile_role_for_user(uuid) from public;
revoke all on function public.has_workspace_access(uuid) from public;
revoke all on function public.can_manage_workspace(uuid) from public;
revoke all on function public.owns_user_or_workspace(uuid, uuid) from public;
revoke all on function public.can_access_support_ticket(uuid) from public;

grant execute on function public.is_admin() to anon, authenticated, service_role;
grant execute on function public.profile_role_for_user(uuid) to authenticated;
grant execute on function public.has_workspace_access(uuid) to authenticated;
grant execute on function public.can_manage_workspace(uuid) to authenticated;
grant execute on function public.owns_user_or_workspace(uuid, uuid) to authenticated;
grant execute on function public.can_access_support_ticket(uuid) to authenticated;

revoke update on public.profiles from anon, authenticated;
grant update (
  first_name,
  last_name,
  display_name,
  avatar_url,
  selected_industry,
  starting_template_id,
  onboarding_completed_at,
  active_workspace_id
) on public.profiles to authenticated;

alter table if exists public.profiles enable row level security;
alter table if exists public.templates enable row level security;
alter table if exists public.template_industries enable row level security;
alter table if exists public.template_categories enable row level security;
alter table if exists public.workspaces enable row level security;
alter table if exists public.workspace_memberships enable row level security;
alter table if exists public.workspace_invitations enable row level security;
alter table if exists public.business_profiles enable row level security;
alter table if exists public.campaigns enable row level security;
alter table if exists public.funnels enable row level security;
alter table if exists public.leads enable row level security;
alter table if exists public.follow_up_settings enable row level security;
alter table if exists public.workspace_meta_connections enable row level security;
alter table if exists public.workspace_provider_connections enable row level security;
alter table if exists public.workspace_provider_assets enable row level security;
alter table if exists public.campaign_publish_jobs enable row level security;
alter table if exists public.campaign_launch_snapshots enable row level security;
alter table if exists public.crm_routing_rules enable row level security;
alter table if exists public.lead_deliveries enable row level security;
alter table if exists public.lead_delivery_attempts enable row level security;
alter table if exists public.support_tickets enable row level security;
alter table if exists public.support_ticket_messages enable row level security;

drop policy if exists "profiles select self or admin" on public.profiles;
drop policy if exists "profiles admin manage" on public.profiles;
drop policy if exists "profiles_select_self_or_admin" on public.profiles;
drop policy if exists "profiles_update_self_safe" on public.profiles;
drop policy if exists "profiles_admin_manage" on public.profiles;

create policy "profiles_select_self_or_admin"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = user_id or public.is_admin());

create policy "profiles_update_self_safe"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and role = public.profile_role_for_user(auth.uid())
  );

create policy "profiles_admin_manage"
  on public.profiles
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "templates published read" on public.templates;
drop policy if exists "templates admin insert" on public.templates;
drop policy if exists "templates admin update" on public.templates;
drop policy if exists "templates admin delete" on public.templates;
drop policy if exists "templates_public_published_read" on public.templates;
drop policy if exists "templates_admin_insert" on public.templates;
drop policy if exists "templates_admin_update" on public.templates;
drop policy if exists "templates_admin_delete" on public.templates;

create policy "templates_public_published_read"
  on public.templates
  for select
  to anon, authenticated
  using (status = 'published' or public.is_admin());

create policy "templates_admin_insert"
  on public.templates
  for insert
  to authenticated
  with check (public.is_admin());

create policy "templates_admin_update"
  on public.templates
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "templates_admin_delete"
  on public.templates
  for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "template industries published read" on public.template_industries;
drop policy if exists "template industries admin insert" on public.template_industries;
drop policy if exists "template industries admin update" on public.template_industries;
drop policy if exists "template industries admin delete" on public.template_industries;
drop policy if exists "template_industries_public_active_read" on public.template_industries;
drop policy if exists "template_industries_admin_insert" on public.template_industries;
drop policy if exists "template_industries_admin_update" on public.template_industries;
drop policy if exists "template_industries_admin_delete" on public.template_industries;

create policy "template_industries_public_active_read"
  on public.template_industries
  for select
  to anon, authenticated
  using (status = 'active' or public.is_admin());

create policy "template_industries_admin_insert"
  on public.template_industries
  for insert
  to authenticated
  with check (public.is_admin());

create policy "template_industries_admin_update"
  on public.template_industries
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "template_industries_admin_delete"
  on public.template_industries
  for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "template categories published read" on public.template_categories;
drop policy if exists "template categories admin insert" on public.template_categories;
drop policy if exists "template categories admin update" on public.template_categories;
drop policy if exists "template categories admin delete" on public.template_categories;
drop policy if exists "template_categories_public_active_read" on public.template_categories;
drop policy if exists "template_categories_admin_insert" on public.template_categories;
drop policy if exists "template_categories_admin_update" on public.template_categories;
drop policy if exists "template_categories_admin_delete" on public.template_categories;

create policy "template_categories_public_active_read"
  on public.template_categories
  for select
  to anon, authenticated
  using (status = 'active' or public.is_admin());

create policy "template_categories_admin_insert"
  on public.template_categories
  for insert
  to authenticated
  with check (public.is_admin());

create policy "template_categories_admin_update"
  on public.template_categories
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "template_categories_admin_delete"
  on public.template_categories
  for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "workspace members can read workspaces" on public.workspaces;
drop policy if exists "workspace owners can manage workspaces" on public.workspaces;
drop policy if exists "workspaces_member_select" on public.workspaces;
drop policy if exists "workspaces_owner_insert" on public.workspaces;
drop policy if exists "workspaces_manager_update" on public.workspaces;
drop policy if exists "workspaces_manager_delete" on public.workspaces;

create policy "workspaces_member_select"
  on public.workspaces
  for select
  to authenticated
  using (public.has_workspace_access(id));

create policy "workspaces_owner_insert"
  on public.workspaces
  for insert
  to authenticated
  with check (owner_user_id = auth.uid());

create policy "workspaces_manager_update"
  on public.workspaces
  for update
  to authenticated
  using (public.can_manage_workspace(id))
  with check (public.can_manage_workspace(id));

create policy "workspaces_manager_delete"
  on public.workspaces
  for delete
  to authenticated
  using (public.can_manage_workspace(id));

drop policy if exists "workspace members can read memberships" on public.workspace_memberships;
drop policy if exists "workspace owners can manage memberships" on public.workspace_memberships;
drop policy if exists "workspace_memberships_member_select" on public.workspace_memberships;
drop policy if exists "workspace_memberships_manager_insert" on public.workspace_memberships;
drop policy if exists "workspace_memberships_manager_update" on public.workspace_memberships;
drop policy if exists "workspace_memberships_manager_delete" on public.workspace_memberships;

create policy "workspace_memberships_member_select"
  on public.workspace_memberships
  for select
  to authenticated
  using (public.has_workspace_access(workspace_id));

create policy "workspace_memberships_manager_insert"
  on public.workspace_memberships
  for insert
  to authenticated
  with check (public.can_manage_workspace(workspace_id));

create policy "workspace_memberships_manager_update"
  on public.workspace_memberships
  for update
  to authenticated
  using (public.can_manage_workspace(workspace_id))
  with check (public.can_manage_workspace(workspace_id));

create policy "workspace_memberships_manager_delete"
  on public.workspace_memberships
  for delete
  to authenticated
  using (public.can_manage_workspace(workspace_id));

drop policy if exists "workspace members can read invitations" on public.workspace_invitations;
drop policy if exists "workspace owners admins can manage invitations" on public.workspace_invitations;
drop policy if exists "workspace_invitations_member_select" on public.workspace_invitations;
drop policy if exists "workspace_invitations_manager_insert" on public.workspace_invitations;
drop policy if exists "workspace_invitations_manager_update" on public.workspace_invitations;
drop policy if exists "workspace_invitations_manager_delete" on public.workspace_invitations;

create policy "workspace_invitations_member_select"
  on public.workspace_invitations
  for select
  to authenticated
  using (public.has_workspace_access(workspace_id));

create policy "workspace_invitations_manager_insert"
  on public.workspace_invitations
  for insert
  to authenticated
  with check (public.can_manage_workspace(workspace_id));

create policy "workspace_invitations_manager_update"
  on public.workspace_invitations
  for update
  to authenticated
  using (public.can_manage_workspace(workspace_id))
  with check (public.can_manage_workspace(workspace_id));

create policy "workspace_invitations_manager_delete"
  on public.workspace_invitations
  for delete
  to authenticated
  using (public.can_manage_workspace(workspace_id));

drop policy if exists "business profiles owner access" on public.business_profiles;
drop policy if exists "workspace members can access business profiles" on public.business_profiles;
drop policy if exists "business_profiles_workspace_select" on public.business_profiles;
drop policy if exists "business_profiles_workspace_insert" on public.business_profiles;
drop policy if exists "business_profiles_workspace_update" on public.business_profiles;
drop policy if exists "business_profiles_workspace_delete" on public.business_profiles;

create policy "business_profiles_workspace_select"
  on public.business_profiles
  for select
  to authenticated
  using (public.owns_user_or_workspace(user_id, workspace_id));

create policy "business_profiles_workspace_insert"
  on public.business_profiles
  for insert
  to authenticated
  with check (public.owns_user_or_workspace(user_id, workspace_id));

create policy "business_profiles_workspace_update"
  on public.business_profiles
  for update
  to authenticated
  using (public.owns_user_or_workspace(user_id, workspace_id))
  with check (public.owns_user_or_workspace(user_id, workspace_id));

create policy "business_profiles_workspace_delete"
  on public.business_profiles
  for delete
  to authenticated
  using (public.owns_user_or_workspace(user_id, workspace_id));

drop policy if exists "campaign owner access" on public.campaigns;
drop policy if exists "campaigns_workspace_select" on public.campaigns;
drop policy if exists "campaigns_workspace_insert" on public.campaigns;
drop policy if exists "campaigns_workspace_update" on public.campaigns;
drop policy if exists "campaigns_workspace_delete" on public.campaigns;

create policy "campaigns_workspace_select"
  on public.campaigns
  for select
  to authenticated
  using (public.owns_user_or_workspace(user_id, workspace_id));

create policy "campaigns_workspace_insert"
  on public.campaigns
  for insert
  to authenticated
  with check (public.owns_user_or_workspace(user_id, workspace_id));

create policy "campaigns_workspace_update"
  on public.campaigns
  for update
  to authenticated
  using (public.owns_user_or_workspace(user_id, workspace_id))
  with check (public.owns_user_or_workspace(user_id, workspace_id));

create policy "campaigns_workspace_delete"
  on public.campaigns
  for delete
  to authenticated
  using (public.owns_user_or_workspace(user_id, workspace_id));

drop policy if exists "funnel owner access" on public.funnels;
drop policy if exists "funnels_workspace_select" on public.funnels;
drop policy if exists "funnels_workspace_insert" on public.funnels;
drop policy if exists "funnels_workspace_update" on public.funnels;
drop policy if exists "funnels_workspace_delete" on public.funnels;

create policy "funnels_workspace_select"
  on public.funnels
  for select
  to authenticated
  using (public.owns_user_or_workspace(user_id, workspace_id));

create policy "funnels_workspace_insert"
  on public.funnels
  for insert
  to authenticated
  with check (public.owns_user_or_workspace(user_id, workspace_id));

create policy "funnels_workspace_update"
  on public.funnels
  for update
  to authenticated
  using (public.owns_user_or_workspace(user_id, workspace_id))
  with check (public.owns_user_or_workspace(user_id, workspace_id));

create policy "funnels_workspace_delete"
  on public.funnels
  for delete
  to authenticated
  using (public.owns_user_or_workspace(user_id, workspace_id));

drop policy if exists "lead owner access" on public.leads;
drop policy if exists "leads_workspace_select" on public.leads;
drop policy if exists "leads_workspace_insert" on public.leads;
drop policy if exists "leads_workspace_update" on public.leads;
drop policy if exists "leads_workspace_delete" on public.leads;

create policy "leads_workspace_select"
  on public.leads
  for select
  to authenticated
  using (public.owns_user_or_workspace(user_id, workspace_id));

create policy "leads_workspace_insert"
  on public.leads
  for insert
  to authenticated
  with check (public.owns_user_or_workspace(user_id, workspace_id));

create policy "leads_workspace_update"
  on public.leads
  for update
  to authenticated
  using (public.owns_user_or_workspace(user_id, workspace_id))
  with check (public.owns_user_or_workspace(user_id, workspace_id));

create policy "leads_workspace_delete"
  on public.leads
  for delete
  to authenticated
  using (public.owns_user_or_workspace(user_id, workspace_id));

drop policy if exists "follow up owner access" on public.follow_up_settings;
drop policy if exists "follow_up_settings_workspace_select" on public.follow_up_settings;
drop policy if exists "follow_up_settings_workspace_insert" on public.follow_up_settings;
drop policy if exists "follow_up_settings_workspace_update" on public.follow_up_settings;
drop policy if exists "follow_up_settings_workspace_delete" on public.follow_up_settings;

create policy "follow_up_settings_workspace_select"
  on public.follow_up_settings
  for select
  to authenticated
  using (public.owns_user_or_workspace(user_id, workspace_id));

create policy "follow_up_settings_workspace_insert"
  on public.follow_up_settings
  for insert
  to authenticated
  with check (public.owns_user_or_workspace(user_id, workspace_id));

create policy "follow_up_settings_workspace_update"
  on public.follow_up_settings
  for update
  to authenticated
  using (public.owns_user_or_workspace(user_id, workspace_id))
  with check (public.owns_user_or_workspace(user_id, workspace_id));

create policy "follow_up_settings_workspace_delete"
  on public.follow_up_settings
  for delete
  to authenticated
  using (public.owns_user_or_workspace(user_id, workspace_id));

-- Legacy plaintext Meta tokens and modern encrypted provider tokens are only
-- handled by trusted server code through the service role.
drop policy if exists "workspace meta connections owner access" on public.workspace_meta_connections;
drop policy if exists "workspace provider connections membership access" on public.workspace_provider_connections;

drop policy if exists "workspace provider assets membership access" on public.workspace_provider_assets;
drop policy if exists "workspace_provider_assets_member_select" on public.workspace_provider_assets;
drop policy if exists "workspace_provider_assets_manager_insert" on public.workspace_provider_assets;
drop policy if exists "workspace_provider_assets_manager_update" on public.workspace_provider_assets;
drop policy if exists "workspace_provider_assets_manager_delete" on public.workspace_provider_assets;

create policy "workspace_provider_assets_member_select"
  on public.workspace_provider_assets
  for select
  to authenticated
  using (public.has_workspace_access(workspace_id));

-- Publish jobs and launch snapshots contain provider payloads and diagnostics.
-- Keep them behind server-owned actions instead of direct browser access.
drop policy if exists "campaign publish jobs membership access" on public.campaign_publish_jobs;
drop policy if exists "campaign launch snapshots membership access" on public.campaign_launch_snapshots;

drop policy if exists "crm routing rules membership access" on public.crm_routing_rules;
drop policy if exists "crm_routing_rules_member_select" on public.crm_routing_rules;
drop policy if exists "crm_routing_rules_manager_insert" on public.crm_routing_rules;
drop policy if exists "crm_routing_rules_manager_update" on public.crm_routing_rules;
drop policy if exists "crm_routing_rules_manager_delete" on public.crm_routing_rules;

create policy "crm_routing_rules_member_select"
  on public.crm_routing_rules
  for select
  to authenticated
  using (public.has_workspace_access(workspace_id));

-- Delivery payload tables can include lead PII and provider request/response
-- bodies, so direct access stays closed. The dashboard and retry action use
-- authenticated server-side ownership checks plus the service role.
drop policy if exists "lead deliveries membership access" on public.lead_deliveries;
drop policy if exists "lead delivery attempts membership access" on public.lead_delivery_attempts;

drop policy if exists "Workspace members can view support tickets" on public.support_tickets;
drop policy if exists "Workspace members can create support tickets" on public.support_tickets;
drop policy if exists "support_tickets_member_select" on public.support_tickets;
drop policy if exists "support_tickets_member_insert" on public.support_tickets;
drop policy if exists "support_tickets_manager_update" on public.support_tickets;

create policy "support_tickets_member_select"
  on public.support_tickets
  for select
  to authenticated
  using (
    public.is_admin()
    or user_id = auth.uid()
    or public.has_workspace_access(workspace_id)
  );

create policy "support_tickets_member_insert"
  on public.support_tickets
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.has_workspace_access(workspace_id)
  );

create policy "support_tickets_manager_update"
  on public.support_tickets
  for update
  to authenticated
  using (public.can_manage_workspace(workspace_id))
  with check (public.can_manage_workspace(workspace_id));

drop policy if exists "Workspace members can view support ticket messages" on public.support_ticket_messages;
drop policy if exists "Workspace members can create support ticket messages" on public.support_ticket_messages;
drop policy if exists "support_ticket_messages_member_select" on public.support_ticket_messages;
drop policy if exists "support_ticket_messages_member_insert" on public.support_ticket_messages;

create policy "support_ticket_messages_member_select"
  on public.support_ticket_messages
  for select
  to authenticated
  using (
    public.has_workspace_access(workspace_id)
    and public.can_access_support_ticket(ticket_id)
  );

create policy "support_ticket_messages_member_insert"
  on public.support_ticket_messages
  for insert
  to authenticated
  with check (
    author_user_id = auth.uid()
    and public.has_workspace_access(workspace_id)
    and public.can_access_support_ticket(ticket_id)
  );

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'storage'
      and table_name = 'objects'
  ) then
    execute 'drop policy if exists "sidekick assets public read" on storage.objects';
    execute 'create policy "sidekick assets public read" on storage.objects for select to anon, authenticated using (bucket_id = ''assets'')';
  end if;
end $$;
