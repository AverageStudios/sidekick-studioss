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
  Target,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { deleteDraftCampaignAction } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { getDashboardSnapshot, getLeads } from "@/lib/data";
import { getCampaignLifecycleLabel, getCampaignLifecycleState } from "@/lib/campaign-management";
import { getCanonicalLeadStatus, getLeadSubmittedAt } from "@/lib/leads";
import { fetchMetaAdAccountDetails, fetchMetaAdAccountInsights } from "@/lib/meta";
import { getWorkspaceLeadSyncHealth, type WorkspaceLeadSyncHealth } from "@/lib/meta-leads";
import { getWorkspaceMetaAccessToken } from "@/lib/meta-integration";
import { getWorkspaceMetaIntegrationForUser } from "@/lib/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getActiveWorkspaceIdForUser } from "@/lib/workspaces";
import { CampaignRecord, LeadRecord } from "@/types";

type MetricTone = "brand" | "emerald" | "amber" | "slate" | "indigo";

type AttentionItem = {
  title: string;
  detail: string;
  tone: "critical" | "warning" | "neutral";
};

type LeadBucket = {
  label: string;
  total: number;
  newCount: number;
  contactedCount: number;
  qualifiedCount: number;
  closedCount: number;
};

type CampaignReportRow = {
  id: string;
  name: string;
  updatedAt: string;
  lifecycleState: ReturnType<typeof getCampaignLifecycleState>;
  lifecycleLabel: string;
  leads: number;
  spend: string;
  cpl: string;
  impressions: string;
  clicks: string;
  ctr: string;
};

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function parseMetricNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

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

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getCampaignPriority(state: ReturnType<typeof getCampaignLifecycleState>) {
  switch (state) {
    case "active":
      return 0;
    case "paused":
      return 1;
    case "draft":
      return 2;
    case "unknown":
      return 3;
    case "archived":
    default:
      return 4;
  }
}

