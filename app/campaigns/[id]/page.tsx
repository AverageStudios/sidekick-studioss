import Link from "next/link";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import {
  AlertTriangle,
  Clock3,
  ExternalLink,
  FileText,
  LayoutTemplate,
  Rocket,
  SquarePen,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CampaignActionSubmitButton } from "@/components/campaign-action-submit-button";
import { FacebookAdPreview } from "@/components/facebook-ad-preview";
import { resolveTemplateCtaLabel } from "@/data/template-taxonomy";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { deleteCampaignAction, pauseCampaignAction, resumeCampaignAction, syncCampaignStatusAction } from "@/app/actions";
import { requireProductAccessUser } from "@/lib/auth";
import { getCampaignBundle, getWorkspaceMetaIntegrationForUser } from "@/lib/data";
import {
  createLaunchStateView,
  evaluateLaunchReadiness,
  getAdTypeLabel,
  getCampaignPreviewDisplayLink,
  getStepDefinition,
  campaignGoalOptions,
} from "@/lib/campaign-launch";
import {
  getCampaignLastSyncedAt,
  getCampaignLifecycleLabel,
  getCampaignLifecycleState,
  getCampaignMetaIdentifiers,
  getCampaignSyncState,
} from "@/lib/campaign-management";
import { resolveMetaPagePreviewIdentity } from "@/lib/meta-page-identity";
import { cn } from "@/lib/utils";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatCurrencyAmount(value: string | null | undefined) {
  const numeric = Number.parseFloat(String(value || "").replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(numeric) || numeric <= 0) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(numeric);
}

function lifecycleTone(state: string) {
  switch (state) {
    case "active":
      return "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]";
    case "in_review":
      return "border-[#dbeafe] bg-[#eff6ff] text-[#1d4ed8]";
    case "paused":
      return "border-[#fed7aa] bg-[#fff7ed] text-[#c2410c]";
    case "archived":
      return "border-[#e2e8f0] bg-[#f8fafc] text-[#475569]";
    case "draft":
      return "border-[#c7d2fe] bg-[#eef2ff] text-[#4f46e5]";
    case "unknown":
    default:
      return "border-[var(--line)] bg-[var(--surface)] text-[var(--muted-strong)]";
  }
}

function InfoRow({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string | null;
}) {
  return (
    <div className="rounded-[20px] bg-[var(--soft-panel)] px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-sm font-medium leading-6 text-[var(--ink)]">{value}</p>
      {detail ? <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{detail}</p> : null}
    </div>
  );
}

function SectionTitle({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description?: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--soft-panel)] text-[var(--brand)]">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div>
        <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{description}</p> : null}
      </div>
    </div>
  );
}

type TimelineItem = {
  title: string;
  detail: string;
  timestamp: string;
};

