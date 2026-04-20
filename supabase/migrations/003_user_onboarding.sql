alter table profiles
  add column if not exists selected_industry text,
  add column if not exists starting_template_id text references templates(id) on delete set null,
  add column if not exists onboarding_completed_at timestamptz;

update profiles p
set
  selected_industry = coalesce(
    p.selected_industry,
    case
      when exists (
        select 1
        from campaigns c
        where c.user_id = p.user_id
      ) then 'auto-detailing'
      when exists (
        select 1
        from business_profiles b
        where b.user_id = p.user_id
      ) then 'auto-detailing'
      else p.selected_industry
    end
  ),
  starting_template_id = coalesce(
    p.starting_template_id,
    (
      select c.template_id
      from campaigns c
      where c.user_id = p.user_id
      order by c.created_at asc
      limit 1
    )
  ),
  onboarding_completed_at = coalesce(
    p.onboarding_completed_at,
    case
      when exists (
        select 1
        from campaigns c
        where c.user_id = p.user_id
      )
      or exists (
        select 1
        from business_profiles b
        where b.user_id = p.user_id
      ) then now()
      else p.onboarding_completed_at
    end
  );

create index if not exists profiles_onboarding_completed_at_idx on profiles(onboarding_completed_at);
create index if not exists profiles_starting_template_id_idx on profiles(starting_template_id);