function getCampaignStateTone(state: ReturnType<typeof getCampaignLifecycleState>): MetricTone {
  switch (state) {
    case "active":
      return "emerald";
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

function buildLeadBuckets(leads: LeadRecord[], weeks = 8): LeadBucket[] {
  const formatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
  const currentWeekStart = startOfWeek(new Date());

  return Array.from({ length: weeks }, (_, index) => {
    const start = addDays(currentWeekStart, (index - (weeks - 1)) * 7);
    const end = addDays(start, 7);
    const bucketLeads = leads.filter((lead) => {
      const submittedAt = new Date(getLeadSubmittedAt(lead));
      return submittedAt >= start && submittedAt < end;
    });

    const counts = {
      newCount: bucketLeads.filter((lead) => getCanonicalLeadStatus(lead.status) === "new").length,
      contactedCount: bucketLeads.filter((lead) => getCanonicalLeadStatus(lead.status) === "contacted").length,
      qualifiedCount: bucketLeads.filter((lead) => getCanonicalLeadStatus(lead.status) === "qualified").length,
      closedCount: bucketLeads.filter((lead) => getCanonicalLeadStatus(lead.status) === "closed").length,
    };

    return {
      label: formatter.format(start),
      total: bucketLeads.length,
      ...counts,
    };
  });
}

function buildCampaignRows(
  campaigns: CampaignRecord[],
  leads: LeadRecord[],
): CampaignReportRow[] {
  return campaigns
    .map((campaign) => {
      const state = getCampaignLifecycleState(campaign);
      const campaignLeads = leads.filter((lead) => lead.campaign_id === campaign.id);

      return {
        id: campaign.id,
        name: campaign.name,
        updatedAt: campaign.updated_at,
        lifecycleState: state,
        lifecycleLabel: getCampaignLifecycleLabel(campaign),
        leads: campaignLeads.length,
        spend: "—",
        cpl: "—",
        impressions: "—",
        clicks: "—",
        ctr: "—",
      };
    })
    .sort((left, right) => {
      const priorityDelta =
        getCampaignPriority(left.lifecycleState) - getCampaignPriority(right.lifecycleState);
      if (priorityDelta !== 0) return priorityDelta;
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
      detail: "Spend, clicks, impressions, CTR, and CPC will stay hidden until Meta reporting is connected.",
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
      detail: "Drafts are still waiting on launch, so they will not appear in delivery reporting yet.",
      tone: "neutral",
    });
  }

  if (errorCampaigns.length || leadSyncHealth?.lastWorkspaceSyncError) {
    items.push({
      title: "Sync issue detected",
      detail:
        leadSyncHealth?.lastWorkspaceSyncError ||
        `${errorCampaigns.length} campaign${errorCampaigns.length === 1 ? "" : "s"} has a status sync issue.`,
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

function ReportingBanner({
  title,
  description,
  ctaHref,
  ctaLabel,
  ctaSecondaryHref,
  ctaSecondaryLabel,
  tone = "brand",
}: {
  title: string;
  description: string;
  ctaHref: string;
  ctaLabel: string;
  ctaSecondaryHref?: string;
  ctaSecondaryLabel?: string;
  tone?: MetricTone;
}) {
  return (
    <Card
      className={`rounded-[28px] border-[var(--line)] bg-[linear-gradient(135deg,rgba(255,255,255,0.95)_0%,rgba(246,248,255,0.92)_100%)] p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-7`}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2">
            <div className={`flex h-9 w-9 items-center justify-center rounded-2xl border ${getToneClasses(tone)}`}>
              <BarChart3 className="h-4.5 w-4.5" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Reporting state
            </p>
          </div>
          <h2 className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-[var(--ink)]">{title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">{description}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href={ctaSecondaryHref || "/workspace/settings?section=integrations"}>{ctaSecondaryLabel || "Open integrations"}</Link>
          </Button>
          <Button asChild>
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
        </div>
      </div>
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

function LeadVolumeChart({ buckets, totalLeads }: { buckets: LeadBucket[]; totalLeads: number }) {
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
        title="No lead activity yet"
        description="This chart will fill in as leads arrive. Once campaigns are live, you will see volume trend by week."
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

export default async function PerformancePage() {
  const user = await requireUser();
  const admin = createSupabaseAdminClient();
  const [activeWorkspaceId, snapshot, allLeadsRaw, metaIntegration] = await Promise.all([
    getActiveWorkspaceIdForUser(user.id),
    getDashboardSnapshot(user.id),
    getLeads(user.id, "all"),
    getWorkspaceMetaIntegrationForUser(user.id),
  ]);
  const allLeads = allLeadsRaw as LeadRecord[];

  const metaConnected = Boolean(
    metaIntegration?.connection &&
      metaIntegration.tokenAvailable &&
      metaIntegration.connection.status === "connected",
  );
  const selectedAdAccountId = metaIntegration?.selected.adAccountId || null;
  const selectedAdAccount = selectedAdAccountId
    ? metaIntegration?.assets.adAccounts.find((asset) => asset.asset_id === selectedAdAccountId) || null
    : null;
  const reportingReady = metaConnected && Boolean(selectedAdAccountId);

  const tokenContext =
    admin && activeWorkspaceId && metaConnected
      ? await getWorkspaceMetaAccessToken({ admin, workspaceId: activeWorkspaceId }).catch(() => null)
      : null;

  const [leadSyncHealth, adAccountDetails, metaInsights] = await Promise.all([
    admin && activeWorkspaceId
      ? getWorkspaceLeadSyncHealth({ admin, workspaceId: activeWorkspaceId }).catch(() => null)
      : Promise.resolve(null),
    tokenContext && selectedAdAccountId
      ? fetchMetaAdAccountDetails(tokenContext.accessToken, selectedAdAccountId).catch(() => null)
      : Promise.resolve(null),
    tokenContext && selectedAdAccountId
      ? fetchMetaAdAccountInsights(tokenContext.accessToken, selectedAdAccountId).catch(() => null)
      : Promise.resolve(null),
  ]);

  const campaigns = (snapshot.campaigns as CampaignRecord[])
    .slice()
    .sort((left, right) => +new Date(right.updated_at) - +new Date(left.updated_at));

  const activeCampaigns = campaigns.filter((campaign) => getCampaignLifecycleState(campaign) === "active");
  const pausedCampaigns = campaigns.filter((campaign) => getCampaignLifecycleState(campaign) === "paused");
  const draftCampaigns = campaigns.filter((campaign) => getCampaignLifecycleState(campaign) === "draft");
  const errorCampaigns = campaigns.filter(
    (campaign) => campaign.management_sync_state === "error" || campaign.management_sync_state === "stale",
  );

  const spend = parseMetricNumber(metaInsights?.spend);
  const impressions = parseMetricNumber(metaInsights?.impressions);
  const clicks = parseMetricNumber(metaInsights?.clicks);
  const ctr = parseMetricNumber(metaInsights?.ctr);
  const cpc = parseMetricNumber(metaInsights?.cpc);
  const leads = allLeads.length;
  const costPerLead = spend !== null && leads > 0 ? spend / leads : null;
  const currency = adAccountDetails?.currency || "USD";

  const leadBuckets = buildLeadBuckets(allLeads);
  const campaignRows = buildCampaignRows(campaigns, allLeads);
  const attentionItems = buildAttentionItems({
    metaConnected,
    metaReportingReady: reportingReady,
    pausedCampaigns,
    draftCampaigns,
    errorCampaigns,
    leadSyncHealth,
  });
  const leadQualityCounts = {
    newCount: allLeads.filter((lead) => getCanonicalLeadStatus(lead.status) === "new").length,
    contactedCount: allLeads.filter((lead) => getCanonicalLeadStatus(lead.status) === "contacted").length,
    qualifiedCount: allLeads.filter((lead) => getCanonicalLeadStatus(lead.status) === "qualified").length,
    closedCount: allLeads.filter((lead) => getCanonicalLeadStatus(lead.status) === "closed").length,
  };
  const qualifiedRate = leads ? Math.round((leadQualityCounts.qualifiedCount / leads) * 100) : 0;
  const weeklyAverage = leadBuckets.some((bucket) => bucket.total > 0)
    ? (leads / leadBuckets.filter((bucket) => bucket.total > 0).length).toFixed(1)
    : "0.0";
  const metaBannerTitle = !metaConnected
    ? "Connect Meta to unlock reporting"
    : !reportingReady
      ? "Meta is connected, but reporting still needs an ad account"
      : adAccountDetails?.name
        ? `Reporting from ${adAccountDetails.name}`
        : selectedAdAccount?.name
          ? `Reporting from ${selectedAdAccount.name}`
          : "Meta reporting is active";
  const metaBannerDescription = !metaConnected
    ? "The performance page is ready to become a reporting workspace. Connect Meta to populate spend, impressions, clicks, CTR, and CPC."
    : !reportingReady
      ? "Select an ad account so this page can pull live delivery metrics and turn the workspace into an analytics view."
      : metaInsights
        ? "Live Meta delivery data is flowing in. The summary cards below are now grounded in account reporting instead of generic workspace stats."
        : "Meta is connected, but recent delivery data is not available yet. Once campaigns spend and Meta returns account insights, these metrics will populate here.";

  return (
    <AppShell currentPath="/performance">
      <div className="space-y-8">
        <PageHeader
          variant="plain"
          badge="Performance"
          title="Campaign reporting"
          description="A focused view for campaign results, delivery trends, and lead quality. This page is built for analysis, not workspace navigation."
          actions={
            <>
              <Button asChild variant="outline">
                <Link href="/templates">Open campaigns</Link>
              </Button>
              <Button asChild>
                <Link href="/templates/new">Launch campaign</Link>
              </Button>
            </>
          }
        />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Spend"
            value={formatCurrencyValue(spend, currency)}
            helper={
              metaConnected
                ? "Last 30 days of Meta account delivery"
                : "Connect Meta to unlock spend reporting"
            }
            icon={DollarSign}
            tone="brand"
          />
          <MetricCard
            label="Leads"
            value={formatCompactNumber(leads)}
            helper="Captured across the workspace"
            icon={UsersRound}
            tone="emerald"
          />
          <MetricCard
            label="Cost per Lead"
            value={formatCurrencyValue(costPerLead, currency)}
            helper={spend !== null && leads > 0 ? "Spend divided by total leads" : "Needs live spend + lead volume"}
            icon={Target}
            tone="indigo"
          />
          <MetricCard
            label="Active Campaigns"
            value={formatCompactNumber(activeCampaigns.length)}
            helper="Campaigns currently delivering"
            icon={Activity}
            tone="emerald"
          />
          <MetricCard
            label="Impressions"
            value={formatCompactNumber(impressions)}
            helper={metaConnected ? "Meta delivery impressions" : "Not connected yet"}
            icon={BarChart3}
            tone="slate"
          />
          <MetricCard
            label="Clicks"
            value={formatCompactNumber(clicks)}
            helper={metaConnected ? "Traffic generated by campaigns" : "Not connected yet"}
            icon={MousePointerClick}
            tone="slate"
          />
          <MetricCard
            label="CTR"
            value={ctr === null ? "—" : `${formatDecimalNumber(ctr, 2)}%`}
            helper={metaConnected ? "Click-through rate from Meta" : "Not connected yet"}
            icon={TrendingUp}
            tone="brand"
          />
          <MetricCard
            label="CPC"
            value={formatCurrencyValue(cpc, currency)}
            helper={metaConnected ? "Cost per click from Meta" : "Not connected yet"}
            icon={Gauge}
            tone="amber"
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
                <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
                  A weekly reporting line for inbound leads. This is the clearest signal of campaign response inside the workspace.
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Last 8 weeks</p>
                <p className="mt-1 text-sm font-medium text-[var(--ink)]">{leads} total leads</p>
              </div>
            </div>

            <div className="mt-6">
              <LeadVolumeChart buckets={leadBuckets} totalLeads={leads} />
            </div>
          </Card>

          <Card className="rounded-[28px] border-[var(--line)] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-7">
            <div className="flex items-center gap-2">
              <Activity className="h-4.5 w-4.5 text-[var(--brand)]" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Pipeline progression</p>
            </div>
            <h2 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">Lead quality flow</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              A compact view of how leads are moving from new to qualified and closed.
            </p>

            <div className="mt-6 space-y-4">
              {[
                { label: "New", value: leadQualityCounts.newCount, tone: "bg-[#dbeafe]" },
                { label: "Contacted", value: leadQualityCounts.contactedCount, tone: "bg-[#ede9fe]" },
                { label: "Qualified", value: leadQualityCounts.qualifiedCount, tone: "bg-[#dcfce7]" },
                { label: "Closed", value: leadQualityCounts.closedCount, tone: "bg-[#fee2e2]" },
              ].map((segment) => {
                const width = `${Math.max((segment.value / Math.max(leads, 1)) * 100, segment.value ? 10 : 4)}%`;

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
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Average per week</p>
                  <p className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">{weeklyAverage}</p>
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Campaign performance</p>
              <h2 className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">Campaign reporting table</h2>
            </div>
            <Button asChild variant="outline">
              <Link href="/templates">
                View all campaigns
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {campaignRows.length ? (
            <Card className="overflow-hidden rounded-[28px] border-[var(--line)] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
              <div className="overflow-x-auto">
                <div className="min-w-[76rem]">
                  <div className="grid grid-cols-[2.2fr_0.9fr_0.95fr_0.9fr_0.95fr_0.95fr_0.85fr_0.8fr_1fr_0.8fr] border-b border-[var(--line)] px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    <div>Campaign Name</div>
                    <div>Status</div>
                    <div>Spend</div>
                    <div>Leads</div>
                    <div>Cost per Lead</div>
                    <div>Impressions</div>
                    <div>Clicks</div>
                    <div>CTR</div>
                    <div>Updated</div>
                    <div>Actions</div>
                  </div>

                  <div className="divide-y divide-[var(--line)]">
                    {campaignRows.slice(0, 10).map((campaign) => (
                      <div
                        key={campaign.id}
                        className="grid grid-cols-[2.2fr_0.9fr_0.95fr_0.9fr_0.95fr_0.95fr_0.85fr_0.8fr_1fr_0.8fr] items-center px-6 py-5 transition-colors hover:bg-[var(--surface)]"
                      >
                        <div className="min-w-0 pr-4">
                          <Link href={`/campaigns/${campaign.id}`} className="block">
                            <p className="truncate text-base font-semibold tracking-[-0.03em] text-[var(--ink)]">{campaign.name}</p>
                          </Link>
                          <p className="mt-1 text-sm text-[var(--muted)]">
                            {campaign.leads} lead{campaign.leads === 1 ? "" : "s"} recorded
                          </p>
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

                        <div className="text-sm font-medium text-[var(--ink)]">{campaign.spend}</div>
                        <div className="text-sm font-medium text-[var(--ink)]">{formatCompactNumber(campaign.leads)}</div>
                        <div className="text-sm font-medium text-[var(--ink)]">{campaign.cpl}</div>
                        <div className="text-sm font-medium text-[var(--ink)]">{campaign.impressions}</div>
                        <div className="text-sm font-medium text-[var(--ink)]">{campaign.clicks}</div>
                        <div className="text-sm font-medium text-[var(--ink)]">{campaign.ctr}</div>
                        <div className="text-sm text-[var(--muted)]">{formatDate(campaign.updatedAt)}</div>
                        <div>
                          {campaign.lifecycleState === "draft" ? (
                            <form action={deleteDraftCampaignAction}>
                              <input type="hidden" name="campaignId" value={campaign.id} />
                              <input type="hidden" name="redirectTo" value="/performance" />
                              <Button
                                type="submit"
                                variant="outline"
                                className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                              >
                                Delete draft
                              </Button>
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
                    Launch a campaign and the table will start reporting row-by-row campaign results here.
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

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Reporting status</p>
              <h2 className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">Meta and sync readiness</h2>
            </div>
          </div>

          <Card className="rounded-[28px] border-[var(--line)] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-7">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Meta connection</p>
                <p className="mt-2 text-sm font-medium text-[var(--ink)]">
                  {metaConnected ? "Connected" : "Not connected"}
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {metaConnected
                    ? "Delivery metrics can be pulled into the performance view."
                    : "Connect Meta to populate spend, impressions, clicks, CTR, and CPC."}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Selected ad account</p>
                <p className="mt-2 text-sm font-medium text-[var(--ink)]">{selectedAdAccount?.name || adAccountDetails?.name || "None selected"}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {selectedAdAccountId ? selectedAdAccountId : "Choose an ad account in integrations."}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Lead sync</p>
                <p className="mt-2 text-sm font-medium text-[var(--ink)]">
                  {leadSyncHealth?.canReadLeads ? "Healthy" : metaConnected ? "Needs attention" : "Unavailable"}
                </p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {leadSyncHealth?.lastWorkspaceSyncError
                    ? leadSyncHealth.lastWorkspaceSyncError
                    : leadSyncHealth?.lastWorkspaceSyncAt
                      ? `Last synced ${formatDate(leadSyncHealth.lastWorkspaceSyncAt)}`
                      : "Sync status will appear once Meta leads are active."}
                </p>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
