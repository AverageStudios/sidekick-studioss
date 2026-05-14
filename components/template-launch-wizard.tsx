"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Globe,
  MapPin,
  MessageCircle,
  PhoneCall,
  Rocket,
  Sparkles,
  Target,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FacebookAdPreview } from "@/components/facebook-ad-preview";
import { resolveMetaPagePreviewIdentity } from "@/lib/meta-page-identity";
import { cn } from "@/lib/utils";
import {
  createInitialCampaignLaunchState,
  evaluateLaunchReadiness,
  getAdTypeLabel,
  getCampaignGoalForAdType,
  getNextWizardStep,
  getPreviousWizardStep,
  getStepDefinition,
  getTemplatePlaceholderFields,
  getTemplateSetupValuesFromLaunchState,
  getVisibleWizardSteps,
  locationTargetingModeOptions,
  normalizeCampaignLaunchState,
  parseDailyBudgetAmount,
  validateWizardStep,
} from "@/lib/campaign-launch";
import { supportedIndustries } from "@/data/template-taxonomy";
import { createCampaignBlueprint } from "@/lib/template-engine";
import {
  BusinessProfile,
  CampaignBundle,
  CampaignGoal,
  CampaignLaunchLocation,
  CampaignLaunchState,
  CampaignLeadFormField,
  CampaignLeadFormMode,
  CampaignLocationScope,
  CampaignPublishMode,
  CampaignWizardStepId,
  MetaLocationTargeting,
  TemplateSeed,
} from "@/types";

type SaveState = "idle" | "saving" | "saved" | "error";

type WizardMetaIntegration = {
  connection: {
    status: string;
    token_expires_at: string | null;
    last_synced_at: string | null;
  } | null;
  tokenAvailable: boolean;
  selected: {
    adAccountId: string | null;
    pageId: string | null;
    pixelId: string | null;
    leadFormId: string | null;
    instagramActorId: string | null;
  };
  assets: {
    adAccounts: Array<{ asset_id: string; name: string | null }>;
    pages: Array<{ asset_id: string; name: string | null; metadata_json: Record<string, unknown> }>;
    pixels: Array<{ asset_id: string; name: string | null }>;
    leadForms: Array<{ asset_id: string; name: string | null }>;
    instagramActors: Array<{ asset_id: string; name: string | null }>;
  };
} | null;

type LaunchIssue = {
  code: string;
  message: string;
  field?: string;
  scope?: "draft" | "live" | "both";
};

type LaunchPreflightResponse = {
  draftId?: string;
  mode: CampaignPublishMode;
  blockingIssues: LaunchIssue[];
  warnings: LaunchIssue[];
  resolvedAssets: {
    adAccount: { id: string; name: string } | null;
    page: { id: string; name: string } | null;
    pixel: { id: string; name: string } | null;
    leadForm: { id: string; name: string; mode: CampaignLeadFormMode } | null;
    instagramActor: { id: string; name: string } | null;
  };
  normalizedPayloadSummary: {
    objective: CampaignGoal;
    campaign: { name: string };
    adSet: { dailyBudgetCents: number };
    creative: { destinationUrl: string; leadFormMode: CampaignLeadFormMode };
  };
};

type LocationSuggestion = {
  id: string;
  label: string;
  scope: CampaignLocationScope;
  lat?: number;
  lon?: number;
  countryCode?: string;
  radiusAllowed?: boolean;
  distanceUnit?: "mile" | "kilometer";
  source?: "meta" | "geocoder" | "manual";
  metaLocation: MetaLocationTargeting;
};

const adTypeOptions = [
  {
    id: "lead_form",
    label: "Lead Form",
    description: "Capture leads directly inside Facebook with a connected or managed form.",
    icon: FileText,
  },
  {
    id: "landing_page",
    label: "Landing Page",
    description: "Send traffic to a website and track delivery with the selected Meta Pixel.",
    icon: Globe,
  },
  {
    id: "call_now",
    label: "Call Now",
    description: "Drive calls directly from the ad using the campaign phone number.",
    icon: PhoneCall,
  },
  {
    id: "messenger_leads",
    label: "Messenger (Leads)",
    description: "Start Messenger conversations designed to capture lead intent.",
    icon: MessageCircle,
  },
  {
    id: "messenger_engagement",
    label: "Messenger (Engagement)",
    description: "Start Messenger conversations optimized for response and engagement.",
    icon: MessageCircle,
  },
] as const;

const leadFormFieldOptions: Array<{
  id: CampaignLeadFormField;
  label: string;
  hint: string;
}> = [
  { id: "FULL_NAME", label: "Full name", hint: "Best for personalized follow-up." },
  { id: "EMAIL", label: "Email", hint: "Required for email follow-up." },
  { id: "PHONE", label: "Phone", hint: "Required for call or SMS follow-up." },
];

const locationScopeOptions: Array<{ value: CampaignLocationScope; label: string }> = [
  { value: "world", label: "Worldwide" },
  { value: "country", label: "Country" },
  { value: "state", label: "State / Region" },
  { value: "city", label: "City" },
  { value: "zip", label: "ZIP / Postal code" },
  { value: "neighborhood", label: "Neighborhood" },
  { value: "address", label: "Address" },
];

function SectionCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("rounded-[28px] border-[var(--line)] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]", className)}>
      <div className="mb-5">
        <h3 className="text-[1.15rem] font-semibold tracking-[-0.03em] text-[var(--ink)]">{title}</h3>
        {description ? <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{description}</p> : null}
      </div>
      {children}
    </Card>
  );
}

function IssueList({
  title,
  issues,
  tone = "rose",
}: {
  title: string;
  issues: Array<{ code?: string; message: string }>;
  tone?: "rose" | "amber";
}) {
  if (!issues.length) return null;
  const toneClasses =
    tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : "border-rose-200 bg-rose-50 text-rose-700";

  return (
    <div className={cn("rounded-2xl border px-4 py-4", toneClasses)}>
      <p className="text-sm font-semibold">{title}</p>
      <ul className="mt-2 space-y-2 text-sm leading-6">
        {issues.map((issue) => (
          <li key={`${issue.code || issue.message}`}>• {issue.message}</li>
        ))}
      </ul>
    </div>
  );
}

