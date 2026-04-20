import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";

export default async function HelpPage() {
  await requireUser();
  return (
    <AppShell currentPath="/settings">
      <div className="max-w-3xl space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Help</p>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--ink)]">Help & tips</h1>
        <div className="rounded-2xl border border-[var(--line)] bg-white p-6">
          <p className="text-sm leading-6 text-[var(--muted)]">
            Need a refresher? Start with the public FAQ at{" "}
            <Link href="/faq" className="font-medium text-[var(--brand)]">
              /faq
            </Link>
            , then come back here for workspace-specific tips and setup guidance as the app grows.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
