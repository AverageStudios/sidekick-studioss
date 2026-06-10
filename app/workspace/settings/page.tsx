import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  Image as ImageIcon,
  LayoutTemplate,
  Plug,
  Settings2,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { WorkspaceLogoField } from "@/components/workspace-logo-field";
import {
  disconnectCrmConnectionAction,
  disconnectMetaIntegrationAction,
  refreshMetaIntegrationAssetsAction,
  retryCrmDeliveryAction,
  retryFailedCrmDeliveriesAction,
  saveCrmConnectionAction,
  saveMetaIntegrationSelectionsAction,
  syncMetaLeadsAction,
  updateWorkspaceGeneralAction,
  updateWorkspaceIconAction,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";
import { getDashboardSnapshot } from "@/lib/data";
import { cn } from "@/lib/utils";
import { getCampaignLifecycleLabel, getCampaignLifecycleState } from "@/lib/campaign-management";
import { getWorkspaceCrmState } from "@/lib/crm-integration";
import { getCurrentWorkspaceContext } from "@/lib/workspaces";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isMetaConfigured } from "@/lib/meta";
import { getWorkspaceMetaIntegrationState } from "@/lib/meta-integration";
import { getWorkspaceLeadSyncHealth } from "@/lib/meta-leads";
import { getGhlEnvStatus, isSupabaseServerConfigured } from "@/lib/env";

const workspaceSections = [
  { id: "general", label: "General", icon: Settings2 },
  { id: "icon", label: "Branding", icon: ImageIcon },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "campaigns", label: "Campaigns", icon: LayoutTemplate },
] as const;

type WorkspaceSection = (typeof workspaceSections)[number]["id"];

function getSection(section: string | undefined): WorkspaceSection {
  return workspaceSections.some((item) => item.id === section) ? (section as WorkspaceSection) : "general";
}

function formatStatusTone(connected: boolean) {
  return connected
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-amber-200 bg-amber-50 text-amber-700";
}

