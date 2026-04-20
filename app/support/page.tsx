import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";

export default async function SupportPage() {
  await requireUser();
  return (
    <AppShell currentPath="/settings">
      <div className="max-w-3xl space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Support</p>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--ink)]">Contact support</h1>
        <div className="rounded-2xl border border-[var(--line)] bg-white p-6">
          <p className="text-sm leading-6 text-[var(--muted)]">
            Reach the SideKick team at{" "}
            <Link href="mailto:contact@sidekickstudioss.net" className="font-medium text-[var(--brand)]">
              contact@sidekickstudioss.net
            </Link>
            . This page is the placeholder for in-app support routing and help history later.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
