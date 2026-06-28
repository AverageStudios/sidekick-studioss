import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  PlusCircle,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { BillingCheckoutSyncState } from "@/components/billing-checkout-sync-state";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getUserBillingStatus, getUserBillingStatusWithRetry } from "@/lib/billing";
import { getCampaignLifecycleLabel, getCampaignLifecycleState } from "@/lib/campaign-management";
import { getWorkspaceCrmState } from "@/lib/crm-integration";
import { getDashboardSnapshot, getWorkspaceMetaIntegrationForUser } from "@/lib/data";
import { getLeadContactSummary, getLeadDisplayName, getLeadStatusLabel } from "@/lib/leads";
import { getWorkspaceLeadSyncHealth } from "@/lib/meta-leads";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { summarizeCampaignLifecycles } from "@/lib/workspace-metrics";
import { getActiveWorkspaceIdForUser } from "@/lib/workspaces";

type AttentionItem = {
  key: string;
  title: string;
  detail: string;
  href?: string;
  tone?: "warning" | "danger";
};

function formatRelativeTime(value?: string | null) {
  if (!value) return "Recently";

  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "Recently";

  const diffMs = timestamp - Date.now();
  const diffSeconds = Math.round(diffMs / 1000);
  const absSeconds = Math.abs(diffSeconds);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absSeconds < 60) return "Just now";
  if (absSeconds < 60 * 60) return rtf.format(Math.round(diffSeconds / 60), "minute");
  if (absSeconds < 24 * 60 * 60) return rtf.format(Math.round(diffSeconds / 3600), "hour");
  if (absSeconds < 7 * 24 * 60 * 60) return rtf.format(Math.round(diffSeconds / 86400), "day");

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getCampaignStatusTone(state: string) {
  switch (state) {
    case "active":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "in_review":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";
    case "paused":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "draft":
      return "border-slate-200 bg-slate-50 text-slate-600";
    default:
      return "border-[var(--line)] bg-[var(--soft-panel)] text-[var(--muted-strong)]";
  }
}

