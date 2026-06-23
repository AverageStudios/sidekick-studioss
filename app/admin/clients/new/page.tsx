import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { adminCreateClientInviteAction } from "@/app/actions";
import { AdminShell } from "@/components/admin-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { requireAdmin } from "@/lib/auth";

export default async function AdminNewClientPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { error } = await searchParams;

  return (
    <AdminShell currentPath="/admin/clients">
      <PageHeader
        badge="New client"
        title="Invite a Done-For-You client"
        description="Create the client account, workspace, plan, and branding, then send a password setup email."
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/clients">
              <ArrowLeft className="h-4 w-4" />
              Back to clients
            </Link>
          </Button>
        }
      />

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <Card className="max-w-4xl p-6 sm:p-7">
        <form action={adminCreateClientInviteAction} className="space-y-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Client</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--ink)]" htmlFor="email">Client email</label>
                <Input id="email" name="email" type="email" required maxLength={254} placeholder="client@example.com" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--ink)]" htmlFor="name">Client name</label>
                <Input id="name" name="name" maxLength={120} placeholder="Jane Detailer" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--ink)]" htmlFor="phone">Phone</label>
                <Input id="phone" name="phone" maxLength={40} placeholder="(555) 123-4567" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--ink)]" htmlFor="websiteUrl">Website or social link</label>
                <Input id="websiteUrl" name="websiteUrl" maxLength={240} placeholder="https://clientbusiness.com" />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Workspace</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--ink)]" htmlFor="businessName">Business name</label>
                <Input id="businessName" name="businessName" required maxLength={160} placeholder="Precision Auto Detail" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--ink)]" htmlFor="workspaceName">Workspace name</label>
                <Input id="workspaceName" name="workspaceName" required maxLength={120} placeholder="Precision Auto Detail" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--ink)]" htmlFor="logoUrl">Logo URL</label>
                <Input id="logoUrl" name="logoUrl" maxLength={500} placeholder="https://..." />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--ink)]" htmlFor="primaryColor">Primary color</label>
                  <Input id="primaryColor" name="primaryColor" type="color" defaultValue="#6D5EF8" className="h-11 p-1.5" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--ink)]" htmlFor="accentColor">Accent color</label>
                  <Input id="accentColor" name="accentColor" type="color" defaultValue="#11B981" className="h-11 p-1.5" />
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Plan</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--ink)]" htmlFor="tier">Tier</label>
                <Select id="tier" name="tier" defaultValue="done_for_you">
                  <option value="done_for_you">Done-For-You</option>
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--ink)]" htmlFor="status">Status</label>
                <Select id="status" name="status" defaultValue="active">
                  <option value="active">Active</option>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-[var(--line)] pt-6 sm:flex-row">
            <Button type="submit" size="lg">
              <Send className="h-4 w-4" />
              Create and send invite
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/admin/clients">Cancel</Link>
            </Button>
          </div>
        </form>
      </Card>
    </AdminShell>
  );
}
