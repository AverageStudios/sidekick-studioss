import Link from "next/link";
import { BookOpenText, CheckCircle2, LifeBuoy, Mail, MessageSquareText } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getSupportCategoryLabel,
  getSupportPriorityTone,
  getSupportStatusLabel,
  getSupportStatusTone,
  listSupportTicketsForUser,
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

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; error?: string; from?: string }>;
}) {
  const user = await requireUser();
  const [{ submitted, error, from }, workspaceContext] = await Promise.all([searchParams, getCurrentWorkspaceContext()]);
  const workspaceName = workspaceContext?.activeWorkspace.name || "Current workspace";
  const workspaceId = workspaceContext?.activeWorkspace.id || "";
  const admin = createSupabaseAdminClient();
  const tickets =
    admin && workspaceId ? await listSupportTicketsForUser({ admin, userId: user.id, workspaceId }) : [];

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
            <h1 className="mt-1 text-[2.2rem] font-semibold tracking-[-0.05em] text-[var(--ink)]">Your Tickets</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Track open conversations with the SideKick team and start a new support request when you need help.
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline" className="rounded-[18px] px-5">
              <Link href="/academy">
                <BookOpenText className="h-4 w-4" />
                Academy
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-[18px] px-5">
              <Link href={emailHref}>
                <Mail className="h-4 w-4" />
                Email Support
              </Link>
            </Button>
            <Button asChild className="rounded-[18px] bg-[var(--brand)] px-5 text-white hover:bg-[color-mix(in_oklab,var(--brand)_88%,black)]">
              <Link href={from ? `/support/new?from=${encodeURIComponent(from)}` : "/support/new"}>
                <LifeBuoy className="h-4 w-4" />
                New Ticket
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

        {error ? (
          <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {tickets.length ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {tickets.map((ticket) => (
              <Link key={ticket.id} href={`/support/${ticket.id}`} className="block">
                <Card className="group h-full rounded-[24px] border-[var(--line)] bg-white p-5 transition duration-200 hover:shadow-[0_8px_28px_rgba(16,24,40,0.06)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-[1.05rem] font-semibold tracking-[-0.02em] text-[var(--ink)]">
                        {ticket.subject}
                      </h2>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {getSupportCategoryLabel(ticket.category)} • Updated {formatLongDate(ticket.last_message_at)}
                      </p>
                    </div>
                    <MessageSquareText className="h-5 w-5 shrink-0 text-[var(--brand)]" />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getSupportStatusTone(ticket.status)}`}>
                      {getSupportStatusLabel(ticket.status)}
                    </span>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getSupportPriorityTone(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>

                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-[var(--muted)]">
                    {ticket.last_message_preview || ticket.message}
                  </p>

                  <div className="mt-5 flex items-center justify-between pt-1">
                    <span className="rounded-[12px] border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5 text-[11px] text-[var(--muted)]">
                      Open thread
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="max-w-[34rem] rounded-[28px] border-[var(--line)] bg-white p-8 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            <h2 className="text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">No tickets yet</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              When you open a ticket, it will show up here with replies, status updates, and the latest activity from the SideKick team.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="rounded-[18px] bg-[var(--brand)] px-5 text-white hover:bg-[color-mix(in_oklab,var(--brand)_88%,black)]">
                <Link href={from ? `/support/new?from=${encodeURIComponent(from)}` : "/support/new"}>New Ticket</Link>
              </Button>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
