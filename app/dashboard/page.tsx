import Link from "next/link";
import { AlertTriangle, ArrowRight, Clock3, ShieldCheck, Sparkles, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getCampaignLifecycleLabel, getCampaignLifecycleState } from "@/lib/campaign-management";
import { getDashboardSnapshot, getWorkspaceMetaIntegrationForUser } from "@/lib/data";
import { getLeadDisplayName, getLeadSubmittedAt } from "@/lib/leads";
import { getWorkspaceLeadSyncHealth } from "@/lib/meta-leads";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/utils";
import { getActiveWorkspaceIdForUser } from "@/lib/workspaces";

type AttentionItem = {
  key: string;
  title: string;
  detail: string;
  href?: string;
  tone?: "warning" | "danger";
};

function formatRelativeTime(value?: string | null) {
  if (!value) return "Just now";

  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "Just now";

  const diffMs = timestamp - Date.now();
  const diffSeconds = Math.round(diffMs / 1000);
  const absSeconds = Math.abs(diffSeconds);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absSeconds < 60) return "Just now";
  if (absSeconds < 60 * 60) return rtf.format(Math.round(diffSeconds / 60), "minute");
  if (absSeconds < 24 * 60 * 60) return rtf.format(Math.round(diffSeconds / 3600), "hour");
  if (absSeconds < 7 * 24 * 60 * 60) return rtf.format(Math.round(diffSeconds / 86400), "day");

  return formatDate(value);
}

function getCampaignStatusTone(state: string) {
  switch (state) {
    case "active":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
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

function getCampaignSourceLabel(campaignName?: string | null) {
  return campaignName?.trim() || "Unknown campaign";
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
      detail: `${errorCampaigns.length} campaign${errorCampaigns.length === 1 ? "" : "s"} ${
        errorCampaigns.length === 1 ? "needs" : "need"
      } a sync check.`,
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
      href: `/templates/drafts`,
      tone: "warning",
    });
  }

  if (leadSyncHealth && (!leadSyncHealth.canReadLeads || leadSyncHealth.lastWorkspaceSyncError)) {
    const detail = leadSyncHealth.lastWorkspaceSyncError
      ? leadSyncHealth.lastWorkspaceSyncError
      : leadSyncHealth.requiredScopesMissing.length
        ? `Missing scopes: ${leadSyncHealth.requiredScopesMissing.join(", ")}`
        : "Lead sync needs attention.";

    items.unshift({
      key: "lead-sync",
      title: "Sync issue",
      detail,
      href: "/leads",
      tone: "danger",
    });
  }

  return items.slice(0, 4);
}

