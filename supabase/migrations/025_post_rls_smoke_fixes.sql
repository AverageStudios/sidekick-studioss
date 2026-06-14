-- Post-Phase-3 smoke fixes. This migration is intentionally narrow: it
-- converges public template reads and removes legacy recursive/sensitive
-- integration policies that can survive a partial/manual Phase 3 apply.

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

revoke all on function public.is_admin() from public;
revoke all on function public.has_workspace_access(uuid) from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;
grant execute on function public.has_workspace_access(uuid) to authenticated, service_role;

grant select on public.templates to anon, authenticated;

drop policy if exists "templates published read" on public.templates;
drop policy if exists "templates_public_published_read" on public.templates;

create policy "templates_public_published_read"
  on public.templates
  for select
  to anon, authenticated
  using (status = 'published' or public.is_admin());

do $$
begin
  if to_regclass('public.template_industries') is not null then
    execute 'grant select on public.template_industries to anon, authenticated';
    execute 'drop policy if exists "template industries published read" on public.template_industries';
    execute 'drop policy if exists "template_industries_public_active_read" on public.template_industries';
    execute 'create policy "template_industries_public_active_read" on public.template_industries for select to anon, authenticated using (status = ''active'' or public.is_admin())';
  end if;

  if to_regclass('public.template_categories') is not null then
    execute 'grant select on public.template_categories to anon, authenticated';
    execute 'drop policy if exists "template categories published read" on public.template_categories';
    execute 'drop policy if exists "template_categories_public_active_read" on public.template_categories';
    execute 'create policy "template_categories_public_active_read" on public.template_categories for select to anon, authenticated using (status = ''active'' or public.is_admin())';
  end if;

  if to_regclass('public.workspace_meta_connections') is not null then
    execute 'revoke all on public.workspace_meta_connections from anon, authenticated';
    execute 'drop policy if exists "workspace meta connections owner access" on public.workspace_meta_connections';
  end if;

  if to_regclass('public.workspace_provider_connections') is not null then
    execute 'revoke all on public.workspace_provider_connections from anon, authenticated';
    execute 'drop policy if exists "workspace provider connections membership access" on public.workspace_provider_connections';
  end if;

  if to_regclass('public.workspace_provider_assets') is not null then
    execute 'revoke insert, update, delete on public.workspace_provider_assets from anon, authenticated';
    execute 'grant select on public.workspace_provider_assets to authenticated';
    execute 'drop policy if exists "workspace provider assets membership access" on public.workspace_provider_assets';
    execute 'drop policy if exists "workspace_provider_assets_member_select" on public.workspace_provider_assets';
    execute 'create policy "workspace_provider_assets_member_select" on public.workspace_provider_assets for select to authenticated using (public.has_workspace_access(workspace_id))';
  end if;

  if to_regclass('public.campaign_publish_jobs') is not null then
    execute 'revoke all on public.campaign_publish_jobs from anon, authenticated';
    execute 'drop policy if exists "campaign publish jobs membership access" on public.campaign_publish_jobs';
  end if;

  if to_regclass('public.campaign_launch_snapshots') is not null then
    execute 'revoke all on public.campaign_launch_snapshots from anon, authenticated';
    execute 'drop policy if exists "campaign launch snapshots membership access" on public.campaign_launch_snapshots';
  end if;

  if to_regclass('public.crm_routing_rules') is not null then
    execute 'revoke insert, update, delete on public.crm_routing_rules from anon, authenticated';
    execute 'grant select on public.crm_routing_rules to authenticated';
    execute 'drop policy if exists "crm routing rules membership access" on public.crm_routing_rules';
    execute 'drop policy if exists "crm_routing_rules_member_select" on public.crm_routing_rules';
    execute 'create policy "crm_routing_rules_member_select" on public.crm_routing_rules for select to authenticated using (public.has_workspace_access(workspace_id))';
  end if;

  if to_regclass('public.lead_deliveries') is not null then
    execute 'revoke all on public.lead_deliveries from anon, authenticated';
    execute 'drop policy if exists "lead deliveries membership access" on public.lead_deliveries';
  end if;

  if to_regclass('public.lead_delivery_attempts') is not null then
    execute 'revoke all on public.lead_delivery_attempts from anon, authenticated';
    execute 'drop policy if exists "lead delivery attempts membership access" on public.lead_delivery_attempts';
  end if;
end $$;
