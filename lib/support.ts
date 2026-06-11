import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  SupportTicketMessageRecord,
  SupportTicketPriority,
  SupportTicketRecord,
  SupportTicketStatus,
} from "@/types";

type SupabaseAdmin = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

export const supportCategories = [
  "campaign_launch",
  "meta_connection",
  "crm_integration",
  "billing",
  "bug_report",
  "general_question",
] as const;

export const supportPriorities = ["low", "medium", "high"] as const;
export const supportStatuses = ["new", "active", "waiting_on_user", "resolved", "closed"] as const;

export function isMissingSupportTableError(message?: string | null) {
  const value = message || "";
  return (
    value.includes("Could not find the table 'public.support_tickets' in the schema cache") ||
    value.includes('Could not find the table \'public.support_ticket_messages\' in the schema cache') ||
    value.includes('relation "public.support_tickets" does not exist') ||
    value.includes('relation "support_tickets" does not exist') ||
    value.includes('relation "public.support_ticket_messages" does not exist') ||
    value.includes('relation "support_ticket_messages" does not exist')
  );
}

type TicketRow = SupportTicketRecord & {
  workspace?: { name?: string } | { name?: string }[] | null;
};

type MessageRow = SupportTicketMessageRecord;

export async function listSupportTicketsForUser({
  admin,
  userId,
  workspaceId,
  ticketId,
}: {
  admin: SupabaseAdmin;
  userId: string;
  workspaceId: string;
  ticketId?: string | null;
}) {
  let query = admin
    .from("support_tickets")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .order("last_message_at", { ascending: false })
    .limit(12);

  if (ticketId) {
    query = admin
      .from("support_tickets")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .eq("id", ticketId)
      .limit(1);
  }

  const { data, error } = await query;
  if (error) {
    if (isMissingSupportTableError(error.message)) return [];
    throw new Error(error.message);
  }
  return ((data || []) as TicketRow[]).map((ticket) => ({
    ...ticket,
    workspace_name:
      ticket.workspace_name ||
      (typeof ticket.context_json?.workspaceName === "string" ? ticket.context_json.workspaceName : "") ||
      "",
  }));
}

export async function getSupportTicketThread({
  admin,
  ticketId,
}: {
  admin: SupabaseAdmin;
  ticketId: string;
}) {
  const [{ data: ticketData, error: ticketError }, { data: messageData, error: messageError }] = await Promise.all([
    admin.from("support_tickets").select("*").eq("id", ticketId).maybeSingle(),
    admin.from("support_ticket_messages").select("*").eq("ticket_id", ticketId).order("created_at", { ascending: true }),
  ]);

  if (ticketError) {
    if (isMissingSupportTableError(ticketError.message)) return null;
    throw new Error(ticketError.message);
  }
  if (messageError) {
    if (isMissingSupportTableError(messageError.message)) return null;
    throw new Error(messageError.message);
  }

  if (!ticketData) return null;

  return {
    ticket: ticketData as SupportTicketRecord,
    messages: (messageData || []) as MessageRow[],
  };
}

export async function listAdminSupportTickets({
  admin,
  status,
  priority,
  query,
}: {
  admin: SupabaseAdmin;
  status?: SupportTicketStatus | "all";
  priority?: SupportTicketPriority | "all";
  query?: string;
}) {
  const { data, error } = await admin
    .from("support_tickets")
    .select("*")
    .order("last_message_at", { ascending: false })
    .limit(200);

  if (error) {
    if (isMissingSupportTableError(error.message)) return [];
    throw new Error(error.message);
  }

  const normalizedQuery = (query || "").trim().toLowerCase();

  return ((data || []) as TicketRow[])
    .map((ticket) => ({
      ...ticket,
      workspace_name:
        ticket.workspace_name ||
        (typeof ticket.context_json?.workspaceName === "string" ? ticket.context_json.workspaceName : "") ||
        "",
    }))
    .filter((ticket) => (status && status !== "all" ? ticket.status === status : true))
    .filter((ticket) => (priority && priority !== "all" ? ticket.priority === priority : true))
    .filter((ticket) => {
      if (!normalizedQuery) return true;
      const haystacks = [
        ticket.subject,
        ticket.user_name,
        ticket.user_email,
        ticket.workspace_name,
        ticket.message,
        ticket.last_message_preview,
      ]
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.toLowerCase());
      return haystacks.some((value) => value.includes(normalizedQuery));
    });
}

