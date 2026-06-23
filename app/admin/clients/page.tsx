import Link from "next/link";
import { ArrowRight, Building2, Mail, UsersRound } from "lucide-react";
import { switchWorkspaceAction } from "@/app/actions";
import { AdminShell } from "@/components/admin-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { listAdminClients } from "@/lib/admin-clients";
import { formatDate } from "@/lib/utils";

function statusTone(status: string) {
  switch (status) {
    case "active":
    case "accepted":
    case "sent":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "email_failed":
    case "expired":
    case "revoked":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "email_skipped":
      return "border-amber-200 bg-amber-50 text-amber-800";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  await requireAdmin();
  const [{ saved, error }, clients] = await Promise.all([searchParams, listAdminClients()]);

  return (
    <AdminShell currentPath="/admin/clients">
      <PageHeader
        badge="Admin"
        title="Done-For-You clients"
        description="Create managed client workspaces, approve access, and send password setup invites without handling client passwords."
        actions={
          <Button asChild size="lg">
            <Link href="/admin/clients/new">
              Invite client
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
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

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Clients</p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[var(--ink)]">{clients.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Active</p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
            {clients.filter((client) => client.status === "active").length}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Accepted invites</p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
            {clients.filter((client) => client.inviteStatus === "accepted").length}
          </p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        {clients.length ? (
          <div className="divide-y divide-[var(--line)]">
            {clients.map((client) => (
              <div key={client.id} className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] lg:items-center">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <UsersRound className="h-4 w-4 text-[var(--brand)]" />
                    <p className="truncate text-sm font-semibold text-[var(--ink)]">{client.businessName}</p>
                  </div>
                  <p className="mt-1 truncate text-sm text-[var(--muted)]">{client.workspaceName}</p>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm text-[var(--muted-strong)]">
                    <Mail className="h-4 w-4 text-[var(--muted)]" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--muted)]">Created {formatDate(client.createdAt)}</p>
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Badge>{client.tier.replaceAll("_", " ")}</Badge>
                  <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${statusTone(client.status)}`}>
                    {client.status}
                  </span>
                  <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${statusTone(client.inviteStatus)}`}>
                    Invite {client.inviteStatus.replaceAll("_", " ")}
                  </span>
                  {client.workspaceId ? (
                    <form action={switchWorkspaceAction}>
                      <input type="hidden" name="workspaceId" value={client.workspaceId} />
                      <input type="hidden" name="redirectTo" value="/dashboard" />
                      <Button type="submit" size="sm" variant="outline">
                        <Building2 className="h-4 w-4" />
                        Manage subaccount
                      </Button>
                    </form>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-14 text-center">
            <UsersRound className="mx-auto h-8 w-8 text-[var(--brand)]" />
            <p className="mt-4 font-semibold text-[var(--ink)]">No client invites yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
              Create your first Done-For-You client workspace and send a password setup invite.
            </p>
            <Button asChild className="mt-5">
              <Link href="/admin/clients/new">Invite client</Link>
            </Button>
          </div>
        )}
      </Card>
    </AdminShell>
  );
}
