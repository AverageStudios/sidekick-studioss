create table if not exists support_tickets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  workspace_name text not null default '',
  user_id uuid,
  user_name text not null default '',
  user_email text not null default '',
  subject text not null,
  category text not null,
  priority text not null default 'medium',
  status text not null default 'new',
  message text not null,
  current_route text default '/support',
  context_json jsonb not null default '{}'::jsonb,
  last_message_at timestamptz not null default now(),
  last_message_preview text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table support_tickets
  add column if not exists workspace_name text not null default '',
  add column if not exists current_route text default '/support',
  add column if not exists last_message_at timestamptz not null default now(),
  add column if not exists last_message_preview text not null default '';

update support_tickets
set
  workspace_name = coalesce(nullif(workspace_name, ''), context_json->>'workspaceName', ''),
  current_route = coalesce(nullif(current_route, ''), context_json->>'currentRoute', '/support'),
  last_message_at = coalesce(last_message_at, updated_at, created_at, now()),
  last_message_preview = coalesce(nullif(last_message_preview, ''), left(message, 280), '')
where true;

update support_tickets
set status = case status
  when 'open' then 'new'
  when 'in_progress' then 'active'
  when 'resolved' then 'resolved'
  when 'closed' then 'closed'
  else status
end
where status in ('open', 'in_progress', 'resolved', 'closed');

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'support_tickets_status_check'
  ) then
    alter table support_tickets
      drop constraint support_tickets_status_check;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'support_tickets_category_check'
  ) then
    alter table support_tickets
      drop constraint support_tickets_category_check;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'support_tickets_priority_check'
  ) then
    alter table support_tickets
      drop constraint support_tickets_priority_check;
  end if;
end $$;

alter table support_tickets
  add constraint support_tickets_category_check check (
    category in (
      'campaign_launch',
      'meta_connection',
      'crm_integration',
      'billing',
      'bug_report',
      'general_question'
    )
  );

alter table support_tickets
  add constraint support_tickets_priority_check check (
    priority in ('low', 'medium', 'high')
  );

alter table support_tickets
  add constraint support_tickets_status_check check (
    status in ('new', 'active', 'waiting_on_user', 'resolved', 'closed')
  );

create index if not exists support_tickets_workspace_name_idx on support_tickets(workspace_name);
create index if not exists support_tickets_last_message_at_idx on support_tickets(last_message_at desc);

drop trigger if exists support_tickets_updated_at on support_tickets;
create trigger support_tickets_updated_at
before update on support_tickets
for each row execute function set_updated_at();

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

create table if not exists support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references support_tickets(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  author_user_id uuid,
  author_name text not null default '',
  author_email text not null default '',
  author_role text not null,
  body text not null,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'support_ticket_messages_author_role_check'
  ) then
    alter table support_ticket_messages
      add constraint support_ticket_messages_author_role_check
      check (author_role in ('user', 'admin', 'system'));
  end if;
end $$;

create index if not exists support_ticket_messages_ticket_id_idx
  on support_ticket_messages(ticket_id, created_at asc);

create index if not exists support_ticket_messages_workspace_id_idx
  on support_ticket_messages(workspace_id, created_at desc);

insert into support_ticket_messages (
  ticket_id,
  workspace_id,
  author_user_id,
  author_name,
  author_email,
  author_role,
  body,
  created_at
)
select
  ticket.id,
  ticket.workspace_id,
  ticket.user_id,
  ticket.user_name,
  ticket.user_email,
  'user',
  ticket.message,
  ticket.created_at
from support_tickets ticket
where not exists (
  select 1
  from support_ticket_messages message
  where message.ticket_id = ticket.id
);

alter table support_ticket_messages enable row level security;

drop policy if exists "Workspace members can view support ticket messages" on support_ticket_messages;
create policy "Workspace members can view support ticket messages"
on support_ticket_messages
for select
using (
  exists (
    select 1
    from workspace_memberships wm
    where wm.workspace_id = support_ticket_messages.workspace_id
      and wm.user_id = auth.uid()
  )
);

drop policy if exists "Workspace members can create support ticket messages" on support_ticket_messages;
create policy "Workspace members can create support ticket messages"
on support_ticket_messages
for insert
with check (
  exists (
    select 1
    from workspace_memberships wm
    where wm.workspace_id = support_ticket_messages.workspace_id
      and wm.user_id = auth.uid()
  )
);