function StepRail({
  steps,
  currentStepId,
  onStepClick,
}: {
  steps: ReturnType<typeof getVisibleWizardSteps>;
  currentStepId: CampaignWizardStepId;
  onStepClick: (stepId: CampaignWizardStepId) => void;
}) {
  const currentIndex = steps.findIndex((step) => step.id === currentStepId);

  return (
    <div className="rounded-[28px] border border-[var(--line)] bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <div className="space-y-2">
        {steps.map((step, index) => {
          const active = step.id === currentStepId;
          const complete = index < currentIndex;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepClick(step.id)}
              className={cn(
                "flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition-colors",
                active
                  ? "bg-[rgba(109,94,248,0.08)]"
                  : "hover:bg-[rgba(15,23,42,0.03)]",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  active
                    ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                    : complete
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-[var(--line)] bg-white text-[var(--muted)]",
                )}
              >
                {complete ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-[var(--ink)]">{step.label}</span>
                <span className="mt-0.5 block text-xs leading-5 text-[var(--muted)]">{step.description}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

async function saveCampaignDraft({
  draftId,
  templateSlug,
  state,
}: {
  draftId?: string | null;
  templateSlug: string;
  state: CampaignLaunchState;
}) {
  const response = await fetch("/api/campaign-drafts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      draftId,
      templateSlug,
      state,
    }),
  });

  const payload = (await response.json().catch(() => null)) as { draftId?: string; error?: string } | null;
  return { response, payload };
}

function buildInitialState({
  templates,
  businessProfile,
  initialDraftBundle,
  initialTemplateSlug,
  integrationDefaults,
}: {
  templates: TemplateSeed[];
  businessProfile: BusinessProfile | null;
  initialDraftBundle: CampaignBundle | null;
  initialTemplateSlug?: string | null;
  integrationDefaults: CampaignLaunchState["integrationSelections"];
}) {
  const initialTemplate =
    initialDraftBundle?.template ||
    templates.find((template) => template.slug === initialTemplateSlug) ||
    null;

  const baseState = initialDraftBundle?.campaign.launch_state_json
    ? normalizeCampaignLaunchState(
        initialDraftBundle.campaign.launch_state_json,
        initialDraftBundle.template,
        businessProfile,
      )
    : createInitialCampaignLaunchState({
        template: initialTemplate,
        businessProfile,
        partial: {
          selection: {
            industry: initialTemplate?.industry || "",
            category: initialTemplate?.category || "",
            offerType: initialTemplate?.offerType || "",
            templateSlug: initialTemplate?.slug || "",
            adType: initialTemplate?.defaultAdType || "lead_form",
          },
          integrationSelections: integrationDefaults,
        },
      });

  return normalizeCampaignLaunchState(
    {
      ...baseState,
      integrationSelections: {
        ...baseState.integrationSelections,
        ...integrationDefaults,
      },
      adTypeConfig: {
        ...baseState.adTypeConfig,
        leadForm: {
          ...baseState.adTypeConfig.leadForm,
          mode:
            integrationDefaults.leadFormId && !baseState.adTypeConfig.leadForm.selectedFormId
              ? "existing"
              : baseState.adTypeConfig.leadForm.mode,
          selectedFormId:
            baseState.adTypeConfig.leadForm.selectedFormId || integrationDefaults.leadFormId || "",
        },
        landingPage: {
          ...baseState.adTypeConfig.landingPage,
          pixelId: baseState.adTypeConfig.landingPage.pixelId || integrationDefaults.pixelId || "",
        },
      },
    },
    initialTemplate || templates[0],
    businessProfile,
  );
}

function locationScopeLabel(scope: CampaignLocationScope) {
  return locationScopeOptions.find((option) => option.value === scope)?.label || "Location";
}

export function TemplateLaunchWizard({
  templates,
  businessProfile,
  initialDraftBundle,
  initialTemplateSlug,
  metaIntegration,
  connectNextUrl,
}: {
  templates: TemplateSeed[];
  businessProfile: BusinessProfile | null;
  initialDraftBundle: CampaignBundle | null;
  initialTemplateSlug?: string | null;
  metaIntegration: WizardMetaIntegration;
  connectNextUrl: string;
}) {
  const router = useRouter();
  const integrationDefaults = {
    adAccountId: metaIntegration?.selected.adAccountId || "",
    pageId: metaIntegration?.selected.pageId || "",
    pixelId: metaIntegration?.selected.pixelId || "",
    leadFormId: metaIntegration?.selected.leadFormId || "",
    instagramActorId: metaIntegration?.selected.instagramActorId || "",
  };

  const [launchState, setLaunchState] = useState<CampaignLaunchState>(() =>
    buildInitialState({
      templates,
      businessProfile,
      initialDraftBundle,
      initialTemplateSlug,
      integrationDefaults,
    }),
  );
  const [draftId, setDraftId] = useState<string | null>(initialDraftBundle?.campaign.id || null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [currentIssues, setCurrentIssues] = useState<LaunchIssue[]>([]);
  const [preflight, setPreflight] = useState<LaunchPreflightResponse | null>(null);
  const [preflightMode, setPreflightMode] = useState<CampaignPublishMode>("draft");
  const [preflightError, setPreflightError] = useState<string | null>(null);
  const [isPreflighting, setIsPreflighting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
  const [pendingLocation, setPendingLocation] = useState("");
  const deferredLocationQuery = useDeferredValue(pendingLocation);
  const [locationScope, setLocationScope] = useState<CampaignLocationScope>("city");
  const [locationMode, setLocationMode] = useState<CampaignLaunchLocation["targetingMode"]>("home");
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [locationSearchError, setLocationSearchError] = useState<string | null>(null);
  const [isSearchingLocations, setIsSearchingLocations] = useState(false);

  useEffect(() => {
    function refreshMetaState() {
      router.refresh();
    }

    window.addEventListener("pageshow", refreshMetaState);
    window.addEventListener("focus", refreshMetaState);
    return () => {
      window.removeEventListener("pageshow", refreshMetaState);
      window.removeEventListener("focus", refreshMetaState);
    };
  }, [router]);

  useEffect(() => {
    if (launchState.selection.templateSlug) return;
    const template = templates.find((item) => item.industry === launchState.selection.industry);
    if (!template) return;
    setLaunchState((current) =>
      normalizeCampaignLaunchState(
        {
          ...current,
          selection: {
            ...current.selection,
            templateSlug: template.slug,
            category: template.category,
            offerType: template.offerType,
          },
        },
        template,
        businessProfile,
      ),
    );
  }, [businessProfile, launchState.selection.industry, launchState.selection.templateSlug, templates]);

  useEffect(() => {
    if (deferredLocationQuery.trim().length < 2 || locationScope === "world") {
      setLocationSuggestions([]);
      setLocationSearchError(null);
      return;
    }

    let cancelled = false;
    setIsSearchingLocations(true);
    fetch(`/api/location-search?q=${encodeURIComponent(deferredLocationQuery.trim())}`)
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as
          | { suggestions?: LocationSuggestion[]; error?: string }
          | null;
        if (cancelled) return;
        if (!response.ok) {
          setLocationSearchError(payload?.error || "Location search failed.");
          setLocationSuggestions([]);
          return;
        }
        setLocationSearchError(payload?.error || null);
        setLocationSuggestions((payload?.suggestions || []).filter((item) => item.scope === locationScope));
      })
      .catch(() => {
        if (!cancelled) {
          setLocationSearchError("Location search failed.");
          setLocationSuggestions([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsSearchingLocations(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [deferredLocationQuery, locationScope]);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.slug === launchState.selection.templateSlug) || null,
    [launchState.selection.templateSlug, templates],
  );

  const visibleSteps = useMemo(
    () => getVisibleWizardSteps(launchState.selection.adType),
    [launchState.selection.adType],
  );
  const currentStepDefinition = getStepDefinition(launchState.stepId);
  const currentStepIndex = visibleSteps.findIndex((step) => step.id === launchState.stepId);
  const filteredTemplates = useMemo(
    () =>
      launchState.selection.industry
        ? templates.filter((template) => template.industry === launchState.selection.industry)
        : templates,
    [launchState.selection.industry, templates],
  );

  const placeholderFields = selectedTemplate ? getTemplatePlaceholderFields(selectedTemplate) : [];
  const setupValues = selectedTemplate
    ? getTemplateSetupValuesFromLaunchState(selectedTemplate, launchState, businessProfile)
    : null;
  const previewBlueprint =
    selectedTemplate && setupValues
      ? createCampaignBlueprint(selectedTemplate, setupValues, {
          logoUrl: businessProfile?.logo_url || null,
          beforeImageUrls: [],
          afterImageUrls: [],
        })
      : null;
  const pagePreviewIdentity = resolveMetaPagePreviewIdentity({
    integration: metaIntegration,
    preferredPageId: launchState.integrationSelections.pageId,
    fallbackName: businessProfile?.business_name || "Select a Facebook Page",
  });

  const validation = validateWizardStep({
    stepId: launchState.stepId,
    state: launchState,
    template: selectedTemplate,
    businessProfile,
  });
  const localReadinessIssues = evaluateLaunchReadiness({
    state: launchState,
    template: selectedTemplate,
    businessProfile,
  });

  const metaConnected = Boolean(
    metaIntegration?.connection &&
      metaIntegration.tokenAvailable &&
      metaIntegration.connection.status === "connected",
  );
  const metaConnectHref = `/api/meta/connect?next=${encodeURIComponent(connectNextUrl)}${
    launchState.selection.adType === "lead_form" ? "&scopeSet=lead_forms" : ""
  }`;

  function updateLaunchState(updater: (current: CampaignLaunchState) => CampaignLaunchState) {
    setLaunchState((current) => updater(current));
    setCurrentIssues([]);
    setPreflight(null);
    setPreflightError(null);
    setPublishError(null);
    setPublishSuccess(null);
  }

  function applyTemplate(template: TemplateSeed) {
    updateLaunchState((current) =>
      normalizeCampaignLaunchState(
        {
          ...current,
          selection: {
            ...current.selection,
            industry: template.industry,
            category: template.category,
            offerType: template.offerType,
            templateSlug: template.slug,
            adType: current.selection.adType || template.defaultAdType || "lead_form",
          },
          placeholders: {
            values: {
              ...createInitialCampaignLaunchState({ template, businessProfile }).placeholders.values,
              ...current.placeholders.values,
            },
          },
          review: {
            ...current.review,
            ctaText: current.review.ctaText || template.ctaDefault,
          },
        },
        template,
        businessProfile,
      ),
    );
  }

  function applyAdType(adType: CampaignLaunchState["selection"]["adType"]) {
    updateLaunchState((current) =>
      normalizeCampaignLaunchState(
        {
          ...current,
          stepId: "budget",
          selection: {
            ...current.selection,
            adType,
          },
          campaign: {
            ...current.campaign,
            objective: getCampaignGoalForAdType(adType),
          },
        },
        selectedTemplate || templates[0],
        businessProfile,
      ),
    );
  }

  async function persistDraft(nextState = launchState) {
    if (!selectedTemplate) return null;
    setSaveState("saving");
    setSaveError(null);
    const { response, payload } = await saveCampaignDraft({
      draftId,
      templateSlug: selectedTemplate.slug,
      state: nextState,
    });
    if (!response.ok || payload?.error || !payload?.draftId) {
      setSaveState("error");
      setSaveError(payload?.error || "Draft could not be saved.");
      return null;
    }
    setDraftId(payload.draftId);
    setSaveState("saved");
    setTimeout(() => {
      setSaveState((current) => (current === "saved" ? "idle" : current));
    }, 1400);
    return payload.draftId;
  }

  async function handleContinue() {
    if (!validation.isValid) {
      setCurrentIssues(validation.issues);
      return;
    }

    const nextStepId = getNextWizardStep(launchState.selection.adType, launchState.stepId);
    const nextState = normalizeCampaignLaunchState(
      {
        ...launchState,
        stepId: nextStepId,
      },
      selectedTemplate || templates[0],
      businessProfile,
    );
    updateLaunchState(() => nextState);
    if (selectedTemplate) {
      await persistDraft(nextState);
    }
  }

  function handleBack() {
    const previousStepId = getPreviousWizardStep(launchState.selection.adType, launchState.stepId);
    updateLaunchState((current) =>
      normalizeCampaignLaunchState(
        {
          ...current,
          stepId: previousStepId,
        },
        selectedTemplate || templates[0],
        businessProfile,
      ),
    );
  }

  function addLocationFromSuggestion(suggestion: LocationSuggestion) {
    const nextLocation: CampaignLaunchLocation = {
      id: suggestion.id,
      label: suggestion.label,
      radius: suggestion.radiusAllowed === false ? "0" : "10",
      radiusAllowed: suggestion.radiusAllowed ?? true,
      distanceUnit: suggestion.distanceUnit || "mile",
      targetingMode: locationMode,
      scope: suggestion.scope,
      lat: suggestion.lat,
      lon: suggestion.lon,
      countryCode: suggestion.countryCode,
      metaLocation: suggestion.metaLocation,
    };

    updateLaunchState((current) =>
      normalizeCampaignLaunchState(
        {
          ...current,
          targeting: {
            ...current.targeting,
            locations: [...current.targeting.locations, nextLocation],
          },
        },
        selectedTemplate || templates[0],
        businessProfile,
      ),
    );
    setPendingLocation("");
    setLocationSuggestions([]);
    setLocationSearchError(null);
  }

  function addManualLocation() {
    if (!pendingLocation.trim()) return;
    const manualLocation: CampaignLaunchLocation = {
      id: `manual-${Date.now()}`,
      label: pendingLocation.trim(),
      radius: locationScope === "world" ? "0" : "10",
      radiusAllowed: !["world", "country", "state"].includes(locationScope),
      distanceUnit: "mile",
      targetingMode: locationMode,
      scope: locationScope,
      metaLocation: {
        classification:
          locationScope === "country"
            ? "country"
            : locationScope === "state"
              ? "region"
              : locationScope === "city"
                ? "city"
                : locationScope === "zip"
                  ? "zip"
                  : locationScope === "neighborhood"
                    ? "neighborhood"
                    : locationScope === "world"
                      ? "world"
                      : "address",
        name: pendingLocation.trim(),
        addressString: pendingLocation.trim(),
      },
    };

    updateLaunchState((current) =>
      normalizeCampaignLaunchState(
        {
          ...current,
          targeting: {
            ...current.targeting,
            locations:
              locationScope === "world"
                ? [manualLocation]
                : [...current.targeting.locations.filter((item) => item.scope !== "world"), manualLocation],
          },
        },
        selectedTemplate || templates[0],
        businessProfile,
      ),
    );
    setPendingLocation("");
    setLocationSuggestions([]);
  }

  function removeLocation(locationId: string) {
    updateLaunchState((current) =>
      normalizeCampaignLaunchState(
        {
          ...current,
          targeting: {
            ...current.targeting,
            locations: current.targeting.locations.filter((location) => location.id !== locationId),
          },
        },
        selectedTemplate || templates[0],
        businessProfile,
      ),
    );
  }

  async function runLaunchPreflight(mode: CampaignPublishMode) {
    if (!selectedTemplate) {
      setPreflightError("Select a template before launch.");
      return null;
    }

    setIsPreflighting(true);
    setPreflightError(null);
    setPreflightMode(mode);
    const response = await fetch("/api/meta/preflight", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        campaignId: draftId,
        templateSlug: selectedTemplate.slug,
        state: launchState,
        mode,
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | (LaunchPreflightResponse & { error?: string })
      | { error?: string }
      | null;

    setIsPreflighting(false);
    if (!response.ok || !payload || ("error" in payload && payload.error && !("blockingIssues" in payload))) {
      setPreflight(null);
      setPreflightError(payload?.error || "Launch readiness could not be checked.");
      return null;
    }

    const readyPayload = payload as LaunchPreflightResponse;
    setDraftId(readyPayload.draftId || draftId);
    setPreflight(readyPayload);
    if (readyPayload.blockingIssues.length) {
      setPreflightError("Preflight found blocking issues. Resolve them before publishing.");
    }
    return readyPayload;
  }

  async function handleLaunch(mode: CampaignPublishMode) {
    if (!selectedTemplate) {
      setPublishError("Select a template before launch.");
      return;
    }

    const localIssues = evaluateLaunchReadiness({
      state: launchState,
      template: selectedTemplate,
      businessProfile,
    });
    if (localIssues.length) {
      setCurrentIssues(localIssues);
      setPublishError("Resolve the wizard issues before launch.");
      return;
    }

    const ensuredDraftId = (await persistDraft()) || draftId;
    if (!ensuredDraftId) {
      setPublishError("Create a campaign draft before launch.");
      return;
    }

    const preflightResult = await runLaunchPreflight(mode);
    if (!preflightResult || preflightResult.blockingIssues.length) {
      return;
    }

    setIsPublishing(true);
    setPublishError(null);
    setPublishSuccess(null);

    const response = await fetch("/api/meta/publish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        campaignId: ensuredDraftId,
        templateSlug: selectedTemplate.slug,
        state: launchState,
        mode,
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { error?: string; preflight?: LaunchPreflightResponse }
      | null;

    setIsPublishing(false);
    if (!response.ok) {
      if (payload?.preflight) {
        setPreflight(payload.preflight);
      }
      setPublishError(payload?.error || "Campaign launch failed.");
      return;
    }

    setPublishSuccess(mode === "live" ? "Campaign launched to Meta." : "Campaign draft pushed to Meta.");
    router.refresh();
  }

  function renderStepContent() {
    switch (launchState.stepId) {
      case "industry":
        return (
          <SectionCard
            title="Select Industry"
            description="Start with the business category so template filtering and campaign defaults stay consistent."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {supportedIndustries.map((industry) => {
                const active = launchState.selection.industry === industry;
                return (
                  <button
                    key={industry}
                    type="button"
                    onClick={() =>
                      updateLaunchState((current) =>
                        normalizeCampaignLaunchState(
                          {
                            ...current,
                            selection: {
                              ...current.selection,
                              industry,
                              category: industry,
                            },
                          },
                          selectedTemplate || templates[0],
                          businessProfile,
                        ),
                      )
                    }
                    className={cn(
                      "rounded-[24px] border px-4 py-4 text-left transition",
                      active
                        ? "border-[var(--brand)] bg-[rgba(109,94,248,0.08)]"
                        : "border-[var(--line)] bg-white hover:border-[rgba(109,94,248,0.3)]",
                    )}
                  >
                    <p className="text-sm font-semibold text-[var(--ink)]">{industry}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Filter templates and campaign defaults for this industry.
                    </p>
                  </button>
                );
              })}
            </div>
          </SectionCard>
        );
      case "template":
        return (
          <SectionCard
            title="Select Template"
            description="Choose the creative system the campaign will use. Placeholders are generated from the selected template."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredTemplates.map((template) => {
                const active = launchState.selection.templateSlug === template.slug;
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => applyTemplate(template)}
                    className={cn(
                      "overflow-hidden rounded-[24px] border text-left transition",
                      active
                        ? "border-[var(--brand)] shadow-[0_18px_40px_rgba(109,94,248,0.12)]"
                        : "border-[var(--line)] hover:border-[rgba(109,94,248,0.3)]",
                    )}
                  >
                    <div className="aspect-[1.3/1] overflow-hidden bg-[#f3f5f8]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={template.previewImage}
                        alt={template.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-base font-semibold text-[var(--ink)]">{template.name}</p>
                        <Badge className="border-[var(--line)] bg-white text-[var(--muted-strong)]">{template.offerType}</Badge>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{template.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </SectionCard>
        );
      case "ad-type":
        return (
          <SectionCard
            title="Pick Ad Type"
            description="This controls the rest of the step flow, validation rules, and Meta publish preparation."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              {adTypeOptions
                .filter((option) =>
                  selectedTemplate?.supportedAdTypes?.length
                    ? selectedTemplate.supportedAdTypes.includes(option.id)
                    : true,
                )
                .map((option) => {
                  const Icon = option.icon;
                  const active = launchState.selection.adType === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => applyAdType(option.id)}
                      className={cn(
                        "rounded-[24px] border px-5 py-5 text-left transition",
                        active
                          ? "border-[var(--brand)] bg-[rgba(109,94,248,0.08)]"
                          : "border-[var(--line)] bg-white hover:border-[rgba(109,94,248,0.3)]",
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(109,94,248,0.1)] text-[var(--brand)]">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-base font-semibold text-[var(--ink)]">{option.label}</span>
                          <span className="mt-1 block text-sm leading-6 text-[var(--muted)]">{option.description}</span>
                        </span>
                      </div>
                    </button>
                  );
                })}
            </div>
          </SectionCard>
        );
      case "budget":
        return (
          <SectionCard
            title="Set Budget"
            description="Use a clean daily budget value. This is the primary budget input used for preflight and publish."
          >
            <div className="max-w-md space-y-3">
              <label className="block text-sm font-medium text-[var(--ink)]">Daily budget</label>
              <Input
                value={launchState.campaign.dailyBudget}
                onChange={(event) =>
                  updateLaunchState((current) => ({
                    ...current,
                    campaign: {
                      ...current.campaign,
                      dailyBudget: event.target.value,
                    },
                  }))
                }
                placeholder="25"
              />
              <p className="text-sm text-[var(--muted)]">
                Meta publish uses this as the ad set daily budget.
              </p>
            </div>
          </SectionCard>
        );
      case "location":
        return (
          <SectionCard
            title="Target Location"
            description="Use the no-map flow: search Meta locations when possible, or add a manual fallback cleanly."
          >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_11rem_14rem]">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--ink)]">Location</label>
                <Input
                  value={pendingLocation}
                  onChange={(event) => setPendingLocation(event.target.value)}
                  placeholder={locationScope === "world" ? "Worldwide" : "Search a city, state, ZIP, or address"}
                  disabled={locationScope === "world"}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--ink)]">Scope</label>
                <select
                  value={locationScope}
                  onChange={(event) => setLocationScope(event.target.value as CampaignLocationScope)}
                  className="h-11 w-full rounded-[16px] border border-[var(--line)] bg-white px-3 text-sm text-[var(--ink)]"
                >
                  {locationScopeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--ink)]">Targeting mode</label>
                <select
                  value={locationMode}
                  onChange={(event) =>
                    setLocationMode(event.target.value as CampaignLaunchLocation["targetingMode"])
                  }
                  className="h-11 w-full rounded-[16px] border border-[var(--line)] bg-white px-3 text-sm text-[var(--ink)]"
                >
                  {locationTargetingModeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" onClick={addManualLocation} variant="outline">
                Add location
              </Button>
              {isSearchingLocations ? <p className="text-sm text-[var(--muted)]">Searching Meta locations…</p> : null}
            </div>

            {locationSearchError ? <p className="mt-3 text-sm text-rose-600">{locationSearchError}</p> : null}
            {locationSuggestions.length ? (
              <div className="mt-4 grid gap-2">
                {locationSuggestions.slice(0, 6).map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    onClick={() => addLocationFromSuggestion(suggestion)}
                    className="flex items-center justify-between rounded-2xl border border-[var(--line)] bg-[rgba(15,23,42,0.02)] px-4 py-3 text-left hover:border-[rgba(109,94,248,0.3)]"
                  >
                    <span>
                      <span className="block text-sm font-medium text-[var(--ink)]">{suggestion.label}</span>
                      <span className="block text-xs text-[var(--muted)]">
                        {locationScopeLabel(suggestion.scope)} {suggestion.source ? `• ${suggestion.source}` : ""}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-[var(--muted)]" />
                  </button>
                ))}
              </div>
            ) : null}

            <div className="mt-5 space-y-3">
              {launchState.targeting.locations.map((location) => (
                <div
                  key={location.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--ink)]">{location.label}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {locationScopeLabel(location.scope || "city")} •{" "}
                      {locationTargetingModeOptions.find((item) => item.value === location.targetingMode)?.label}
                    </p>
                  </div>
                  <Button type="button" variant="outline" onClick={() => removeLocation(location.id)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </SectionCard>
        );
      case "tracking-pixel":
        return (
          <SectionCard
            title="Tracking Pixel"
            description="Landing page campaigns need a selected Meta Pixel before launch."
          >
            <select
              value={launchState.integrationSelections.pixelId}
              onChange={(event) =>
                updateLaunchState((current) => ({
                  ...current,
                  integrationSelections: {
                    ...current.integrationSelections,
                    pixelId: event.target.value,
                  },
                  adTypeConfig: {
                    ...current.adTypeConfig,
                    landingPage: {
                      ...current.adTypeConfig.landingPage,
                      pixelId: event.target.value,
                      pixelName:
                        metaIntegration?.assets.pixels.find((item) => item.asset_id === event.target.value)?.name || "",
                    },
                  },
                }))
              }
              className="h-11 w-full rounded-[16px] border border-[var(--line)] bg-white px-3 text-sm text-[var(--ink)]"
            >
              <option value="">Select tracking pixel</option>
              {(metaIntegration?.assets.pixels || []).map((pixel) => (
                <option key={pixel.asset_id} value={pixel.asset_id}>
                  {pixel.name || pixel.asset_id}
                </option>
              ))}
            </select>
          </SectionCard>
        );
      case "placeholders":
        return (
          <SectionCard
            title="Fill Placeholders"
            description="This step is generated from the template content. Every deduplicated template variable lives here."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              {placeholderFields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <label className="block text-sm font-medium text-[var(--ink)]">{field.label}</label>
                  <Input
                    value={launchState.placeholders.values[field.id] || ""}
                    onChange={(event) =>
                      updateLaunchState((current) => ({
                        ...current,
                        placeholders: {
                          values: {
                            ...current.placeholders.values,
                            [field.id]: event.target.value,
                          },
                        },
                      }))
                    }
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                  />
                  {field.description ? (
                    <p className="text-xs leading-5 text-[var(--muted)]">{field.description}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </SectionCard>
        );
      case "landing-page":
        return (
          <SectionCard
            title="Landing Page"
            description="Set the website destination used by the ad and final publish payload."
          >
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--ink)]">Landing page URL</label>
              <Input
                value={launchState.adTypeConfig.landingPage.url}
                onChange={(event) =>
                  updateLaunchState((current) => ({
                    ...current,
                    adTypeConfig: {
                      ...current.adTypeConfig,
                      landingPage: {
                        ...current.adTypeConfig.landingPage,
                        url: event.target.value,
                      },
                    },
                  }))
                }
                placeholder="https://your-site.com"
              />
            </div>
          </SectionCard>
        );
      case "phone-number":
        return (
          <SectionCard
            title="Phone Number"
            description="Use the phone number that should be dialed from the Call Now ad."
          >
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--ink)]">Phone number</label>
              <Input
                value={launchState.adTypeConfig.callNow.phoneNumber}
                onChange={(event) =>
                  updateLaunchState((current) => ({
                    ...current,
                    adTypeConfig: {
                      ...current.adTypeConfig,
                      callNow: {
                        phoneNumber: event.target.value,
                      },
                    },
                  }))
                }
                placeholder="+1 555 123 4567"
              />
            </div>
          </SectionCard>
        );
      case "messenger-setup":
        return (
          <SectionCard
            title="Messenger Setup"
            description="Set the opening message and optional reply prompt used by Messenger campaigns."
          >
            <div className="grid gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--ink)]">Welcome message</label>
                <Textarea
                  value={launchState.adTypeConfig.messenger.welcomeMessage}
                  onChange={(event) =>
                    updateLaunchState((current) => ({
                      ...current,
                      adTypeConfig: {
                        ...current.adTypeConfig,
                        messenger: {
                          ...current.adTypeConfig.messenger,
                          welcomeMessage: event.target.value,
                        },
                      },
                    }))
                  }
                  rows={4}
                  placeholder="Thanks for reaching out. Tell us a little about what you need."
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--ink)]">Reply prompt</label>
                <Textarea
                  value={launchState.adTypeConfig.messenger.replyPrompt}
                  onChange={(event) =>
                    updateLaunchState((current) => ({
                      ...current,
                      adTypeConfig: {
                        ...current.adTypeConfig,
                        messenger: {
                          ...current.adTypeConfig.messenger,
                          replyPrompt: event.target.value,
                        },
                      },
                    }))
                  }
                  rows={3}
                  placeholder="Reply with your main goal and we’ll point you to the next best step."
                />
              </div>
            </div>
          </SectionCard>
        );
      case "thank-you":
        return (
          <SectionCard
            title="Thank You Page"
            description="This stays optional. When enabled, it shapes the post-submit experience for SideKick-managed lead forms."
          >
            <div className="space-y-5">
              <label className="flex items-center gap-3 text-sm font-medium text-[var(--ink)]">
                <input
                  type="checkbox"
                  checked={launchState.adTypeConfig.leadForm.thankYou.enabled}
                  onChange={(event) =>
                    updateLaunchState((current) => ({
                      ...current,
                      adTypeConfig: {
                        ...current.adTypeConfig,
                        leadForm: {
                          ...current.adTypeConfig.leadForm,
                          thankYou: {
                            ...current.adTypeConfig.leadForm.thankYou,
                            enabled: event.target.checked,
                          },
                        },
                      },
                    }))
                  }
                />
                Enable thank-you page
              </label>

              {launchState.adTypeConfig.leadForm.thankYou.enabled ? (
                <div className="grid gap-4">
                  <Input
                    value={launchState.adTypeConfig.leadForm.thankYou.headline}
                    onChange={(event) =>
                      updateLaunchState((current) => ({
                        ...current,
                        adTypeConfig: {
                          ...current.adTypeConfig,
                          leadForm: {
                            ...current.adTypeConfig.leadForm,
                            thankYou: {
                              ...current.adTypeConfig.leadForm.thankYou,
                              headline: event.target.value,
                            },
                          },
                        },
                      }))
                    }
                    placeholder="Thank-you headline"
                  />
                  <Textarea
                    value={launchState.adTypeConfig.leadForm.thankYou.description}
                    onChange={(event) =>
                      updateLaunchState((current) => ({
                        ...current,
                        adTypeConfig: {
                          ...current.adTypeConfig,
                          leadForm: {
                            ...current.adTypeConfig.leadForm,
                            thankYou: {
                              ...current.adTypeConfig.leadForm.thankYou,
                              description: event.target.value,
                            },
                          },
                        },
                      }))
                    }
                    rows={3}
                    placeholder="Thank-you description"
                  />
                  <div className="grid gap-4 lg:grid-cols-2">
                    <select
                      value={launchState.adTypeConfig.leadForm.thankYou.buttonAction}
                      onChange={(event) =>
                        updateLaunchState((current) => ({
                          ...current,
                          adTypeConfig: {
                            ...current.adTypeConfig,
                            leadForm: {
                              ...current.adTypeConfig.leadForm,
                              thankYou: {
                                ...current.adTypeConfig.leadForm.thankYou,
                                buttonAction: event.target.value as CampaignLaunchState["adTypeConfig"]["leadForm"]["thankYou"]["buttonAction"],
                              },
                            },
                          },
                        }))
                      }
                      className="h-11 rounded-[16px] border border-[var(--line)] bg-white px-3 text-sm text-[var(--ink)]"
                    >
                      <option value="OPEN_WEBSITE">Open website</option>
                      <option value="DOWNLOAD">Download</option>
                      <option value="CALL_BUSINESS">Call business</option>
                    </select>
                    <Input
                      value={launchState.adTypeConfig.leadForm.thankYou.buttonLabel}
                      onChange={(event) =>
                        updateLaunchState((current) => ({
                          ...current,
                          adTypeConfig: {
                            ...current.adTypeConfig,
                            leadForm: {
                              ...current.adTypeConfig.leadForm,
                              thankYou: {
                                ...current.adTypeConfig.leadForm.thankYou,
                                buttonLabel: event.target.value,
                              },
                            },
                          },
                        }))
                      }
                      placeholder="Button label"
                    />
                  </div>
                  {launchState.adTypeConfig.leadForm.thankYou.buttonAction !== "CALL_BUSINESS" ? (
                    <Input
                      value={launchState.adTypeConfig.leadForm.thankYou.websiteUrl}
                      onChange={(event) =>
                        updateLaunchState((current) => ({
                          ...current,
                          adTypeConfig: {
                            ...current.adTypeConfig,
                            leadForm: {
                              ...current.adTypeConfig.leadForm,
                              thankYou: {
                                ...current.adTypeConfig.leadForm.thankYou,
                                websiteUrl: event.target.value,
                              },
                            },
                          },
                        }))
                      }
                      placeholder="Optional destination URL"
                    />
                  ) : (
                    <Input
                      value={launchState.adTypeConfig.leadForm.thankYou.completionPhone}
                      onChange={(event) =>
                        updateLaunchState((current) => ({
                          ...current,
                          adTypeConfig: {
                            ...current.adTypeConfig,
                            leadForm: {
                              ...current.adTypeConfig.leadForm,
                              thankYou: {
                                ...current.adTypeConfig.leadForm.thankYou,
                                completionPhone: event.target.value,
                              },
                            },
                          },
                        }))
                      }
                      placeholder="Phone number used by the thank-you button"
                    />
                  )}
                </div>
              ) : null}
            </div>
          </SectionCard>
        );
      case "overview":
        return (
          <div className="space-y-6">
            <SectionCard
              title="Overview / Review & Edit"
              description="This is the final editable control center before launch."
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[var(--ink)]">Campaign name</label>
                  <Input
                    value={launchState.campaign.name}
                    onChange={(event) =>
                      updateLaunchState((current) => ({
                        ...current,
                        campaign: {
                          ...current.campaign,
                          name: event.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[var(--ink)]">CTA text</label>
                  <Input
                    value={launchState.review.ctaText}
                    onChange={(event) =>
                      updateLaunchState((current) => ({
                        ...current,
                        review: {
                          ...current.review,
                          ctaText: event.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[var(--ink)]">Ad account</label>
                  <select
                    value={launchState.integrationSelections.adAccountId}
                    onChange={(event) =>
                      updateLaunchState((current) => ({
                        ...current,
                        integrationSelections: {
                          ...current.integrationSelections,
                          adAccountId: event.target.value,
                        },
                      }))
                    }
                    className="h-11 rounded-[16px] border border-[var(--line)] bg-white px-3 text-sm text-[var(--ink)]"
                  >
                    <option value="">Select ad account</option>
                    {(metaIntegration?.assets.adAccounts || []).map((account) => (
                      <option key={account.asset_id} value={account.asset_id}>
                        {account.name || account.asset_id}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[var(--ink)]">Facebook Page</label>
                  <select
                    value={launchState.integrationSelections.pageId}
                    onChange={(event) =>
                      updateLaunchState((current) => ({
                        ...current,
                        integrationSelections: {
                          ...current.integrationSelections,
                          pageId: event.target.value,
                        },
                      }))
                    }
                    className="h-11 rounded-[16px] border border-[var(--line)] bg-white px-3 text-sm text-[var(--ink)]"
                  >
                    <option value="">Select page</option>
                    {(metaIntegration?.assets.pages || []).map((page) => (
                      <option key={page.asset_id} value={page.asset_id}>
                        {page.name || page.asset_id}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {launchState.selection.adType === "lead_form" ? (
                <div className="mt-6 grid gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[var(--ink)]">Lead form mode</label>
                    <select
                      value={launchState.adTypeConfig.leadForm.mode}
                      onChange={(event) =>
                        updateLaunchState((current) => ({
                          ...current,
                          adTypeConfig: {
                            ...current.adTypeConfig,
                            leadForm: {
                              ...current.adTypeConfig.leadForm,
                              mode: event.target.value as CampaignLeadFormMode,
                            },
                          },
                        }))
                      }
                      className="h-11 rounded-[16px] border border-[var(--line)] bg-white px-3 text-sm text-[var(--ink)]"
                    >
                      <option value="managed_new">SideKick-managed lead form</option>
                      <option value="existing">Use existing Meta lead form</option>
                    </select>
                  </div>

                  {launchState.adTypeConfig.leadForm.mode === "existing" ? (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[var(--ink)]">Existing Meta lead form</label>
                      <select
                        value={launchState.adTypeConfig.leadForm.selectedFormId}
                        onChange={(event) =>
                          updateLaunchState((current) => ({
                            ...current,
                            adTypeConfig: {
                              ...current.adTypeConfig,
                              leadForm: {
                                ...current.adTypeConfig.leadForm,
                                selectedFormId: event.target.value,
                                selectedFormName:
                                  metaIntegration?.assets.leadForms.find((form) => form.asset_id === event.target.value)?.name || "",
                              },
                            },
                            integrationSelections: {
                              ...current.integrationSelections,
                              leadFormId: event.target.value,
                            },
                          }))
                        }
                        className="h-11 rounded-[16px] border border-[var(--line)] bg-white px-3 text-sm text-[var(--ink)]"
                      >
                        <option value="">Select lead form</option>
                        {(metaIntegration?.assets.leadForms || []).map((form) => (
                          <option key={form.asset_id} value={form.asset_id}>
                            {form.name || form.asset_id}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      <Input
                        value={launchState.adTypeConfig.leadForm.managedFormName}
                        onChange={(event) =>
                          updateLaunchState((current) => ({
                            ...current,
                            adTypeConfig: {
                              ...current.adTypeConfig,
                              leadForm: {
                                ...current.adTypeConfig.leadForm,
                                managedFormName: event.target.value,
                              },
                            },
                          }))
                        }
                        placeholder="Managed lead form name"
                      />
                      <Input
                        value={launchState.adTypeConfig.leadForm.privacyPolicyUrl}
                        onChange={(event) =>
                          updateLaunchState((current) => ({
                            ...current,
                            adTypeConfig: {
                              ...current.adTypeConfig,
                              leadForm: {
                                ...current.adTypeConfig.leadForm,
                                privacyPolicyUrl: event.target.value,
                              },
                            },
                          }))
                        }
                        placeholder="Privacy policy URL"
                      />
                      <div className="grid gap-2 sm:grid-cols-3">
                        {leadFormFieldOptions.map((option) => {
                          const selected = launchState.adTypeConfig.leadForm.fields.includes(option.id);
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() =>
                                updateLaunchState((current) => ({
                                  ...current,
                                  adTypeConfig: {
                                    ...current.adTypeConfig,
                                    leadForm: {
                                      ...current.adTypeConfig.leadForm,
                                      fields: selected
                                        ? current.adTypeConfig.leadForm.fields.filter((field) => field !== option.id)
                                        : [...current.adTypeConfig.leadForm.fields, option.id],
                                    },
                                  },
                                }))
                              }
                              className={cn(
                                "rounded-2xl border px-3 py-3 text-left",
                                selected
                                  ? "border-[var(--brand)] bg-[rgba(109,94,248,0.08)]"
                                  : "border-[var(--line)]",
                              )}
                            >
                              <p className="text-sm font-semibold text-[var(--ink)]">{option.label}</p>
                              <p className="mt-1 text-xs text-[var(--muted)]">{option.hint}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {launchState.selection.adType === "landing_page" ? (
                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  <Input
                    value={launchState.adTypeConfig.landingPage.url}
                    onChange={(event) =>
                      updateLaunchState((current) => ({
                        ...current,
                        adTypeConfig: {
                          ...current.adTypeConfig,
                          landingPage: {
                            ...current.adTypeConfig.landingPage,
                            url: event.target.value,
                          },
                        },
                      }))
                    }
                    placeholder="Landing page URL"
                  />
                  <select
                    value={launchState.integrationSelections.pixelId}
                    onChange={(event) =>
                      updateLaunchState((current) => ({
                        ...current,
                        integrationSelections: {
                          ...current.integrationSelections,
                          pixelId: event.target.value,
                        },
                        adTypeConfig: {
                          ...current.adTypeConfig,
                          landingPage: {
                            ...current.adTypeConfig.landingPage,
                            pixelId: event.target.value,
                            pixelName:
                              metaIntegration?.assets.pixels.find((item) => item.asset_id === event.target.value)?.name || "",
                          },
                        },
                      }))
                    }
                    className="h-11 rounded-[16px] border border-[var(--line)] bg-white px-3 text-sm text-[var(--ink)]"
                  >
                    <option value="">Select tracking pixel</option>
                    {(metaIntegration?.assets.pixels || []).map((pixel) => (
                      <option key={pixel.asset_id} value={pixel.asset_id}>
                        {pixel.name || pixel.asset_id}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {launchState.selection.adType === "call_now" ? (
                <div className="mt-6">
                  <Input
                    value={launchState.adTypeConfig.callNow.phoneNumber}
                    onChange={(event) =>
                      updateLaunchState((current) => ({
                        ...current,
                        adTypeConfig: {
                          ...current.adTypeConfig,
                          callNow: {
                            phoneNumber: event.target.value,
                          },
                        },
                      }))
                    }
                    placeholder="Phone number"
                  />
                </div>
              ) : null}

              {(launchState.selection.adType === "messenger_leads" ||
                launchState.selection.adType === "messenger_engagement") ? (
                <div className="mt-6 grid gap-4">
                  <Textarea
                    value={launchState.adTypeConfig.messenger.welcomeMessage}
                    onChange={(event) =>
                      updateLaunchState((current) => ({
                        ...current,
                        adTypeConfig: {
                          ...current.adTypeConfig,
                          messenger: {
                            ...current.adTypeConfig.messenger,
                            welcomeMessage: event.target.value,
                          },
                        },
                      }))
                    }
                    rows={4}
                    placeholder="Messenger welcome message"
                  />
                  <Textarea
                    value={launchState.adTypeConfig.messenger.replyPrompt}
                    onChange={(event) =>
                      updateLaunchState((current) => ({
                        ...current,
                        adTypeConfig: {
                          ...current.adTypeConfig,
                          messenger: {
                            ...current.adTypeConfig.messenger,
                            replyPrompt: event.target.value,
                          },
                        },
                      }))
                    }
                    rows={3}
                    placeholder="Messenger reply prompt"
                  />
                </div>
              ) : null}
            </SectionCard>

            <SectionCard title="Rendered Summary" description="The current wizard state rendered into the campaign blueprint.">
              <div className="space-y-3 text-sm text-[var(--muted-strong)]">
                <div className="flex items-center justify-between gap-4">
                  <span>Industry</span>
                  <span className="font-medium text-[var(--ink)]">{launchState.selection.industry || "Missing"}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Template</span>
                  <span className="font-medium text-[var(--ink)]">{selectedTemplate?.name || "Missing"}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Ad type</span>
                  <span className="font-medium text-[var(--ink)]">{getAdTypeLabel(launchState.selection.adType)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Budget</span>
                  <span className="font-medium text-[var(--ink)]">${launchState.campaign.dailyBudget || "0"}/day</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Locations</span>
                  <span className="font-medium text-[var(--ink)]">{launchState.targeting.locations.length}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Placeholders</span>
                  <span className="font-medium text-[var(--ink)]">{placeholderFields.length}</span>
                </div>
              </div>
            </SectionCard>
          </div>
        );
      case "launch":
        return (
          <div className="space-y-6">
            <SectionCard
              title="Launch Readiness"
              description="Run preflight on top of the new wizard state, then publish when Meta is ready."
            >
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={() => runLaunchPreflight("live")}
                  disabled={isPreflighting || !selectedTemplate}
                >
                  {isPreflighting && preflightMode === "live" ? "Running preflight..." : "Run Preflight"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleLaunch("live")}
                  disabled={isPublishing || !selectedTemplate}
                >
                  {isPublishing ? "Launching..." : "Launch Campaign"}
                </Button>
                <Button type="button" variant="outline" onClick={() => persistDraft()} disabled={!selectedTemplate || saveState === "saving"}>
                  {saveState === "saving" ? "Saving..." : "Save Draft"}
                </Button>
              </div>

              <div className="mt-5 space-y-4">
                <IssueList title="Local wizard blockers" issues={currentIssues.length ? currentIssues : localReadinessIssues} />
                {preflightError ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
                    {preflightError}
                  </div>
                ) : null}
                {preflight ? (
                  <div className="rounded-2xl border border-[var(--line)] bg-[rgba(15,23,42,0.02)] px-4 py-4">
                    <div className="grid gap-2 text-sm text-[var(--muted-strong)] sm:grid-cols-2">
                      <p>Blocking issues: {preflight.blockingIssues.length}</p>
                      <p>Warnings: {preflight.warnings.length}</p>
                      <p>Ad account: {preflight.resolvedAssets.adAccount?.name || "Missing"}</p>
                      <p>Page: {preflight.resolvedAssets.page?.name || "Missing"}</p>
                    </div>
                    {preflight.blockingIssues.length ? (
                      <IssueList title="Blocking issues" issues={preflight.blockingIssues} />
                    ) : null}
                    {preflight.warnings.length ? (
                      <IssueList title="Warnings" issues={preflight.warnings} tone="amber" />
                    ) : null}
                  </div>
                ) : null}
                {publishError ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
                    {publishError}
                  </div>
                ) : null}
                {publishSuccess ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
                    {publishSuccess}
                  </div>
                ) : null}
              </div>
            </SectionCard>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-[var(--line)] bg-[linear-gradient(135deg,#fbfbff_0%,#f6f8fc_100%)] p-6 shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="rounded-full bg-[rgba(109,94,248,0.1)] px-3 py-1 text-[var(--brand)]">Launch Wizard</Badge>
              <Badge className="border-[var(--line)] bg-white text-[var(--muted-strong)]">{getAdTypeLabel(launchState.selection.adType)}</Badge>
            </div>
            <h1 className="mt-4 text-[2.2rem] font-semibold tracking-[-0.06em] text-[var(--ink)]">
              Build a clean Meta campaign flow
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              The wizard now uses explicit ad-type-based steps, canonical launch state, generated placeholders, and a clean
              review-to-launch path.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" onClick={() => persistDraft()} disabled={!selectedTemplate || saveState === "saving"}>
              {saveState === "saving" ? "Saving..." : "Save Draft"}
            </Button>
            <Button asChild variant={metaConnected ? "outline" : "primary"}>
              <Link href={metaConnectHref}>{metaConnected ? "Reconnect Facebook" : "Connect Facebook"}</Link>
            </Button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3 text-sm text-[var(--muted-strong)]">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3 py-1.5">
            <Target className="h-4 w-4 text-[var(--brand)]" />
            {launchState.selection.industry || "No industry selected"}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3 py-1.5">
            <Sparkles className="h-4 w-4 text-[var(--brand)]" />
            {selectedTemplate?.name || "No template selected"}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3 py-1.5">
            <Wallet className="h-4 w-4 text-[var(--brand)]" />
            ${launchState.campaign.dailyBudget || "0"}/day
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3 py-1.5">
            <MapPin className="h-4 w-4 text-[var(--brand)]" />
            {launchState.targeting.locations.length ? `${launchState.targeting.locations.length} locations` : "No location yet"}
          </span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)_28rem]">
        <div className="space-y-4">
          <StepRail
            steps={visibleSteps}
            currentStepId={launchState.stepId}
            onStepClick={(stepId) =>
              updateLaunchState((current) => ({
                ...current,
                stepId,
              }))
            }
          />
          <IssueList title="Current step issues" issues={currentIssues} />
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-[var(--line)] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Current Step</p>
            <div className="mt-3 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-[var(--ink)]">
                  {currentStepDefinition.label}
                </h2>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{currentStepDefinition.description}</p>
              </div>
              <Badge className="border-[var(--line)] bg-white text-[var(--muted-strong)]">
                Step {currentStepIndex + 1} of {visibleSteps.length}
              </Badge>
            </div>
          </div>

          {renderStepContent()}

          <div className="flex items-center justify-between gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStepIndex <= 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            {launchState.stepId !== "launch" ? (
              <Button type="button" onClick={handleContinue}>
                Continue
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={() => handleLaunch("live")} disabled={isPublishing}>
                {isPublishing ? "Launching..." : "Launch Campaign"}
                <Rocket className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <SectionCard
            title="Live Preview"
            description="The ad preview is rendered from the same canonical launch state that feeds save, preflight, and publish."
          >
            <FacebookAdPreview
              template={selectedTemplate}
              pageName={pagePreviewIdentity.pageName}
              pageAvatarUrl={pagePreviewIdentity.pageAvatarUrl}
              primaryText={previewBlueprint?.adCopy.primary}
              headline={previewBlueprint?.adCopy.headlines[0]}
              description={previewBlueprint?.adCopy.descriptions[0]}
              ctaLabel={launchState.review.ctaText || selectedTemplate?.ctaDefault}
              imageUrl={selectedTemplate?.previewImage || null}
              compact
            />
          </SectionCard>

          <SectionCard title="Wizard Architecture" description="Quick signal that the state and flow are coherent.">
            <div className="space-y-3 text-sm text-[var(--muted-strong)]">
              <div className="flex items-center justify-between gap-4">
                <span>State model</span>
                <span className="font-medium text-[var(--ink)]">v{launchState.version}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Selected template</span>
                <span className="font-medium text-[var(--ink)]">{selectedTemplate?.slug || "None"}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Ad type flow</span>
                <span className="font-medium text-[var(--ink)]">{visibleSteps.length} steps</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Generated placeholders</span>
                <span className="font-medium text-[var(--ink)]">{placeholderFields.length}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Meta connection</span>
                <span className="font-medium text-[var(--ink)]">{metaConnected ? "Connected" : "Needs Facebook"}</span>
              </div>
            </div>
            <div className="mt-5 rounded-2xl border border-[var(--line)] bg-[rgba(15,23,42,0.02)] px-4 py-4">
              <p className="text-sm font-semibold text-[var(--ink)]">Meta assets in play</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Ad account:{" "}
                <span className="font-medium text-[var(--ink)]">
                  {metaIntegration?.assets.adAccounts.find((item) => item.asset_id === launchState.integrationSelections.adAccountId)?.name || "Not selected"}
                </span>
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                Facebook Page:{" "}
                <span className="font-medium text-[var(--ink)]">
                  {pagePreviewIdentity.pageName}
                </span>
              </p>
              {launchState.selection.adType === "landing_page" ? (
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  Tracking Pixel:{" "}
                  <span className="font-medium text-[var(--ink)]">
                    {metaIntegration?.assets.pixels.find((item) => item.asset_id === launchState.integrationSelections.pixelId)?.name || "Not selected"}
                  </span>
                </p>
              ) : null}
            </div>
            <div className="mt-5">
              <Link href="/workspace/settings?section=integrations" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--brand)]">
                Manage workspace Meta connection
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
