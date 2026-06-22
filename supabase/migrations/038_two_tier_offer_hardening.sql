-- Follow-up hardening for two-tier offer tables.
-- This is safe to run after an earlier version of 037_two_tier_offer_branding.sql.
-- It does not drop tables or modify billing/access gates.

do $$
begin
  if to_regclass('public.done_for_you_requests') is not null then
    alter table public.done_for_you_requests enable row level security;

    revoke all on public.done_for_you_requests from anon;
    grant insert on public.done_for_you_requests to anon, authenticated;
    grant select, update, delete on public.done_for_you_requests to authenticated;

    drop policy if exists "done_for_you_requests_public_insert" on public.done_for_you_requests;
    drop policy if exists "done_for_you_requests_admin_select" on public.done_for_you_requests;
    drop policy if exists "done_for_you_requests_admin_update" on public.done_for_you_requests;
    drop policy if exists "done_for_you_requests_admin_delete" on public.done_for_you_requests;

    create policy "done_for_you_requests_public_insert"
      on public.done_for_you_requests
      for insert
      to anon, authenticated
      with check (status = 'new' and (user_id is null or user_id = auth.uid()));

    create policy "done_for_you_requests_admin_select"
      on public.done_for_you_requests
      for select
      to authenticated
      using (public.is_admin());

    create policy "done_for_you_requests_admin_update"
      on public.done_for_you_requests
      for update
      to authenticated
      using (public.is_admin())
      with check (public.is_admin());

    create policy "done_for_you_requests_admin_delete"
      on public.done_for_you_requests
      for delete
      to authenticated
      using (public.is_admin());
  end if;
end $$;

do $$
begin
  if to_regclass('public.done_for_you_requests') is not null then
    if not exists (
      select 1 from pg_constraint where conname = 'done_for_you_requests_name_length_check'
    ) then
      alter table public.done_for_you_requests
        add constraint done_for_you_requests_name_length_check
        check (name is null or char_length(name) <= 120) not valid;
    end if;

    if not exists (
      select 1 from pg_constraint where conname = 'done_for_you_requests_email_format_check'
    ) then
      alter table public.done_for_you_requests
        add constraint done_for_you_requests_email_format_check
        check (email ~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$' and char_length(email) <= 254) not valid;
    end if;

    if not exists (
      select 1 from pg_constraint where conname = 'done_for_you_requests_phone_length_check'
    ) then
      alter table public.done_for_you_requests
        add constraint done_for_you_requests_phone_length_check
        check (phone is null or char_length(phone) <= 40) not valid;
    end if;

    if not exists (
      select 1 from pg_constraint where conname = 'done_for_you_requests_business_name_length_check'
    ) then
      alter table public.done_for_you_requests
        add constraint done_for_you_requests_business_name_length_check
        check (business_name is null or char_length(business_name) <= 160) not valid;
    end if;

    if not exists (
      select 1 from pg_constraint where conname = 'done_for_you_requests_business_url_length_check'
    ) then
      alter table public.done_for_you_requests
        add constraint done_for_you_requests_business_url_length_check
        check (business_url is null or char_length(business_url) <= 240) not valid;
    end if;

    if not exists (
      select 1 from pg_constraint where conname = 'done_for_you_requests_service_area_length_check'
    ) then
      alter table public.done_for_you_requests
        add constraint done_for_you_requests_service_area_length_check
        check (service_area is null or char_length(service_area) <= 160) not valid;
    end if;

    if not exists (
      select 1 from pg_constraint where conname = 'done_for_you_requests_monthly_jobs_length_check'
    ) then
      alter table public.done_for_you_requests
        add constraint done_for_you_requests_monthly_jobs_length_check
        check (monthly_jobs is null or char_length(monthly_jobs) <= 120) not valid;
    end if;

    if not exists (
      select 1 from pg_constraint where conname = 'done_for_you_requests_message_length_check'
    ) then
      alter table public.done_for_you_requests
        add constraint done_for_you_requests_message_length_check
        check (message is null or char_length(message) <= 1500) not valid;
    end if;
  end if;
end $$;

do $$
begin
  if to_regclass('public.workspace_branding') is not null then
    if not exists (
      select 1 from pg_constraint where conname = 'workspace_branding_business_name_length_check'
    ) then
      alter table public.workspace_branding
        add constraint workspace_branding_business_name_length_check
        check (business_name is null or char_length(business_name) <= 160) not valid;
    end if;

    if not exists (
      select 1 from pg_constraint where conname = 'workspace_branding_logo_url_length_check'
    ) then
      alter table public.workspace_branding
        add constraint workspace_branding_logo_url_length_check
        check (logo_url is null or char_length(logo_url) <= 500) not valid;
    end if;

    if not exists (
      select 1 from pg_constraint where conname = 'workspace_branding_website_url_length_check'
    ) then
      alter table public.workspace_branding
        add constraint workspace_branding_website_url_length_check
        check (website_url is null or char_length(website_url) <= 240) not valid;
    end if;

    if not exists (
      select 1 from pg_constraint where conname = 'workspace_branding_phone_length_check'
    ) then
      alter table public.workspace_branding
        add constraint workspace_branding_phone_length_check
        check (phone is null or char_length(phone) <= 40) not valid;
    end if;
  end if;
end $$;

select pg_notify('pgrst', 'reload schema');
