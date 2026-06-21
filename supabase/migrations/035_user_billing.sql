create table if not exists public.user_billing (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_price_id text,
  subscription_status text,
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_billing_subscription_status_check'
  ) then
    alter table public.user_billing
      add constraint user_billing_subscription_status_check
      check (
        subscription_status is null
        or subscription_status in (
          'trialing',
          'active',
          'past_due',
          'canceled',
          'incomplete',
          'incomplete_expired',
          'unpaid',
          'paused'
        )
      );
  end if;
end $$;

create index if not exists user_billing_subscription_status_idx
  on public.user_billing(subscription_status);

create index if not exists user_billing_current_period_end_idx
  on public.user_billing(current_period_end desc);

alter table public.user_billing enable row level security;

revoke all on public.user_billing from anon;
grant select on public.user_billing to authenticated;

drop policy if exists "user_billing_select_self_or_admin" on public.user_billing;
drop policy if exists "user_billing_admin_manage" on public.user_billing;

create policy "user_billing_select_self_or_admin"
  on public.user_billing
  for select
  to authenticated
  using (auth.uid() = user_id or public.is_admin());

create policy "user_billing_admin_manage"
  on public.user_billing
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists user_billing_updated_at on public.user_billing;
create trigger user_billing_updated_at
before update on public.user_billing
for each row execute function set_updated_at();
