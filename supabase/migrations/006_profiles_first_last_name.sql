alter table profiles
  add column if not exists first_name text,
  add column if not exists last_name text;

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