export async function getAdminSupportTicketDetail({
  admin,
  ticketId,
}: {
  admin: SupabaseAdmin;
  ticketId: string;
}) {
  const result = await getSupportTicketThread({ admin, ticketId });
  if (!result) return null;

  const ticket = {
    ...result.ticket,
    workspace_name:
      result.ticket.workspace_name ||
      (typeof result.ticket.context_json?.workspaceName === "string" ? result.ticket.context_json.workspaceName : "") ||
      "",
    current_route:
      result.ticket.current_route ||
      (typeof result.ticket.context_json?.currentRoute === "string" ? result.ticket.context_json.currentRoute : null),
  };

  return {
    ticket,
    messages: result.messages,
  };
}

export async function createSupportTicketWithMessage({
  admin,
  ticket,
  message,
}: {
  admin: SupabaseAdmin;
  ticket: Omit<
    SupportTicketRecord,
    "id" | "created_at" | "updated_at" | "last_message_at" | "last_message_preview" | "status"
  > & { status?: SupportTicketStatus };
  message: Omit<SupportTicketMessageRecord, "id" | "created_at">;
}) {
  const now = new Date().toISOString();
  const ticketInsert = {
    workspace_id: ticket.workspace_id,
    workspace_name: ticket.workspace_name,
    user_id: ticket.user_id,
    user_name: ticket.user_name,
    user_email: ticket.user_email,
    subject: ticket.subject,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status || "new",
    message: ticket.message,
    current_route: ticket.current_route,
    context_json: ticket.context_json,
    last_message_at: now,
    last_message_preview: message.body.slice(0, 280),
  };

  const { data: insertedTicket, error: ticketError } = await admin
    .from("support_tickets")
    .insert(ticketInsert)
    .select("*")
    .single();

  if (ticketError) throw new Error(ticketError.message);

  const { error: messageError } = await admin.from("support_ticket_messages").insert({
    ticket_id: insertedTicket.id,
    workspace_id: ticket.workspace_id,
    author_user_id: message.author_user_id,
    author_name: message.author_name,
    author_email: message.author_email,
    author_role: message.author_role,
    body: message.body,
  });

  if (messageError) throw new Error(messageError.message);
  return insertedTicket as SupportTicketRecord;
}

export async function appendSupportTicketMessage({
  admin,
  ticketId,
  body,
  authorUserId,
  authorName,
  authorEmail,
  authorRole,
  nextStatus,
}: {
  admin: SupabaseAdmin;
  ticketId: string;
  body: string;
  authorUserId: string | null;
  authorName: string;
  authorEmail: string;
  authorRole: SupportTicketMessageRecord["author_role"];
  nextStatus?: SupportTicketStatus;
}) {
  const { data: ticketData, error: ticketError } = await admin
    .from("support_tickets")
    .select("*")
    .eq("id", ticketId)
    .single();

  if (ticketError) throw new Error(ticketError.message);
  const ticket = ticketData as SupportTicketRecord;

  const { error: messageError } = await admin.from("support_ticket_messages").insert({
    ticket_id: ticket.id,
    workspace_id: ticket.workspace_id,
    author_user_id: authorUserId,
    author_name: authorName,
    author_email: authorEmail,
    author_role: authorRole,
    body,
  });

  if (messageError) throw new Error(messageError.message);

  const { error: updateError } = await admin
    .from("support_tickets")
    .update({
      status: nextStatus || ticket.status,
      last_message_at: new Date().toISOString(),
      last_message_preview: body.slice(0, 280),
      updated_at: new Date().toISOString(),
    })
    .eq("id", ticket.id);

  if (updateError) throw new Error(updateError.message);
}

export function getSupportStatusLabel(status: SupportTicketStatus) {
  switch (status) {
    case "new":
      return "New";
    case "active":
      return "Active";
    case "waiting_on_user":
      return "Waiting on User";
    case "resolved":
      return "Resolved";
    case "closed":
      return "Closed";
    default:
      return status;
  }
}

export function getSupportStatusTone(status: SupportTicketStatus) {
  switch (status) {
    case "new":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "active":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "waiting_on_user":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "resolved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "closed":
      return "border-slate-200 bg-slate-100 text-slate-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

export function getSupportPriorityTone(priority: SupportTicketPriority) {
  switch (priority) {
    case "high":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "medium":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "low":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

export function getSupportCategoryLabel(category: SupportTicketRecord["category"]) {
  return category.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
