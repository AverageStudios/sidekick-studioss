import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";

export default async function DomainsPage() {
  await requireUser();
  return (
    <AppShell currentPath="/settings">
      <div className="max-w-3xl space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Account</p>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--ink)]">Domains</h1>
        <div className="rounded-2xl border border-[var(--line)] bg-white p-6">
          <p className="text-sm leading-6 text-[var(--muted)]">
            Domain connection is not built out yet, but this route is now reserved for workspace domain settings and publishing configuration.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
