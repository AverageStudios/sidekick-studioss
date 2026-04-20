create table if not exists workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  invited_email text not null,
  invited_role text not null default 'member',
  invited_by_user_id uuid not null,
  token text not null unique,
  status text not null default 'pending',
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  accepted_by_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from information_schema.constraint_column_usage
    where table_name = 'workspace_invitations'
      and constraint_name = 'workspace_invitations_role_check'
  ) then
    alter table workspace_invitations
      add constraint workspace_invitations_role_check
      check (invited_role in ('admin', 'member'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from information_schema.constraint_column_usage
    where table_name = 'workspace_invitations'
      and constraint_name = 'workspace_invitations_status_check'
  ) then
    alter table workspace_invitations
      add constraint workspace_invitations_status_check
      check (status in ('pending', 'accepted', 'revoked', 'expired'));
  end if;
end $$;

create unique index if not exists workspace_invitations_workspace_email_pending_idx
  on workspace_invitations(workspace_id, lower(invited_email))
  where status = 'pending';

create index if not exists workspace_invitations_workspace_idx
  on workspace_invitations(workspace_id);

create index if not exists workspace_invitations_token_idx
  on workspace_invitations(token);

alter table workspace_invitations enable row level security;

create policy "workspace members can read invitations" on workspace_invitations
  for select using (
    exists (
      select 1
      from workspace_memberships wm
      where wm.workspace_id = workspace_invitations.workspace_id
        and wm.user_id = auth.uid()
    )
  );

create policy "workspace owners admins can manage invitations" on workspace_invitations
  for all using (
    exists (
      select 1
      from workspace_memberships wm
      where wm.workspace_id = workspace_invitations.workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'admin')
    )
  ) with check (
    exists (
      select 1
      from workspace_memberships wm
      where wm.workspace_id = workspace_invitations.workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'admin')
    )
  );

drop trigger if exists workspace_invitations_updated_at on workspace_invitations;
create trigger workspace_invitations_updated_at
before update on workspace_invitations
for each row execute function set_updated_at();
