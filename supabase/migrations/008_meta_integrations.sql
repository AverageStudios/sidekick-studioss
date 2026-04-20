create table if not exists workspace_meta_connections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references workspaces(id) on delete cascade,
  user_id uuid not null,
  meta_user_id text,
  meta_user_name text,
  access_token text not null,
  token_type text,
  token_expires_at timestamptz,
  scopes text[] not null default '{}'::text[],
  selected_ad_account_id text,
  selected_ad_account_name text,
  selected_page_id text,
  selected_page_name text,
  ad_accounts_json jsonb not null default '[]'::jsonb,
  pages_json jsonb not null default '[]'::jsonb,
  connected_at timestamptz not null default now(),
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspace_meta_connections_user_id_idx
  on workspace_meta_connections(user_id);

create index if not exists workspace_meta_connections_workspace_id_idx
  on workspace_meta_connections(workspace_id);

alter table workspace_meta_connections enable row level security;

create policy "workspace meta connections owner access" on workspace_meta_connections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists workspace_meta_connections_updated_at on workspace_meta_connections;
create trigger workspace_meta_connections_updated_at
before update on workspace_meta_connections
for each row execute function set_updated_at();