export default async function CampaignPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const user = await requireProductAccessUser(`/campaigns/${id}`);
  const [bundle, metaIntegration] = await Promise.all([
    getCampaignBundle(user.id, id),
    getWorkspaceMetaIntegrationForUser(user.id),
  ]);

  if (!bundle) {
    notFound();
  }

  const lifecycleState = getCampaignLifecycleState(bundle.campaign);
  const lifecycleLabel = getCampaignLifecycleLabel(bundle.campaign);
  const metaIds = getCampaignMetaIdentifiers(bundle.campaign);
  const redirectTo = `/campaigns/${bundle.campaign.id}`;
  const lastSyncedAt = getCampaignLastSyncedAt(bundle.campaign);
  const syncState = getCampaignSyncState(bundle.campaign);
  const isDraft = bundle.campaign.status === "draft";
  const isPublished = bundle.campaign.status === "published";
  const canPause = lifecycleState === "active";
  const canResume = lifecycleState === "paused";
  const canDelete = true;
  const pageIdentity = resolveMetaPagePreviewIdentity({
    integration: metaIntegration,
    fallbackName: "No Facebook Page selected",
  });

  const launchState = bundle.campaign.launch_state_json || null;
  const launchView = launchState ? createLaunchStateView(launchState) : null;
  const launchIssues = launchState
    ? evaluateLaunchReadiness({
        state: launchState,
        template: bundle.template,
        businessProfile: bundle.businessProfile,
      })
    : [];

  const currentStep = launchState ? getStepDefinition(launchState.stepId) : null;
  const objectiveLabel =
    launchView?.campaignGoal
      ? campaignGoalOptions.find((option) => option.id === launchView.campaignGoal)?.label || launchView.campaignGoal
      : "Not configured";
  const adTypeLabel = getAdTypeLabel(launchView?.adType || bundle.template.defaultAdType || "lead_form");
  const budgetLabel = launchView ? formatCurrencyAmount(launchView.dailyBudget) : "—";

  const destinationSummary = (() => {
    if (!launchView) {
      return {
        label: "Launch state missing",
        value: "Open the editor to restore the saved campaign setup.",
        detail: null as string | null,
      };
    }

    switch (launchView.adType) {
      case "lead_form":
        return {
          label: "Lead form",
          value:
            launchView.leadForm.mode === "existing"
              ? launchView.leadForm.selectedFormName || "Existing Meta form"
              : launchView.leadForm.managedFormName || "Managed lead form",
          detail:
            launchView.leadForm.mode === "existing"
              ? launchView.leadForm.selectedFormId || "No form selected yet"
              : launchView.advanced.privacyPolicyUrl
                ? "Privacy policy connected"
                : "Privacy policy still needs to be added",
        };
      case "landing_page":
        return {
          label: "Destination URL",
          value: launchView.landingPageUrl || "Not configured",
          detail: launchView.trackingPixelId
            ? `Pixel ${launchView.trackingPixelName || launchView.trackingPixelId}`
            : "No pixel selected yet",
        };
      case "call_now":
        return {
          label: "Call destination",
          value: launchView.phoneNumber || "Not configured",
          detail: "Uses the business phone number for call ads.",
        };
      case "messenger_leads":
      case "messenger_engagement":
        return {
          label: "Messenger destination",
          value: launchView.messengerWelcomeMessage || "Messenger is configured",
          detail: launchView.messengerReplyPrompt || "Reply prompt not added yet",
        };
      default:
        return {
          label: "Destination",
          value: "Not configured",
          detail: null,
        };
    }
  })();
  const previewDisplayLink =
    launchState ? getCampaignPreviewDisplayLink(launchState, bundle.template.displayLink || null) : null;

  const timelineItems: Array<TimelineItem | null> = [
    {
      title: "Draft created",
      detail: "This campaign instance was saved in SideKick.",
      timestamp: bundle.campaign.created_at,
    },
    {
      title: "Last edited",
      detail: "Most recent campaign save.",
      timestamp: bundle.campaign.updated_at,
    },
    bundle.campaign.published_at
      ? {
          title: "Published",
          detail: "The campaign was pushed live to Meta.",
          timestamp: bundle.campaign.published_at,
        }
      : null,
    lastSyncedAt
      ? {
          title: "Meta sync",
          detail: syncState === "error" ? "Meta sync needs attention." : "Campaign status refreshed from Meta.",
          timestamp: lastSyncedAt,
        }
      : null,
    bundle.campaign.archived_at
      ? {
          title: "Archived",
          detail: "This campaign was moved out of active views.",
          timestamp: bundle.campaign.archived_at,
        }
      : null,
  ];
  const timelineEntries = timelineItems.filter((item): item is TimelineItem => item !== null);

  const baseDescription =
    isDraft
      ? "Review the setup and jump back into the editor when you're ready to launch."
      : isPublished
        ? "This campaign is live. Inspect setup, sync state, and Meta status below."
        : "Inspect the saved campaign, its launch state, and publishing details.";
  const openInMetaHref = "https://business.facebook.com/adsmanager";

  return (
    <AppShell currentPath="/templates">
      {query.success ? (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {query.success}
        </div>
      ) : null}
      {query.error ? (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {query.error}
        </div>
      ) : null}

      <div className="space-y-8">
        <div className="space-y-4">
          <PageHeader
            badge={bundle.template.name}
            title={bundle.campaign.name}
            description={baseDescription}
            variant="plain"
            actions={
              <>
                {isDraft ? (
                  <>
                    <Button asChild className="h-11 rounded-[18px] px-5">
                      <Link href={`/templates/new?draft=${bundle.campaign.id}`}>
                        Launch Campaign
                        <Rocket className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-11 rounded-[18px] px-5">
                      <Link href={`/templates/new?draft=${bundle.campaign.id}`}>
                        Continue Editing
                        <SquarePen className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="secondary" className="h-11 rounded-[18px] px-5">
                      <Link href={`/templates/new?draft=${bundle.campaign.id}`}>
                        Save Draft
                        <Sparkles className="h-4 w-4" />
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild variant="outline" className="h-11 rounded-[18px] px-5">
                      <a href={openInMetaHref} target="_blank" rel="noreferrer">
                        Open in Meta
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </>
                )}
                {canPause ? (
                  <form action={pauseCampaignAction}>
                    <input type="hidden" name="campaignId" value={bundle.campaign.id} />
                    <input type="hidden" name="redirectTo" value={redirectTo} />
                    <CampaignActionSubmitButton
                      label="Pause"
                      pendingLabel="Pausing..."
                      variant="outline"
                      className="h-11 rounded-[18px] px-5"
                    />
                  </form>
                ) : null}
                {canResume ? (
                  <form action={resumeCampaignAction}>
                    <input type="hidden" name="campaignId" value={bundle.campaign.id} />
                    <input type="hidden" name="redirectTo" value={redirectTo} />
                    <CampaignActionSubmitButton
                      label="Resume"
                      pendingLabel="Resuming..."
                      variant="outline"
                      className="h-11 rounded-[18px] px-5"
                    />
                  </form>
                ) : null}
                {canDelete ? (
                  <form action={deleteCampaignAction}>
                    <input type="hidden" name="campaignId" value={bundle.campaign.id} />
                    <input type="hidden" name="redirectTo" value={redirectTo} />
                    <input type="hidden" name="successRedirectTo" value="/templates" />
                    <CampaignActionSubmitButton
                      label="Delete"
                      pendingLabel="Deleting..."
                      variant="outline"
                      className="h-11 rounded-[18px] border-rose-200 px-5 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                    />
                  </form>
                ) : null}
              </>
            }
          />

          <div className="flex flex-wrap gap-2">
            <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium", lifecycleTone(lifecycleState))}>
              {lifecycleLabel}
            </span>
            <span className="inline-flex items-center rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--muted-strong)]">
              {currentStep ? currentStep.label : "Launch state not saved"}
            </span>
            <span className="inline-flex items-center rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--muted-strong)]">
              {adTypeLabel}
            </span>
            {isDraft ? (
              <span className="inline-flex items-center rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--muted-strong)]">
                Not published yet
              </span>
            ) : null}
            {isPublished ? (
              <span className="inline-flex items-center rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--muted-strong)]">
                Last synced {lastSyncedAt ? formatDateTime(lastSyncedAt) : "—"}
              </span>
            ) : null}
          </div>
        </div>

        {launchIssues.length ? (
          <div className="rounded-[24px] border border-amber-200 bg-amber-50/60 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              Missing items from the editor
            </div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-900">
              {launchIssues.slice(0, 6).map((issue) => (
                <li key={`${issue.code}:${issue.field || ""}`} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-500" />
                  <span>{issue.message}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-2">
          <Card className="p-6 sm:p-7">
            <SectionTitle
              title="Campaign configuration"
              icon={LayoutTemplate}
            />

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <InfoRow label="Campaign name" value={bundle.campaign.name} />
              <InfoRow label="Template" value={bundle.template.name} detail={bundle.template.description} />
              <InfoRow label="Stage" value={currentStep ? currentStep.label : "Launch state not saved"} detail={currentStep?.description || null} />
              <InfoRow label="Campaign goal" value={objectiveLabel} />
              <InfoRow
                label="Audience"
                value={
                  launchView
                    ? `${launchView.targeting.ageMin || "18"}–${launchView.targeting.ageMax || "65"} • ${
                        launchView.targeting.gender === "all"
                          ? "All genders"
                          : launchView.targeting.gender === "male"
                            ? "Men"
                            : "Women"
                      }`
                    : "Not configured"
                }
                detail={
                  launchView
                    ? [
                        launchView.targeting.interests.trim() || null,
                        launchView.targeting.customAudiences.trim() ? `Audiences: ${launchView.targeting.customAudiences.trim()}` : null,
                      ]
                        .filter(Boolean)
                        .join(" • ") || "No interests or custom audiences saved."
                    : null
                }
              />
              <InfoRow
                label="Budget"
                value={budgetLabel === "—" ? "—" : `${budgetLabel} / day`}
                detail={launchView ? "Daily budget from the launch state." : bundle.campaign.ad_copy_json.budget}
              />
              <InfoRow
                label="Target location"
                value={
                  launchView?.targetLocations.length
                    ? launchView.targetLocations.map((location) => location.label).join(", ")
                    : "Not configured"
                }
                detail={
                  launchView?.targetLocations.length
                    ? `${launchView.targetLocations.length} location${launchView.targetLocations.length === 1 ? "" : "s"} configured`
                    : "Add a location in the editor."
                }
              />
              <InfoRow
                label="Destination"
                value={destinationSummary.value}
                detail={destinationSummary.detail}
              />
              <InfoRow
                label="Publish settings"
                value={
                  metaIntegration?.selected.adAccountId
                    ? "Meta ad account selected"
                    : "Meta ad account not selected"
                }
                detail={
                  metaIntegration?.selected.pageId
                    ? `Page: ${pageIdentity.pageName}`
                    : "No Facebook Page selected yet."
                }
              />
            </div>
          </Card>

          <Card className="p-6 sm:p-7">
            <SectionTitle
              title="Creative summary"
              icon={FileText}
            />

            <div className="mt-6 space-y-5">
                <FacebookAdPreview
                  template={bundle.template}
                  pageName={pageIdentity.pageName}
                  pageAvatarUrl={pageIdentity.pageAvatarUrl}
                  primaryText={bundle.campaign.ad_copy_json.primary || bundle.campaign.business_description}
                  headline={bundle.campaign.headline || bundle.campaign.ad_copy_json.headlines[0] || bundle.campaign.name}
                  description={
                    bundle.campaign.ad_copy_json.descriptions[0] ||
                    bundle.campaign.subheadline ||
                    bundle.template.description
                  }
                  displayLink={previewDisplayLink}
                  ctaLabel={bundle.campaign.cta_text || resolveTemplateCtaLabel(bundle.template, "Learn More")}
                  imageUrl={bundle.template.previewImage || null}
                  placeholderValues={launchState?.placeholders?.values || {}}
                compact
                showMetaBar={false}
                showReactionsBar={false}
                showActionsRow={false}
                interactiveControls={false}
                className="border-0 bg-transparent p-0 shadow-none"
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[20px] bg-[var(--soft-panel)] px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Primary ad text</p>
                  <p className="mt-2 text-sm leading-7 text-[var(--muted-strong)]">
                    {bundle.campaign.ad_copy_json.primary || "No primary ad text saved yet."}
                  </p>
                </div>
                <div className="rounded-[20px] bg-[var(--soft-panel)] px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Headline options</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {bundle.campaign.ad_copy_json.headlines.length ? (
                      bundle.campaign.ad_copy_json.headlines.map((headline) => (
                        <span key={headline} className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs text-[var(--muted-strong)]">
                          {headline}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-[var(--muted)]">No headline options saved yet.</span>
                    )}
                  </div>
                </div>
                <div className="rounded-[20px] bg-[var(--soft-panel)] px-4 py-4 sm:col-span-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Description options</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {bundle.campaign.ad_copy_json.descriptions.length ? (
                      bundle.campaign.ad_copy_json.descriptions.map((description) => (
                        <span key={description} className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs text-[var(--muted-strong)]">
                          {description}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-[var(--muted)]">No description options saved yet.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card className="p-6 sm:p-7">
            <SectionTitle
              title="Publishing status"
              icon={Rocket}
            />

            <div className="mt-6 space-y-4">
              <div className="rounded-[24px] border border-[var(--line)] bg-[var(--soft-panel)] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink)]">
                      {isDraft ? "Draft saved" : lifecycleLabel}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                      {isDraft
                        ? "This campaign has not been published yet."
                        : "This campaign has already been pushed live and can be paused, resumed, or deleted."}
                  </p>
                </div>
                <span className={cn("rounded-full border px-3 py-1 text-xs font-medium", lifecycleTone(lifecycleState))}>
                  {lifecycleLabel}
                </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <InfoRow
                  label="External status"
                  value={bundle.campaign.external_publish_status || "Not started"}
                  detail={bundle.campaign.meta_effective_status ? `Meta effective: ${bundle.campaign.meta_effective_status}` : null}
                />
                <InfoRow
                  label="Sync state"
                  value={syncState === "synced" ? "Synced" : syncState === "stale" ? "Stale" : syncState === "error" ? "Sync issue" : "Not live"}
                  detail={lastSyncedAt ? `Last synced ${formatDateTime(lastSyncedAt)}` : "No Meta sync yet."}
                />
                <InfoRow
                  label="Published"
                  value={formatDateTime(bundle.campaign.published_at)}
                  detail={isDraft ? "Not published yet." : null}
                />
                {bundle.campaign.archived_at ? (
                  <InfoRow
                    label="Archived"
                    value={formatDateTime(bundle.campaign.archived_at)}
                    detail="Moved out of active views."
                  />
                ) : null}
              </div>

              {isPublished ? (
                <form action={syncCampaignStatusAction}>
                  <input type="hidden" name="campaignId" value={bundle.campaign.id} />
                  <input type="hidden" name="redirectTo" value={redirectTo} />
                  <CampaignActionSubmitButton
                    label="Refresh Meta status"
                    pendingLabel="Refreshing..."
                    variant="outline"
                    className="rounded-[18px] px-5"
                  />
                </form>
              ) : null}

              {canPause || canResume ? (
                <div className="flex flex-wrap gap-3">
                  {canPause ? (
                    <form action={pauseCampaignAction}>
                      <input type="hidden" name="campaignId" value={bundle.campaign.id} />
                      <input type="hidden" name="redirectTo" value={redirectTo} />
                      <CampaignActionSubmitButton
                        label="Pause campaign"
                        pendingLabel="Pausing..."
                        variant="outline"
                        className="rounded-[18px] px-5"
                      />
                    </form>
                  ) : null}
                  {canResume ? (
                    <form action={resumeCampaignAction}>
                      <input type="hidden" name="campaignId" value={bundle.campaign.id} />
                      <input type="hidden" name="redirectTo" value={redirectTo} />
                      <CampaignActionSubmitButton
                        label="Resume campaign"
                        pendingLabel="Resuming..."
                        variant="primary"
                        className="rounded-[18px] px-5"
                      />
                    </form>
                  ) : null}
                </div>
              ) : null}
            </div>
          </Card>

          <Card className="p-6 sm:p-7">
            <SectionTitle
              title="Activity / timeline"
              icon={Clock3}
            />

            <div className="mt-6 space-y-4">
              {timelineEntries.map((item) => (
                <div key={`${item.title}-${item.timestamp || item.detail}`} className="flex gap-4 rounded-[22px] border border-[var(--line)] bg-white p-4">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--soft-panel)] text-[var(--brand)]">
                    <Clock3 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-[var(--ink)]">{item.title}</p>
                      <span className="text-xs text-[var(--muted)]">{formatDateTime(item.timestamp)}</span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{item.detail}</p>
                  </div>
                </div>
              ))}
              {!timelineEntries.length ? (
                <div className="rounded-[22px] border border-dashed border-[var(--line)] px-5 py-8 text-center text-sm text-[var(--muted)]">
                  No timeline events are available yet.
                </div>
              ) : null}
            </div>
          </Card>
        </div>

        <Card className="p-6 sm:p-7">
          <SectionTitle
            title="Technical details"
            description="Identifiers for debugging or Meta support."
            icon={SquarePen}
          />

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <InfoRow label="Campaign ID" value={bundle.campaign.id} />
            <InfoRow label="Template ID" value={bundle.template.id} />
            <InfoRow label="Campaign slug" value={bundle.campaign.slug} />
            <InfoRow label="Workspace ID" value={bundle.campaign.workspace_id || "—"} />
            <InfoRow label="Meta campaign ID" value={metaIds.campaignId || "Not saved"} />
            <InfoRow label="Meta ad set ID" value={metaIds.adSetId || "Not saved"} />
            <InfoRow label="Meta ad ID" value={metaIds.adId || "Not saved"} />
            <InfoRow label="Meta lead form ID" value={metaIds.leadFormId || "Not saved"} />
            <InfoRow label="Last edited" value={formatDateTime(bundle.campaign.updated_at)} />
            <InfoRow label="Published date" value={formatDateTime(bundle.campaign.published_at)} />
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
