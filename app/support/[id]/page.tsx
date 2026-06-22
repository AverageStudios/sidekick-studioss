import Link from "next/link";
import { CheckCircle2, Mail } from "lucide-react";
import { replyToSupportTicketAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { AsyncSubmitButton } from "@/components/ui/async-submit-button";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getSupportCategoryLabel,
  getSupportPriorityTone,
  getSupportStatusLabel,
  getSupportStatusTone,
  getSupportTicketThread,
} from "@/lib/support";
import { getCurrentWorkspaceContext } from "@/lib/workspaces";

const supportEmail = "contact@sidekickstudioss.net";

function formatLongDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default async function SupportTicketDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ submitted?: string; replied?: string; error?: string }>;
}) {
  const user = await requireUser();
  const [{ id }, { submitted, replied, error }, workspaceContext] = await Promise.all([
    params,
    searchParams,
    getCurrentWorkspaceContext(),
  ]);
  const workspaceId = workspaceContext?.activeWorkspace.id || "";
  const workspaceName = workspaceContext?.activeWorkspace.name || "Current workspace";
  const admin = createSupabaseAdminClient();
  const ticketThread = admin ? await getSupportTicketThread({ admin, ticketId: id }).catch(() => null) : null;

  if (!ticketThread || ticketThread.ticket.user_id !== user.id || ticketThread.ticket.workspace_id !== workspaceId) {
    return (
      <AppShell currentPath="/support">
        <div className="space-y-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Support</p>
            <h1 className="mt-1 text-[2.2rem] font-semibold tracking-[-0.05em] text-[var(--ink)]">Ticket not found</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              This ticket is not available in your current workspace.
            </p>
          </div>
          <Button asChild className="rounded-[18px] bg-[var(--brand)] px-5 text-white hover:bg-[color-mix(in_oklab,var(--brand)_88%,black)]">
            <Link href="/support" prefetch>Back to tickets</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const mailtoSubject = encodeURIComponent(`SideKick support ticket - ${ticketThread.ticket.subject}`);
  const mailtoBody = encodeURIComponent(
    [
      "Hi SideKick Support,",
      "",
      `Ticket: ${ticketThread.ticket.subject}`,
      `Workspace: ${workspaceName}${workspaceId ? ` (${workspaceId})` : ""}`,
      `Account: ${user.email || workspaceContext?.userEmail || ""}`,
      "",
      "Reply:",
    ].join("\n"),
  );
  const emailHref = `mailto:${supportEmail}?subject=${mailtoSubject}&body=${mailtoBody}`;

  return (
    <AppShell currentPath="/support">
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Support</p>
            <h1 className="mt-1 text-[2.2rem] font-semibold tracking-[-0.05em] text-[var(--ink)]">
              {ticketThread.ticket.subject}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              {getSupportCategoryLabel(ticketThread.ticket.category)} • Opened {formatLongDate(ticketThread.ticket.created_at)}
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline" className="rounded-[18px] px-5">
              <Link href="/support" prefetch>Back to tickets</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-[18px] px-5">
              <Link href={emailHref}>
                <Mail className="h-4 w-4" />
                Email Support
              </Link>
            </Button>
          </div>
        </div>

        {submitted ? (
          <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">Your ticket was received.</p>
                <p className="mt-1 text-sm leading-6 text-emerald-700">
                  We saved your workspace context and opened a support thread for the SideKick team.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {replied ? (
          <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">Reply sent.</p>
                <p className="mt-1 text-sm leading-6 text-emerald-700">Your update has been added to the ticket thread.</p>
              </div>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="rounded-[1.75rem] border border-[var(--line)] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)] sm:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Conversation</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">Ticket thread</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getSupportStatusTone(ticketThread.ticket.status)}`}>
                  {getSupportStatusLabel(ticketThread.ticket.status)}
                </span>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getSupportPriorityTone(ticketThread.ticket.priority)}`}>
                  {ticketThread.ticket.priority}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {ticketThread.messages.map((message) => {
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
                        {message.author_name || (isAdmin ? "SideKick Support" : "You")}
                      </p>
                      <span className="text-xs text-[var(--muted)]">
                        {isAdmin ? "Support" : "You"} • {formatLongDate(message.created_at)}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--muted-strong)]">{message.body}</p>
                  </div>
                );
              })}
            </div>

            {ticketThread.ticket.status !== "closed" ? (
              <form action={replyToSupportTicketAction} className="mt-6 space-y-3">
                <input type="hidden" name="ticketId" value={ticketThread.ticket.id} />
                <input type="hidden" name="redirectTo" value={`/support/${ticketThread.ticket.id}`} />
                <label htmlFor="replyMessage" className="text-sm font-medium text-[var(--ink)]">
                  Add a reply
                </label>
                <Textarea
                  id="replyMessage"
                  name="message"
                  className="min-h-[120px]"
                  placeholder="Add any new context, screenshots notes, or follow-up details."
                  required
                />
                <div className="flex justify-end">
                  <AsyncSubmitButton
                    label="Send Reply"
                    pendingLabel="Sending..."
                    className="rounded-[18px] bg-[var(--brand)] px-5 text-white hover:bg-[color-mix(in_oklab,var(--brand)_88%,black)]"
                  />
                </div>
              </form>
            ) : null}
          </div>

          <aside className="space-y-4">
            <div className="rounded-[1.75rem] border border-[var(--line)] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Details</p>
              <div className="mt-4 space-y-3 text-sm text-[var(--muted)]">
                <p>Workspace: <span className="font-medium text-[var(--ink)]">{workspaceName}</span></p>
                <p>Priority: <span className="font-medium capitalize text-[var(--ink)]">{ticketThread.ticket.priority}</span></p>
                <p>Status: <span className="font-medium text-[var(--ink)]">{getSupportStatusLabel(ticketThread.ticket.status)}</span></p>
                <p>Last update: <span className="font-medium text-[var(--ink)]">{formatLongDate(ticketThread.ticket.updated_at)}</span></p>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}
