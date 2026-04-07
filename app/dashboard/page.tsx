import Link from "next/link";
import { ArrowRight, CircleCheckBig } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { requireUser } from "@/lib/auth";
import { getDashboardSnapshot } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireUser();
  const snapshot = await getDashboardSnapshot(user.id);

  return (
    <AppShell currentPath="/dashboard">
      <Card className="overflow-hidden bg-[linear-gradient(135deg,#fefeff_0%,#f3f1ff_60%,#eef9f7_100%)] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">Dashboard</p>
            <h1 className="text-4xl font-semibold tracking-[-0.06em] text-[var(--ink)]">
              Calm, simple, and ready to launch
            </h1>
            <p className="max-w-2xl text-base leading-7 text-[var(--muted-strong)]">
              This isn&apos;t a CRM. It&apos;s the fastest path from template to published detailing funnel.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/templates">
              Create a campaign
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Live funnels" value={snapshot.liveFunnels} helper="Published and ready for traffic" />
        <StatCard label="New leads" value={snapshot.newLeads} helper="Fresh requests that need a reply" />
        <StatCard label="Contacted" value={snapshot.contactedLeads} helper="Leads that already got a follow-up" />
        <StatCard label="Booked" value={snapshot.bookedLeads} helper="Leads that turned into appointments" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">Recent leads</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">Keep the list short and actionable.</p>
            </div>
            <Link href="/leads" className="text-sm font-medium text-[var(--brand)]">
              View all
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {snapshot.recentLeads.length ? (
              snapshot.recentLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex flex-col gap-3 rounded-[24px] border border-[var(--line)] bg-[var(--soft-panel)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-[var(--ink)]">{lead.name}</p>
                    <p className="text-sm text-[var(--muted)]">
                      {lead.service_interest} • {lead.phone}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
                    <span className="rounded-full bg-white px-3 py-1">{lead.status}</span>
                    <span>{formatDate(lead.created_at)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-[var(--line)] px-5 py-10 text-center text-sm text-[var(--muted)]">
                Leads will show up here once your funnel is live.
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">What to do next</h2>
          <div className="mt-5 space-y-3">
            {[
              "Pick a template that matches the service you want to push",
              "Customize your offer and upload one or two proof images",
              "Use the campaign output page to grab ad copy and CTA ideas",
            ].map((item) => (
              <div key={item} className="flex gap-3 rounded-[24px] bg-[var(--soft-panel)] px-4 py-4">
                <CircleCheckBig className="mt-0.5 h-5 w-5 text-[var(--brand)]" />
                <p className="text-sm leading-6 text-[var(--muted-strong)]">{item}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