function joinNames(values: string[]) {
  if (!values.length) return "";
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values[0]}, ${values[1]}, and ${values.length - 2} more`;
}

function buildAttentionItems({
  campaigns,
  leadSyncHealth,
}: {
  campaigns: Array<{
    id: string;
    name: string;
    status: "draft" | "published" | "archived";
    management_sync_state?: "synced" | "stale" | "error" | "unknown" | null;
    external_publish_status?: string | null;
    meta_effective_status?: string | null;
    meta_configured_status?: string | null;
  }>;
  leadSyncHealth: Awaited<ReturnType<typeof getWorkspaceLeadSyncHealth>> | null;
}) {
  const draftCampaigns = campaigns.filter((campaign) => getCampaignLifecycleState(campaign) === "draft");
  const pausedCampaigns = campaigns.filter((campaign) => getCampaignLifecycleState(campaign) === "paused");
  const errorCampaigns = campaigns.filter(
    (campaign) =>
      campaign.management_sync_state === "error" ||
      campaign.external_publish_status === "error",
  );

  const items: AttentionItem[] = [];

  if (errorCampaigns.length) {
    items.push({
      key: "campaign-errors",
      title: errorCampaigns.length === 1 ? "Campaign error" : "Campaign errors",
      detail: `${errorCampaigns.length} campaign${errorCampaigns.length === 1 ? "" : "s"} need a sync check.`,
      href: `/campaigns/${errorCampaigns[0]?.id}`,
      tone: "danger",
    });
  }

  if (pausedCampaigns.length) {
    items.push({
      key: "paused-campaigns",
      title: pausedCampaigns.length === 1 ? "Paused campaign" : "Paused campaigns",
      detail: joinNames(pausedCampaigns.slice(0, 3).map((campaign) => campaign.name)),
      href: `/campaigns/${pausedCampaigns[0]?.id}`,
      tone: "warning",
    });
  }

  if (draftCampaigns.length) {
    items.push({
      key: "draft-campaigns",
      title: draftCampaigns.length === 1 ? "Draft not launched" : "Drafts not launched",
      detail: joinNames(draftCampaigns.slice(0, 3).map((campaign) => campaign.name)),
      href: "/templates/drafts",
      tone: "warning",
    });
  }

  if (leadSyncHealth && (!leadSyncHealth.canReadLeads || leadSyncHealth.lastWorkspaceSyncError)) {
    items.unshift({
      key: "lead-sync",
      title: "Capture sync issue",
      detail:
        leadSyncHealth.lastWorkspaceSyncError ||
        (leadSyncHealth.requiredScopesMissing.length
          ? `Missing scopes: ${leadSyncHealth.requiredScopesMissing.join(", ")}`
          : "Lead sync needs attention."),
      href: "/workspace/settings?section=integrations",
      tone: "danger",
    });
  }

  return items.slice(0, 4);
}

function EmptyWorkspaceState() {
  return (
    <AppShell currentPath="/dashboard">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 py-10 sm:py-14">
        <PageHeader
          variant="plain"
          badge="Home"
          title="Finish your business workspace setup"
        />

        <Card className="overflow-hidden border-[var(--line)] bg-[rgba(255,255,255,0.8)] p-7 shadow-[0_10px_24px_rgba(16,24,40,0.03)] sm:p-8">
          <div className="space-y-5">
            <p className="max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-[15px]">
              Your business workspace keeps campaigns, leads, and CRM connections in one place.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="sm:min-w-48">
                <Link href="/workspace/settings" prefetch>
                  Open business settings
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="sm:min-w-48">
                <Link href="/academy/workspace-basics" prefetch>Read workspace basics</Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function MetaConnectionCallout() {
  return (
    <Card className="overflow-hidden border-[var(--line)] bg-[rgba(255,255,255,0.8)] p-6 shadow-[0_10px_24px_rgba(16,24,40,0.03)] sm:p-7">
      <div className="flex flex-col gap-4">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[rgba(244,114,182,0.2)] bg-[rgba(244,114,182,0.08)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#b42373]">
          <ShieldCheck className="h-3.5 w-3.5" />
          Meta not connected
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
            Connect Meta to go live
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Connect Meta to unlock live campaign status, lead capture, and delivery reporting.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/api/meta/connect?next=/dashboard">
              Connect Meta
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/workspace/settings?section=integrations" prefetch>Open integrations</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}

function BillingActivationState({ sessionId }: { sessionId?: string | null }) {
  return (
    <AppShell currentPath="/dashboard">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-10 sm:py-14">
        {sessionId ? (
          <BillingCheckoutSyncState sessionId={sessionId} />
        ) : (
          <Card className="overflow-hidden border-[var(--line)] bg-[rgba(255,255,255,0.88)] p-7 shadow-[0_10px_24px_rgba(16,24,40,0.03)] sm:p-8">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(109,94,248,0.18)] bg-[rgba(109,94,248,0.08)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
                <RefreshCcw className="h-3.5 w-3.5" />
                Billing update
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)] sm:text-[2.15rem]">
                  We could not finish activating your trial.
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-[15px]">
                  The checkout confirmation was missing the session details SideKick needs to verify your subscription instantly.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild>
                  <Link href="/pricing?startTrial=1" prefetch>
                    Retry activation
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/support/new?from=/dashboard-billing-activation" prefetch>Contact support</Link>
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; checkout?: string; session_id?: string; returnTo?: string }>;
}) {
  const user = await requireUser();
  const { success, checkout, session_id: sessionId, returnTo } = await searchParams;
  const isCheckoutActivation = checkout === "success" && Boolean(sessionId);

  if (isCheckoutActivation) {
    return (
      <AppShell currentPath="/dashboard">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-10 sm:py-14">
          <BillingCheckoutSyncState sessionId={sessionId!} returnTo={returnTo} />
        </div>
      </AppShell>
    );
  }

  const billingStatus =
    checkout === "success"
      ? await getUserBillingStatusWithRetry(user.id, { attempts: 4, delayMs: 1500 })
      : await getUserBillingStatus(user.id);

  if (!billingStatus.hasAccess) {
    if (checkout === "success") {
      return <BillingActivationState sessionId={sessionId} />;
    }
  }

  const [snapshot, metaIntegration, activeWorkspaceId] = await Promise.all([
    getDashboardSnapshot(user.id, { allowDemo: false }),
    getWorkspaceMetaIntegrationForUser(user.id),
    getActiveWorkspaceIdForUser(user.id),
  ]);

  if (!activeWorkspaceId) {
    return <EmptyWorkspaceState />;
  }

  const metaConnected = Boolean(
    metaIntegration?.connection &&
      metaIntegration.tokenAvailable &&
      metaIntegration.connection.status === "connected",
  );

  const admin = createSupabaseAdminClient();
  const [leadSyncHealth, crmState] = await Promise.all([
    admin
      ? getWorkspaceLeadSyncHealth({ admin, workspaceId: activeWorkspaceId }).catch(() => null)
      : Promise.resolve(null),
    admin
      ? getWorkspaceCrmState({ admin, workspaceId: activeWorkspaceId }).catch(() => null)
      : Promise.resolve(null),
  ]);

  const campaigns = snapshot.campaigns
    .slice()
    .sort((left, right) => +new Date(right.updated_at) - +new Date(left.updated_at));
  const recentCampaigns = campaigns.slice(0, 5);
  const campaignSummary = summarizeCampaignLifecycles(campaigns);
  const attentionItems = buildAttentionItems({ campaigns, leadSyncHealth });
  const connectedCrmCount =
    crmState?.connections.filter((connection) => connection.is_active && connection.status === "connected").length || 0;
  const deliveredCount = crmState?.deliveryCounts.delivered || 0;
  const failedCount = crmState?.deliveryCounts.failed || 0;
  const pendingCount = (crmState?.deliveryCounts.pending || 0) + (crmState?.deliveryCounts.retrying || 0);
  const successBanner = checkout === "success" ? "Your 14-day trial is active." : success;

  return (
    <AppShell currentPath="/dashboard">
      <div className="space-y-8">
        {successBanner ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successBanner}
          </div>
        ) : null}

        <PageHeader
          variant="plain"
          badge="Workspace overview"
          title="Home"
          actions={
            <>
              <Button asChild variant="outline">
                <Link href="/performance" prefetch>View performance</Link>
              </Button>
              <Button asChild>
                <Link href="/templates/new" prefetch>Create campaign</Link>
              </Button>
            </>
          }
        />

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Button asChild variant="outline" className="justify-between rounded-[22px] px-5 py-6 text-left">
            <Link href="/templates/new" prefetch>
              <span className="flex items-center gap-3">
                <PlusCircle className="h-4.5 w-4.5 text-[var(--brand)]" />
                Create campaign
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="justify-between rounded-[22px] px-5 py-6 text-left">
            <Link href="/templates" prefetch>
              <span className="flex items-center gap-3">
                <Sparkles className="h-4.5 w-4.5 text-[var(--brand)]" />
                View templates
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="justify-between rounded-[22px] px-5 py-6 text-left">
            <Link href="/workspace/settings?section=integrations" prefetch>
              <span className="flex items-center gap-3">
                <RefreshCcw className="h-4.5 w-4.5 text-[var(--brand)]" />
                Connect CRM
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="justify-between rounded-[22px] px-5 py-6 text-left">
            <Link href="/performance" prefetch>
              <span className="flex items-center gap-3">
                <BarChart3 className="h-4.5 w-4.5 text-[var(--brand)]" />
                View performance
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </section>

        {!metaConnected ? <MetaConnectionCallout /> : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Leads" value={snapshot.totalLeads} helper="Across this workspace" />
          <StatCard label="New Leads" value={snapshot.newLeadsLast30Days} helper="Last 30 days" />
          <StatCard label="Active Campaigns" value={campaignSummary.active} helper="Currently delivering" />
          <StatCard
            label="Connected CRMs"
            value={connectedCrmCount}
            helper={connectedCrmCount ? "Ready for lead handoff" : "No CRM connected yet"}
          />
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-[var(--line)] bg-[rgba(255,255,255,0.8)] p-6 shadow-[0_10px_24px_rgba(16,24,40,0.03)] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                  Campaign status
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                  Recent campaigns
                </h2>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {recentCampaigns.length ? (
                recentCampaigns.map((campaign) => {
                  const lifecycle = getCampaignLifecycleState(campaign);
                  return (
                    <div
                      key={campaign.id}
                      className="flex flex-col gap-3 rounded-[22px] border border-[var(--line)] bg-[var(--soft-panel)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-[var(--ink)]">{campaign.name}</p>
                          <span
                            className={[
                              "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]",
                              getCampaignStatusTone(lifecycle),
                            ].join(" ")}
                          >
                            {getCampaignLifecycleLabel(campaign)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                          Updated {formatRelativeTime(campaign.updated_at)}
                        </p>
                      </div>
                      <Link href={`/campaigns/${campaign.id}`} prefetch className="text-sm font-medium text-[var(--brand)]">
                        Open
                      </Link>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-[24px] border border-dashed border-[var(--line)] px-5 py-10 text-center">
                  <p className="text-base font-medium text-[var(--ink)]">No campaigns yet</p>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
                    Launch your first campaign from a template.
                  </p>
                  <Button asChild variant="outline" className="mt-5">
                    <Link href="/templates" prefetch>Browse templates</Link>
                  </Button>
                </div>
              )}
            </div>
          </Card>

          <Card className="border-[var(--line)] bg-[rgba(255,255,255,0.8)] p-6 shadow-[0_10px_24px_rgba(16,24,40,0.03)] sm:p-7">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Recent activity
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                Latest captured leads
              </h2>
            </div>

            <div className="mt-5 space-y-3">
              {snapshot.recentLeads.length ? (
                snapshot.recentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="rounded-[22px] border border-[var(--line)] bg-[var(--soft-panel)] px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="min-w-0 truncate text-sm font-semibold text-[var(--ink)]">
                        {getLeadDisplayName(lead)}
                      </p>
                      <span className="rounded-full border border-[var(--line)] bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-strong)]">
                        {getLeadStatusLabel(lead.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {getLeadContactSummary(lead) || "Contact details not available"}
                    </p>
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      Captured {formatRelativeTime(lead.meta_created_time || lead.created_at)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-[var(--line)] px-5 py-10 text-center">
                  <p className="text-base font-medium text-[var(--ink)]">No leads yet</p>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
                    Leads from live campaigns appear here.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
          <Card className="border-[var(--line)] bg-[rgba(255,255,255,0.8)] p-6 shadow-[0_10px_24px_rgba(16,24,40,0.03)] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                  CRM handoff
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                  Delivery status
                </h2>
              </div>
              <Link href="/workspace/settings?section=integrations" prefetch className="text-sm font-medium text-[var(--brand)]">
                Open integrations
              </Link>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-3">
              <div className="rounded-[22px] border border-[var(--line)] bg-[var(--soft-panel)] px-4 py-4">
                <div className="flex items-center gap-2">
                  {leadSyncHealth?.canReadLeads ? (
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="h-4.5 w-4.5 text-amber-600" />
                  )}
                  <p className="text-sm font-semibold text-[var(--ink)]">Capture source</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {leadSyncHealth?.canReadLeads
                    ? "Meta lead capture is connected and ready to feed CRM delivery."
                    : "Lead capture still needs attention before CRM handoff can be considered healthy."}
                </p>
              </div>

              <div className="rounded-[22px] border border-[var(--line)] bg-[var(--soft-panel)] px-4 py-4">
                <div className="flex items-center gap-2">
                  <RefreshCcw className="h-4.5 w-4.5 text-[var(--brand)]" />
                  <p className="text-sm font-semibold text-[var(--ink)]">Connected destinations</p>
                </div>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">{connectedCrmCount}</p>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  {connectedCrmCount ? "Every connected CRM can receive eligible lead-form submissions." : "Connect a CRM to start handoff."}
                </p>
              </div>

              <div className="rounded-[22px] border border-[var(--line)] bg-[var(--soft-panel)] px-4 py-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4.5 w-4.5 text-[var(--brand)]" />
                  <p className="text-sm font-semibold text-[var(--ink)]">Recent delivery log</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {deliveredCount || failedCount || pendingCount
                    ? `${deliveredCount} delivered, ${failedCount} failed, ${pendingCount} pending or retrying.`
                    : "No CRM delivery attempts yet for this workspace."}
                </p>
              </div>
            </div>
          </Card>

          <Card className="border-[var(--line)] bg-[rgba(255,255,255,0.8)] p-6 shadow-[0_10px_24px_rgba(16,24,40,0.03)] sm:p-7">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Needs attention
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                Keep the workspace moving
              </h2>
            </div>

            <div className="mt-5 space-y-3">
              {attentionItems.length ? (
                attentionItems.map((item) => {
                  const toneClass =
                    item.tone === "danger"
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-amber-200 bg-amber-50 text-amber-700";

                  return item.href ? (
                    <Link
                      key={item.key}
                      href={item.href}
                      className="group flex items-start gap-3 rounded-[22px] border border-[var(--line)] bg-[var(--soft-panel)] px-4 py-4 transition-colors hover:bg-white"
                    >
                      <span className={["mt-0.5 inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]", toneClass].join(" ")}>
                        <AlertTriangle className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[var(--ink)]">{item.title}</p>
                        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{item.detail}</p>
                      </div>
                    </Link>
                  ) : (
                    <div
                      key={item.key}
                      className="flex items-start gap-3 rounded-[22px] border border-[var(--line)] bg-[var(--soft-panel)] px-4 py-4"
                    >
                      <span className={["mt-0.5 inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]", toneClass].join(" ")}>
                        <AlertTriangle className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[var(--ink)]">{item.title}</p>
                        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{item.detail}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-[24px] border border-dashed border-[var(--line)] px-5 py-10 text-center">
                  <p className="text-base font-medium text-[var(--ink)]">Nothing needs attention</p>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
                    You&apos;re all caught up.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
