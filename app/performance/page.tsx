import Link from "next/link";
import type { ComponentType } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CircleDashed,
  DollarSign,
  Gauge,
  MousePointerClick,
  RefreshCcw,
  Target,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { AsyncSubmitButton } from "@/components/ui/async-submit-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { deleteDraftCampaignAction } from "@/app/actions";
import { requireProductAccessUser } from "@/lib/auth";
import { getCampaignLifecycleLabel, getCampaignLifecycleState } from "@/lib/campaign-management";
import { getWorkspaceCrmState } from "@/lib/crm-integration";
import { getLeads, getWorkspaceCampaignsForUser, getWorkspaceMetaIntegrationForUser } from "@/lib/data";
import { getLeadSubmittedAt } from "@/lib/leads";
import { fetchMetaAdAccountDetails, fetchMetaAdAccountInsights } from "@/lib/meta";
import { getWorkspaceLeadSyncHealth, type WorkspaceLeadSyncHealth } from "@/lib/meta-leads";
import { getWorkspaceMetaAccessToken } from "@/lib/meta-integration";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  buildLeadBuckets,
  countLeadsByStatus,
  countLeadsInPastDays,
  formatMetricDate,
  getSafeAverage,
  getSafePercentage,
  parseMetricNumber,
  summarizeCampaignLifecycles,
} from "@/lib/workspace-metrics";
import { getActiveWorkspaceIdForUser } from "@/lib/workspaces";
import { CampaignRecord, LeadRecord } from "@/types";

type MetricTone = "brand" | "emerald" | "amber" | "slate" | "indigo";

type AttentionItem = {
  title: string;
  detail: string;
  tone: "critical" | "warning" | "neutral";
};

type CampaignReportRow = {
  id: string;
  name: string;
  updatedAt: string;
  lifecycleState: ReturnType<typeof getCampaignLifecycleState>;
  lifecycleLabel: string;
  totalLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  lastLeadAt: string | null;
};

