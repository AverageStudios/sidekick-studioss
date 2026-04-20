alter table workspace_memberships
  add column if not exists last_accessed_at timestamptz not null default now();

update workspace_memberships
set last_accessed_at = coalesce(last_accessed_at, updated_at, created_at, now());

create index if not exists workspace_memberships_user_last_accessed_idx
  on workspace_memberships(user_id, last_accessed_at desc);
