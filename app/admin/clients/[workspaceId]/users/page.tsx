import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Send, UsersRound } from "lucide-react";
import { adminInviteClientUserAction } from "@/app/actions";
import { AdminShell } from "@/components/admin-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { requireAdmin } from "@/lib/auth";
import { getAdminClient, listAdminClientUsers } from "@/lib/admin-clients";
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
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-800";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export default async function AdminClientUsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  await requireAdmin();
  const [{ workspaceId }, { saved, error }] = await Promise.all([params, searchParams]);
  const [client, users] = await Promise.all([getAdminClient(workspaceId), listAdminClientUsers(workspaceId)]);

  if (!client) {
    notFound();
  }

  return (
    <AdminShell currentPath="/admin/clients">
      <PageHeader
        badge="Users"
        title={`${client.businessName} team`}
        description="Invite users to this subaccount. Each user sets their own password and receives access only to this workspace."
        actions={
          <Button asChild variant="outline">
            <Link href={`/admin/clients/${client.workspaceId}`}>
              <ArrowLeft className="h-4 w-4" />
              Back to subaccount
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

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <Card className="overflow-hidden">
          {users.length ? (
            <div className="divide-y divide-[var(--line)]">
              {users.map((user) => (
                <div key={`${user.status}-${user.id}`} className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <UsersRound className="h-4 w-4 text-[var(--brand)]" />
                      <p className="truncate text-sm font-semibold text-[var(--ink)]">{user.name}</p>
                    </div>
                    <p className="mt-1 truncate text-sm text-[var(--muted)]">{user.email}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">Added {formatDate(user.createdAt)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <Badge>{user.role}</Badge>
                    <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${statusTone(user.status)}`}>
                      {user.status.replaceAll("_", " ")}
                    </span>
                    {user.inviteStatus && user.inviteStatus !== user.status ? (
                      <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${statusTone(user.inviteStatus)}`}>
                        Invite {user.inviteStatus.replaceAll("_", " ")}
                      </span>
                    ) : null}
                    {user.inviteType ? <Badge>{user.inviteType}</Badge> : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-14 text-center">
              <UsersRound className="mx-auto h-8 w-8 text-[var(--brand)]" />
              <p className="mt-4 font-semibold text-[var(--ink)]">No users invited yet</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
                Invite the client owner or team members when the subaccount is ready.
              </p>
            </div>
          )}
        </Card>

        <Card className="h-fit p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Invite user</p>
          <form action={adminInviteClientUserAction} className="mt-4 space-y-4">
            <input type="hidden" name="workspaceId" value={client.workspaceId} />
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--ink)]" htmlFor="email">
                Email
              </label>
              <Input id="email" name="email" type="email" required maxLength={254} placeholder="client@example.com" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--ink)]" htmlFor="name">
                Name
              </label>
              <Input id="name" name="name" maxLength={120} placeholder="Jane Detailer" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--ink)]" htmlFor="role">
                Role
              </label>
              <Select id="role" name="role" defaultValue="owner">
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
                <option value="member">Member</option>
              </Select>
            </div>
            <Button type="submit" className="w-full">
              <Send className="h-4 w-4" />
              Invite user
            </Button>
          </form>
        </Card>
      </div>
    </AdminShell>
  );
}
