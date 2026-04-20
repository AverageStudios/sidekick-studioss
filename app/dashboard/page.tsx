import Link from "next/link";
import { ArrowRight, LayoutTemplate, Send } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DashboardOnboarding } from "@/components/dashboard-onboarding";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getIndustryLabel } from "@/data/onboarding";
import { getCurrentProfile, requireUser } from "@/lib/auth";
import { getBusinessProfile, getDashboardSnapshot, getTemplates } from "@/lib/data";
import { formatDate } from "@/lib/utils";

const launchSteps = [
  {
    step: "01",
    title: "Choose your industry",
    description: "Start from the template library that matches the kind of business you run.",
    icon: LayoutTemplate,
  },
  {
    step: "02",
    title: "Pick a template",
    description: "Use a ready-to-go campaign instead of building your launch flow from scratch.",
    icon: ArrowRight,
  },
  {
    step: "03",
    title: "Launch and manage leads",
    description: "Publish faster, then keep inquiries and follow-up moving from the same workspace.",
    icon: Send,
  },
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const user = await requireUser();
  const [{ success }, snapshot, templates, profile, userProfile] = await Promise.all([
    searchParams,
    getDashboardSnapshot(user.id),
    getTemplates(),
    getBusinessProfile(user.id),
    getCurrentProfile(),
  ]);

  const featuredTemplates = templates.slice(0, 4);
  const selectedIndustryLabel = getIndustryLabel(userProfile?.selected_industry);
  const selectedTemplate =
    templates.find((t) => t.id === userProfile?.starting_template_id) || featuredTemplates[0];
  const businessName = profile?.business_name || "Your workspace";

  if (!userProfile?.onboarding_completed_at) {
    return (
      <AppShell currentPath="/dashboard">
        {success ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}
        <DashboardOnboarding
          templates={templates}
          initialIndustry={userProfile?.selected_industry}
          initialTemplateId={userProfile?.starting_template_id}
        />
      </AppShell>
    );
  }

  return (
    <AppShell currentPath="/dashboard">
      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <PageHeader
        variant="plain"
        badge="Home"
        title="Your workspace, ready to launch"
        description="Choose your industry, pick a template, and keep leads and follow-up moving from one calm workspace."
        actions={
          <>
            <Button asChild size="lg">
              <Link href="/templates">
                Choose a template
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/leads">View leads</Link>
            </Button>
          </>
        }
      />

      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white/78">
        <div className="grid divide-y divide-[var(--line)] md:grid-cols-3 md:divide-x md:divide-y-0">
          {launchSteps.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.title} className="px-5 py-5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                    {item.step}
                  </span>
                  <Icon className="h-4 w-4 text-[var(--brand)]" />
                </div>
                <h2 className="mt-3 text-base font-semibold text-[var(--ink)]">{item.title}</h2>
                <p className="mt-1.5 text-sm leading-6 text-[var(--muted)]">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      <Card className="bg-white/82 p-7 shadow-[0_10px_24px_rgba(16,24,40,0.03)] sm:p-8">
        <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-start">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-ink)]">
              Next step
            </p>
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
              Start from your saved setup
            </h2>
            <p className="max-w-xl text-sm leading-6 text-[var(--muted)]">
              Use your selected industry and starting template as the launch point, then handle leads from the same workspace.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[18px] bg-[var(--soft-panel)] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Selected industry
                </p>
                <p className="mt-2 text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                  {selectedIndustryLabel}
                </p>
              </div>
              <div className="rounded-[18px] bg-[var(--soft-panel)] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Starting template
                </p>
                <p className="mt-2 text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                  {selectedTemplate?.name || "Choose one"}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-[var(--ink)]">{businessName}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Start from a published template, tailor the essentials for your business, and move straight into leads and follow-up.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {featuredTemplates.map((template) => (
                <span
                  key={template.id}
                  className="rounded-full border border-[var(--line)] bg-[var(--panel-strong)] px-3 py-1.5 text-xs font-medium text-[var(--muted-strong)]"
                >
                  {template.name}
                </span>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[18px] bg-[var(--soft-panel)] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Live</p>
                <p className="mt-1.5 text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">{snapshot.liveFunnels}</p>
              </div>
              <div className="rounded-[18px] bg-[var(--soft-panel)] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">New leads</p>
                <p className="mt-1.5 text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">{snapshot.newLeads}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="sm:flex-1">
                <Link href={selectedTemplate ? `/templates/${selectedTemplate.slug}` : "/templates"}>
                  {selectedTemplate ? `Start with ${selectedTemplate.name}` : "Pick a template"}
                </Link>
              </Button>
              <Button asChild variant="outline" className="sm:flex-1">
                <Link href="/templates">Browse library</Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">Recent leads</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              New inquiries stay simple here so you can reply and move on.
            </p>
          </div>
          <Link href="/leads" className="text-sm font-medium text-[var(--brand)]">
            Open lead list
          </Link>
        </div>

        <div className="mt-5 space-y-3.5">
          {snapshot.recentLeads.length ? (
            snapshot.recentLeads.map((lead) => (
              <div
                key={lead.id}
                className="flex flex-col gap-3 rounded-[18px] border border-[var(--line)] bg-[var(--soft-panel)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-[var(--ink)]">{lead.name}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {lead.service_interest} • {lead.phone}
                  </p>
                </div>
                <div className="text-sm text-[var(--muted)]">{formatDate(lead.created_at)}</div>
              </div>
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-[var(--line)] px-5 py-10 text-center">
              <p className="text-base font-medium text-[var(--ink)]">No leads yet</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
                Once you launch a template, new inquiries will show up here with a clear status and next step.
              </p>
              <Button asChild variant="outline" className="mt-5">
                <Link href="/templates">Choose your first template</Link>
              </Button>
            </div>
          )}
        </div>
      </Card>
    </AppShell>
  );
}
