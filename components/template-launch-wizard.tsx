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
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  carDetailingLaunchCategories,
  normalizeIndustryLabel,
  normalizeTemplateCategoryKey,
  resolveTemplateCtaLabel,
  resolveTemplateLaunchCategory,
  supportedIndustries,
} from "@/data/template-taxonomy";
import { FacebookAdPreview } from "@/components/facebook-ad-preview";
import { resolveMetaPagePreviewIdentity } from "@/lib/meta-page-identity";
import { buildResolvedPlaceholderMap } from "@/lib/template-placeholders";
import { cn } from "@/lib/utils";
import {
  createInitialCampaignLaunchState,
  evaluateLaunchReadiness,
  getAdTypeLabel,
  getCampaignGoalForAdType,
  getNextWizardStep,
  getPreviousWizardStep,
  getWizardSectionForStep,
  getTemplatePlaceholderFields,
  getTemplateSetupValuesFromLaunchState,
  getCampaignPreviewDisplayLink,
  getVisibleWizardSteps,
  locationTargetingModeOptions,
  normalizeCampaignLaunchState,
  validateWizardStep,
} from "@/lib/campaign-launch";
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

type BudgetGuidanceResponse = {
  currency: string;
  maxDailyBudget: number;
  spendCap: number | null;
  remainingSpendCap: number | null;
  note: string;
  estimate: {
    metricLabel: string | null;
    averageUnitCost: number | null;
    lowPerDay: number | null;
    highPerDay: number | null;
    source: "meta_lead_history" | "meta_click_history" | "meta_unavailable";
    note: string;
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
    keyMode: "auto",
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
        "rounded-[28px] border border-[rgba(102,112,133,0.12)] bg-white/96 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm",
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

function TopStepPill({
  stepNumber,
  label,
  active,
  complete,
}: {
  stepNumber: number;
  label: string;
  active: boolean;
  complete: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold transition-all",
          complete || active
            ? "border-[var(--brand)] bg-[var(--brand)] text-white shadow-[0_10px_18px_rgba(109,94,248,0.18)]"
            : "border-[rgba(102,112,133,0.18)] bg-white text-[var(--muted-strong)]",
        )}
      >
        {complete ? <CheckCircle2 className="h-3.5 w-3.5" /> : stepNumber}
      </span>
      <span className={cn("text-xs font-medium", active ? "text-[var(--ink)]" : "text-[var(--muted)]")}>
        {label}
      </span>
    </div>
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

function formatCurrencyAmount(value: number, currency = "USD", maximumFractionDigits = 0) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits,
  }).format(value);
}

function budgetToSliderValue(amount: number, min: number, max: number) {
  if (max <= min) return 0;
  const safeAmount = Math.min(max, Math.max(min, amount));
  return Math.round(
    ((Math.log(safeAmount) - Math.log(min)) / (Math.log(max) - Math.log(min))) * 100,
  );
}

