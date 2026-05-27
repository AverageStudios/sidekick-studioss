"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Globe,
  MessageCircle,
  PhoneCall,
  Rocket,
} from "lucide-react";
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
  getMetaCompatibleCtaLabel,
  getNextWizardStep,
  getPreviousWizardStep,
  getWizardSectionForStep,
  getWizardSections,
  getTemplatePlaceholderFields,
  getTemplateSetupValuesFromLaunchState,
  getVisibleWizardSteps,
  locationTargetingModeOptions,
  normalizeCampaignLaunchState,
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
  CampaignLeadFormCustomQuestion,
  CampaignLeadFormField,
  CampaignLeadFormMode,
  CampaignLocationScope,
  CampaignPublishMode,
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

type MetaPublishErrorResponse = {
  error?: string;
  metaError?: {
    message?: string;
    stage?: string | null;
    endpoint?: string | null;
    code?: number | null;
    subcode?: number | null;
    type?: string | null;
    traceId?: string | null;
    userTitle?: string | null;
    userMessage?: string | null;
    blameFieldSpecs?: string[][] | null;
    requestUrl?: string | null;
    requestBody?: string | null;
    responseBody?: string | null;
    responseJson?: unknown;
    errorData?: Record<string, unknown> | null;
    payload?: Record<string, unknown> | null;
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

type CachedLocationLookup = {
  suggestions: LocationSuggestion[];
  fetchedAt: number;
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
    label: "Messenger",
    description: "Start Messenger conversations with a cleaner message-first setup.",
    icon: MessageCircle,
  },
] as const;

function getAdTypeFieldHint(adType: CampaignLaunchState["selection"]["adType"]) {
  switch (adType) {
    case "lead_form":
      return "Uses a Facebook lead form, privacy policy, and lead fields.";
    case "landing_page":
      return "Needs a public website URL and a selected tracking pixel.";
    case "call_now":
      return "Needs a business phone number for the call button.";
    case "messenger_leads":
    case "messenger_engagement":
      return "Uses Messenger-specific setup instead of a website, phone, or lead form.";
    default:
      return "";
  }
}

function templateSupportsAdType(
  template: TemplateSeed | null,
  adType: CampaignLaunchState["selection"]["adType"],
) {
  if (!template?.supportedAdTypes?.length) return true;
  if (adType === "messenger_leads") {
    return (
      template.supportedAdTypes.includes("messenger_leads") ||
      template.supportedAdTypes.includes("messenger_engagement")
    );
  }
  return template.supportedAdTypes.includes(adType);
}

function getLocationScopeLabel(scope: CampaignLocationScope) {
  switch (scope) {
    case "city":
      return "City";
    case "state":
      return "State";
    case "country":
      return "Country";
    case "zip":
      return "ZIP";
    case "neighborhood":
      return "Neighborhood";
    case "address":
      return "Address";
    case "world":
      return "Worldwide";
    default:
      return "Location";
  }
}

const leadFormFieldOptions: Array<{
  id: CampaignLeadFormField;
  label: string;
  hint: string;
}> = [
  { id: "FULL_NAME", label: "Full name", hint: "Best for personalized follow-up." },
  { id: "FIRST_NAME", label: "First name", hint: "Useful when you want a shorter prefill field." },
  { id: "LAST_NAME", label: "Last name", hint: "Useful when you want separate first and last names." },
  { id: "EMAIL", label: "Email", hint: "Required for email follow-up." },
  { id: "PHONE", label: "Phone", hint: "Required for call or SMS follow-up." },
  { id: "COMPANY_NAME", label: "Company name", hint: "Helpful for B2B lead qualification." },
  { id: "JOB_TITLE", label: "Job title", hint: "Helpful for filtering professional leads." },
];

function normalizeQuestionKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

function createCustomLeadFormQuestion(
  type: CampaignLeadFormCustomQuestion["type"],
): CampaignLeadFormCustomQuestion {
  return {
    id: `question-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    key: "",
    label: "",
    type,
    options:
      type === "MULTIPLE_CHOICE"
        ? [
            {
              id: `option-${Date.now()}-1`,
              value: "",
            },
          ]
        : [],
  };
}

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
    <Card
      className={cn(
        "rounded-[24px] border border-[color-mix(in_oklab,var(--brand)_8%,var(--line))] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]",
        className,
      )}
    >
      <div className="mb-5">
        <h3 className="text-[1.05rem] font-semibold tracking-[-0.03em] text-[var(--ink)]">{title}</h3>
        {description ? <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{description}</p> : null}
      </div>
      {children}
    </Card>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm text-[var(--muted-strong)]">
      <span>{label}</span>
      <span className="max-w-[60%] truncate font-medium text-[var(--ink)]">{value}</span>
    </div>
  );
}

function ReviewGroupCard({
  title,
  description,
  onEdit,
  editLabel = "Edit",
  children,
}: {
  title: string;
  description?: string;
  onEdit?: () => void;
  editLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-[var(--line)] bg-white px-5 py-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--ink)]">{title}</p>
          {description ? <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">{description}</p> : null}
        </div>
        {onEdit ? (
          <Button type="button" variant="outline" className="h-9 px-3 text-xs font-medium" onClick={onEdit}>
            {editLabel}
          </Button>
        ) : null}
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function formatBudgetDisplay(value: string) {
  const amount = Number.parseFloat(value.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) {
    return "$0/day";
  }

  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `$${formatted}/day`;
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
    <div className={cn("rounded-[20px] border px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.03)]", toneClasses)}>
      <p className="text-sm font-semibold">{title}</p>
      <ul className="mt-2 space-y-2 text-sm leading-6">
        {issues.map((issue) => (
          <li key={`${issue.code || issue.message}`}>• {issue.message}</li>
        ))}
      </ul>
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
      ...(draftId ? { draftId } : {}),
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

export function TemplateLaunchWizard({
  templates,
  businessProfile,
  initialDraftBundle,
  initialTemplateSlug,
  metaIntegration,
  connectNextUrl,
  immersive = false,
}: {
  templates: TemplateSeed[];
  businessProfile: BusinessProfile | null;
  initialDraftBundle: CampaignBundle | null;
  initialTemplateSlug?: string | null;
  metaIntegration: WizardMetaIntegration;
  connectNextUrl: string;
  immersive?: boolean;
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
  const [publishErrorDetails, setPublishErrorDetails] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
  const [pendingLocation, setPendingLocation] = useState("");
  const deferredLocationQuery = useDeferredValue(pendingLocation);
  const [locationMode, setLocationMode] = useState<CampaignLaunchLocation["targetingMode"]>("home");
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [activeLocationSuggestionIndex, setActiveLocationSuggestionIndex] = useState(0);
  const [locationSearchError, setLocationSearchError] = useState<string | null>(null);
  const [isSearchingLocations, setIsSearchingLocations] = useState(false);
  const locationSuggestionCacheRef = useRef<Map<string, CachedLocationLookup>>(new Map());
  const locationSearchAbortRef = useRef<AbortController | null>(null);

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
    const query = deferredLocationQuery.trim();
    if (query.length < 2) {
      locationSearchAbortRef.current?.abort();
      return;
    }

    const normalizedQuery = query.toLowerCase();
    const cache = locationSuggestionCacheRef.current;
    const cached = cache.get(normalizedQuery);
    if (cached) {
      setLocationSuggestions(cached.suggestions);
      setActiveLocationSuggestionIndex(cached.suggestions.length ? 0 : 0);
      setLocationSearchError(null);
    } else {
      const prefixHit = Array.from(cache.entries())
        .filter(([key, value]) => normalizedQuery.startsWith(key) && value.suggestions.length)
        .sort((left, right) => right[0].length - left[0].length)[0];
      if (prefixHit) {
        setLocationSuggestions(prefixHit[1].suggestions);
        setActiveLocationSuggestionIndex(prefixHit[1].suggestions.length ? 0 : 0);
      }
    }

    locationSearchAbortRef.current?.abort();
    const controller = new AbortController();
    locationSearchAbortRef.current = controller;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setIsSearchingLocations(true);
      fetch(`/api/location-search?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as
          | { suggestions?: LocationSuggestion[]; error?: string }
          | null;
        if (cancelled) return;
        if (!response.ok) {
          setLocationSearchError(payload?.error || "Location search failed.");
          setLocationSuggestions([]);
          setActiveLocationSuggestionIndex(0);
          return;
        }
        setLocationSearchError(payload?.error || null);
        const nextSuggestions = payload?.suggestions || [];
        cache.set(normalizedQuery, {
          suggestions: nextSuggestions,
          fetchedAt: Date.now(),
        });
        if (cache.size > 24) {
          const oldestKey = Array.from(cache.entries()).sort((left, right) => left[1].fetchedAt - right[1].fetchedAt)[0]?.[0];
          if (oldestKey) cache.delete(oldestKey);
        }
        setLocationSuggestions(nextSuggestions);
        setActiveLocationSuggestionIndex(nextSuggestions.length ? 0 : 0);
      })
      .catch(() => {
        if (!cancelled && !controller.signal.aborted) {
          setLocationSearchError("Location search failed.");
          setLocationSuggestions([]);
          setActiveLocationSuggestionIndex(0);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsSearchingLocations(false);
        }
      });
    }, cached ? 90 : 160);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [deferredLocationQuery]);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.slug === launchState.selection.templateSlug) || null,
    [launchState.selection.templateSlug, templates],
  );

  const visibleSteps = useMemo(
    () => getVisibleWizardSteps(launchState.selection.adType),
    [launchState.selection.adType],
  );
  const currentStepIndex = visibleSteps.findIndex((step) => step.id === launchState.stepId);
  const resolvedStepIndex = currentStepIndex >= 0 ? currentStepIndex : 0;
  const wizardSections = useMemo(
    () => getWizardSections(launchState.selection.adType),
    [launchState.selection.adType],
  );
  const { index: currentSectionIndex, section: currentSectionDefinition } = useMemo(
    () => getWizardSectionForStep(launchState.selection.adType, launchState.stepId),
    [launchState.selection.adType, launchState.stepId],
  );
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
  const needsLeadFormReconnect = launchState.selection.adType === "lead_form";
  const metaConnectHref = `/api/meta/connect?next=${encodeURIComponent(connectNextUrl)}${
    needsLeadFormReconnect ? "&scopeSet=lead_forms" : ""
  }${metaConnected || needsLeadFormReconnect ? "&reconnect=1" : ""}`;

  function updateLaunchState(updater: (current: CampaignLaunchState) => CampaignLaunchState) {
    setLaunchState((current) => updater(current));
    setCurrentIssues([]);
    setPreflight(null);
    setPreflightError(null);
    setPublishError(null);
    setPublishErrorDetails(null);
    setPublishSuccess(null);
  }

  function selectTemplateAndAdvance(template: TemplateSeed) {
    const nextState = normalizeCampaignLaunchState(
      {
        ...launchState,
        stepId: "ad-type",
        selection: {
          ...launchState.selection,
          industry: template.industry,
          category: template.category,
          offerType: template.offerType,
          templateSlug: template.slug,
          adType: launchState.selection.adType || template.defaultAdType || "lead_form",
        },
        placeholders: {
          values: {
            ...createInitialCampaignLaunchState({ template, businessProfile }).placeholders.values,
            ...launchState.placeholders.values,
          },
        },
      },
      template,
      businessProfile,
    );

    updateLaunchState(() => nextState);
    void persistDraft(nextState);
  }

  function applyAdType(adType: CampaignLaunchState["selection"]["adType"]) {
    updateLaunchState((current) =>
      normalizeCampaignLaunchState(
        {
          ...current,
          stepId: "campaign-basics",
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

  function addLeadFormCustomQuestion(type: CampaignLeadFormCustomQuestion["type"]) {
    updateLaunchState((current) => ({
      ...current,
      adTypeConfig: {
        ...current.adTypeConfig,
        leadForm: {
          ...current.adTypeConfig.leadForm,
          customQuestions: [
            ...current.adTypeConfig.leadForm.customQuestions,
            createCustomLeadFormQuestion(type),
          ],
        },
      },
    }));
  }

  function updateLeadFormCustomQuestion(
    questionId: string,
    updater: (question: CampaignLeadFormCustomQuestion) => CampaignLeadFormCustomQuestion,
  ) {
    updateLaunchState((current) => ({
      ...current,
      adTypeConfig: {
        ...current.adTypeConfig,
        leadForm: {
          ...current.adTypeConfig.leadForm,
          customQuestions: current.adTypeConfig.leadForm.customQuestions.map((question) =>
            question.id === questionId ? updater(question) : question,
          ),
        },
      },
    }));
  }

  function removeLeadFormCustomQuestion(questionId: string) {
    updateLaunchState((current) => ({
      ...current,
      adTypeConfig: {
        ...current.adTypeConfig,
        leadForm: {
          ...current.adTypeConfig.leadForm,
          customQuestions: current.adTypeConfig.leadForm.customQuestions.filter(
            (question) => question.id !== questionId,
          ),
        },
      },
    }));
  }

  function moveLeadFormCustomQuestion(questionId: string, direction: -1 | 1) {
    updateLaunchState((current) => {
      const questions = [...current.adTypeConfig.leadForm.customQuestions];
      const index = questions.findIndex((question) => question.id === questionId);
      if (index < 0) return current;
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= questions.length) return current;
      const [question] = questions.splice(index, 1);
      questions.splice(targetIndex, 0, question);
      return {
        ...current,
        adTypeConfig: {
          ...current.adTypeConfig,
          leadForm: {
            ...current.adTypeConfig.leadForm,
            customQuestions: questions,
          },
        },
      };
    });
  }

  function addLeadFormCustomOption(questionId: string) {
    updateLeadFormCustomQuestion(questionId, (question) => ({
      ...question,
      options: [
        ...question.options,
        {
          id: `option-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          value: "",
        },
      ],
    }));
  }

  function updateLeadFormCustomOption(questionId: string, optionId: string, value: string) {
    updateLeadFormCustomQuestion(questionId, (question) => ({
      ...question,
      options: question.options.map((option) =>
        option.id === optionId
          ? {
              ...option,
              value,
            }
          : option,
      ),
    }));
  }

  function removeLeadFormCustomOption(questionId: string, optionId: string) {
    updateLeadFormCustomQuestion(questionId, (question) => ({
      ...question,
      options: question.options.filter((option) => option.id !== optionId),
    }));
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
    setActiveLocationSuggestionIndex(0);
    setLocationSearchError(null);
  }

  function inferLocationScopeFromQuery(query: string): CampaignLocationScope {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return "city";
    if (normalized === "world" || normalized === "worldwide" || normalized === "global") return "world";
    if (/^\d{5}(-\d{4})?$/.test(normalized)) return "zip";
    if (
      /\d/.test(normalized) ||
      /(?:street|st|avenue|ave|road|rd|lane|ln|drive|dr|boulevard|blvd|court|ct|way|suite|ste|apt|apartment|unit|highway|hwy)\b/i.test(
        normalized,
      )
    ) {
      return "address";
    }
    return "city";
  }

  function addManualLocation() {
    if (!pendingLocation.trim()) return;
    const inferredScope = inferLocationScopeFromQuery(pendingLocation);
    const manualLocation: CampaignLaunchLocation = {
      id: `manual-${Date.now()}`,
      label: pendingLocation.trim(),
      radius: inferredScope === "world" ? "0" : "10",
      radiusAllowed: !["world", "country", "state"].includes(inferredScope),
      distanceUnit: "mile",
      targetingMode: locationMode,
      scope: inferredScope,
      metaLocation: {
        classification:
          inferredScope === "country"
            ? "country"
            : inferredScope === "state"
              ? "region"
              : inferredScope === "city"
                ? "city"
                : inferredScope === "zip"
                  ? "zip"
                  : inferredScope === "neighborhood"
                    ? "neighborhood"
                    : inferredScope === "world"
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
              inferredScope === "world"
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
    setActiveLocationSuggestionIndex(0);
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

  function updateLocationTargeting(locationId: string, updates: Partial<CampaignLaunchLocation>) {
    updateLaunchState((current) =>
      normalizeCampaignLaunchState(
        {
          ...current,
          targeting: {
            ...current.targeting,
            locations: current.targeting.locations.map((location) =>
              location.id === locationId
                ? {
                    ...location,
                    ...updates,
                  }
                : location,
            ),
          },
        },
        selectedTemplate || templates[0],
        businessProfile,
      ),
    );
  }

  function handleLocationKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!locationSuggestions.length) {
      if (event.key === "Enter") {
        event.preventDefault();
        addManualLocation();
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveLocationSuggestionIndex((current) => (current + 1) % locationSuggestions.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveLocationSuggestionIndex((current) =>
        current <= 0 ? locationSuggestions.length - 1 : current - 1,
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const suggestion =
        locationSuggestions[activeLocationSuggestionIndex] || locationSuggestions[0] || null;
      if (suggestion) {
        addLocationFromSuggestion(suggestion);
      } else {
        addManualLocation();
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setLocationSuggestions([]);
      setActiveLocationSuggestionIndex(0);
    }
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
        ...(draftId ? { campaignId: draftId } : {}),
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
    setPublishErrorDetails(null);
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
      | (MetaPublishErrorResponse & { preflight?: LaunchPreflightResponse })
      | null;

    setIsPublishing(false);
    if (!response.ok) {
      if (payload?.preflight) {
        setPreflight(payload.preflight);
      }
      setPublishError(payload?.error || "Campaign launch failed.");
      setPublishErrorDetails(
        payload?.metaError
          ? JSON.stringify(payload.metaError, null, 2)
          : null,
      );
      return;
    }

    setPublishSuccess(mode === "live" ? "Campaign launched to Meta." : "Campaign draft pushed to Meta.");
    setPublishErrorDetails(null);
    router.refresh();
  }

  function renderStepContent() {
    switch (launchState.stepId) {
      case "industry":
        return (
          <SectionCard
            title="Select Industry"
            description="Pick the library the wizard should filter against."
            className="p-5 sm:p-6"
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
                      "rounded-[24px] border px-4 py-5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklab,var(--brand)_50%,white)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]",
                      active
                        ? "border-[color-mix(in_oklab,var(--brand)_32%,white)] bg-[var(--soft-brand)] shadow-[0_16px_32px_rgba(109,94,248,0.12)]"
                        : "border-[var(--line)] bg-white/82 shadow-[var(--shadow-soft)] hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--brand)_18%,white)] hover:bg-white active:translate-y-px",
                    )}
                  >
                    <p className="font-semibold text-[var(--ink)]">{industry}</p>
                  </button>
                );
              })}
            </div>
          </SectionCard>
        );
      case "template":
        return (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredTemplates.map((template) => {
                const previewPrimaryText =
                  template.adCopy.primary || template.description || template.promoDetails || "Template preview";
                const previewHeadline = template.adCopy.headlines?.[0] || template.name;
                const previewDescription = template.promoDetails || template.adCopy.descriptions?.[0] || "";
                const previewCta = getMetaCompatibleCtaLabel(
                  launchState.selection.adType || template.defaultAdType || "lead_form",
                );
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => selectTemplateAndAdvance(template)}
                    className={cn(
                      "group h-full overflow-hidden rounded-[24px] border text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklab,var(--brand)_50%,white)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]",
                      "border-[var(--line)] bg-white shadow-[var(--shadow-soft)] hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--brand)_18%,white)] hover:bg-white active:translate-y-px",
                    )}
                  >
                    <FacebookAdPreview
                      template={template}
                      pageName={pagePreviewIdentity.pageName}
                      pageAvatarUrl={pagePreviewIdentity.pageAvatarUrl}
                      primaryText={previewPrimaryText}
                      headline={previewHeadline}
                      description={previewDescription}
                      ctaLabel={previewCta}
                      imageUrl={template.previewImage || null}
                      compact
                      showMetaBar={false}
                      showReactionsBar={false}
                      showActionsRow={false}
                      interactiveControls={false}
                      className="border-0 bg-transparent p-0 shadow-none"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        );
      case "ad-type":
        return (
          <SectionCard
            title="Pick Ad Type"
            description="This controls the rest of the step flow, validation rules, and Meta publish preparation."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              {adTypeOptions.map((option) => {
                const Icon = option.icon;
                const active =
                  option.id === "messenger_leads"
                    ? launchState.selection.adType === "messenger_leads" ||
                      launchState.selection.adType === "messenger_engagement"
                    : launchState.selection.adType === option.id;
                const templateSupportsOption = templateSupportsAdType(selectedTemplate, option.id);

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
                        <span className="mt-2 block text-xs leading-5 text-[var(--muted-strong)]">
                          {getAdTypeFieldHint(option.id)}
                        </span>
                        {!templateSupportsOption ? (
                          <span className="mt-2 inline-flex rounded-full bg-[var(--soft-panel)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-strong)]">
                            Not preset by template
                          </span>
                        ) : null}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </SectionCard>
        );
      case "campaign-basics":
        return (
          <SectionCard
            title="Campaign Basics"
            description="Only the shared Meta essentials live here: campaign name, Facebook Page, ad account, and daily budget."
          >
            <div className="grid gap-4">
              <SectionCard
                title="Campaign Basics"
                description="Set the campaign identity and the account it will run from."
                className="bg-[var(--soft-panel)]"
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
                      placeholder="Campaign name"
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
                  <div className="space-y-2 lg:col-span-2">
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
              </SectionCard>

              <SectionCard
                title="Budget & Schedule"
                description="Keep the spend settings in their own block so they stay easy to scan."
                className="bg-[var(--soft-panel)]"
              >
                <div className="max-w-md space-y-2">
                  <label className="block text-sm font-medium text-[var(--ink)]">Daily budget</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[var(--muted-strong)]">
                      $
                    </span>
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
                      className="pl-8"
                    />
                  </div>
                  <p className="text-sm text-[var(--muted)]">Used as the Meta ad set daily budget.</p>
                </div>
              </SectionCard>
            </div>
          </SectionCard>
        );
      case "location":
        return (
          <SectionCard
            title="Target Location"
            description="Use the no-map flow: search Meta locations when possible, or add a manual fallback cleanly."
          >
            <div className="grid gap-4">
              <SectionCard
                title="Location Search"
                description="Find Meta-recognized locations first, then pick the matching targeting mode."
                className="bg-[var(--soft-panel)]"
              >
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_14rem]">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[var(--ink)]">Location</label>
                    <div className="relative">
                      <Input
                        value={pendingLocation}
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          setPendingLocation(nextValue);
                          setActiveLocationSuggestionIndex(0);
                          if (nextValue.trim().length < 2) {
                            locationSearchAbortRef.current?.abort();
                            setLocationSuggestions([]);
                            setLocationSearchError(null);
                            setIsSearchingLocations(false);
                          }
                        }}
                        onKeyDown={handleLocationKeyDown}
                        onFocus={() => {
                          if (locationSuggestions.length) {
                            setActiveLocationSuggestionIndex(0);
                          }
                        }}
                        placeholder="Search a city, state, ZIP, or address"
                        autoComplete="off"
                        aria-autocomplete="list"
                        aria-expanded={locationSuggestions.length > 0}
                      />
                      {locationSuggestions.length ? (
                        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-[18px] border border-[var(--line)] bg-white shadow-[0_20px_48px_rgba(15,23,42,0.12)]">
                          {locationSuggestions.slice(0, 6).map((suggestion, index) => (
                            <button
                              key={suggestion.id}
                              type="button"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => addLocationFromSuggestion(suggestion)}
                              className={cn(
                                "flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors",
                                index === activeLocationSuggestionIndex
                                  ? "bg-[rgba(109,94,248,0.08)]"
                                  : "hover:bg-[rgba(15,23,42,0.03)]",
                              )}
                            >
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-medium text-[var(--ink)]">
                                  {suggestion.label}
                                </span>
                                <span className="block text-xs text-[var(--muted)]">
                                  {`${getLocationScopeLabel(suggestion.scope)}${suggestion.source ? ` • ${suggestion.source === "meta" ? "Meta" : "Autocomplete"}` : ""}`}
                                </span>
                              </span>
                              {index === activeLocationSuggestionIndex ? (
                                <span className="shrink-0 rounded-full bg-[var(--brand)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                                  Enter
                                </span>
                              ) : (
                                <ChevronRight className="h-4 w-4 shrink-0 text-[var(--muted)]" />
                              )}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
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
              </SectionCard>

              <SectionCard title="Selected Locations" description="Adjust radius and distance for each saved location." className="bg-[var(--soft-panel)]">
                <div className="space-y-3">
                  {launchState.targeting.locations.map((location) => (
                    <div
                      key={location.id}
                      className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--ink)]">{location.label}</p>
                          <p className="text-xs text-[var(--muted)]">
                            {location.scope ? `${location.scope} • ` : ""}
                            {locationTargetingModeOptions.find((item) => item.value === location.targetingMode)?.label}
                          </p>
                        </div>
                        <Button type="button" variant="outline" onClick={() => removeLocation(location.id)}>
                          Remove
                        </Button>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
                        <div className="space-y-2">
                          <label className="block text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted-strong)]">
                            Radius
                          </label>
                          <Input
                            type="number"
                            min={1}
                            max={50}
                            step={1}
                            value={location.radius}
                            onChange={(event) =>
                              updateLocationTargeting(location.id, {
                                radius: event.target.value,
                              })
                            }
                            disabled={location.radiusAllowed === false}
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted-strong)]">
                            Distance
                          </label>
                          <select
                            value={location.distanceUnit || "mile"}
                            onChange={(event) =>
                              updateLocationTargeting(location.id, {
                                distanceUnit: event.target.value as CampaignLaunchLocation["distanceUnit"],
                              })
                            }
                            disabled={location.radiusAllowed === false}
                            className="h-10 w-full rounded-[16px] border border-[var(--line)] bg-white px-3 text-sm text-[var(--ink)] disabled:cursor-not-allowed disabled:bg-[var(--soft-panel)]"
                          >
                            <option value="mile">Miles</option>
                            <option value="kilometer">Kilometers</option>
                          </select>
                        </div>
                      </div>
                      {location.radiusAllowed === false ? (
                        <p className="mt-2 text-xs text-[var(--muted)]">
                          This location type does not support radius targeting in Meta.
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Audience Filters" description="Keep age targeting separate so it is easy to scan." className="bg-[var(--soft-panel)]">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[var(--ink)]">Minimum age</label>
                    <Input
                      type="number"
                      min={18}
                      max={65}
                      value={launchState.targeting.ageMin}
                      onChange={(event) =>
                        updateLaunchState((current) => ({
                          ...current,
                          targeting: {
                            ...current.targeting,
                            ageMin: event.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[var(--ink)]">Maximum age</label>
                    <Input
                      type="number"
                      min={18}
                      max={65}
                      value={launchState.targeting.ageMax}
                      onChange={(event) =>
                        updateLaunchState((current) => ({
                          ...current,
                          targeting: {
                            ...current.targeting,
                            ageMax: event.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              </SectionCard>
            </div>
          </SectionCard>
        );
      case "destination-setup":
        return (
          <SectionCard
            title="Destination Setup"
            description="Only the destination settings that match the selected ad type appear here."
          >
            {launchState.selection.adType === "lead_form" ? (
              <div className="grid gap-4">
                <SectionCard
                  title="Form Setup"
                  description="Choose the form source and the contact fields it should collect."
                  className="bg-[var(--soft-panel)]"
                >
                  <div className="grid gap-4">
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
                        <div className="grid gap-4 lg:grid-cols-2">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-[var(--ink)]">Form name</label>
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
                              placeholder="Lead form name"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-[var(--ink)]">Privacy policy URL</label>
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
                              placeholder="https://yourbusiness.com/privacy"
                            />
                          </div>
                        </div>

                        <div className="rounded-[24px] border border-[var(--line)] bg-[rgba(15,23,42,0.02)] p-4">
                          <div className="mb-3">
                            <p className="text-sm font-semibold text-[var(--ink)]">Standard Fields</p>
                            <p className="text-xs leading-5 text-[var(--muted)]">
                              These map to Meta’s standard prefill questions and can be added or removed cleanly.
                            </p>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
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
                                    "rounded-2xl border px-3 py-3 text-left transition-colors",
                                    selected
                                      ? "border-[var(--brand)] bg-[rgba(109,94,248,0.08)]"
                                      : "border-[var(--line)] bg-white",
                                  )}
                                >
                                  <p className="text-sm font-semibold text-[var(--ink)]">{option.label}</p>
                                  <p className="mt-1 text-xs text-[var(--muted)]">{option.hint}</p>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="rounded-[24px] border border-[var(--line)] bg-[rgba(15,23,42,0.02)] p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-[var(--ink)]">Custom Questions</p>
                              <p className="text-xs leading-5 text-[var(--muted)]">
                                Add short-answer or multiple-choice questions that map into Meta’s custom question payload.
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button type="button" variant="outline" onClick={() => addLeadFormCustomQuestion("SHORT_ANSWER")}>
                                Add Short Answer
                              </Button>
                              <Button type="button" variant="outline" onClick={() => addLeadFormCustomQuestion("MULTIPLE_CHOICE")}>
                                Add Multiple Choice
                              </Button>
                            </div>
                          </div>

                          {launchState.adTypeConfig.leadForm.customQuestions.length ? (
                            <div className="mt-4 space-y-4">
                              {launchState.adTypeConfig.leadForm.customQuestions.map((question, questionIndex) => (
                                <div key={question.id} className="rounded-[20px] border border-[var(--line)] bg-white p-4">
                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-semibold text-[var(--ink)]">
                                        {question.type === "MULTIPLE_CHOICE" ? "Multiple Choice" : "Short Answer"} Question
                                      </p>
                                      <p className="text-xs text-[var(--muted)]">Question {questionIndex + 1}</p>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => moveLeadFormCustomQuestion(question.id, -1)}
                                        disabled={questionIndex === 0}
                                      >
                                        Up
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => moveLeadFormCustomQuestion(question.id, 1)}
                                        disabled={questionIndex === launchState.adTypeConfig.leadForm.customQuestions.length - 1}
                                      >
                                        Down
                                      </Button>
                                      <Button type="button" variant="outline" onClick={() => removeLeadFormCustomQuestion(question.id)}>
                                        Remove
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                                    <div className="space-y-2">
                                      <label className="block text-sm font-medium text-[var(--ink)]">Question label</label>
                                      <Input
                                        value={question.label}
                                        onChange={(event) =>
                                          updateLeadFormCustomQuestion(question.id, (currentQuestion) => {
                                            const nextLabel = event.target.value;
                                            const nextKey = currentQuestion.key.trim()
                                              ? currentQuestion.key
                                              : normalizeQuestionKey(nextLabel);
                                            return {
                                              ...currentQuestion,
                                              label: nextLabel,
                                              key: nextKey,
                                            };
                                          })
                                        }
                                        placeholder="What service are you interested in?"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="block text-sm font-medium text-[var(--ink)]">Internal key</label>
                                      <Input
                                        value={question.key}
                                        onChange={(event) =>
                                          updateLeadFormCustomQuestion(question.id, (currentQuestion) => ({
                                            ...currentQuestion,
                                            key: normalizeQuestionKey(event.target.value),
                                          }))
                                        }
                                        placeholder="service_interest"
                                      />
                                      <p className="text-xs leading-5 text-[var(--muted)]">
                                        Used for a stable Meta payload key. Letters, numbers, and underscores only.
                                      </p>
                                    </div>
                                  </div>

                                  {question.type === "MULTIPLE_CHOICE" ? (
                                    <div className="mt-4 space-y-3">
                                      <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm font-medium text-[var(--ink)]">Options</p>
                                        <Button type="button" variant="outline" onClick={() => addLeadFormCustomOption(question.id)}>
                                          Add Option
                                        </Button>
                                      </div>
                                      <div className="space-y-2">
                                        {question.options.map((option, optionIndex) => (
                                          <div key={option.id} className="flex items-center gap-2">
                                            <Input
                                              value={option.value}
                                              onChange={(event) =>
                                                updateLeadFormCustomOption(question.id, option.id, event.target.value)
                                              }
                                              placeholder={`Option ${optionIndex + 1}`}
                                            />
                                            <Button
                                              type="button"
                                              variant="outline"
                                              onClick={() => removeLeadFormCustomOption(question.id, option.id)}
                                              disabled={question.options.length <= 1}
                                            >
                                              Remove
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-4 text-sm text-[var(--muted)]">
                              No custom questions yet. Add one when you need qualification beyond Meta’s standard prefill fields.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </SectionCard>

                <SectionCard
                  title="Thank You Page"
                  description="Optional post-submit destination and button settings."
                  className="bg-[var(--soft-panel)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-medium text-[var(--ink)]">Enable thank-you page</p>
                    <label className="flex items-center gap-2 text-sm text-[var(--muted-strong)]">
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
                        className="h-4 w-4 rounded border-[var(--line)]"
                      />
                      Enabled
                    </label>
                  </div>

                  {launchState.adTypeConfig.leadForm.thankYou.enabled ? (
                    <div className="mt-4 grid gap-4">
                      <div className="grid gap-4 lg:grid-cols-2">
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
                      <div className="grid gap-4 lg:grid-cols-[12rem_minmax(0,1fr)]">
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
                          <option value="OPEN_WEBSITE">Website</option>
                          <option value="DOWNLOAD">Download</option>
                          <option value="CALL_BUSINESS">Call Business</option>
                        </select>
                        {launchState.adTypeConfig.leadForm.thankYou.buttonAction === "CALL_BUSINESS" ? (
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
                        ) : (
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
                        )}
                      </div>
                    </div>
                  ) : null}
                </SectionCard>
              </div>
            ) : null}

            {launchState.selection.adType === "landing_page" ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[var(--ink)]">Final website URL</label>
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
                    placeholder="https://yourbusiness.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[var(--ink)]">Tracking pixel (optional)</label>
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
                    <option value="">No pixel selected</option>
                    {(metaIntegration?.assets.pixels || []).map((pixel) => (
                      <option key={pixel.asset_id} value={pixel.asset_id}>
                        {pixel.name || pixel.asset_id}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}

            {launchState.selection.adType === "call_now" ? (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[var(--ink)]">Business phone number</label>
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
            ) : null}

            {(launchState.selection.adType === "messenger_leads" ||
              launchState.selection.adType === "messenger_engagement") ? (
              <div className="grid gap-4">
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
        );
      case "placeholders": {
        const placeholderPreviewPrimary =
          previewBlueprint?.adCopy.primary ||
          selectedTemplate?.adCopy.primary ||
          selectedTemplate?.description ||
          "";
        const placeholderPreviewHeadline =
          previewBlueprint?.funnelConfig.headline ||
          selectedTemplate?.name ||
          "Template headline";
        const placeholderPreviewDescription =
          previewBlueprint?.adCopy.descriptions[0] ||
          selectedTemplate?.promoDetails ||
          "";
        const placeholderPreviewCta =
          previewBlueprint?.funnelConfig.ctaText ||
          launchState.review.ctaText ||
          selectedTemplate?.ctaDefault ||
          "Learn more";

        return (
          <SectionCard
            title="Fill Placeholders"
            description="This step is generated from the template content. Every deduplicated template variable lives here."
          >
            <div className="grid gap-6">
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

              <div className="mx-auto w-full max-w-[18rem] overflow-hidden rounded-[24px] border border-[var(--line)] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                <div className="overflow-hidden rounded-[24px] bg-white">
                  <FacebookAdPreview
                    template={selectedTemplate}
                    pageName={pagePreviewIdentity.pageName}
                    pageAvatarUrl={pagePreviewIdentity.pageAvatarUrl}
                    primaryText={placeholderPreviewPrimary}
                    headline={placeholderPreviewHeadline}
                    description={placeholderPreviewDescription}
                    ctaLabel={placeholderPreviewCta}
                    imageUrl={selectedTemplate?.previewImage || null}
                    compact
                    showMetaHeader
                    showMetaBar={false}
                    showReactionsBar={false}
                    showActionsRow={false}
                    interactiveControls={false}
                    className="border-0 bg-transparent p-0 shadow-none"
                  />
                </div>
              </div>
            </div>
          </SectionCard>
        );
      }
      case "review-launch":
        return (
          <div className="space-y-6">
            <SectionCard
              title="Launch Actions"
              description="Save a draft now, or launch the campaign and let readiness checks run automatically."
            >
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => persistDraft()}
                  disabled={!selectedTemplate || saveState === "saving"}
                >
                  {saveState === "saving" ? "Saving..." : "Save Draft"}
                </Button>
                <Button type="button" onClick={() => handleLaunch("live")} disabled={isPublishing || !selectedTemplate}>
                  {isPublishing ? "Launching..." : "Launch Campaign"}
                  <Rocket className="h-4 w-4" />
                </Button>
                {!metaConnected || launchState.selection.adType === "lead_form" ? (
                  <Button type="button" variant="outline" asChild>
                    <Link href={metaConnectHref}>Reconnect Facebook</Link>
                  </Button>
                ) : null}
              </div>
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                Launching automatically runs preflight. If anything blocks publish, the issues will appear below.
              </p>
              {saveState === "error" && saveError ? (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
                  {saveError}
                </div>
              ) : null}
            </SectionCard>

            <SectionCard
              title="Review Summary"
              description="This final step keeps only the launch-critical details visible before publish."
            >
              <div className="grid gap-4">
                <ReviewGroupCard
                  title="Campaign Basics"
                  description="Review the high-level campaign identity before launch."
                  onEdit={() => updateLaunchState((current) => ({ ...current, stepId: "campaign-basics" }))}
                >
                  <SummaryRow label="Campaign name" value={launchState.campaign.name || "Missing"} />
                  <SummaryRow
                    label="Ad account"
                    value={
                      metaIntegration?.assets.adAccounts.find((account) => account.asset_id === launchState.integrationSelections.adAccountId)?.name || "Missing"
                    }
                  />
                  <SummaryRow
                    label="Facebook Page"
                    value={
                      metaIntegration?.assets.pages.find((page) => page.asset_id === launchState.integrationSelections.pageId)?.name || "Missing"
                    }
                  />
                </ReviewGroupCard>

                <ReviewGroupCard
                  title="Budget & Schedule"
                  description="Keep spend in its own block so it is easy to verify."
                  onEdit={() => updateLaunchState((current) => ({ ...current, stepId: "campaign-basics" }))}
                >
                  <SummaryRow label="Ad type" value={getAdTypeLabel(launchState.selection.adType)} />
                  <SummaryRow label="Daily budget" value={formatBudgetDisplay(launchState.campaign.dailyBudget)} />
                </ReviewGroupCard>

                <ReviewGroupCard
                  title="Targeting"
                  description="Locations and audience filters stay grouped together."
                  onEdit={() => updateLaunchState((current) => ({ ...current, stepId: "location" }))}
                >
                  <SummaryRow label="Locations" value={launchState.targeting.locations.length || 0} />
                  <SummaryRow
                    label="Age range"
                    value={`${launchState.targeting.ageMin || "18"} - ${launchState.targeting.ageMax || "65"}`}
                  />
                  <SummaryRow
                    label="Primary location"
                    value={launchState.targeting.locations[0]?.label || "Missing"}
                  />
                </ReviewGroupCard>

                <ReviewGroupCard
                  title="Destination Setup"
                  description="Confirm the correct Meta destination path for the selected ad type."
                  onEdit={() => updateLaunchState((current) => ({ ...current, stepId: "destination-setup" }))}
                >
                  <SummaryRow
                    label="Destination"
                    value={
                      launchState.selection.adType === "lead_form"
                        ? launchState.adTypeConfig.leadForm.mode === "existing"
                          ? launchState.adTypeConfig.leadForm.selectedFormName || "Existing Meta lead form"
                          : launchState.adTypeConfig.leadForm.managedFormName || "Managed lead form"
                        : launchState.selection.adType === "landing_page"
                          ? launchState.adTypeConfig.landingPage.url || "Missing"
                          : launchState.selection.adType === "call_now"
                            ? launchState.adTypeConfig.callNow.phoneNumber || "Missing"
                            : "Messenger conversation"
                    }
                  />
                  {launchState.selection.adType === "lead_form" ? (
                    <>
                      <SummaryRow
                        label="Form mode"
                        value={
                          launchState.adTypeConfig.leadForm.mode === "existing" ? "Existing Meta form" : "Managed by SideKick"
                        }
                      />
                      <SummaryRow
                        label="Thank-you page"
                        value={launchState.adTypeConfig.leadForm.thankYou.enabled ? "Enabled" : "Disabled"}
                      />
                    </>
                  ) : null}
                </ReviewGroupCard>

                <ReviewGroupCard
                  title="Creative Details"
                  description="Check the template copy and CTA that will be sent to Meta."
                  onEdit={() => updateLaunchState((current) => ({ ...current, stepId: "placeholders" }))}
                >
                  <SummaryRow label="Template" value={selectedTemplate?.name || "Missing"} />
                  <SummaryRow
                    label="CTA"
                    value={launchState.review.ctaText || selectedTemplate?.ctaDefault || "Learn more"}
                  />
                  <SummaryRow
                    label="Placeholders filled"
                    value={`${Object.values(launchState.placeholders.values).filter((value) => value.trim()).length} / ${placeholderFields.length}`}
                  />
                </ReviewGroupCard>
              </div>
            </SectionCard>

            <SectionCard
              title="Launch Readiness"
              description="Preflight results, blocking issues, and publish feedback appear here after you launch."
            >
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
                    {publishErrorDetails ? (
                      <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-white/70 p-3 text-xs leading-5 text-rose-800">
                        {publishErrorDetails}
                      </pre>
                    ) : null}
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
    <div
      className={cn(
        immersive
          ? "min-h-[calc(100vh-68px)] w-full bg-[radial-gradient(circle_at_top_left,rgba(109,94,248,0.12),transparent_30%),linear-gradient(180deg,#dbe8f4_0%,#eef4fb_100%)] p-0"
          : "min-h-[calc(100vh-2rem)] rounded-[36px] border border-white/70 bg-[radial-gradient(circle_at_top_left,rgba(109,94,248,0.12),transparent_30%),linear-gradient(180deg,#dbe8f4_0%,#eef4fb_100%)] p-3 sm:p-4",
      )}
    >
      <div
        className={cn(
          "grid min-h-[calc(100vh-3rem)] overflow-hidden bg-white lg:grid-cols-[19rem_minmax(0,1fr)]",
          immersive ? "rounded-none shadow-none min-h-[calc(100vh-68px)]" : "rounded-[32px] shadow-[0_28px_90px_rgba(15,23,42,0.10)]",
        )}
      >
        <aside className="relative overflow-hidden bg-[linear-gradient(180deg,var(--brand-ink)_0%,var(--brand)_100%)] px-6 py-7 text-white">
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/12 text-sm font-semibold">
                SK
              </div>
              <div>
                <p className="text-[1.02rem] font-semibold tracking-[-0.03em]">SideKick Studioss</p>
                <p className="text-sm text-white/70">Simple launch flow</p>
              </div>
            </div>

            <div className="mt-10 space-y-2">
              {wizardSections.map((section, index) => {
                const active = section.id === currentSectionDefinition.id;
                const sectionStartIndex = visibleSteps.findIndex((step) => section.stepIds.includes(step.id));
                const sectionEndIndex =
                  sectionStartIndex >= 0 ? sectionStartIndex + section.stepIds.length - 1 : -1;
                const complete = sectionEndIndex >= 0 && resolvedStepIndex > sectionEndIndex;
                const stepCountLabel = `${section.stepIds.length} step${section.stepIds.length === 1 ? "" : "s"}`;
                return (
                  <div key={section.id} className="flex flex-col items-start">
                    <button
                      type="button"
                      onClick={() =>
                        updateLaunchState((current) => ({
                          ...current,
                          stepId: section.stepIds[0],
                        }))
                      }
                      className={cn(
                        "group flex w-full items-start gap-4 rounded-[20px] px-3 py-3 text-left transition-colors",
                        active ? "bg-white/12" : "hover:bg-white/8",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-all",
                          complete
                            ? "bg-white text-[var(--brand-ink)]"
                            : active
                              ? "bg-white text-[var(--brand-ink)] shadow-[0_8px_20px_rgba(255,255,255,0.18)]"
                              : "border border-white/18 bg-white/8 text-white/85",
                        )}
                      >
                        {complete ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                      </span>
                      <span className="min-w-0">
                        <span className={cn("block text-[0.98rem] font-medium", active ? "text-white" : "text-white/86")}>
                          {section.label}
                        </span>
                        <span className="mt-1 block text-sm leading-5 text-white/66">{section.description}</span>
                        <span className="mt-2 inline-flex rounded-full border border-white/12 bg-white/8 px-2.5 py-0.5 text-[11px] font-medium tracking-[0.08em] text-white/72 uppercase">
                          {stepCountLabel}
                        </span>
                      </span>
                    </button>
                    {index < wizardSections.length - 1 ? (
                      <div className="ml-[1.125rem] h-6 w-px bg-white/14" />
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="mt-10 rounded-[24px] border border-white/12 bg-white/8 px-4 py-4 text-sm leading-6 text-white/78">
              Clean, guided setup with the right Meta fields appearing only when they are needed.
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.14),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.10),transparent_40%)] opacity-70" />
        </aside>

        <main className="flex min-w-0 flex-col bg-[linear-gradient(180deg,#ffffff_0%,#fbfcfe_100%)]">
          <div className="border-b border-[var(--line)] px-6 py-6 sm:px-8 sm:py-8 lg:px-10">
            <p className="text-sm font-medium text-[var(--muted-strong)]">
              Step {currentSectionIndex + 1} / {wizardSections.length}
            </p>
            <h1 className="mt-2 text-[clamp(2rem,3vw,3.1rem)] font-semibold tracking-[-0.06em] text-[var(--ink)]">
              {currentSectionDefinition?.label || "Launch"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              {currentSectionDefinition?.description || "Work through the steps one at a time with a clean, simple flow."}
            </p>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-6 px-6 py-6 sm:px-8 lg:px-10">
            {currentIssues.length > 0 ? <IssueList title="Current step issues" issues={currentIssues} /> : null}

            <div className="space-y-5">
              {renderStepContent()}

              {launchState.stepId === "review-launch" ? (
                <SectionCard
                  title="Preview"
                  description="A quick look at how the selected template will render before you publish."
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
              ) : null}
            </div>

            <div className="mt-auto flex items-center justify-between gap-4 border-t border-[var(--line)] pt-5">
              <Button type="button" variant="outline" onClick={handleBack} disabled={currentStepIndex <= 0}>
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              {launchState.stepId !== "review-launch" ? (
                <Button type="button" onClick={handleContinue}>
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