function DashboardConnectState() {
  return (
    <AppShell currentPath="/dashboard">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 py-10 sm:py-14">
        <PageHeader
          variant="plain"
          badge="Home"
          title="Connect Meta"
          description="Meta is not connected yet."
        />

        <Card className="overflow-hidden border-[var(--line)] bg-[rgba(255,255,255,0.8)] p-7 shadow-[0_10px_24px_rgba(16,24,40,0.03)] sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(244,114,182,0.2)] bg-[rgba(244,114,182,0.08)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#b42373]">
                <ShieldCheck className="h-3.5 w-3.5" />
                Meta required
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)] sm:text-[2.15rem]">
                  Meta is not connected yet
                </h2>
                <p className="max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-[15px]">
                  Connect Meta to unlock live campaign status and recent leads.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 rounded-[22px] bg-[var(--soft-panel)] px-4 py-4">
                  <Sparkles className="mt-0.5 h-4 w-4 text-[var(--brand)]" />
                  <p className="text-sm leading-6 text-[var(--muted-strong)]">
                    Campaign status, attention items, and recent leads.
                  </p>
                </div>
                <div className="flex items-start gap-3 rounded-[22px] bg-[var(--soft-panel)] px-4 py-4">
                  <Users className="mt-0.5 h-4 w-4 text-[var(--brand)]" />
                  <p className="text-sm leading-6 text-[var(--muted-strong)]">
                    Setup returns you here when the connection finishes.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="sm:min-w-48">
                  <Link href="/api/meta/connect?next=/dashboard">
                    Connect Meta
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="sm:min-w-48">
                  <Link href="/workspace/settings?section=integrations">Open integrations</Link>
                </Button>
              </div>
            </div>

            <div className="rounded-[28px] border border-[var(--line)] bg-white/72 p-5" />
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const user = await requireUser();
  const [{ success }, snapshot, metaIntegration] = await Promise.all([
    searchParams,
    getDashboardSnapshot(user.id),
    getWorkspaceMetaIntegrationForUser(user.id),
  ]);

  const metaConnected = Boolean(
    metaIntegration?.connection &&
      metaIntegration.tokenAvailable &&
      metaIntegration.connection.status === "connected",
  );

  if (!metaConnected) {
    return <DashboardConnectState />;
  }

  const activeWorkspaceId = await getActiveWorkspaceIdForUser(user.id);
  const admin = createSupabaseAdminClient();
  const leadSyncHealth =
    admin && activeWorkspaceId
      ? await getWorkspaceLeadSyncHealth({ admin, workspaceId: activeWorkspaceId }).catch(() => null)
      : null;

  const campaigns = snapshot.campaigns.slice().sort((left, right) => +new Date(right.updated_at) - +new Date(left.updated_at));
  const recentCampaigns = campaigns.slice(0, 5);
  const recentLeads = snapshot.recentLeads.slice(0, 5);

  const activeCampaigns = campaigns.filter((campaign) => getCampaignLifecycleState(campaign) === "active");
  const pausedCampaigns = campaigns.filter((campaign) => getCampaignLifecycleState(campaign) === "paused");
  const draftCampaigns = campaigns.filter((campaign) => getCampaignLifecycleState(campaign) === "draft");
  const attentionItems = buildAttentionItems({ campaigns, leadSyncHealth });
  const campaignMap = new Map(campaigns.map((campaign) => [campaign.id, campaign]));
  return (
    <AppShell currentPath="/dashboard">
      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <div className="space-y-8">
        <PageHeader
          variant="plain"
          badge="Home"
          title="Operational overview"
          description="A compact view of what is active, what needs attention, and which leads just came in."
          actions={
            <>
              <Button asChild variant="outline">
                <Link href="/leads">Open leads</Link>
              </Button>
              <Button asChild>
                <Link href="/templates">Launch campaign</Link>
              </Button>
            </>
          }
        />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Active Campaigns"
            value={activeCampaigns.length}
            helper="Live now"
          />
          <StatCard label="Paused Campaigns" value={pausedCampaigns.length} helper="On hold" />
          <StatCard label="Draft Campaigns" value={draftCampaigns.length} helper="Saved for later" />
          <StatCard label="New Leads" value={snapshot.newLeads} helper="Unread leads" />
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
                      <Link href={`/campaigns/${campaign.id}`} className="text-sm font-medium text-[var(--brand)]">
                        Open
                      </Link>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-[24px] border border-dashed border-[var(--line)] px-5 py-10 text-center">
                  <p className="text-base font-medium text-[var(--ink)]">No campaigns yet</p>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
                    Start from a template and this section will show your active, paused, and draft campaigns.
                  </p>
                  <Button asChild variant="outline" className="mt-5">
                    <Link href="/templates">Browse campaigns</Link>
                  </Button>
                </div>
              )}
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
                    Campaigns are in good shape, and there are no sync issues or unfinished drafts right now.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <Card className="border-[var(--line)] bg-[rgba(255,255,255,0.8)] p-6 shadow-[0_10px_24px_rgba(16,24,40,0.03)] sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Recent leads
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                Latest incoming leads
              </h2>
            </div>
            <Link href="/leads" className="text-sm font-medium text-[var(--brand)]">
              View all
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {recentLeads.length ? (
              recentLeads.map((lead) => {
                const campaign = lead.campaign_id ? campaignMap.get(lead.campaign_id) : null;
                return (
                  <div
                    key={lead.id}
                    className="flex flex-col gap-3 rounded-[22px] border border-[var(--line)] bg-[var(--soft-panel)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--ink)]">{getLeadDisplayName(lead)}</p>
                      <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                        {getCampaignSourceLabel(campaign?.name)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                      <Clock3 className="h-4 w-4" />
                      <span>{formatRelativeTime(getLeadSubmittedAt(lead))}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-[24px] border border-dashed border-[var(--line)] px-5 py-10 text-center">
                <p className="text-base font-medium text-[var(--ink)]">No leads yet</p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
                  Once Meta starts sending inquiries, the newest leads will appear here in a lightweight list.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