function formatCompactNumber(value: number | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatDecimalNumber(value: number | null, digits = 1) {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function formatCurrencyValue(value: number | null, currency: string) {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function getCampaignPriority(state: ReturnType<typeof getCampaignLifecycleState>) {
  switch (state) {
    case "active":
      return 0;
    case "paused":
      return 1;
    case "draft":
      return 2;
    case "in_review":
      return 3;
    case "unknown":
      return 4;
    case "archived":
    default:
      return 5;
  }
}

function getCampaignStateTone(state: ReturnType<typeof getCampaignLifecycleState>): MetricTone {
  switch (state) {
    case "active":
      return "emerald";
    case "in_review":
      return "brand";
    case "paused":
      return "amber";
    case "draft":
      return "indigo";
    case "archived":
      return "slate";
    case "unknown":
    default:
      return "brand";
  }
}

function getToneClasses(tone: MetricTone) {
  switch (tone) {
    case "emerald":
      return "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]";
    case "amber":
      return "border-[#fed7aa] bg-[#fff7ed] text-[#c2410c]";
    case "slate":
      return "border-[#e2e8f0] bg-[#f8fafc] text-[#475569]";
    case "indigo":
      return "border-[#c7d2fe] bg-[#eef2ff] text-[#4f46e5]";
    case "brand":
    default:
      return "border-[color:color-mix(in_srgb,var(--brand)_18%,white)] bg-[color:color-mix(in_srgb,var(--brand)_10%,white)] text-[var(--brand)]";
  }
}

function buildCampaignRows(campaigns: CampaignRecord[], leads: LeadRecord[]): CampaignReportRow[] {
  return campaigns
    .map((campaign) => {
      const lifecycleState = getCampaignLifecycleState(campaign);
      const campaignLeads = leads.filter((lead) => lead.campaign_id === campaign.id);
      const counts = countLeadsByStatus(campaignLeads);
      const lastLeadAt = campaignLeads
        .map((lead) => getLeadSubmittedAt(lead))
        .filter(Boolean)
        .sort((left, right) => +new Date(right) - +new Date(left))[0] || null;

      return {
        id: campaign.id,
        name: campaign.name,
        updatedAt: campaign.updated_at,
        lifecycleState,
        lifecycleLabel: getCampaignLifecycleLabel(campaign),
        totalLeads: counts.total,
        newLeads: counts.newCount,
        qualifiedLeads: counts.qualifiedCount,
        lastLeadAt,
      };
    })
    .sort((left, right) => {
      const priorityDelta = getCampaignPriority(left.lifecycleState) - getCampaignPriority(right.lifecycleState);
      if (priorityDelta !== 0) return priorityDelta;
      if (right.totalLeads !== left.totalLeads) return right.totalLeads - left.totalLeads;
      return +new Date(right.updatedAt) - +new Date(left.updatedAt);
    });
}

function buildAttentionItems({
  metaConnected,
  metaReportingReady,
  pausedCampaigns,
  draftCampaigns,
  errorCampaigns,
  leadSyncHealth,
}: {
  metaConnected: boolean;
  metaReportingReady: boolean;
  pausedCampaigns: CampaignRecord[];
  draftCampaigns: CampaignRecord[];
  errorCampaigns: CampaignRecord[];
  leadSyncHealth: WorkspaceLeadSyncHealth | null;
}): AttentionItem[] {
  const items: AttentionItem[] = [];

  if (!metaConnected) {
    items.push({
      title: "Connect Meta",
      detail: "Meta reporting is still unavailable, so spend and delivery metrics cannot populate yet.",
      tone: "critical",
    });
  } else if (!metaReportingReady) {
    items.push({
      title: "Select a Meta ad account",
      detail: "This workspace is connected, but reporting cannot load until an ad account is selected.",
      tone: "warning",
    });
  }

  if (pausedCampaigns.length) {
    items.push({
      title: `${pausedCampaigns.length} paused campaign${pausedCampaigns.length === 1 ? "" : "s"}`,
      detail: "Paused campaigns are not contributing to current performance and should be reviewed.",
      tone: "warning",
    });
  }

  if (draftCampaigns.length) {
    items.push({
      title: `${draftCampaigns.length} draft campaign${draftCampaigns.length === 1 ? "" : "s"} not launched`,
      detail: "Draft campaigns are saved, but they are not live yet and do not contribute to performance reporting.",
      tone: "neutral",
    });
  }

  if (errorCampaigns.length || leadSyncHealth?.lastWorkspaceSyncError) {
    items.push({
      title: "Sync issue detected",
      detail:
        leadSyncHealth?.lastWorkspaceSyncError ||
        `${errorCampaigns.length} campaign${errorCampaigns.length === 1 ? " has" : "s have"} a status sync issue.`,
      tone: "critical",
    });
  }

  return items.slice(0, 4);
}

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  icon: ComponentType<{ className?: string }>;
  tone: MetricTone;
}) {
  return (
    <Card className="rounded-[24px] border-[var(--line)] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{label}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-2xl border ${getToneClasses(tone)}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
      <p className="mt-4 text-[2rem] font-semibold tracking-[-0.05em] text-[var(--ink)]">{value}</p>
      <p className="mt-2 text-sm text-[var(--muted)]">{helper}</p>
    </Card>
  );
}

function EmptyChartState({
  title,
  description,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  description: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div className="flex h-64 flex-col items-center justify-center rounded-[24px] border border-dashed border-[var(--line)] bg-[var(--surface)] px-6 text-center">
      <CircleDashed className="h-6 w-6 text-[var(--muted)]" />
      <h3 className="mt-3 text-base font-semibold tracking-[-0.03em] text-[var(--ink)]">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">{description}</p>
      <Button asChild variant="outline" className="mt-5">
        <Link href={ctaHref}>{ctaLabel}</Link>
      </Button>
    </div>
  );
}

function LeadVolumeChart({ buckets, totalLeads }: { buckets: ReturnType<typeof buildLeadBuckets>; totalLeads: number }) {
  const maxValue = Math.max(...buckets.map((bucket) => bucket.total), 1);
  const width = 640;
  const height = 220;
  const padding = 28;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;
  const points = buckets.map((bucket, index) => {
    const x = padding + (usableWidth * index) / Math.max(buckets.length - 1, 1);
    const y = padding + usableHeight - (bucket.total / maxValue) * usableHeight;
    return { x, y };
  });

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");
  const areaPath =
    points.length > 1
      ? `${path} L ${points[points.length - 1].x.toFixed(2)} ${height - padding} L ${points[0].x.toFixed(2)} ${height - padding} Z`
      : "";

  if (!buckets.some((bucket) => bucket.total > 0)) {
    return (
      <EmptyChartState
        title="No leads yet"
        description="Leads appear here once campaigns are live."
        ctaHref="/templates/new"
        ctaLabel="Launch campaign"
      />
    );
  }

  return (
    <div className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full">
        <defs>
          <linearGradient id="leadVolumeFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(109,94,248,0.24)" />
            <stop offset="100%" stopColor="rgba(109,94,248,0.03)" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((fraction) => {
          const y = padding + usableHeight * fraction;
          return (
            <line
              key={fraction}
              x1={padding}
              x2={width - padding}
              y1={y}
              y2={y}
              stroke="rgba(148,163,184,0.18)"
              strokeDasharray="4 6"
            />
          );
        })}

        {areaPath ? <path d={areaPath} fill="url(#leadVolumeFill)" /> : null}
        {path ? <path d={path} fill="none" stroke="rgba(109,94,248,0.95)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /> : null}

        {points.map((point, index) => (
          <circle key={`${buckets[index].label}-${index}`} cx={point.x} cy={point.y} r="4.5" fill="white" stroke="rgba(109,94,248,0.95)" strokeWidth="2.5" />
        ))}
      </svg>

      <div className="grid grid-cols-8 gap-2 px-1">
        {buckets.map((bucket) => (
          <div key={bucket.label} className="text-center">
            <p className="text-sm font-semibold text-[var(--ink)]">{bucket.total}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">{bucket.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[var(--line)] pt-4 text-sm text-[var(--muted)]">
        <span>Weekly lead volume</span>
        <span className="font-medium text-[var(--ink)]">{totalLeads} total leads</span>
      </div>
    </div>
  );
}

function EmptyWorkspaceState() {
  return (
    <AppShell currentPath="/performance">
      <div className="space-y-8">
        <PageHeader
          variant="plain"
          badge="Performance"
          title="Performance will appear after workspace setup"
        />
        <EmptyChartState
          title="No workspace selected yet"
          description="Create a workspace to unlock performance reporting."
          ctaHref="/workspaces/new"
          ctaLabel="Create workspace"
        />
      </div>
    </AppShell>
  );
}

export default async function PerformancePage() {
  const user = await requireProductAccessUser("/performance");
  const admin = createSupabaseAdminClient();
  const [activeWorkspaceId, metaIntegration] = await Promise.all([
    getActiveWorkspaceIdForUser(user.id),
    getWorkspaceMetaIntegrationForUser(user.id),
  ]);

  if (!activeWorkspaceId) {
    return <EmptyWorkspaceState />;
  }

  let campaigns: CampaignRecord[] = [];
  let campaignLoadError = false;
  try {
    campaigns = await getWorkspaceCampaignsForUser(user.id, true, false);
  } catch {
    campaignLoadError = true;
  }

  let allLeads: LeadRecord[] = [];
  let leadsLoadError = false;
  try {
    allLeads = (await getLeads(user.id, "all", { allowDemo: false })) as LeadRecord[];
  } catch {
    leadsLoadError = true;
  }

  const metaConnected = Boolean(
    metaIntegration?.connection &&
      metaIntegration.tokenAvailable &&
      metaIntegration.connection.status === "connected",
  );
  const selectedAdAccountId = metaIntegration?.selected.adAccountId || null;
  const reportingReady = metaConnected && Boolean(selectedAdAccountId);

  const tokenContext =
    admin && metaConnected
      ? await getWorkspaceMetaAccessToken({ admin, workspaceId: activeWorkspaceId }).catch(() => null)
      : null;

  const [leadSyncHealth, adAccountDetails, metaInsights, crmState] = await Promise.all([
    admin
      ? getWorkspaceLeadSyncHealth({ admin, workspaceId: activeWorkspaceId }).catch(() => null)
      : Promise.resolve(null),
    tokenContext && selectedAdAccountId
      ? fetchMetaAdAccountDetails(tokenContext.accessToken, selectedAdAccountId).catch(() => null)
      : Promise.resolve(null),
    tokenContext && selectedAdAccountId
      ? fetchMetaAdAccountInsights(tokenContext.accessToken, selectedAdAccountId).catch(() => null)
      : Promise.resolve(null),
    admin
      ? getWorkspaceCrmState({ admin, workspaceId: activeWorkspaceId }).catch(() => null)
      : Promise.resolve(null),
  ]);

  const sortedCampaigns = campaigns
    .slice()
    .sort((left, right) => +new Date(right.updated_at) - +new Date(left.updated_at));
  const campaignSummary = summarizeCampaignLifecycles(sortedCampaigns);
  const pausedCampaigns = sortedCampaigns.filter((campaign) => getCampaignLifecycleState(campaign) === "paused");
  const draftCampaigns = sortedCampaigns.filter((campaign) => getCampaignLifecycleState(campaign) === "draft");
  const errorCampaigns = sortedCampaigns.filter(
    (campaign) => campaign.management_sync_state === "error" || campaign.management_sync_state === "stale",
  );

  const spend = parseMetricNumber(metaInsights?.spend);
  const impressions = parseMetricNumber(metaInsights?.impressions);
  const clicks = parseMetricNumber(metaInsights?.clicks);
  const currency = adAccountDetails?.currency || "USD";
  const totalLeads = allLeads.length;
  const newLeadsLast30Days = countLeadsInPastDays(allLeads, 30);
  const costPerLead = spend !== null && totalLeads > 0 ? spend / totalLeads : null;
  const leadBuckets = buildLeadBuckets(allLeads);
  const campaignRows = buildCampaignRows(sortedCampaigns, allLeads);
  const attentionItems = buildAttentionItems({
    metaConnected,
    metaReportingReady: reportingReady,
    pausedCampaigns,
    draftCampaigns,
    errorCampaigns,
    leadSyncHealth,
  });
  const leadQualityCounts = countLeadsByStatus(allLeads);
  const qualifiedRate = getSafePercentage(leadQualityCounts.qualifiedCount, totalLeads);
  const activeLeadWeeks = leadBuckets.filter((bucket) => bucket.total > 0).length;
  const weeklyAverage = getSafeAverage(totalLeads, activeLeadWeeks || 1);
  const crmDelivered = crmState?.deliveryCounts.delivered || 0;
  const crmFailed = crmState?.deliveryCounts.failed || 0;
  const crmPending = (crmState?.deliveryCounts.pending || 0) + (crmState?.deliveryCounts.retrying || 0);
  const crmAttemptedTerminal = crmDelivered + crmFailed;
  const crmSuccessRate =
    crmAttemptedTerminal > 0 ? getSafePercentage(crmDelivered, crmAttemptedTerminal, 0) : null;
  const connectedCrmCount =
    crmState?.connections.filter((connection) => connection.is_active && connection.status === "connected").length || 0;

  return (
    <AppShell currentPath="/performance">
      <div className="space-y-8">
        {campaignLoadError || leadsLoadError ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Some performance data is temporarily unavailable. The page is showing safe fallback states until reporting loads again.
          </div>
        ) : null}

        <PageHeader
          variant="plain"
          badge="Performance"
          title="Campaign reporting"
          actions={
            <>
              <Button asChild variant="outline">
                <Link href="/campaigns">Open campaigns</Link>
              </Button>
              <Button asChild>
                <Link href="/templates/new">Launch campaign</Link>
              </Button>
            </>
          }
        />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            label="Total Leads"
            value={formatCompactNumber(totalLeads)}
            helper="Across the current workspace"
            icon={UsersRound}
            tone="emerald"
          />
          <MetricCard
            label="New Leads"
            value={formatCompactNumber(newLeadsLast30Days)}
            helper="Captured in the last 30 days"
            icon={TrendingUp}
            tone="brand"
          />
          <MetricCard
            label="Active Campaigns"
            value={formatCompactNumber(campaignSummary.active)}
            helper="Currently delivering"
            icon={Activity}
            tone="emerald"
          />
          <MetricCard
            label="CRM Success Rate"
            value={crmSuccessRate === null ? "—" : `${crmSuccessRate}%`}
            helper={crmSuccessRate === null ? "No completed CRM delivery attempts yet" : "Delivered vs failed CRM handoff attempts"}
            icon={Target}
            tone="indigo"
          />
          <MetricCard
            label="CRM Failures"
            value={formatCompactNumber(crmFailed)}
            helper={crmFailed ? "Recent failed delivery attempts" : "No recent delivery failures"}
            icon={AlertTriangle}
            tone="amber"
          />
          <MetricCard
            label="Connected CRMs"
            value={formatCompactNumber(connectedCrmCount)}
            helper={connectedCrmCount ? "All connected CRMs can receive eligible leads" : "No CRM connected yet"}
            icon={RefreshCcw}
            tone="slate"
          />
          <MetricCard
            label="Spend"
            value={formatCurrencyValue(spend, currency)}
            helper={metaInsights ? "Last 30 days of Meta account delivery" : "Meta performance data not available yet"}
            icon={DollarSign}
            tone="brand"
          />
          <MetricCard
            label="Cost per Lead"
            value={formatCurrencyValue(costPerLead, currency)}
            helper={spend !== null && totalLeads > 0 ? "Spend divided by total workspace leads" : "Needs live spend and at least one lead"}
            icon={Gauge}
            tone="amber"
          />
          <MetricCard
            label="Impressions"
            value={formatCompactNumber(impressions)}
            helper={metaInsights ? "Meta delivery impressions" : "Meta performance data not available yet"}
            icon={BarChart3}
            tone="slate"
          />
          <MetricCard
            label="Clicks"
            value={formatCompactNumber(clicks)}
            helper={metaInsights ? "Traffic generated by live campaigns" : "Meta performance data not available yet"}
            icon={MousePointerClick}
            tone="slate"
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.95fr)]">
          <Card className="rounded-[28px] border-[var(--line)] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Lead volume</p>
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                  Leads over time
                </h2>
              </div>
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Last 8 weeks</p>
                <p className="mt-1 text-sm font-medium text-[var(--ink)]">{totalLeads} total leads</p>
              </div>
            </div>

            <div className="mt-6">
              <LeadVolumeChart buckets={leadBuckets} totalLeads={totalLeads} />
            </div>
          </Card>

          <Card className="rounded-[28px] border-[var(--line)] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-7">
            <div className="flex items-center gap-2">
              <Activity className="h-4.5 w-4.5 text-[var(--brand)]" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Pipeline progression</p>
            </div>
            <h2 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">Lead quality flow</h2>

            <div className="mt-6 space-y-4">
              {[
                { label: "New", value: leadQualityCounts.newCount, tone: "bg-[#dbeafe]" },
                { label: "Contacted", value: leadQualityCounts.contactedCount, tone: "bg-[#ede9fe]" },
                { label: "Qualified", value: leadQualityCounts.qualifiedCount, tone: "bg-[#dcfce7]" },
                { label: "Closed", value: leadQualityCounts.closedCount, tone: "bg-[#fee2e2]" },
              ].map((segment) => {
                const width = `${Math.max((segment.value / Math.max(totalLeads, 1)) * 100, segment.value ? 10 : 4)}%`;

                return (
                  <div key={segment.label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-[var(--ink)]">{segment.label}</span>
                      <span className="text-[var(--muted)]">{segment.value}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-[var(--soft-panel)]">
                      <div className={`h-2.5 rounded-full ${segment.tone}`} style={{ width }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-[24px] border border-[var(--line)] bg-[var(--surface)] px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Qualification rate</p>
                  <p className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">{qualifiedRate}%</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Average per active week</p>
                  <p className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">{formatDecimalNumber(weeklyAverage, 1)}</p>
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Campaign reporting</p>
              <h2 className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">Campaign performance table</h2>
            </div>
            <Button asChild variant="outline">
              <Link href="/campaigns">
                View all campaigns
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {campaignRows.length ? (
            <Card className="overflow-hidden rounded-[28px] border-[var(--line)] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
              <div className="overflow-x-auto">
                <div className="min-w-[70rem]">
                  <div className="grid grid-cols-[2.3fr_1fr_0.8fr_0.8fr_0.9fr_1fr_1fr_0.9fr] border-b border-[var(--line)] px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    <div>Campaign Name</div>
                    <div>Status</div>
                    <div>Leads</div>
                    <div>New</div>
                    <div>Qualified</div>
                    <div>Last Lead</div>
                    <div>Updated</div>
                    <div>Actions</div>
                  </div>

                  <div className="divide-y divide-[var(--line)]">
                    {campaignRows.slice(0, 10).map((campaign) => (
                      <div
                        key={campaign.id}
                        className="grid grid-cols-[2.3fr_1fr_0.8fr_0.8fr_0.9fr_1fr_1fr_0.9fr] items-center px-6 py-5 transition-colors hover:bg-[var(--surface)]"
                      >
                        <div className="min-w-0 pr-4">
                          <Link href={`/campaigns/${campaign.id}`} className="block">
                            <p className="truncate text-base font-semibold tracking-[-0.03em] text-[var(--ink)]">{campaign.name}</p>
                          </Link>
                        </div>

                        <div>
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${getToneClasses(
                              getCampaignStateTone(campaign.lifecycleState),
                            )}`}
                          >
                            {campaign.lifecycleLabel}
                          </span>
                        </div>

                        <div className="text-sm font-medium text-[var(--ink)]">{formatCompactNumber(campaign.totalLeads)}</div>
                        <div className="text-sm font-medium text-[var(--ink)]">{formatCompactNumber(campaign.newLeads)}</div>
                        <div className="text-sm font-medium text-[var(--ink)]">{formatCompactNumber(campaign.qualifiedLeads)}</div>
                        <div className="text-sm text-[var(--muted)]">{formatMetricDate(campaign.lastLeadAt)}</div>
                        <div className="text-sm text-[var(--muted)]">{formatMetricDate(campaign.updatedAt)}</div>
                        <div>
                          {campaign.lifecycleState === "draft" ? (
                            <form action={deleteDraftCampaignAction}>
                              <input type="hidden" name="campaignId" value={campaign.id} />
                              <input type="hidden" name="redirectTo" value="/performance" />
                              <AsyncSubmitButton
                                label="Delete draft"
                                pendingLabel="Deleting..."
                                variant="outline"
                                className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                              />
                            </form>
                          ) : (
                            <span className="text-sm text-[var(--muted)]">—</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="rounded-[28px] border-[var(--line)] bg-white p-7 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
              <div className="flex items-start gap-3">
                <CircleDashed className="mt-0.5 h-5 w-5 text-[var(--muted)]" />
                <div>
                  <h3 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">No campaigns yet</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                    Launch a campaign to see results here.
                  </p>
                  <div className="mt-5">
                    <Button asChild>
                      <Link href="/templates/new">Launch campaign</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="rounded-[28px] border-[var(--line)] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-7">
            <div className="flex items-center gap-2">
              <RefreshCcw className="h-4.5 w-4.5 text-[var(--brand)]" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">CRM delivery</p>
            </div>
            <h2 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">Delivery health</h2>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Delivered</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">{crmDelivered}</p>
              </div>
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Failed</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">{crmFailed}</p>
              </div>
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Pending / retrying</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">{crmPending}</p>
              </div>
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Connected CRMs</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">{connectedCrmCount}</p>
              </div>
            </div>
          </Card>

          <Card className="rounded-[28px] border-[var(--line)] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-7">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4.5 w-4.5 text-[var(--brand)]" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Attention</p>
            </div>
            <h2 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">What needs review</h2>
            <div className="mt-6 space-y-3">
              {attentionItems.length ? (
                attentionItems.map((item) => {
                  const toneClass =
                    item.tone === "critical"
                      ? "border-rose-200 bg-rose-50 text-rose-700"
                      : item.tone === "warning"
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted-strong)]";

                  return (
                    <div
                      key={`${item.title}-${item.detail}`}
                      className={`rounded-[22px] border px-4 py-4 ${toneClass}`}
                    >
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="mt-1 text-sm leading-6">{item.detail}</p>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-[24px] border border-dashed border-[var(--line)] px-5 py-10 text-center">
                  <p className="text-base font-medium text-[var(--ink)]">No major issues right now</p>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
                    Everything looks healthy.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
