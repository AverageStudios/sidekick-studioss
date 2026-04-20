create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, role, first_name, last_name)
  values (
    new.id,
    'user',
    nullif(new.raw_user_meta_data ->> 'first_name', ''),
    nullif(new.raw_user_meta_data ->> 'last_name', '')
  )
  on conflict (user_id) do update
  set
    first_name = coalesce(public.profiles.first_name, excluded.first_name),
    last_name = coalesce(public.profiles.last_name, excluded.last_name);

  return new;
end;
$$;

update profiles p
set
  first_name = coalesce(
    p.first_name,
    nullif(u.raw_user_meta_data ->> 'first_name', ''),
    nullif(split_part(coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', ''), ' ', 1), '')
  ),
  last_name = coalesce(
    p.last_name,
    nullif(u.raw_user_meta_data ->> 'last_name', ''),
    nullif(
      regexp_replace(coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', ''), '^\S+\s*', ''),
      ''
    )
  )
from auth.users u
where u.id = p.user_id;
