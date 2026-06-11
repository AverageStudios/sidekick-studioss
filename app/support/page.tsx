import Link from "next/link";
import { CheckCircle2, LifeBuoy, Mail, MessageSquareText, ShieldCheck } from "lucide-react";
import { replyToSupportTicketAction, submitSupportTicketAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getSupportCategoryLabel,
  getSupportPriorityTone,
  getSupportStatusLabel,
  getSupportStatusTone,
  getSupportTicketThread,
  listSupportTicketsForUser,
} from "@/lib/support";
import { getCurrentWorkspaceContext } from "@/lib/workspaces";

const supportEmail = "contact@sidekickstudioss.net";

const categories = [
  { value: "campaign_launch", label: "Campaign Launch" },
  { value: "meta_connection", label: "Meta Connection" },
  { value: "crm_integration", label: "CRM Integration" },
  { value: "billing", label: "Billing" },
  { value: "bug_report", label: "Bug Report" },
  { value: "general_question", label: "General Question" },
];

const priorities = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

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

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; replied?: string; error?: string; from?: string; ticket?: string }>;
}) {
  const user = await requireUser();
  const [{ submitted, replied, error, from, ticket: selectedTicketId }, workspaceContext] = await Promise.all([
    searchParams,
    getCurrentWorkspaceContext(),
  ]);
  const workspaceName = workspaceContext?.activeWorkspace.name || "Current workspace";
  const workspaceId = workspaceContext?.activeWorkspace.id || "";
  const userName = workspaceContext?.userDisplayName || user.email || "SideKick user";
  const admin = createSupabaseAdminClient();
  const tickets =
    admin && workspaceId ? await listSupportTicketsForUser({ admin, userId: user.id, workspaceId }) : [];
  const selectedTicketSummary = selectedTicketId ? tickets.find((ticket) => ticket.id === selectedTicketId) || null : null;
  const selectedTicket =
    admin && selectedTicketSummary ? await getSupportTicketThread({ admin, ticketId: selectedTicketSummary.id }).catch(() => null) : null;

  const mailtoSubject = encodeURIComponent(`SideKick support request - ${workspaceName}`);
  const mailtoBody = encodeURIComponent(
    [
      "Hi SideKick Support,",
      "",
      "I need help with:",
      "",
      `Workspace: ${workspaceName}${workspaceId ? ` (${workspaceId})` : ""}`,
      `Account: ${user.email || workspaceContext?.userEmail || ""}`,
      from ? `Page: ${from}` : "Page: /support",
    ].join("\n"),
  );
  const emailHref = `mailto:${supportEmail}?subject=${mailtoSubject}&body=${mailtoBody}`;

  return (
    <AppShell currentPath="/support">
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Support</p>
            <h1 className="mt-1 text-[2.2rem] font-semibold tracking-[-0.05em] text-[var(--ink)]">Get Support</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Reach the SideKick team for campaign launch, Meta, CRM handoff, billing, bugs, or general product help.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={emailHref}>
              <Mail className="h-4 w-4" />
              Email Support
            </Link>
          </Button>
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
                <p className="mt-1 text-sm leading-6 text-emerald-700">
                  Your update has been added to the ticket thread.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-6">
            <div className="rounded-[1.75rem] border border-[var(--line)] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)] sm:p-7">
              <div className="mb-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">New ticket</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">What can we help with?</h2>
              </div>

              <form action={submitSupportTicketAction} className="space-y-4">
                <input type="hidden" name="currentRoute" value={from || "/support"} />
                <div>
                  <label htmlFor="subject" className="text-sm font-medium text-[var(--ink)]">
                    Subject
                  </label>
                  <Input id="subject" name="subject" className="mt-2" placeholder="Short summary" required />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="category" className="text-sm font-medium text-[var(--ink)]">
                      Category
                    </label>
                    <Select id="category" name="category" className="mt-2" defaultValue="general_question" required>
                      {categories.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label htmlFor="priority" className="text-sm font-medium text-[var(--ink)]">
                      Priority
                    </label>
                    <Select id="priority" name="priority" className="mt-2" defaultValue="medium" required>
                      {priorities.map((priority) => (
                        <option key={priority.value} value={priority.value}>
                          {priority.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="text-sm font-medium text-[var(--ink)]">
                    Message
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    className="mt-2 min-h-[170px]"
                    placeholder="Share what happened, what you were trying to do, and anything urgent we should know."
                    required
                  />
                </div>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-5 text-[var(--muted)]">
                    Sending as {userName} from {workspaceName}.
                  </p>
                  <Button type="submit">
                    <LifeBuoy className="h-4 w-4" />
                    Submit Ticket
                  </Button>
                </div>
              </form>
            </div>

            {selectedTicket ? (
              <div className="rounded-[1.75rem] border border-[var(--line)] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)] sm:p-7">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Ticket thread</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                      {selectedTicket.ticket.subject}
                    </h2>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {getSupportCategoryLabel(selectedTicket.ticket.category)} • Updated {formatLongDate(selectedTicket.ticket.updated_at)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getSupportStatusTone(selectedTicket.ticket.status)}`}>
                      {getSupportStatusLabel(selectedTicket.ticket.status)}
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getSupportPriorityTone(selectedTicket.ticket.priority)}`}>
                      {selectedTicket.ticket.priority}
                    </span>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {selectedTicket.messages.map((message) => {
                    const isAdmin = message.author_role === "admin";
                    return (
                      <div
                        key={message.id}
                        className={`rounded-[1.25rem] border px-4 py-4 ${
                          isAdmin
                            ? "border-sky-200 bg-sky-50"
                            : "border-[var(--line)] bg-[var(--surface)]"
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
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--muted-strong)]">
                          {message.body}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {selectedTicket.ticket.status !== "closed" ? (
                  <form action={replyToSupportTicketAction} className="mt-6 space-y-3">
                    <input type="hidden" name="ticketId" value={selectedTicket.ticket.id} />
                    <input type="hidden" name="redirectTo" value={`/support?ticket=${selectedTicket.ticket.id}`} />
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
                      <Button type="submit">Send Reply</Button>
                    </div>
                  </form>
                ) : null}
              </div>
            ) : null}
          </div>

          <aside className="space-y-6">
            <div className="rounded-[1.75rem] border border-[var(--line)] bg-[var(--soft-panel)] p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-white text-[var(--brand)]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-base font-semibold text-[var(--ink)]">Included with your ticket</h2>
              <div className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
                <p>Workspace name and ID</p>
                <p>Your account name and email</p>
                <p>The app page you came from</p>
                <p>Submission time and app environment</p>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-[var(--line)] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Recent tickets</p>
                  <h2 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">Your support history</h2>
                </div>
                <MessageSquareText className="h-5 w-5 text-[var(--brand)]" />
              </div>

              <div className="mt-5 space-y-3">
                {tickets.length ? (
                  tickets.map((ticket) => (
                    <Link
                      key={ticket.id}
                      href={`/support?ticket=${ticket.id}`}
                      className="block rounded-[1.15rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-4 transition hover:border-[color-mix(in_oklab,var(--brand)_18%,white)]"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-[var(--ink)]">{ticket.subject}</p>
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getSupportStatusTone(ticket.status)}`}>
                          {getSupportStatusLabel(ticket.status)}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-[var(--muted)]">
                        {ticket.last_message_preview || ticket.message}
                      </p>
                      <p className="mt-2 text-xs text-[var(--muted)]">
                        {getSupportCategoryLabel(ticket.category)} • {formatLongDate(ticket.last_message_at)}
                      </p>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--soft-panel)] px-5 py-6 text-sm text-[var(--muted)]">
                    No tickets yet. Your next support request will appear here.
                  </div>
                )}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}
