create table if not exists support_tickets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid,
  user_name text not null default '',
  user_email text not null default '',
  subject text not null,
  category text not null,
  priority text not null default 'medium',
  message text not null,
  status text not null default 'open',
  context_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint support_tickets_category_check check (
    category in (
      'campaign_launch',
      'meta_connection',
      'crm_integration',
      'billing',
      'bug_report',
      'general_question'
    )
  ),
  constraint support_tickets_priority_check check (priority in ('low', 'medium', 'high')),
  constraint support_tickets_status_check check (status in ('open', 'in_progress', 'resolved', 'closed'))
);

create index if not exists support_tickets_workspace_id_idx on support_tickets(workspace_id);
create index if not exists support_tickets_user_id_idx on support_tickets(user_id);
create index if not exists support_tickets_status_idx on support_tickets(status);
create index if not exists support_tickets_created_at_idx on support_tickets(created_at desc);

alter table support_tickets enable row level security;

drop policy if exists "Workspace members can view support tickets" on support_tickets;
create policy "Workspace members can view support tickets"
on support_tickets
for select
using (
  exists (
    select 1
    from workspace_memberships wm
    where wm.workspace_id = support_tickets.workspace_id
      and wm.user_id = auth.uid()
  )
);

drop policy if exists "Workspace members can create support tickets" on support_tickets;
create policy "Workspace members can create support tickets"
on support_tickets
for insert
with check (
  exists (
    select 1
    from workspace_memberships wm
    where wm.workspace_id = support_tickets.workspace_id
      and wm.user_id = auth.uid()
  )
);
