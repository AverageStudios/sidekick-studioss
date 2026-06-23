import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Palette, UsersRound } from "lucide-react";
import { switchWorkspaceAction } from "@/app/actions";
import { AdminShell } from "@/components/admin-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { getAdminClient } from "@/lib/admin-clients";

function statusTone(status: string) {
  switch (status) {
    case "active":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "requested":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "inactive":
    case "canceled":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export default async function AdminClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ created?: string; saved?: string; error?: string }>;
}) {
  await requireAdmin();
  const [{ workspaceId }, { created, saved, error }] = await Promise.all([params, searchParams]);
  const client = await getAdminClient(workspaceId);

  if (!client) {
    notFound();
  }

  return (
    <AdminShell currentPath="/admin/clients">
      <PageHeader
        badge="Subaccount"
        title={client.businessName}
        description="Review the client subaccount, manage workspace access, and invite users when the account is ready."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/admin/clients">
                <ArrowLeft className="h-4 w-4" />
                Back to clients
              </Link>
            </Button>
            <form action={switchWorkspaceAction}>
              <input type="hidden" name="workspaceId" value={client.workspaceId} />
              <input type="hidden" name="redirectTo" value="/dashboard" />
              <Button type="submit">
                <Building2 className="h-4 w-4" />
                Manage workspace
              </Button>
            </form>
          </>
        }
      />

      {created ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Client subaccount created. Invite users from the Users page when you are ready.
        </div>
      ) : null}
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

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            {client.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={client.logoUrl}
                alt={`${client.businessName} logo`}
                className="h-20 w-20 rounded-2xl border border-[var(--line)] object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--soft-panel)] text-2xl font-semibold text-[var(--brand)]">
                {client.businessName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">{client.businessName}</h2>
                <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${statusTone(client.status)}`}>
                  {client.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-[var(--muted)]">{client.workspaceName}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Tier</p>
                  <p className="mt-1 text-sm font-semibold capitalize text-[var(--ink)]">{client.tier.replaceAll("_", " ")}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Industry</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--ink)]">{client.industry || "Auto Detailing"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Service area</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--ink)]">{client.serviceArea || "Not set"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Created</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--ink)]">{formatDate(client.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Users</p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[var(--ink)]">{client.memberCount}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{client.pendingInviteCount} pending invites</p>
            <Button asChild className="mt-5 w-full" variant="outline">
              <Link href={`/admin/clients/${client.workspaceId}/users`}>
                <UsersRound className="h-4 w-4" />
                Users
              </Link>
            </Button>
          </Card>

          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Branding</p>
            <div className="mt-4 flex items-center gap-2">
              <Palette className="h-4 w-4 text-[var(--muted)]" />
              <div className="flex gap-2">
                <span className="h-6 w-6 rounded-full border border-[var(--line)]" style={{ backgroundColor: client.primaryColor || "#6D5EF8" }} />
                <span className="h-6 w-6 rounded-full border border-[var(--line)]" style={{ backgroundColor: client.accentColor || "#11B981" }} />
              </div>
            </div>
            <form action={switchWorkspaceAction} className="mt-5">
              <input type="hidden" name="workspaceId" value={client.workspaceId} />
              <input type="hidden" name="redirectTo" value="/workspace/settings" />
              <Button type="submit" className="w-full" variant="outline">
                Edit branding
              </Button>
            </form>
          </Card>
        </div>
      </div>

      <Card className="p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Website / social</p>
            <p className="mt-1 break-words text-sm font-semibold text-[var(--ink)]">{client.websiteUrl || "Not set"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Phone</p>
            <p className="mt-1 text-sm font-semibold text-[var(--ink)]">{client.phone || "Not set"}</p>
          </div>
        </div>
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Notes</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--muted-strong)]">{client.notes || "No internal notes yet."}</p>
        </div>
      </Card>
    </AdminShell>
  );
}
