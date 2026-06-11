import Link from "next/link";
import { ArrowLeft, Clock3, LifeBuoy } from "lucide-react";
import {
  adminReplyToSupportTicketAction,
  adminUpdateSupportTicketStatusAction,
} from "@/app/actions";
import { AdminShell } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getAdminSupportTicketDetail,
  getSupportCategoryLabel,
  getSupportPriorityTone,
  getSupportStatusLabel,
  getSupportStatusTone,
} from "@/lib/support";

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default async function AdminSupportTicketDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  await requireAdmin();
  const [{ id }, { saved, error }] = await Promise.all([params, searchParams]);
  const admin = createSupabaseAdminClient();
  const detail = admin ? await getAdminSupportTicketDetail({ admin, ticketId: id }).catch(() => null) : null;

  return (
    <AdminShell currentPath="/admin/support">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost">
          <Link href="/admin/support">
            <ArrowLeft className="h-4 w-4" />
            Back to tickets
          </Link>
        </Button>
      </div>

      {saved ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {saved}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {!detail ? (
        <div className="rounded-[1.75rem] border border-dashed border-[var(--line)] bg-[var(--soft-panel)] px-6 py-12 text-center">
          <LifeBuoy className="mx-auto h-8 w-8 text-[var(--brand)]" />
          <p className="mt-4 text-base font-semibold text-[var(--ink)]">Ticket not found</p>
          <p className="mt-2 text-sm text-[var(--muted)]">This ticket may not exist yet, or support storage has not been migrated in this database.</p>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="rounded-[1.75rem] border border-[var(--line)] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Support ticket</p>
                <h1 className="mt-2 text-[2rem] font-semibold tracking-[-0.05em] text-[var(--ink)]">{detail.ticket.subject}</h1>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {getSupportCategoryLabel(detail.ticket.category)} • Opened {formatDateTime(detail.ticket.created_at)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getSupportStatusTone(detail.ticket.status)}`}>
                  {getSupportStatusLabel(detail.ticket.status)}
                </span>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getSupportPriorityTone(detail.ticket.priority)}`}>
                  {detail.ticket.priority}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {detail.messages.map((message) => {
                const isAdmin = message.author_role === "admin";
                return (
                  <div
                    key={message.id}
                    className={`rounded-[1.25rem] border px-4 py-4 ${
                      isAdmin ? "border-sky-200 bg-sky-50" : "border-[var(--line)] bg-[var(--surface)]"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-[var(--ink)]">
                        {message.author_name || (isAdmin ? "SideKick admin" : detail.ticket.user_name)}
                      </p>
                      <span className="text-xs text-[var(--muted)]">
                        {isAdmin ? "Admin" : "User"} • {formatDateTime(message.created_at)}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--muted-strong)]">{message.body}</p>
                  </div>
                );
              })}
            </div>

            <form action={adminReplyToSupportTicketAction} className="mt-6 space-y-4">
              <input type="hidden" name="ticketId" value={detail.ticket.id} />
              <input type="hidden" name="redirectTo" value={`/admin/support/${detail.ticket.id}`} />
              <div>
                <label htmlFor="adminReply" className="text-sm font-medium text-[var(--ink)]">
                  Reply
                </label>
                <Textarea
                  id="adminReply"
                  name="message"
                  className="mt-2 min-h-[150px]"
                  placeholder="Reply to the user with next steps, requests, or resolution details."
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-[14rem_auto] sm:items-end">
                <div>
                  <label htmlFor="nextStatus" className="text-sm font-medium text-[var(--ink)]">
                    Status after reply
                  </label>
                  <Select id="nextStatus" name="nextStatus" className="mt-2" defaultValue="waiting_on_user">
                    <option value="active">Active</option>
                    <option value="waiting_on_user">Waiting on User</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </Select>
                </div>
                <div className="flex justify-end">
                  <Button type="submit">Send Reply</Button>
                </div>
              </div>
            </form>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[1.75rem] border border-[var(--line)] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Metadata</p>
              <div className="mt-4 space-y-4 text-sm text-[var(--muted)]">
                <div>
                  <p className="font-medium text-[var(--ink)]">Workspace</p>
                  <p className="mt-1">{detail.ticket.workspace_name || "Unknown workspace"}</p>
                  <p className="mt-1 text-xs">{detail.ticket.workspace_id}</p>
                </div>
                <div>
                  <p className="font-medium text-[var(--ink)]">User</p>
                  <p className="mt-1">{detail.ticket.user_name || "Unknown user"}</p>
                  <p className="mt-1">{detail.ticket.user_email || "No email"}</p>
                </div>
                <div>
                  <p className="font-medium text-[var(--ink)]">Route</p>
                  <p className="mt-1">{detail.ticket.current_route || "/support"}</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Clock3 className="h-4 w-4 text-[var(--muted)]" />
                  <span>Last updated {formatDateTime(detail.ticket.updated_at)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-[var(--line)] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Status</p>
              <form action={adminUpdateSupportTicketStatusAction} className="mt-4 space-y-4">
                <input type="hidden" name="ticketId" value={detail.ticket.id} />
                <input type="hidden" name="redirectTo" value={`/admin/support/${detail.ticket.id}`} />
                <Select name="status" defaultValue={detail.ticket.status}>
                  <option value="new">New</option>
                  <option value="active">Active</option>
                  <option value="waiting_on_user">Waiting on User</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </Select>
                <Button type="submit" variant="outline" className="w-full">
                  Save Status
                </Button>
              </form>
            </div>
          </aside>
        </div>
      )}
    </AdminShell>
  );
}
