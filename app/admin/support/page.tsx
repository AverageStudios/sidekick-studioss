import Link from "next/link";
import { Filter, LifeBuoy, Search } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getSupportCategoryLabel,
  getSupportPriorityTone,
  getSupportStatusLabel,
  getSupportStatusTone,
  listAdminSupportTickets,
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

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string; q?: string; saved?: string; error?: string }>;
}) {
  await requireAdmin();
  const [{ status, priority, q, saved, error }] = await Promise.all([searchParams]);
  const admin = createSupabaseAdminClient();
  const tickets =
    admin
      ? await listAdminSupportTickets({
          admin,
          status: (status as "all" | undefined) || "all",
          priority: (priority as "all" | undefined) || "all",
          query: q || "",
        }).catch(() => [])
      : [];

  return (
    <AdminShell currentPath="/admin/support">
      <PageHeader
        badge="Admin"
        title="Support tickets"
        description="Track incoming support requests, manage ticket status, and reply from a single operational queue."
      />

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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Total", value: tickets.length },
          { label: "New", value: tickets.filter((ticket) => ticket.status === "new").length },
          { label: "Active", value: tickets.filter((ticket) => ticket.status === "active").length },
          { label: "Waiting on User", value: tickets.filter((ticket) => ticket.status === "waiting_on_user").length },
          { label: "Resolved / Closed", value: tickets.filter((ticket) => ticket.status === "resolved" || ticket.status === "closed").length },
        ].map((item) => (
          <div key={item.label} className="rounded-[1.5rem] border border-[var(--line)] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[var(--ink)]">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[1.75rem] border border-[var(--line)] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
        <form className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_12rem_12rem_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <Input name="q" defaultValue={q || ""} placeholder="Search subject, workspace, user, or message" className="pl-9" />
          </div>
          <Select name="status" defaultValue={status || "all"}>
            <option value="all">All statuses</option>
            <option value="new">New</option>
            <option value="active">Active</option>
            <option value="waiting_on_user">Waiting on User</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </Select>
          <Select name="priority" defaultValue={priority || "all"}>
            <option value="all">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
          <Button type="submit" variant="outline">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </form>

        <div className="mt-6 space-y-3">
          {tickets.length ? (
            tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/admin/support/${ticket.id}`}
                className="grid gap-4 rounded-[1.35rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-4 transition hover:border-[color-mix(in_oklab,var(--brand)_18%,white)] sm:grid-cols-[minmax(0,1.3fr)_minmax(0,0.8fr)_auto]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-[var(--ink)]">{ticket.subject}</p>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getSupportStatusTone(ticket.status)}`}>
                      {getSupportStatusLabel(ticket.status)}
                    </span>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getSupportPriorityTone(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-[var(--muted)]">
                    {ticket.last_message_preview || ticket.message}
                  </p>
                </div>

                <div className="min-w-0 text-sm text-[var(--muted)]">
                  <p className="font-medium text-[var(--ink)]">{ticket.workspace_name || "Workspace"}</p>
                  <p className="mt-1 truncate">{ticket.user_name || "Unknown user"}</p>
                  <p className="truncate">{ticket.user_email || "No email"}</p>
                </div>

                <div className="flex flex-col items-start gap-2 text-xs text-[var(--muted)] sm:items-end">
                  <Badge>{getSupportCategoryLabel(ticket.category)}</Badge>
                  <span>{formatDateTime(ticket.last_message_at)}</span>
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-[1.35rem] border border-dashed border-[var(--line)] bg-[var(--soft-panel)] px-6 py-10 text-center">
              <LifeBuoy className="mx-auto h-8 w-8 text-[var(--brand)]" />
              <p className="mt-4 text-base font-semibold text-[var(--ink)]">No tickets match these filters</p>
              <p className="mt-2 text-sm text-[var(--muted)]">Try broadening the search or switching back to all statuses.</p>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