function sliderValueToBudget(value: number, min: number, max: number) {
  if (max <= min) return min;
  const ratio = Math.min(100, Math.max(0, value)) / 100;
  const scaled = Math.exp(Math.log(min) + (Math.log(max) - Math.log(min)) * ratio);
  const rounded =
    scaled >= 10000 ? Math.round(scaled / 250) * 250
    : scaled >= 2500 ? Math.round(scaled / 100) * 100
    : scaled >= 1000 ? Math.round(scaled / 50) * 50
    : scaled >= 250 ? Math.round(scaled / 25) * 25
    : scaled >= 100 ? Math.round(scaled / 10) * 10
    : Math.round(scaled / 5) * 5;

  return Math.min(max, Math.max(min, rounded));
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

const industryVisuals: Record<string, { emoji: string; color: string; bg: string }> = {
  "Car Detailing": { emoji: "🚗", color: "#C05621", bg: "#FFF0E6" },
  "Chiropractic": { emoji: "🧑‍⚕️", color: "#0369A1", bg: "#E0F2FE" },
  "Physical Therapy": { emoji: "💪", color: "#166534", bg: "#DCFCE7" },
  "Cleaning Services": { emoji: "🧹", color: "#6D28D9", bg: "#EDE9FE" },
  "Fitness / Personal Training": { emoji: "🏋️", color: "#0F766E", bg: "#CCFBF1" },
  "Flooring": { emoji: "🪵", color: "#92400E", bg: "#FEF3C7" },
  "Landscape / Lawn Care": { emoji: "🌿", color: "#15803D", bg: "#DCFCE7" },
  "Plumbing": { emoji: "🔧", color: "#0E7490", bg: "#CFFAFE" },
  "Pool Services": { emoji: "🏊", color: "#1D4ED8", bg: "#DBEAFE" },
  "Roofing": { emoji: "🏠", color: "#B91C1C", bg: "#FEE2E2" },
  "Spas & Massage": { emoji: "💆", color: "#BE185D", bg: "#FCE7F3" },
};

function AnimatedNumber({ value, duration = 300 }: { value: number; duration?: number }) {
  const [shown, setShown] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    const t0 = performance.now();
    let raf: number;
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      setShown(Math.round(from + (to - from) * eased));
      if (k < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{shown}</>;
}

function WizardDisclosure({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lf-disclosure" data-open={open}>
      <div className="lf-disclosure-head" onClick={() => setOpen((v) => !v)}>
        <span className="lf-disclosure-label">{label}</span>
        {value ? <span className="lf-disclosure-value">{value}</span> : null}
        <svg className="lf-disclosure-chevron" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      {open ? <div className="lf-disclosure-body">{children}</div> : null}
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
  const [preflightError, setPreflightError] = useState<string | null>(null);
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
  const [budgetGuidance, setBudgetGuidance] = useState<BudgetGuidanceResponse | null>(null);
  const [budgetGuidanceError, setBudgetGuidanceError] = useState<string | null>(null);
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState("all");
  const locationSuggestionCacheRef = useRef<Map<string, CachedLocationLookup>>(new Map());
  const locationSearchAbortRef = useRef<AbortController | null>(null);
  const budgetGuidanceAbortRef = useRef<AbortController | null>(null);

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
    setLaunchState((current) => {
      const nextAdAccountId = metaIntegration?.selected.adAccountId || "";
      const nextPageId = metaIntegration?.selected.pageId || "";
      const nextInstagramActorId = metaIntegration?.selected.instagramActorId || "";

      if (
        current.integrationSelections.adAccountId === nextAdAccountId &&
        current.integrationSelections.pageId === nextPageId &&
        current.integrationSelections.instagramActorId === nextInstagramActorId
      ) {
        return current;
      }

      return {
        ...current,
        integrationSelections: {
          ...current.integrationSelections,
          adAccountId: nextAdAccountId,
          pageId: nextPageId,
          instagramActorId: nextInstagramActorId,
        },
      };
    });
  }, [
    metaIntegration?.selected.adAccountId,
    metaIntegration?.selected.pageId,
    metaIntegration?.selected.instagramActorId,
  ]);

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

  useEffect(() => {
    const adAccountId = launchState.integrationSelections.adAccountId;
    const adType = launchState.selection.adType;

    if (!adAccountId) {
      budgetGuidanceAbortRef.current?.abort();
      return;
    }

    budgetGuidanceAbortRef.current?.abort();
    const controller = new AbortController();
    budgetGuidanceAbortRef.current = controller;
    let cancelled = false;

    fetch(`/api/meta/budget-guidance?adAccountId=${encodeURIComponent(adAccountId)}&adType=${encodeURIComponent(adType)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as BudgetGuidanceResponse & { error?: string } | null;
        if (cancelled) return;
        if (!response.ok || !payload || payload.error) {
          setBudgetGuidance(null);
          setBudgetGuidanceError(payload?.error || "Meta budget guidance could not be loaded.");
          return;
        }
        setBudgetGuidance(payload);
        setBudgetGuidanceError(null);
      })
      .catch(() => {
        if (!cancelled && !controller.signal.aborted) {
          setBudgetGuidance(null);
          setBudgetGuidanceError("Meta budget guidance could not be loaded.");
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [launchState.integrationSelections.adAccountId, launchState.selection.adType]);

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
  const currentStepDefinition = visibleSteps[resolvedStepIndex] || visibleSteps[0] || null;
  const { section: currentSectionDefinition } = useMemo(
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
  function getTemplateLaunchCategory(template: TemplateSeed) {
    const resolvedCategory = resolveTemplateLaunchCategory(template);
    const fallbackCategory =
      template.category && template.category.trim().toLowerCase() !== template.industry?.trim().toLowerCase()
        ? template.category.trim()
        : "";
    return resolvedCategory || fallbackCategory || "Uncategorized";
  }
  const templateCategoryOptions = useMemo(() => {
    const categoryCounts = new Map<string, number>();
    const normalizedTemplates = filteredTemplates.map((template) => ({
      template,
      category: getTemplateLaunchCategory(template),
    }));

    normalizedTemplates.forEach(({ category }) => {
      const key = normalizeTemplateCategoryKey(category);
      categoryCounts.set(key, (categoryCounts.get(key) || 0) + 1);
    });

    if (launchState.selection.industry === "Car Detailing") {
      return carDetailingLaunchCategories
        .filter((label) => label !== "All")
        .map((label) => ({
          key: normalizeTemplateCategoryKey(label),
          label,
          count: categoryCounts.get(normalizeTemplateCategoryKey(label)) || 0,
        }));
    }

    return Array.from(
      new Map(
        normalizedTemplates.map(({ category }) => {
          const key = normalizeTemplateCategoryKey(category);
          return [key, { key, label: category, count: categoryCounts.get(key) || 0 }];
        }),
      ).values(),
    ).sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }
      return left.label.localeCompare(right.label);
    });
  }, [filteredTemplates, launchState.selection.industry]);
  const visibleTemplates = useMemo(() => {
    if (templateCategoryFilter === "all") {
      return filteredTemplates;
    }

    return filteredTemplates.filter((template) => {
      const category = normalizeTemplateCategoryKey(getTemplateLaunchCategory(template));
      return category === templateCategoryFilter;
    });
  }, [filteredTemplates, templateCategoryFilter]);
  const availableIndustries = useMemo(() => {
    const dynamicIndustries = Array.from(
      new Set(
        templates
          .map((template) => normalizeIndustryLabel(template.industry || template.category || ""))
          .filter(Boolean),
      ),
    );

    return dynamicIndustries.length ? dynamicIndustries : supportedIndustries;
  }, [templates]);

  useEffect(() => {
    setTemplateCategoryFilter("all");
  }, [launchState.selection.industry]);

  useEffect(() => {
    if (templateCategoryFilter === "all") {
      return;
    }

    if (!templateCategoryOptions.some((option) => option.key === templateCategoryFilter)) {
      setTemplateCategoryFilter("all");
    }
  }, [templateCategoryFilter, templateCategoryOptions]);

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
  const previewPlaceholderValues = useMemo(
    () =>
      buildResolvedPlaceholderMap(launchState.placeholders.values, {
        businessName: setupValues?.businessName || businessProfile?.business_name || "",
        city: setupValues?.city || "",
        ctaText: launchState.review.ctaText || setupValues?.ctaText || "",
        offerPrice: setupValues?.offerPrice || "",
        regularPrice: setupValues?.regularPrice || "",
      }),
    [
      businessProfile?.business_name,
      launchState.placeholders.values,
      launchState.review.ctaText,
      setupValues?.businessName,
      setupValues?.city,
      setupValues?.ctaText,
      setupValues?.offerPrice,
      setupValues?.regularPrice,
    ],
  );

  useEffect(() => {
    if (process.env.NODE_ENV === "production" || !selectedTemplate) return;
    console.debug("[launch preview CTA]", {
      templateSlug: selectedTemplate.slug,
      rawTemplateCta: selectedTemplate.ctaDefault,
      templateCtaType: selectedTemplate.ctaType || null,
      templateCtaLabel: selectedTemplate.ctaLabel || null,
      funnelFinalCta: previewBlueprint?.funnelConfig.ctaText || null,
      reviewCta: launchState.review.ctaText || null,
      resolved: launchState.review.ctaText || previewBlueprint?.funnelConfig.ctaText || selectedTemplate.ctaDefault || null,
    });
  }, [launchState.review.ctaText, previewBlueprint?.funnelConfig.ctaText, selectedTemplate]);
  const pagePreviewIdentity = resolveMetaPagePreviewIdentity({
    integration: metaIntegration,
    preferredPageId: launchState.integrationSelections.pageId,
    fallbackName: businessProfile?.business_name || "Select a Facebook Page",
  });
  const visibleBudgetGuidance = launchState.integrationSelections.adAccountId ? budgetGuidance : null;
  const visibleBudgetGuidanceError = launchState.integrationSelections.adAccountId ? budgetGuidanceError : null;
  const previewDisplayLink = useMemo(
    () => getCampaignPreviewDisplayLink(launchState, selectedTemplate?.displayLink || null),
    [launchState, selectedTemplate?.displayLink],
  );

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
          category: getTemplateLaunchCategory(template),
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

  async function persistDraft(nextState = launchState, redirectAfterSave = false) {
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
    if (redirectAfterSave) {
      router.push("/templates");
    }
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

    setPreflightError(null);
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
    router.push("/templates");
  }

  function renderStepContent() {
    switch (launchState.stepId) {
      case "industry":
        return (
          <div className="lf-industry-grid lf-fade">
            {availableIndustries.map((industry) => {
              const visuals = industryVisuals[industry] || { emoji: "🏢", color: "#6D5EF8", bg: "#EFECFF" };
              const active = launchState.selection.industry === industry;
              return (
                <button
                  key={industry}
                  type="button"
                  data-active={active}
                  className="lf-industry-tile focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-offset-2"
                  onClick={() =>
                    updateLaunchState((current) =>
                      normalizeCampaignLaunchState(
                        {
                          ...current,
                          selection: {
                            ...current.selection,
                            industry,
                            category: "",
                          },
                        },
                        selectedTemplate || templates[0],
                        businessProfile,
                      ),
                    )
                  }
                >
                  <div className="lf-industry-icon" style={{ background: visuals.bg, color: visuals.color }}>
                    {visuals.emoji}
                  </div>
                  <span className="text-sm font-semibold leading-tight text-[var(--foreground)]">{industry}</span>
                </button>
              );
            })}
          </div>
        );
      case "template":
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTemplateCategoryFilter("all")}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-semibold transition",
                  templateCategoryFilter === "all"
                    ? "border-[var(--brand)] bg-[var(--brand)] text-white shadow-[0_10px_20px_rgba(109,94,248,0.18)]"
                    : "border-[var(--line)] bg-white text-[var(--muted-strong)] hover:border-[color-mix(in_oklab,var(--brand)_18%,white)] hover:text-[var(--ink)]",
                )}
              >
                All
              </button>
              {templateCategoryOptions.map((category) => {
                const active = templateCategoryFilter === category.key;
                return (
                  <button
                    key={category.key}
                    type="button"
                    onClick={() => setTemplateCategoryFilter(category.key)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-semibold transition",
                      active
                        ? "border-[var(--brand)] bg-[color-mix(in_oklab,var(--brand)_12%,white)] text-[var(--brand)] shadow-[0_10px_20px_rgba(109,94,248,0.10)]"
                        : "border-[var(--line)] bg-white text-[var(--muted-strong)] hover:border-[color-mix(in_oklab,var(--brand)_18%,white)] hover:text-[var(--ink)]",
                    )}
                  >
                    {category.label}
                    <span className="ml-2 text-[11px] font-medium opacity-70">{category.count}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibleTemplates.map((template) => {
                const previewPrimaryText =
                  template.adCopy.primary || template.description || template.promoDetails || "Template preview";
                const previewHeadline = template.adCopy.headlines?.[0] || template.name;
                const previewDescription = template.adCopy.descriptions?.[0] || template.promoDetails || "";
                const previewCta =
                  template.ctaLabel ||
                  previewBlueprint?.funnelConfig.ctaText ||
                  resolveTemplateCtaLabel(template, "Learn more");
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
                      displayLink={null}
                      ctaLabel={previewCta}
                    imageUrl={template.previewImage || null}
                    compact
                    showCompactDescription
                    showMetaBar
                    showReactionsBar={false}
                    showActionsRow={false}
                    interactiveControls={false}
                      className="border-0 bg-transparent p-0 shadow-none"
                    />
                  </button>
                );
              })}
            </div>
            {!visibleTemplates.length ? (
              <div className="rounded-[24px] border border-dashed border-[var(--line)] bg-white px-6 py-10 text-center text-sm text-[var(--muted-strong)]">
                No templates match this category yet. Try another category or switch back to All.
              </div>
            ) : null}
          </div>
        );
      case "ad-type":
        return (
          <div className="grid gap-4 sm:grid-cols-2">
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
                    "relative overflow-hidden rounded-[28px] border p-7 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklab,var(--brand)_50%,white)] focus-visible:ring-offset-2",
                    active
                      ? "border-[var(--brand)] bg-[linear-gradient(135deg,rgba(109,94,248,0.08)_0%,rgba(109,94,248,0.03)_100%)] shadow-[0_0_0_1px_var(--brand),0_20px_48px_rgba(109,94,248,0.14)]"
                      : "border-[var(--line)] bg-white shadow-[var(--shadow-soft)] hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--brand)_22%,white)] hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)] active:translate-y-px",
                  )}
                >
                  <div
                    className={cn(
                      "mb-5 flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200",
                      active
                        ? "bg-[var(--brand)] text-white shadow-[0_8px_20px_rgba(109,94,248,0.28)]"
                        : "bg-[rgba(109,94,248,0.08)] text-[var(--brand)]",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-[1.05rem] font-semibold tracking-[-0.02em] text-[var(--ink)]">{option.label}</p>
                  <p className="mt-2 text-sm leading-[1.7] text-[var(--muted)]">{option.description}</p>
                  {active ? (
                    <span className="absolute right-5 top-5 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand)]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                    </span>
                  ) : null}
                  {!templateSupportsOption ? (
                    <span className="mt-3 inline-block rounded-full bg-[var(--soft-panel)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-strong)]">
                      Not preset
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        );
      case "campaign-basics": {
        const budgetRaw = launchState.campaign.dailyBudget.replace(/[^0-9.]/g, "");
        const budgetAmount = Number.parseFloat(budgetRaw) || 25;
        const BUDGET_MIN = 5;
        const BUDGET_MAX = Math.max(BUDGET_MIN, Math.round(visibleBudgetGuidance?.maxDailyBudget || 50000));
        const sliderValue = budgetToSliderValue(budgetAmount, BUDGET_MIN, BUDGET_MAX);
        const monthlyBudget = budgetAmount * 30.4;
        const weeklyBudget = budgetAmount * 7;
        const estimateUnitCost = visibleBudgetGuidance?.estimate.averageUnitCost || null;
        const estimateMetricLabel = visibleBudgetGuidance?.estimate.metricLabel || null;
        const estimatedDailyResults =
          estimateUnitCost && estimateUnitCost > 0 ? budgetAmount / estimateUnitCost : null;
        const estimatedDailyRange = estimatedDailyResults
          ? {
              low: Math.max(0, estimatedDailyResults * 0.82),
              high: estimatedDailyResults * 1.18,
            }
          : null;

        const setBudget = (val: number) => {
          updateLaunchState((current) => ({
            ...current,
            campaign: {
              ...current.campaign,
              dailyBudget: String(Math.max(BUDGET_MIN, Math.min(BUDGET_MAX, Math.round(val)))),
            },
          }));
        };

        const setBudgetFromInput = (rawValue: string) => {
          const nextValue = rawValue.replace(/[^0-9.]/g, "");
          updateLaunchState((current) => ({
            ...current,
            campaign: {
              ...current.campaign,
              dailyBudget: nextValue,
            },
          }));
        };

        return (
          <div className="flex flex-col gap-8">
            {/* Budget hero */}
            <div className="lf-fade flex flex-col items-center gap-5 pt-4 pb-2">
              <div className="flex items-baseline gap-2">
                <span className="text-[2rem] font-semibold text-[var(--muted)]">$</span>
                <span
                  className="font-bold tracking-[-0.05em] text-[var(--foreground)]"
                  style={{ fontSize: "clamp(5rem,12vw,7.5rem)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}
                >
                  <AnimatedNumber value={budgetAmount} />
                </span>
                <span className="mb-3 self-end text-lg font-medium text-[var(--muted)]">/day</span>
              </div>

              {/* Reach pill */}
              <div className="flex items-center gap-1.5 rounded-full bg-[rgba(109,94,248,0.08)] px-4 py-2 text-sm text-[var(--brand)]">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2L10.5 7H14L10.5 10L12 14.5L8 11.5L4 14.5L5.5 10L2 7H5.5L8 2Z" fill="currentColor"/></svg>
                <span>
                  {estimatedDailyRange && estimateMetricLabel ? (
                    <>
                      Est.{" "}
                      <strong>
                        {estimatedDailyRange.low.toFixed(1)}-{estimatedDailyRange.high.toFixed(1)}
                      </strong>{" "}
                      {estimateMetricLabel} · <strong>{formatCurrencyAmount(monthlyBudget, visibleBudgetGuidance?.currency || "USD")}</strong>/mo
                    </>
                  ) : (
                    <>
                      <strong>{formatCurrencyAmount(weeklyBudget, visibleBudgetGuidance?.currency || "USD")}</strong>/wk ·{" "}
                      <strong>{formatCurrencyAmount(monthlyBudget, visibleBudgetGuidance?.currency || "USD")}</strong>/mo
                    </>
                  )}
                </span>
              </div>

              <div className="w-full max-w-xl space-y-3 rounded-[18px] border border-[rgba(17,24,39,0.07)] bg-white px-4 py-4 text-left shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
                <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  Daily budget
                </label>
                <div className="rounded-[16px] border border-[rgba(17,24,39,0.10)] bg-[rgba(247,248,250,0.95)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] focus-within:border-[color-mix(in_oklab,var(--brand)_55%,white)] focus-within:ring-2 focus-within:ring-[color-mix(in_oklab,var(--brand)_18%,white)]">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--muted-strong)]">$</span>
                    <Input
                      inputMode="decimal"
                      value={launchState.campaign.dailyBudget}
                      onChange={(event) => setBudgetFromInput(event.target.value)}
                      placeholder="25"
                      className="h-11 border-0 bg-transparent px-0 text-[1.05rem] font-semibold tracking-[-0.02em] shadow-none focus-visible:ring-0"
                    />
                    <span className="text-sm font-medium text-[var(--muted)]">/day</span>
                  </div>
                  <div className="mt-4 px-1">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={sliderValue}
                      onChange={(e) => setBudget(sliderValueToBudget(Number(e.target.value), BUDGET_MIN, BUDGET_MAX))}
                      className="campaign-budget-slider w-full"
                    />
                    <div className="mt-2 flex justify-between text-[11px] text-[var(--muted)]">
                      <span>{formatCurrencyAmount(BUDGET_MIN, visibleBudgetGuidance?.currency || "USD")}</span>
                      <span>{formatCurrencyAmount(Math.min(50, BUDGET_MAX), visibleBudgetGuidance?.currency || "USD")}</span>
                      <span>{formatCurrencyAmount(Math.min(250, BUDGET_MAX), visibleBudgetGuidance?.currency || "USD")}</span>
                      <span>{formatCurrencyAmount(Math.min(1000, BUDGET_MAX), visibleBudgetGuidance?.currency || "USD")}</span>
                      <span>{formatCurrencyAmount(BUDGET_MAX, visibleBudgetGuidance?.currency || "USD")}</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs leading-5 text-[var(--muted)]">
                  {visibleBudgetGuidance?.note ||
                    "Meta uses daily budget as an average over the week, not a hard single-day ceiling."}
                </p>
                {visibleBudgetGuidance?.remainingSpendCap ? (
                  <p className="text-xs leading-5 text-[var(--muted)]">
                    Remaining account spending limit:{" "}
                    <strong>{formatCurrencyAmount(visibleBudgetGuidance.remainingSpendCap, visibleBudgetGuidance.currency)}</strong>
                  </p>
                ) : null}
                {visibleBudgetGuidanceError ? (
                  <p className="text-xs leading-5 text-amber-700">{visibleBudgetGuidanceError}</p>
                ) : null}
                {visibleBudgetGuidance?.estimate.note ? (
                  <p className="text-xs leading-5 text-[var(--muted)]">{visibleBudgetGuidance.estimate.note}</p>
                ) : null}
              </div>
            </div>

            {/* Collapsible secondary settings */}
            <div className="lf-fade lf-d2 flex flex-col gap-3">
              <WizardDisclosure label="Campaign name" value={launchState.campaign.name || "Unnamed campaign"}>
                <label className="mb-1 block text-xs font-medium text-[var(--muted)]">Internal name (only you see this)</label>
                <Input
                  value={launchState.campaign.name}
                  onChange={(event) =>
                    updateLaunchState((current) => ({
                      ...current,
                      campaign: { ...current.campaign, name: event.target.value },
                    }))
                  }
                  placeholder="Campaign name"
                  className="mt-1"
                />
              </WizardDisclosure>

              <WizardDisclosure
                label="Ad account"
                value={
                  metaIntegration?.assets.adAccounts.find((a) => a.asset_id === (metaIntegration?.selected.adAccountId || launchState.integrationSelections.adAccountId))?.name ||
                  (metaIntegration?.selected.adAccountId || launchState.integrationSelections.adAccountId ? "Selected in workspace" : "Not selected")
                }
              >
                <div className="mt-1 rounded-[14px] border border-[var(--line)] bg-[var(--soft-panel)] px-4 py-3 text-sm text-[var(--foreground)]">
                  {metaIntegration?.assets.adAccounts.find((a) => a.asset_id === (metaIntegration?.selected.adAccountId || launchState.integrationSelections.adAccountId))?.name ||
                    "Select a workspace ad account in Integrations."}
                </div>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Publishing always uses the ad account selected in this workspace&apos;s Meta integration.
                </p>
              </WizardDisclosure>

              <WizardDisclosure
                label="Facebook Page"
                value={
                  metaIntegration?.assets.pages.find((p) => p.asset_id === (metaIntegration?.selected.pageId || launchState.integrationSelections.pageId))?.name ||
                  (metaIntegration?.selected.pageId || launchState.integrationSelections.pageId ? "Selected in workspace" : "Not selected")
                }
              >
                <div className="mt-1 rounded-[14px] border border-[var(--line)] bg-[var(--soft-panel)] px-4 py-3 text-sm text-[var(--foreground)]">
                  {metaIntegration?.assets.pages.find((p) => p.asset_id === (metaIntegration?.selected.pageId || launchState.integrationSelections.pageId))?.name ||
                    "Select a workspace Facebook Page in Integrations."}
                </div>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Publishing always uses the Facebook Page selected in this workspace&apos;s Meta integration.
                </p>
              </WizardDisclosure>
            </div>
          </div>
        );
      }
      case "location":
        return (
          <div className="grid gap-6">
            {/* Search */}
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
                placeholder="Search a city, state, ZIP, or address…"
                autoComplete="off"
                aria-autocomplete="list"
                aria-expanded={locationSuggestions.length > 0}
                className="h-13 rounded-[18px] px-5 text-base shadow-[0_2px_12px_rgba(15,23,42,0.06)]"
              />
              {isSearchingLocations ? (
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)]">
                  Searching…
                </span>
              ) : null}
              {locationSuggestions.length ? (
                <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-[20px] border border-[var(--line)] bg-white shadow-[0_20px_48px_rgba(15,23,42,0.12)]">
                  {locationSuggestions.slice(0, 6).map((suggestion, index) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => addLocationFromSuggestion(suggestion)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors",
                        index === activeLocationSuggestionIndex
                          ? "bg-[rgba(109,94,248,0.07)]"
                          : "hover:bg-[rgba(15,23,42,0.03)]",
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-[var(--ink)]">
                          {suggestion.label}
                        </span>
                        <span className="block text-xs text-[var(--muted)]">
                          {getLocationScopeLabel(suggestion.scope)}
                          {suggestion.source ? ` · ${suggestion.source === "meta" ? "Meta" : "Autocomplete"}` : ""}
                        </span>
                      </span>
                      {index === activeLocationSuggestionIndex ? (
                        <span className="shrink-0 rounded-full bg-[var(--brand)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
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

            {locationSearchError ? (
              <p className="text-sm text-rose-500">{locationSearchError}</p>
            ) : null}

            {/* Targeting mode + manual add */}
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={locationMode}
                onChange={(event) =>
                  setLocationMode(event.target.value as CampaignLaunchLocation["targetingMode"])
                }
                className="h-10 rounded-[14px] border border-[var(--line)] bg-white px-3 text-sm text-[var(--ink)] focus:outline-none"
              >
                {locationTargetingModeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button type="button" onClick={addManualLocation} variant="outline" className="h-10">
                Add manually
              </Button>
            </div>

            {/* Selected location chips */}
            {launchState.targeting.locations.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  {launchState.targeting.locations.length === 1 ? "1 location" : `${launchState.targeting.locations.length} locations`}
                </p>
                <div className="space-y-2">
                  {launchState.targeting.locations.map((location) => (
                    <div
                      key={location.id}
                      className="flex items-center gap-3 rounded-[18px] border border-[var(--line)] bg-white px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[var(--ink)]">{location.label}</p>
                        <p className="text-xs text-[var(--muted)]">
                          {location.scope ? `${location.scope}` : ""}
                          {location.radiusAllowed !== false
                            ? ` · ${location.radius || "10"} ${location.distanceUnit === "kilometer" ? "km" : "mi"}`
                            : ""}
                        </p>
                      </div>
                      {location.radiusAllowed !== false ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={location.radius}
                            onChange={(event) =>
                              updateLocationTargeting(location.id, { radius: event.target.value })
                            }
                            className="h-8 w-16 rounded-[10px] border border-[var(--line)] bg-white px-2 text-center text-sm text-[var(--ink)] focus:outline-none"
                          />
                          <select
                            value={location.distanceUnit || "mile"}
                            onChange={(event) =>
                              updateLocationTargeting(location.id, {
                                distanceUnit: event.target.value as CampaignLaunchLocation["distanceUnit"],
                              })
                            }
                            className="h-8 rounded-[10px] border border-[var(--line)] bg-white px-2 text-sm text-[var(--ink)] focus:outline-none"
                          >
                            <option value="mile">mi</option>
                            <option value="kilometer">km</option>
                          </select>
                        </div>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => removeLocation(location.id)}
                        className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-rose-50 hover:text-rose-500"
                        aria-label="Remove location"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-[20px] border border-dashed border-[var(--line)] px-5 py-8 text-center">
                <p className="text-sm text-[var(--muted)]">No locations added yet. Search above to add one.</p>
              </div>
            )}

            <details className="group overflow-hidden rounded-[22px] border border-[var(--line)] bg-[var(--soft-panel)]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 marker:hidden">
                <div>
                  <p className="text-sm font-semibold text-[var(--ink)]">More advanced targeting options</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                    Age range, gender, and other supported refinements live here.
                  </p>
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-strong)] transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>

              <div className="border-t border-[rgba(102,112,133,0.12)] px-4 py-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-3 rounded-[18px] border border-[var(--line)] bg-white px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Age range</p>
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        type="number"
                        min={18}
                        max={65}
                        value={launchState.targeting.ageMin}
                        onChange={(event) =>
                          updateLaunchState((current) => ({
                            ...current,
                            targeting: { ...current.targeting, ageMin: event.target.value },
                          }))
                        }
                        className="h-9 w-20 rounded-[12px] border border-[var(--line)] bg-white px-2 text-center text-sm text-[var(--ink)] focus:outline-none"
                      />
                      <span className="text-xs text-[var(--muted)]">to</span>
                      <input
                        type="number"
                        min={18}
                        max={65}
                        value={launchState.targeting.ageMax}
                        onChange={(event) =>
                          updateLaunchState((current) => ({
                            ...current,
                            targeting: { ...current.targeting, ageMax: event.target.value },
                          }))
                        }
                        className="h-9 w-20 rounded-[12px] border border-[var(--line)] bg-white px-2 text-center text-sm text-[var(--ink)] focus:outline-none"
                      />
                      <span className="text-xs text-[var(--muted)]">years old</span>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-[18px] border border-[var(--line)] bg-white px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Gender</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: "all", label: "All" },
                        { value: "male", label: "Men" },
                        { value: "female", label: "Women" },
                      ].map((option) => {
                        const active = launchState.targeting.gender === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() =>
                              updateLaunchState((current) => ({
                                ...current,
                                targeting: {
                                  ...current.targeting,
                                  gender: option.value as CampaignLaunchState["targeting"]["gender"],
                                },
                              }))
                            }
                            className={cn(
                              "h-9 rounded-[12px] border px-3 text-sm font-medium transition-colors",
                              active
                                ? "border-[var(--brand)] bg-[rgba(109,94,248,0.08)] text-[var(--brand)]"
                                : "border-[var(--line)] bg-white text-[var(--muted-strong)] hover:border-[rgba(109,94,248,0.28)]",
                            )}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </details>
          </div>
        );
      case "destination-setup":
        return (
          <div className="grid gap-5">
            {launchState.selection.adType === "lead_form" ? (
              <div className="grid gap-5">
                <div className="rounded-[28px] bg-[var(--soft-panel)] px-5 py-5">
                  <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Form Source</p>
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

                        <WizardDisclosure
                          label="Custom Questions"
                          value={
                            launchState.adTypeConfig.leadForm.customQuestions.length
                              ? `${launchState.adTypeConfig.leadForm.customQuestions.length} question${
                                  launchState.adTypeConfig.leadForm.customQuestions.length === 1 ? "" : "s"
                                }`
                              : "Optional"
                          }
                        >
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

                                  <div className="mt-4 space-y-4">
                                    <div className="space-y-2">
                                      <label className="block text-sm font-medium text-[var(--ink)]">Question label</label>
                                      <Input
                                        value={question.label}
                                        onChange={(event) =>
                                          updateLeadFormCustomQuestion(question.id, (currentQuestion) => {
                                            const nextLabel = event.target.value;
                                            return {
                                              ...currentQuestion,
                                              label: nextLabel,
                                              key: normalizeQuestionKey(nextLabel),
                                              keyMode: "auto",
                                            };
                                          })
                                        }
                                        placeholder="What service are you interested in?"
                                      />
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
                        </WizardDisclosure>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-[28px] bg-[var(--soft-panel)] px-5 py-5">
                  <WizardDisclosure
                    label="Thank-You Destination"
                    value={launchState.adTypeConfig.leadForm.thankYou.enabled ? "Enabled" : "Disabled"}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-medium text-[var(--ink)]">Enable thank-you destination</p>
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
                        <div className="rounded-[20px] border border-[var(--line)] bg-white p-4">
                          <p className="text-sm font-semibold text-[var(--ink)]">Choose destination</p>
                          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                            Choose between Meta's built-in thank-you page or a website redirect after submit.
                          </p>
                          <div className="mt-4 grid gap-3 lg:grid-cols-2">
                            {[
                              {
                                value: "facebook",
                                label: "Facebook thank-you page",
                                description: "Keep the submission flow inside Meta.",
                              },
                              {
                                value: "website",
                                label: "Website redirect",
                                description: "Send people to your own page after submit.",
                              },
                            ].map((option) => {
                              const selected =
                                launchState.adTypeConfig.leadForm.thankYou.destinationMode === option.value;
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() =>
                                    updateLaunchState((current) => ({
                                      ...current,
                                      adTypeConfig: {
                                        ...current.adTypeConfig,
                                        leadForm: {
                                          ...current.adTypeConfig.leadForm,
                                          thankYou: {
                                            ...current.adTypeConfig.leadForm.thankYou,
                                            destinationMode: option.value as CampaignLaunchState["adTypeConfig"]["leadForm"]["thankYou"]["destinationMode"],
                                          },
                                        },
                                      },
                                    }))
                                  }
                                  className={cn(
                                    "rounded-[18px] border px-4 py-4 text-left transition-colors",
                                    selected
                                      ? "border-[var(--brand)] bg-[rgba(109,94,248,0.08)]"
                                      : "border-[var(--line)] bg-white",
                                  )}
                                >
                                  <p className="text-sm font-semibold text-[var(--ink)]">{option.label}</p>
                                  <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{option.description}</p>
                                </button>
                              );
                            })}
                          </div>
                        </div>

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
                        {launchState.adTypeConfig.leadForm.thankYou.destinationMode === "facebook" ? (
                          <div className="space-y-4">
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
                                <option value="OPEN_WEBSITE">Continue on Facebook</option>
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
                              ) : null}
                            </div>
                            <p className="text-xs leading-5 text-[var(--muted)]">
                              The built-in Facebook page keeps people inside Meta after they submit the form.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2 rounded-[20px] border border-[var(--line)] bg-white p-4">
                            <label className="block text-sm font-medium text-[var(--ink)]">Redirect URL</label>
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
                              placeholder="https://yourwebsite.com/redirect"
                            />
                            <p className="text-xs leading-5 text-[var(--muted)]">
                              Send people to your own website after they submit instead of using Meta’s built-in page.
                            </p>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </WizardDisclosure>
                </div>
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
          </div>
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
          selectedTemplate?.ctaLabel ||
          previewBlueprint?.funnelConfig.ctaText ||
          resolveTemplateCtaLabel(selectedTemplate, "Learn more");

        return (
          <div className="grid gap-5">
            {placeholderFields.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {placeholderFields.map((field) => (
                  <div key={field.id} className="space-y-1.5">
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
                      <p className="text-xs text-[var(--muted)]">{field.description}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[20px] border border-dashed border-[var(--line)] px-5 py-8 text-center">
                <p className="text-sm text-[var(--muted)]">This template has no placeholder variables to fill.</p>
              </div>
            )}
          </div>
        );
      }
      case "review-launch":
        return (
          <div className="grid gap-4">
            {/* Summary cards — clean and quick to scan */}
            <ReviewGroupCard
              title="Budget"
              onEdit={() => updateLaunchState((current) => ({ ...current, stepId: "campaign-basics" }))}
            >
              <SummaryRow label="Daily budget" value={formatBudgetDisplay(launchState.campaign.dailyBudget)} />
              <SummaryRow label="Ad type" value={getAdTypeLabel(launchState.selection.adType)} />
              <SummaryRow label="Campaign name" value={launchState.campaign.name || "—"} />
            </ReviewGroupCard>

            <ReviewGroupCard
              title="Audience"
              onEdit={() => updateLaunchState((current) => ({ ...current, stepId: "location" }))}
            >
              <SummaryRow
                label="Primary location"
                value={launchState.targeting.locations[0]?.label || "—"}
              />
              {launchState.targeting.locations.length > 1 ? (
                <SummaryRow
                  label="Additional locations"
                  value={`+${launchState.targeting.locations.length - 1} more`}
                />
              ) : null}
              <SummaryRow
                label="Age range"
                value={`${launchState.targeting.ageMin || "18"}–${launchState.targeting.ageMax || "65"}`}
              />
            </ReviewGroupCard>

            <ReviewGroupCard
              title="Destination"
              onEdit={() => updateLaunchState((current) => ({ ...current, stepId: "destination-setup" }))}
            >
              <SummaryRow
                label="Destination"
                value={
                  launchState.selection.adType === "lead_form"
                    ? launchState.adTypeConfig.leadForm.mode === "existing"
                      ? launchState.adTypeConfig.leadForm.selectedFormName || "Existing Meta form"
                      : launchState.adTypeConfig.leadForm.managedFormName || "Managed form"
                    : launchState.selection.adType === "landing_page"
                      ? launchState.adTypeConfig.landingPage.url || "—"
                      : launchState.selection.adType === "call_now"
                        ? launchState.adTypeConfig.callNow.phoneNumber || "—"
                        : "Messenger"
                }
              />
              <SummaryRow label="Template" value={selectedTemplate?.name || "—"} />
              {placeholderFields.length > 0 ? (
                <SummaryRow
                  label="Placeholders"
                  value={`${Object.values(launchState.placeholders.values).filter((v) => v.trim()).length} / ${placeholderFields.length} filled`}
                />
              ) : null}
            </ReviewGroupCard>

            {/* Issues — only shown if present */}
            {(currentIssues.length > 0 || localReadinessIssues.length > 0) ? (
              <IssueList title="Resolve before launch" issues={currentIssues.length ? currentIssues : localReadinessIssues} />
            ) : null}
            {preflightError ? (
              <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
                {preflightError}
              </div>
            ) : null}
            {preflight?.blockingIssues.length ? (
              <IssueList title="Blocking issues" issues={preflight.blockingIssues} />
            ) : null}
            {preflight?.warnings.length ? (
              <IssueList title="Warnings" issues={preflight.warnings} tone="amber" />
            ) : null}

            {/* Publish feedback */}
            {publishError ? (
              <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
                {publishError}
                {publishErrorDetails ? (
                  <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-[16px] bg-white/70 p-3 text-xs leading-5 text-rose-800">
                    {publishErrorDetails}
                  </pre>
                ) : null}
              </div>
            ) : null}
            {publishSuccess ? (
              <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
                {publishSuccess}
              </div>
            ) : null}
            {saveState === "error" && saveError ? (
              <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
                {saveError}
              </div>
            ) : null}

            {/* Launch actions — dominant CTA at the bottom */}
            <div className="mt-2 rounded-[28px] bg-[linear-gradient(135deg,rgba(109,94,248,0.06)_0%,rgba(109,94,248,0.02)_100%)] border border-[rgba(109,94,248,0.12)] px-6 py-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-[var(--ink)]">Ready to go live?</p>
                  <p className="mt-0.5 text-sm text-[var(--muted)]">Preflight checks run automatically on launch.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => persistDraft(launchState, true)}
                    disabled={!selectedTemplate || saveState === "saving"}
                    className="h-11 px-5"
                  >
                    {saveState === "saving" ? "Saving…" : "Save Draft"}
                  </Button>
                  {!metaConnected || launchState.selection.adType === "lead_form" ? (
                    <Button type="button" variant="outline" asChild className="h-11 px-5">
                      <Link href={metaConnectHref}>Reconnect Facebook</Link>
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    onClick={() => handleLaunch("live")}
                    disabled={isPublishing || !selectedTemplate}
                    className="h-11 px-6"
                  >
                    {isPublishing ? "Launching…" : "Launch Campaign"}
                    <Rocket className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className={cn("bg-[var(--background)]", immersive ? "" : "")}>
      {/* ── 2-col shell ── */}
      <div
        className={cn(
          "lf-shell",
          (launchState.stepId === "industry" || launchState.stepId === "template") && "lf-shell--full",
        )}
      >
        {/* Left: scrollable content + sticky footer */}
        <div className="lf-content-wrap">
          <div className="lf-content">
            {/* Step header */}
            <div key={`header-${launchState.stepId}`} className="step-content mb-1">
              <div className="lf-eyebrow">Step {resolvedStepIndex + 1} of {visibleSteps.length}</div>
              <h1 className="lf-title" style={{ whiteSpace: "pre-line" }}>
                {getStepHeadline(launchState.stepId)}
              </h1>
              <p className="lf-subtitle">
                {currentStepDefinition?.description || currentSectionDefinition?.description || "Work through the campaign setup step by step."}
              </p>
            </div>

            {/* Validation issues */}
            {currentIssues.length > 0 && launchState.stepId !== "review-launch" ? (
              <div className="mb-5">
                <IssueList title="Fix these to continue" issues={currentIssues} />
              </div>
            ) : null}

            {/* Step content */}
            <div key={launchState.stepId} className="step-content">
              {renderStepContent()}
            </div>
          </div>

          {/* Sticky gradient footer nav */}
          <div className="lf-footer">
            <div className="flex items-center justify-between gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStepIndex <= 0}
                className="h-11 rounded-[14px] px-5"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              {launchState.stepId !== "review-launch" ? (
                <Button
                  type="button"
                  onClick={handleContinue}
                  className="h-11 rounded-[14px] px-6 shadow-[0_8px_24px_rgba(109,94,248,0.28)]"
                >
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        {launchState.stepId !== "industry" && launchState.stepId !== "template" ? (
          /* Right: sticky preview pane */
          <div className="lf-right">
            <div className="lf-preview-shell">
              <div className="lf-preview-body">
                <div className="mx-auto w-full max-w-[428px] overflow-hidden rounded-[18px] border border-[rgba(17,24,39,0.08)]">
                  <FacebookAdPreview
                    template={selectedTemplate}
                    pageName={pagePreviewIdentity.pageName}
                    pageAvatarUrl={pagePreviewIdentity.pageAvatarUrl}
                    primaryText={previewBlueprint?.adCopy.primary}
                    headline={previewBlueprint?.adCopy.headlines[0]}
                    description={previewBlueprint?.adCopy.descriptions[0]}
                    displayLink={previewDisplayLink}
                    ctaLabel={
                      selectedTemplate?.ctaLabel ||
                      previewBlueprint?.funnelConfig.ctaText ||
                      resolveTemplateCtaLabel(selectedTemplate, "Learn more")
                    }
                    imageUrl={selectedTemplate?.previewImage || null}
                    placeholderValues={previewPlaceholderValues}
                    fillHeight={false}
                    collapsedPrimaryLines={6}
                    compact
                    showCompactDescription
                    mediaFit="contain"
                    mediaAspectMode="uniform"
                    className="w-full rounded-none border-0 bg-transparent p-0 shadow-none"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function getStepHeadline(stepId: string): string {
  switch (stepId) {
    case "industry": return "What kind of business\nare you running?";
    case "template": return "Pick a campaign\nwe know works.";
    case "ad-type": return "How should people\nrespond?";
    case "campaign-basics": return "Set your daily budget.";
    case "location": return "Where should we\nrun this?";
    case "destination-setup": return "Where do people go\nafter they click?";
    case "placeholders": return "Make it yours.";
    case "review-launch": return "Ready to launch.";
    default: return "Campaign Setup";
  }
}
