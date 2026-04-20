alter table campaigns
  add column if not exists launch_platform text not null default 'meta',
  add column if not exists launch_category text,
  add column if not exists launch_state_json jsonb not null default '{}'::jsonb,
  add column if not exists external_publish_status text not null default 'not_started',
  add column if not exists external_ids_json jsonb not null default '{}'::jsonb;

create index if not exists campaigns_workspace_status_idx on campaigns(workspace_id, status);
create index if not exists campaigns_launch_platform_idx on campaigns(launch_platform);