function formatDeliveryStateTone(state: string) {
  switch (state) {
    case "delivered":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "failed":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function formatShortDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export default async function WorkspaceSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string; saved?: string; error?: string; created?: string }>;
}) {
  const user = await requireUser();
  const [{ section: rawSection, saved, error, created }, workspaceContext, dashboardSnapshot] = await Promise.all([
    searchParams,
    getCurrentWorkspaceContext(),
    getDashboardSnapshot(user.id),
  ]);

  const section = getSection(rawSection);
  const workspaceName = workspaceContext?.activeWorkspace.name || "My Workspace";
  const businessProfile = workspaceContext?.businessProfile;
  const workspaceId = workspaceContext?.activeWorkspace.id || null;
  const workspaceContextMissing = !workspaceContext && isSupabaseServerConfigured();
  const admin = createSupabaseAdminClient();
  let integrationError: string | null = null;
  let crmIntegrationError: string | null = null;
  let leadSyncError: string | null = null;
  const integrationState =
    admin && workspaceId
      ? await getWorkspaceMetaIntegrationState({ admin, workspaceId }).catch((err) => {
          integrationError = err instanceof Error ? err.message : "Meta integration data could not be loaded.";
          return null;
        })
      : null;
  const leadSyncHealth =
    admin && workspaceId
      ? await getWorkspaceLeadSyncHealth({ admin, workspaceId }).catch((err) => {
          leadSyncError = err instanceof Error ? err.message : "Lead sync status could not be loaded.";
          return null;
        })
      : null;
  const crmState =
    admin && workspaceId
      ? await getWorkspaceCrmState({ admin, workspaceId }).catch((err) => {
          crmIntegrationError = err instanceof Error ? err.message : "CRM connections could not be loaded.";
          return {
            connections: [],
            destinations: [],
            deliveries: [],
            deliveryCounts: {
              pending: 0,
              delivered: 0,
              failed: 0,
              retrying: 0,
              skipped: 0,
            },
          };
        })
      : {
          connections: [],
          destinations: [],
          deliveries: [],
          deliveryCounts: {
            pending: 0,
            delivered: 0,
            failed: 0,
            retrying: 0,
            skipped: 0,
          },
        };
  const connection = integrationState?.connection || null;
  const adAccounts = integrationState?.assets.adAccounts || [];
  const pages = integrationState?.assets.pages || [];
  const instagramActors = integrationState?.assets.instagramActors || [];
  const metaConnected =
    Boolean(connection && integrationState?.tokenAvailable && connection.status === "connected");
  const crmConnections = crmState.connections.filter((item) => item.is_active);
  const ghlConnection = crmConnections.find((item) => item.provider === "gohighlevel") || null;
  const hubspotConnection = crmConnections.find((item) => item.provider === "hubspot") || null;
  const ghlEnvStatus = getGhlEnvStatus();
  const providerDestinations = crmState.destinations.filter((destination) => destination.is_available);
  const metaConnectNext = encodeURIComponent("/workspace/settings?section=integrations");
  const selectedPageLeadFormAccess =
    connection?.metadata_json &&
    typeof connection.metadata_json === "object" &&
    connection.metadata_json.selected_page_lead_form_access &&
    typeof connection.metadata_json.selected_page_lead_form_access === "object"
      ? (connection.metadata_json.selected_page_lead_form_access as Record<string, unknown>)
      : null;
  const selectedPageLeadFormMissingPermissions = Array.isArray(selectedPageLeadFormAccess?.missingPermissions)
    ? selectedPageLeadFormAccess?.missingPermissions.filter(
        (permission): permission is string => typeof permission === "string",
      )
    : [];
  const needsLeadFormReconnect = selectedPageLeadFormMissingPermissions.includes("pages_manage_ads");
  const metaConnectHref = `/api/meta/connect?next=${metaConnectNext}${needsLeadFormReconnect ? "&scopeSet=lead_forms" : ""}${metaConnected || needsLeadFormReconnect ? "&reconnect=1" : ""}`;
  const leadSyncStatusLabel =
    leadSyncHealth?.webhookSubscriptionReady
      ? "Real-time lead form sync is ready."
      : leadSyncHealth?.canReadLeads
        ? "Lead recovery sync is available."
        : "Lead form sync needs reconnect permissions.";
  const campaigns = dashboardSnapshot.campaigns || [];
  const publishedCampaigns = campaigns.filter((campaign) => campaign.status === "published");
  const draftCampaigns = campaigns.filter((campaign) => campaign.status === "draft");
  const archivedCampaigns = campaigns.filter((campaign) => campaign.status === "archived");
  return (
    <AppShell currentPath="/settings">
      <div className="overflow-hidden rounded-[2rem] border border-[var(--line)] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
        <div className="grid min-h-[42rem] lg:grid-cols-[18rem_minmax(0,1fr)]">
          <aside className="border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--surface)_78%,white)] px-6 py-7 lg:border-b-0 lg:border-r">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted-strong)] transition-colors hover:text-[var(--ink)]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>

            <div className="mt-8">
              <h1 className="text-[1.7rem] font-semibold tracking-[-0.04em] text-[var(--ink)]">
                {workspaceName}
              </h1>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Real workspace settings for the business account behind your SideKick setup.
              </p>
            </div>

            <nav className="mt-8 space-y-1.5">
              {workspaceSections.map((item) => {
                const Icon = item.icon;
                const active = item.id === section;

                return (
                  <Link
                    key={item.id}
                    href={`/workspace/settings?section=${item.id}`}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                      active
                        ? "bg-[var(--soft-panel)] text-[var(--brand-ink)]"
                        : "text-[var(--muted)] hover:bg-[var(--soft-panel)] hover:text-[var(--ink)]",
                    )}
                  >
                    <Icon className={cn("h-4 w-4", active ? "text-[var(--brand)]" : "text-[var(--muted)]")} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-8 rounded-2xl border border-[var(--line)] bg-white p-4">
              <p className="text-sm font-semibold text-[var(--ink)]">Workspace</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                These settings affect the active workspace and business account.
              </p>
            </div>
          </aside>

          <div className="px-6 py-8 sm:px-8 sm:py-10 lg:px-12">
            {saved ? (
              <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Workspace settings saved.
              </div>
            ) : null}
            {error ? (
              <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            {section === "general" ? (
              <section className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">General</p>
                <h2 className="mt-3 text-[2.2rem] font-semibold tracking-[-0.05em] text-[var(--ink)]">General</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  Basic settings for your workspace and business identity.
                </p>

                {created === "1" ? (
                  <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
                    <p className="text-sm font-semibold text-emerald-800">Workspace created</p>
                    <p className="mt-1 text-sm leading-6 text-emerald-700">
                      This is now a separate business environment. Next best steps: connect Meta, confirm your business defaults, and launch your first campaign from this workspace.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Button asChild size="sm">
                        <Link href="/workspace/settings?section=integrations">Connect Meta</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href="/templates/new">Launch first campaign</Link>
                      </Button>
                    </div>
                  </div>
                ) : null}

                <form action={updateWorkspaceGeneralAction} className="mt-8 space-y-6">
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label className="text-sm font-medium text-[var(--ink)]" htmlFor="workspaceName">
                        Workspace name
                      </label>
                      <span className="text-xs text-[var(--muted)]">{workspaceName.length}/40 characters</span>
                    </div>
                    <Input
                      id="workspaceName"
                      name="workspaceName"
                      maxLength={40}
                      defaultValue={workspaceName}
                      placeholder="Workspace name"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--ink)]" htmlFor="businessName">
                      Business name
                    </label>
                    <Input
                      id="businessName"
                      name="businessName"
                      defaultValue={businessProfile?.business_name || workspaceName}
                      placeholder="Business name"
                      required
                    />
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[var(--ink)]" htmlFor="businessEmail">
                        Business email
                      </label>
                      <Input
                        id="businessEmail"
                        name="businessEmail"
                        type="email"
                        defaultValue={businessProfile?.email || user.email || ""}
                        placeholder="hello@yourbusiness.com"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[var(--ink)]" htmlFor="businessPhone">
                        Business phone
                      </label>
                      <Input
                        id="businessPhone"
                        name="businessPhone"
                        defaultValue={businessProfile?.phone || ""}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[var(--ink)]" htmlFor="website">
                        Website
                      </label>
                      <Input
                        id="website"
                        name="website"
                        defaultValue={businessProfile?.website || ""}
                        placeholder="https://yourbusiness.com"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[var(--ink)]" htmlFor="privacyPolicyUrl">
                        Privacy policy URL
                      </label>
                      <Input
                        id="privacyPolicyUrl"
                        name="privacyPolicyUrl"
                        defaultValue={businessProfile?.privacy_policy_url || ""}
                        placeholder="https://yourbusiness.com/privacy"
                      />
                    </div>
                  </div>

                  <div className="max-w-sm">
                    <label className="mb-2 block text-sm font-medium text-[var(--ink)]" htmlFor="industry">
                      Industry
                    </label>
                    <Input
                      id="industry"
                      name="industry"
                      defaultValue={businessProfile?.industry || ""}
                      placeholder="Auto Detailing"
                    />
                  </div>

                  <Button type="submit">Save general settings</Button>
                </form>
              </section>
            ) : null}

            {section === "icon" ? (
              <section className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Icon</p>
                <h2 className="mt-3 text-[2.2rem] font-semibold tracking-[-0.05em] text-[var(--ink)]">Icon</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  Update the workspace image and accent color used across your campaign setup.
                </p>

                <form action={updateWorkspaceIconAction} className="mt-8 space-y-6">
                  <WorkspaceLogoField
                    currentLogoUrl={businessProfile?.logo_url || null}
                    initials={workspaceName.charAt(0).toUpperCase()}
                    label={workspaceName}
                  />

                  <div className="max-w-[12rem]">
                    <label className="mb-2 block text-sm font-medium text-[var(--ink)]" htmlFor="brandColor">
                      Brand color
                    </label>
                    <Input
                      id="brandColor"
                      name="brandColor"
                      type="color"
                      defaultValue={businessProfile?.brand_color || "#6D5EF8"}
                      className="h-11 p-1.5"
                    />
                  </div>

                  <Button type="submit">Save icon settings</Button>
                </form>
              </section>
            ) : null}

            {section === "campaigns" ? (
              <section className="max-w-5xl">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Campaigns</p>
                <h2 className="mt-3 text-[2.2rem] font-semibold tracking-[-0.05em] text-[var(--ink)]">Campaigns</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  See every draft and published ad running inside this workspace.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Total campaigns</p>
                    <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">{campaigns.length}</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Published</p>
                    <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">{publishedCampaigns.length}</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Drafts</p>
                    <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">{draftCampaigns.length}</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Archived</p>
                    <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">{archivedCampaigns.length}</p>
                  </div>
                </div>

                <div className="mt-8 space-y-8">
                  <div>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold text-[var(--ink)]">Published ads</h3>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          Live campaigns that are already running from this workspace.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {publishedCampaigns.length ? (
                        publishedCampaigns.map((campaign) => (
                          <div
                            key={campaign.id}
                            className="flex flex-col gap-4 rounded-2xl border border-[var(--line)] bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-sm font-semibold text-[var(--ink)]">{campaign.name}</p>
                                <span
                                  className={cn(
                                    "rounded-full px-2.5 py-1 text-[11px] font-medium",
                                    getCampaignLifecycleState(campaign) === "paused"
                                      ? "bg-amber-50 text-amber-700"
                                      : "bg-emerald-50 text-emerald-700",
                                  )}
                                >
                                  {getCampaignLifecycleLabel(campaign)}
                                </span>
                              </div>
                              <p className="mt-2 line-clamp-1 text-sm text-[var(--muted)]">
                                {campaign.headline || campaign.subheadline || "This campaign is live in your workspace."}
                              </p>
                              <p className="mt-2 text-xs text-[var(--muted)]">
                                Updated {new Date(campaign.updated_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Button asChild variant="outline">
                              <Link href={`/campaigns/${campaign.id}`}>Open campaign</Link>
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-[var(--line)] bg-[var(--soft-panel)] p-5 text-sm text-[var(--muted)]">
                          No published ads in this workspace yet.
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold text-[var(--ink)]">Archived campaigns</h3>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          Hidden from default views but still available for history and troubleshooting.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {archivedCampaigns.length ? (
                        archivedCampaigns.map((campaign) => (
                          <div
                            key={campaign.id}
                            className="flex flex-col gap-4 rounded-2xl border border-[var(--line)] bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-sm font-semibold text-[var(--ink)]">{campaign.name}</p>
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                                  Archived
                                </span>
                              </div>
                              <p className="mt-2 line-clamp-1 text-sm text-[var(--muted)]">
                                {campaign.headline || campaign.subheadline || "This campaign was archived from active views."}
                              </p>
                              <p className="mt-2 text-xs text-[var(--muted)]">
                                {campaign.archived_at
                                  ? `Archived ${new Date(campaign.archived_at).toLocaleDateString()}`
                                  : `Updated ${new Date(campaign.updated_at).toLocaleDateString()}`}
                              </p>
                            </div>
                            <Button asChild variant="outline">
                              <Link href={`/campaigns/${campaign.id}`}>View archived campaign</Link>
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-[var(--line)] bg-[var(--soft-panel)] p-5 text-sm text-[var(--muted)]">
                          No archived campaigns in this workspace yet.
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold text-[var(--ink)]">Draft ads</h3>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          Campaigns still being prepared before they go live.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {draftCampaigns.length ? (
                        draftCampaigns.map((campaign) => (
                          <div
                            key={campaign.id}
                            className="flex flex-col gap-4 rounded-2xl border border-[var(--line)] bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-sm font-semibold text-[var(--ink)]">{campaign.name}</p>
                                <span className="rounded-full bg-[var(--soft-panel)] px-2.5 py-1 text-[11px] font-medium text-[var(--ink)]">
                                  Draft
                                </span>
                              </div>
                              <p className="mt-2 line-clamp-1 text-sm text-[var(--muted)]">
                                {campaign.headline || campaign.subheadline || "This draft is still being customized."}
                              </p>
                              <p className="mt-2 text-xs text-[var(--muted)]">
                                Updated {new Date(campaign.updated_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Button asChild variant="outline">
                              <Link href={`/campaigns/${campaign.id}`}>Open draft</Link>
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-[var(--line)] bg-[var(--soft-panel)] p-5 text-sm text-[var(--muted)]">
                          No draft ads in this workspace right now.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            {section === "integrations" ? (
              <section className="max-w-5xl">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Integrations</p>
                <h2 className="mt-3 text-[2.2rem] font-semibold tracking-[-0.05em] text-[var(--ink)]">Connected accounts</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  Connect the services this workspace uses to launch campaigns and send new leads into your CRM.
                </p>

                <div className="mt-8 space-y-6">
                  {workspaceContextMissing ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      Workspace settings could not be loaded right now.
                    </div>
                  ) : null}
                  {integrationError ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {integrationError}
                    </div>
                  ) : null}
                  {crmIntegrationError ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {crmIntegrationError}
                    </div>
                  ) : null}
                  {leadSyncError ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {leadSyncError}
                    </div>
                  ) : null}

                  <div className="rounded-[1.75rem] border border-[var(--line)] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-[var(--ink)]">Connected accounts</p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          Manage the services this workspace uses for campaign launch and CRM handoff.
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 space-y-4">
                      <details
                        open={metaConnected || needsLeadFormReconnect}
                        className="group rounded-[1.35rem] border border-[var(--line)] bg-[var(--surface)]"
                      >
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                              <p className="text-base font-semibold text-[var(--ink)]">Meta / Facebook</p>
                              <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", formatStatusTone(metaConnected))}>
                                {metaConnected ? "Connected" : "Not connected"}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-[var(--muted)]">
                              Connect Meta to publish campaigns and receive lead form submissions.
                            </p>
                            {connection?.provider_user_name ? (
                              <p className="mt-1 text-xs text-[var(--muted)]">Connected as {connection.provider_user_name}</p>
                            ) : null}
                            {leadSyncHealth ? (
                              <p className="mt-1 text-xs text-[var(--muted)]">{leadSyncStatusLabel}</p>
                            ) : null}
                          </div>
                          <ChevronDown className="h-4 w-4 shrink-0 text-[var(--muted)] transition-transform group-open:rotate-180" />
                        </summary>

                        <div className="border-t border-[var(--line)] px-5 py-5">
                          <div className="flex flex-wrap gap-2">
                            <Button asChild disabled={!isMetaConfigured() || !workspaceId}>
                              <Link href={metaConnectHref}>{metaConnected ? "Reconnect" : "Connect"}</Link>
                            </Button>
                            {metaConnected ? (
                              <>
                                <form action={refreshMetaIntegrationAssetsAction}>
                                  <Button type="submit" variant="outline">Refresh</Button>
                                </form>
                                <form action={disconnectMetaIntegrationAction}>
                                  <Button type="submit" variant="outline">Disconnect</Button>
                                </form>
                                <form action={syncMetaLeadsAction}>
                                  <input type="hidden" name="mode" value="incremental" />
                                  <input type="hidden" name="redirectTo" value="/workspace/settings?section=integrations" />
                                  <Button type="submit" variant="outline">Sync recent leads</Button>
                                </form>
                                <form action={syncMetaLeadsAction}>
                                  <input type="hidden" name="mode" value="backfill" />
                                  <input type="hidden" name="redirectTo" value="/workspace/settings?section=integrations" />
                                  <Button type="submit" variant="outline">Backfill lead forms</Button>
                                </form>
                              </>
                            ) : null}
                          </div>

                          {connection ? (
                            <form action={saveMetaIntegrationSelectionsAction} className="mt-5 space-y-5">
                              <div className="space-y-2">
                                <label className="block text-sm font-medium text-[var(--ink)]">Ad account</label>
                                <select
                                  name="adAccountId"
                                  defaultValue={integrationState?.selected.adAccountId || ""}
                                  className="h-12 w-full rounded-[14px] border border-[var(--line)] bg-white px-4 text-sm text-[var(--ink)] shadow-sm outline-none transition-colors focus:border-[var(--brand)]"
                                >
                                  <option value="">Select ad account</option>
                                  {adAccounts.map((account) => (
                                    <option key={account.asset_id} value={account.asset_id}>
                                      {account.name || account.asset_id}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="space-y-2">
                                <label className="block text-sm font-medium text-[var(--ink)]">Facebook Page</label>
                                <select
                                  name="pageId"
                                  defaultValue={integrationState?.selected.pageId || ""}
                                  className="h-12 w-full rounded-[14px] border border-[var(--line)] bg-white px-4 text-sm text-[var(--ink)] shadow-sm outline-none transition-colors focus:border-[var(--brand)]"
                                >
                                  <option value="">Select page</option>
                                  {pages.map((page) => (
                                    <option key={page.asset_id} value={page.asset_id}>
                                      {page.name || page.asset_id}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {instagramActors.length ? (
                                <div className="space-y-2">
                                  <label className="block text-sm font-medium text-[var(--ink)]">Instagram account</label>
                                  <select
                                    name="instagramActorId"
                                    defaultValue={integrationState?.selected.instagramActorId || ""}
                                    className="h-12 w-full rounded-[14px] border border-[var(--line)] bg-white px-4 text-sm text-[var(--ink)] shadow-sm outline-none transition-colors focus:border-[var(--brand)]"
                                  >
                                    <option value="">No Instagram account selected</option>
                                    {instagramActors.map((actor) => (
                                      <option key={actor.asset_id} value={actor.asset_id}>
                                        {actor.name || actor.asset_id}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ) : null}

                              <div className="flex flex-wrap items-center gap-3 pt-2">
                                <Button type="submit">Save changes</Button>
                                {needsLeadFormReconnect ? (
                                  <p className="text-xs text-[var(--muted)]">
                                    Reconnect Meta to approve lead form permissions for the selected page.
                                  </p>
                                ) : null}
                              </div>
                            </form>
                          ) : null}
                        </div>
                      </details>

                      <details open={Boolean(ghlConnection)} className="group rounded-[1.35rem] border border-[var(--line)] bg-[var(--surface)]">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                              <p className="text-base font-semibold text-[var(--ink)]">GoHighLevel</p>
                              <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", formatStatusTone(Boolean(ghlConnection)))}>
                                {ghlConnection ? "Connected" : "Not connected"}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-[var(--muted)]">
                              Send new Meta lead form submissions from this workspace directly into GoHighLevel.
                            </p>
                            {ghlConnection ? (
                              <p className="mt-1 text-xs text-[var(--muted)]">
                                {typeof ghlConnection.metadata_json.location_name === "string"
                                  ? ghlConnection.metadata_json.location_name
                                  : ghlConnection.provider_user_name || "Workspace connected"}
                              </p>
                            ) : !ghlEnvStatus.configured ? (
                              <p className="mt-1 text-xs text-[var(--muted)]">OAuth setup is not configured yet.</p>
                            ) : null}
                          </div>
                          <ChevronDown className="h-4 w-4 shrink-0 text-[var(--muted)] transition-transform group-open:rotate-180" />
                        </summary>

                        <div className="border-t border-[var(--line)] px-5 py-5">
                          <div className="flex flex-wrap gap-2">
                            <Button asChild disabled={!ghlEnvStatus.configured}>
                              <Link href="/api/integrations/crm/connect?provider=gohighlevel&next=/workspace/settings?section=integrations">
                                {ghlConnection ? "Reconnect" : "Connect"}
                              </Link>
                            </Button>
                            {ghlConnection ? (
                              <form action={disconnectCrmConnectionAction}>
                                <input type="hidden" name="provider" value="gohighlevel" />
                                <Button type="submit" variant="outline">Disconnect</Button>
                              </form>
                            ) : null}
                          </div>
                        </div>
                      </details>

                      <details open={Boolean(hubspotConnection)} className="group rounded-[1.35rem] border border-[var(--line)] bg-[var(--surface)]">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                              <p className="text-base font-semibold text-[var(--ink)]">HubSpot</p>
                              <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", formatStatusTone(Boolean(hubspotConnection)))}>
                                {hubspotConnection ? "Connected" : "Not connected"}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-[var(--muted)]">
                              Send new Meta lead form submissions from this workspace into HubSpot contacts.
                            </p>
                            {hubspotConnection ? (
                              <p className="mt-1 text-xs text-[var(--muted)]">
                                {hubspotConnection.provider_user_name || "HubSpot account connected"}
                              </p>
                            ) : null}
                          </div>
                          <ChevronDown className="h-4 w-4 shrink-0 text-[var(--muted)] transition-transform group-open:rotate-180" />
                        </summary>

                        <div className="border-t border-[var(--line)] px-5 py-5">
                          {hubspotConnection ? (
                            <div className="flex flex-wrap gap-2">
                              <form action={disconnectCrmConnectionAction}>
                                <input type="hidden" name="provider" value="hubspot" />
                                <Button type="submit" variant="outline">Disconnect</Button>
                              </form>
                            </div>
                          ) : (
                            <form action={saveCrmConnectionAction} className="flex max-w-[24rem] flex-col gap-3">
                              <input type="hidden" name="provider" value="hubspot" />
                              <Input
                                type="password"
                                name="accessToken"
                                required
                                placeholder="HubSpot private app token"
                              />
                              <Button type="submit" className="self-start">Connect</Button>
                            </form>
                          )}
                        </div>
                      </details>
                    </div>

                    <div className="mt-6 rounded-[1.35rem] border border-[var(--line)] bg-[var(--surface)] p-5">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-sm font-semibold text-[var(--ink)]">CRM handoff</p>
                        <span
                          className={cn(
                            "rounded-full border px-3 py-1 text-xs font-semibold",
                            providerDestinations.length
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-amber-200 bg-amber-50 text-amber-700",
                          )}
                        >
                          {providerDestinations.length ? "Send to all connected CRMs" : "No CRMs connected yet"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-[var(--muted)]">
                        SideKick automatically sends Meta lead form submissions to every connected CRM in this workspace. No default CRM selection is required.
                      </p>
                      {providerDestinations.length ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {providerDestinations.map((destination) => (
                            <span
                              key={destination.id}
                              className="rounded-full border border-[var(--line)] bg-white px-3 py-1 text-xs font-semibold text-[var(--muted-strong)]"
                            >
                              {destination.provider === "gohighlevel"
                                ? "GoHighLevel"
                                : destination.provider === "hubspot"
                                  ? "HubSpot"
                                  : destination.provider}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-6">
                    <div className="rounded-[1.75rem] border border-[var(--line)] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-[var(--ink)]">Recent sync activity</p>
                          <p className="mt-1 text-sm text-[var(--muted)]">
                            Recent CRM handoff results for Meta lead form submissions.
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-[var(--soft-panel)] px-3 py-1 text-xs font-semibold text-[var(--muted-strong)]">
                            {crmState.deliveries.length} recent
                          </span>
                          {crmState.deliveryCounts.failed ? (
                            <form action={retryFailedCrmDeliveriesAction}>
                              <Button type="submit" size="sm" variant="outline">
                                Retry failed
                              </Button>
                            </form>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Delivered</p>
                          <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">{crmState.deliveryCounts.delivered}</p>
                        </div>
                        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Failed</p>
                          <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">{crmState.deliveryCounts.failed}</p>
                        </div>
                        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Pending / retrying</p>
                          <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                            {crmState.deliveryCounts.pending + crmState.deliveryCounts.retrying}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 space-y-3">
                        {crmState.deliveries.length ? (
                          crmState.deliveries.slice(0, 5).map((delivery) => (
                            <div key={delivery.id} className="rounded-[1.15rem] border border-[var(--line)] bg-[var(--surface)] p-4">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-semibold text-[var(--ink)]">{delivery.provider}</p>
                                    <span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-semibold", formatDeliveryStateTone(delivery.state))}>
                                      {delivery.state}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-sm text-[var(--muted-strong)]">
                                    {delivery.campaignName || delivery.formName || delivery.leadName || "Meta lead form"}
                                  </p>
                                  <p className="mt-1 text-xs text-[var(--muted)]">
                                    {formatShortDate(delivery.updated_at) || "Recently updated"} • {delivery.attempts_count} attempt{delivery.attempts_count === 1 ? "" : "s"}
                                  </p>
                                  <p className="mt-1 text-xs text-[var(--muted)]">
                                    {delivery.formName || "Lead form"}{delivery.pageName ? ` • ${delivery.pageName}` : ""}{delivery.leadName ? ` • ${delivery.leadName}` : ""}
                                  </p>
                                  {delivery.last_error ? (
                                    <p className="mt-2 text-xs text-rose-700">{delivery.last_error}</p>
                                  ) : null}
                                </div>
                                {delivery.state === "failed" ? (
                                  <form action={retryCrmDeliveryAction}>
                                    <input type="hidden" name="deliveryId" value={delivery.id} />
                                    <Button type="submit" size="sm" variant="outline">Retry</Button>
                                  </form>
                                ) : null}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--soft-panel)] px-5 py-6 text-sm text-[var(--muted)]">
                            No recent sync activity yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

          </div>
        </div>
      </div>
    </AppShell>
  );
}
