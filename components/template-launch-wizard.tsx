"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeDollarSign,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CircleDot,
  ExternalLink,
  Goal,
  Eye,
  FileText,
  Globe,
  Megaphone,
  MapPin,
  PanelLeft,
  Plus,
  Rocket,
  Sparkles,
  Settings2,
  PhoneCall,
  MessageCircle,
  Smartphone,
  TrendingUp,
  Target,
  Users,
  X,
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
  campaignGoalOptions,
  campaignWizardSteps,
  createInitialCampaignLaunchState,
  getAdTypeLabel,
  getCampaignDetailsStepsForAdType,
  getCampaignGoalForAdType,
  getTemplatePlaceholderFields,
  getDefaultThankYouButtonLabel,
  locationTargetingModeOptions,
  getNextCampaignDetailsStep,
  getPreviousCampaignDetailsStep,
  getTemplateSetupValuesFromLaunchState,
  normalizeCampaignLaunchState,
  parseDailyBudgetAmount,
} from "@/lib/campaign-launch";
import { supportedIndustries } from "@/data/template-taxonomy";
import { createCampaignBlueprint } from "@/lib/template-engine";
import {
  BusinessProfile,
  CampaignBundle,
  CampaignDetailsStep,
  CampaignAdType,
  CampaignGoal,
  CampaignLaunchState,
  CampaignLocationTargetingType,
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
    leadForm: { id: string; name: string; mode: CampaignLaunchState["leadForm"]["mode"] } | null;
    instagramActor: { id: string; name: string } | null;
  };
  normalizedPayloadSummary: {
    objective: CampaignGoal;
    campaign: { name: string };
    adSet: { dailyBudgetCents: number };
    creative: { destinationUrl: string; leadFormMode: CampaignLaunchState["leadForm"]["mode"] };
  };
};

const defaultLocationRadius = "10";
const maxLocationRadius = 50;
const radiusEnabledScopes: NonNullable<CampaignLaunchState["targetLocations"]>[number]["scope"][] = [
  "city",
  "zip",
  "neighborhood",
  "address",
];
const metaThankYouButtonLabelPresets = [
  "Continue",
  "Call Now",
  "Learn more",
  "Sign up",
  "Shop now",
  "Book now",
  "Get offer",
  "Get quote",
  "Contact us",
  "Subscribe",
  "Apply now",
  "Download",
  "Get showtimes",
  "Listen now",
  "Watch more",
  "Order now",
  "Book travel",
  "Buy now",
  "Bid now",
  "Donate now",
  "Get event tickets",
  "Play game",
  "Vote now",
  "Register now",
  "Open link",
  "Request time",
  "See menu",
  "Sell now",
  "Try it",
  "Try on",
  "Inquire now",
] as const;
const thankYouButtonLabelPresetSet = new Set<string>(metaThankYouButtonLabelPresets);
const managedLeadFieldOptions: Array<{
  id: CampaignLaunchState["leadForm"]["fields"][number];
  label: string;
  hint: string;
}> = [
  { id: "FULL_NAME", label: "Full name", hint: "Best for personalization" },
  { id: "EMAIL", label: "Email", hint: "Required for email follow-up" },
  { id: "PHONE", label: "Phone", hint: "Required for SMS/call follow-up" },
];

type LocationSuggestion = {
  id: string;
  label: string;
  scope: NonNullable<CampaignLaunchState["targetLocations"]>[number]["scope"];
  source?: "meta" | "manual";
  lat?: number;
  lon?: number;
  countryCode?: string;
  radiusAllowed?: boolean;
  distanceUnit?: "mile" | "kilometer";
  metaLocation: MetaLocationTargeting;
};

const adTypeOptions: Array<{
  id: CampaignAdType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: "lead_form",
    label: "Lead Form",
    description: "Capture contact details with a Meta lead form and optional thank-you page.",
    icon: FileText,
  },
  {
    id: "landing_page",
    label: "Landing Page",
    description: "Send people to a website or landing page with optional pixel tracking.",
    icon: Globe,
  },
  {
    id: "call_now",
    label: "Call Now",
    description: "Drive phone calls with a call-first campaign flow.",
    icon: PhoneCall,
  },
  {
    id: "messenger_leads",
    label: "Messenger (Leads)",
    description: "Collect leads through Messenger conversation flow.",
    icon: MessageCircle,
  },
  {
    id: "messenger_engagement",
    label: "Messenger (Engagement)",
    description: "Drive conversations and engagement through Messenger.",
    icon: Users,
  },
];

function goalDisplay(goal: CampaignGoal) {
  return campaignGoalOptions.find((option) => option.id === goal)?.label || "Leads";
}

function goalIcon(goal: CampaignGoal) {
  switch (goal) {
    case "OUTCOME_AWARENESS":
      return Eye;
    case "OUTCOME_TRAFFIC":
      return ExternalLink;
    case "OUTCOME_ENGAGEMENT":
      return Users;
    case "OUTCOME_APP_PROMOTION":
      return Smartphone;
    case "OUTCOME_SALES":
      return TrendingUp;
    default:
      return Goal;
  }
}

function showsLeadFormPreview(adType: CampaignAdType) {
  return adType === "lead_form";
}

function showsThankYouPreview(adType: CampaignAdType, thankYouEnabled: boolean) {
  return adType === "lead_form" && thankYouEnabled;
}

function normalizeLocationId(label: string) {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function deriveLocationSummary(state: CampaignLaunchState) {
  if (!state.targetLocations?.length) return state.targetLocation || "No locations added";
  if (state.targetLocations.length === 1) return state.targetLocations[0].label;
  return `${state.targetLocations[0].label} +${state.targetLocations.length - 1} more`;
}

function locationScopeLabel(scope?: NonNullable<CampaignLaunchState["targetLocations"]>[number]["scope"]) {
  if (scope === "world") return "Worldwide";
  if (scope === "country") return "Country";
  if (scope === "state") return "State/region";
  if (scope === "city") return "City";
  if (scope === "zip") return "ZIP";
  if (scope === "neighborhood") return "Neighborhood";
  if (scope === "address") return "Address";
  return "Location";
}

function canEditLocationRadius(
  scope?: NonNullable<CampaignLaunchState["targetLocations"]>[number]["scope"],
  radiusAllowed?: boolean,
) {
  if (typeof radiusAllowed === "boolean") return radiusAllowed;
  if (!scope) return true;
  return radiusEnabledScopes.includes(scope);
}

function distanceUnitLabel(unit?: "mile" | "kilometer") {
  return unit === "kilometer" ? "km" : "mi";
}

function distanceUnitFullLabel(unit?: "mile" | "kilometer") {
  return unit === "kilometer" ? "kilometers" : "miles";
}

function clampLocationRadius(value?: string | number | null) {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value || defaultLocationRadius), 10);
  if (!Number.isFinite(parsed)) return 10;
  return Math.min(Math.max(parsed, 1), maxLocationRadius);
}

function compactLocationLabel(label: string, scope?: NonNullable<CampaignLaunchState["targetLocations"]>[number]["scope"]) {
  if (scope === "world") return "Worldwide";
  const parts = label
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts.length) return label;
  if (scope === "country") return parts[0];
  if (scope === "state") return parts.slice(0, 2).join(", ");
  if (scope === "city" || scope === "zip" || scope === "neighborhood") return parts.slice(0, 3).join(", ");
  return parts.slice(0, 4).join(", ");
}

function locationMetadataSummary(location: NonNullable<CampaignLaunchState["targetLocations"]>[number]) {
  const bits = [locationScopeLabel(location.scope)];
  if (location.metaLocation?.addressString) bits.push(location.metaLocation.addressString);
  if (location.metaLocation?.countryName) bits.push(location.metaLocation.countryName);
  if (location.metaLocation?.region) bits.push(location.metaLocation.region);
  if (location.metaLocation?.key) bits.push(`Meta ${location.metaLocation.key}`);
  return bits.filter(Boolean).join(" • ");
}

function locationTargetShapeLabel(location: NonNullable<CampaignLaunchState["targetLocations"]>[number]) {
  return canEditLocationRadius(location.scope, location.radiusAllowed) ? "Radius target" : "Broad target";
}

function locationTargetingModeLabel(mode: CampaignLocationTargetingType) {
  return locationTargetingModeOptions.find((option) => option.value === mode)?.label || "People living in this location";
}

function thankYouButtonActionLabel(action: CampaignLaunchState["thankYouPage"]["buttonAction"]) {
  if (action === "DOWNLOAD") return "Download File";
  if (action === "CALL_BUSINESS") return "Call Business";
  return "Open Website";
}

function getThankYouButtonLabelPresets(
  action: CampaignLaunchState["thankYouPage"]["buttonAction"],
) {
  const recommended =
    action === "DOWNLOAD"
      ? ["Download", "Continue", "Learn more", "Get offer", "Contact us", "Open link"]
      : action === "CALL_BUSINESS"
        ? ["Call Now", "Contact us", "Get quote", "Request time", "Inquire now", "Continue"]
        : ["Continue", "Learn more", "Sign up", "Apply now", "Book now", "Get quote", "Contact us", "Open link"];

  return Array.from(new Set([...recommended, ...metaThankYouButtonLabelPresets]));
}

function formatThankYouUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    return `${url.hostname}${url.pathname === "/" ? "" : url.pathname}`;
  } catch {
    return trimmed.replace(/^https?:\/\//, "");
  }
}

function previewStatusMessage(saveState: SaveState, saveError: string | null) {
  if (saveState === "saving") return "Saving draft...";
  if (saveState === "saved") return "Draft saved";
  if (saveState === "error") return saveError || "Draft could not be saved.";
  return "Draft not saved yet";
}

function StepHero({
  saveState,
  saveError,
}: {
  saveState: SaveState;
  saveError: string | null;
}) {
  return (
    <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex flex-col gap-2">
        <span className="text-2xl font-semibold text-gray-900">Campaign Details</span>
        <span className="text-sm font-normal leading-8 text-gray-500">
          Almost there! Let&apos;s set the ad type, budget, targeting, and launch details.
        </span>
      </div>

      <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 shadow-sm">
        <span
          className={cn(
            "h-2.5 w-2.5 rounded-full",
            saveState === "saved"
              ? "bg-emerald-500"
              : saveState === "saving"
                ? "bg-amber-400"
                : saveState === "error"
                  ? "bg-red-500"
                  : "bg-gray-300",
          )}
        />
        {previewStatusMessage(saveState, saveError)}
      </div>
    </div>
  );
}

function WizardProgress({
  currentStep,
  onStepClick,
}: {
  currentStep: CampaignLaunchState["currentStep"];
  onStepClick: (step: CampaignLaunchState["currentStep"]) => void;
}) {
  const currentIndex = campaignWizardSteps.findIndex((step) => step.id === currentStep);

  return (
    <nav className="flex flex-wrap items-center justify-center gap-2 py-4" aria-label="Wizard progress">
      {campaignWizardSteps.map((step, index) => {
        const active = step.id === currentStep;
        const complete = index < currentIndex;

        return (
          <div key={step.id} className="contents">
            <button
              type="button"
              onClick={() => onStepClick(step.id)}
              className="group flex items-center gap-2"
            >
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0 transition-all",
                  complete
                    ? "bg-indigo-600 text-white group-hover:bg-indigo-700"
                    : active
                      ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white ring-2 ring-indigo-200"
                      : "bg-white text-gray-600 ring-1 ring-gray-300 group-hover:ring-indigo-300",
                )}
              >
                {complete ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              <span
                className={cn(
                  "text-sm transition-colors",
                  active
                    ? "font-bold text-gray-900"
                    : complete
                      ? "font-medium text-indigo-600 group-hover:text-indigo-700"
                      : "font-medium text-gray-500 group-hover:text-gray-700",
                )}
              >
                {step.label === "Choose platform" ? "Choose a platform" : step.label}
              </span>
            </button>
            {index < campaignWizardSteps.length - 1 ? (
              <div className="mx-1 h-px w-12 bg-indigo-400" />
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

function StepSection({
  title,
  description,
  children,
  hideHeader = false,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  hideHeader?: boolean;
}) {
  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {hideHeader ? (
        <div className="p-6">{children}</div>
      ) : (
        <>
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <div className="p-6">
            <div className="mb-8 text-center">
              <p className="mt-2 text-sm text-gray-500">{description}</p>
            </div>
            {children}
          </div>
        </>
      )}
    </div>
  );
}

function BuilderTip({
  title,
  children,
  icon: Icon,
}: {
  title: string;
  children: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-purple-200 bg-purple-50 p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100">
        <Icon className="h-4 w-4 text-purple-600" />
      </div>
      <div>
        <p className="text-sm font-semibold text-purple-900">{title}</p>
        <div className="mt-1 text-sm leading-6 text-purple-800">{children}</div>
      </div>
    </div>
  );
}

function PreviewTabs({
  value,
  onChange,
  showLeadForm,
  showThankYou,
}: {
  value: NonNullable<CampaignLaunchState["previewTab"]>;
  onChange: (tab: NonNullable<CampaignLaunchState["previewTab"]>) => void;
  showLeadForm: boolean;
  showThankYou: boolean;
}) {
  const tabs: Array<{ id: NonNullable<CampaignLaunchState["previewTab"]>; label: string }> = [
    { id: "ad", label: "Ad Preview" },
    ...(showLeadForm ? [{ id: "lead-form" as const, label: "Lead Form" }] : []),
    ...(showThankYou ? [{ id: "thank-you" as const, label: "Thank You" }] : []),
  ];

  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 shadow-sm">
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150 ease-in-out",
              active
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-transparent text-gray-600 hover:bg-gray-50",
            )}
          >
            {tab.label === "Ad Preview"
              ? "Ad"
              : tab.label === "Lead Form"
                ? "Lead Form"
                : "Thank You"}
          </button>
        );
      })}
    </div>
  );
}

function MetaAdPreview({
  template,
  preview,
  launchState,
  businessProfile,
  pageName,
  pageAvatarUrl,
}: {
  template: TemplateSeed;
  preview: ReturnType<typeof createCampaignBlueprint>;
  launchState: CampaignLaunchState;
  businessProfile: BusinessProfile | null;
  pageName?: string;
  pageAvatarUrl?: string | null;
}) {
  const businessName = pageName || businessProfile?.business_name || "Your Page Name";

  return (
    <FacebookAdPreview
      template={template}
      pageName={businessName}
      pageAvatarUrl={pageAvatarUrl}
      primaryText={preview.adCopy.primary}
      headline={preview.adCopy.headlines[0] || template.name}
      description={template.promoDetails}
      ctaLabel={preview.funnelConfig.ctaText}
      imageUrl={template.previewImage}
      compact={false}
      className="shadow-none"
    />
  );
}

function LeadFormPreview({
  preview,
  template,
}: {
  preview: ReturnType<typeof createCampaignBlueprint>;
  template: TemplateSeed;
}) {
  const formFields = template.funnel.formFields?.length ? template.funnel.formFields : ["Full name", "Phone", "Email"];

  return (
    <div className="mx-auto max-w-sm">
      <div className="rounded-3xl bg-gray-100 p-3 shadow-lg">
        <div className="mb-2 flex justify-center border-b border-gray-200 py-2">
          <div className="h-6 w-6 rounded-full bg-blue-600" />
        </div>
        <div className="mb-3 flex items-center justify-between px-1">
          <span className="text-sm font-medium text-gray-900">Lead Form</span>
          <span className="text-sm text-gray-600">1 of 3</span>
        </div>
        <div className="flex min-h-[450px] flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="space-y-4 p-4">
            <div>
              <p className="text-lg font-semibold text-gray-900">{preview.funnelConfig.headline}</p>
              <p className="mt-2 text-sm leading-6 text-gray-500">{preview.funnelConfig.subheadline}</p>
            </div>
            <div className="space-y-3">
              {formFields.map((field) => (
                <div key={field} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">
                  {field}
                </div>
              ))}
            </div>
            <button
              type="button"
              className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
            >
              {preview.funnelConfig.ctaText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ThankYouPreview({
  launchState,
  pageName,
  pageUrl,
}: {
  launchState: CampaignLaunchState;
  pageName?: string | null;
  pageUrl?: string | null;
}) {
  const websiteMode =
    launchState.thankYouPage.buttonAction === "OPEN_WEBSITE" ||
    launchState.thankYouPage.buttonAction === "DOWNLOAD";
  const displayPageName = pageName || "Your Page";
  const destinationLabel = websiteMode
    ? formatThankYouUrl(launchState.thankYouPage.websiteUrl) || "Website"
    : pageName
      ? `${pageName} on Facebook`
      : "Facebook Page";
  const headerLabel = websiteMode ? "Website redirect" : "Facebook page";
  const actionLabel = thankYouButtonActionLabel(launchState.thankYouPage.buttonAction);
  const phoneTarget =
    launchState.thankYouPage.completionPhone?.trim() || "your business phone number";

  return (
    <div className="overflow-hidden rounded-[30px] border border-gray-200 bg-white shadow-sm">
      <div className="bg-[#1877F2] px-4 py-3 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/25">
            <span className="text-sm font-bold uppercase">{displayPageName.slice(0, 1)}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-none">{displayPageName}</p>
            <p className="mt-1 text-xs text-white/80">
              {headerLabel} • {actionLabel}
            </p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white/90">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="bg-[#f0f2f5] px-4 py-4">
        <div className="mx-auto max-w-sm overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#1877F2]">Thank you</p>
            <p className="mt-2 text-[22px] font-semibold tracking-tight text-gray-900">{launchState.thankYouPage.headline}</p>
            <p className="mt-3 text-sm leading-6 text-gray-600">{launchState.thankYouPage.description}</p>
          </div>

          <div className="px-5 py-4">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1877F2]/10 text-[#1877F2]">
                  <ExternalLink className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Destination</p>
                  <p className="truncate text-sm font-semibold text-gray-900">{destinationLabel}</p>
                </div>
              </div>
              <button
                type="button"
                className={cn(
                  "mt-4 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm",
                  websiteMode ? "bg-[#1877F2]" : "bg-gray-900",
                )}
              >
                {launchState.thankYouPage.buttonLabel}
              </button>
            </div>
          </div>

          <div className="border-t border-gray-100 px-5 py-3 text-xs text-gray-500">
            {launchState.thankYouPage.buttonAction === "CALL_BUSINESS"
              ? `Calls ${phoneTarget} when tapped.`
              : `Opens ${destinationLabel} when tapped.`}
          </div>
        </div>
        {pageUrl ? <p className="mt-3 truncate text-center text-xs text-gray-500">{pageUrl}</p> : null}
      </div>
    </div>
  );
}

function BuilderPreview({
  launchState,
  onPreviewTabChange,
  template,
  preview,
  businessProfile,
  pagePreviewIdentity,
  connectedPageAsset,
  connectedPageAvatarUrl,
}: {
  launchState: CampaignLaunchState;
  onPreviewTabChange: (tab: NonNullable<CampaignLaunchState["previewTab"]>) => void;
  template: TemplateSeed;
  preview: ReturnType<typeof createCampaignBlueprint>;
  businessProfile: BusinessProfile | null;
  pagePreviewIdentity: ReturnType<typeof resolveMetaPagePreviewIdentity>;
  connectedPageAsset: {
    asset_id?: string | null;
    name?: string | null;
    metadata_json?: Record<string, unknown> | null;
  } | null;
  connectedPageAvatarUrl: string | null;
}) {
  const previewTab = launchState.previewTab || "ad";
  const showLeadForm = showsLeadFormPreview(launchState.adType);
  const showThankYou = showsThankYouPreview(launchState.adType, launchState.thankYouPage.enabled);
  const safePreviewTab =
    previewTab === "lead-form" && !showLeadForm
      ? "ad"
      : previewTab === "thank-you" && !showThankYou
        ? "ad"
        : previewTab;
  const targetLocation = deriveLocationSummary(launchState);

  return (
    <div className="sticky top-6 space-y-6 lg:space-y-0">
      <div className="rounded-2xl border border-gray-200 bg-gray-100 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Ad Preview</h3>
          <PreviewTabs
            value={safePreviewTab}
            onChange={onPreviewTabChange}
            showLeadForm={showLeadForm}
            showThankYou={showThankYou}
          />
        </div>
        {safePreviewTab === "ad" ? (
          <MetaAdPreview
            template={template}
            preview={preview}
            launchState={launchState}
            businessProfile={businessProfile}
            pageName={pagePreviewIdentity.pageName}
            pageAvatarUrl={connectedPageAvatarUrl}
          />
        ) : null}
        {safePreviewTab === "lead-form" && showLeadForm ? <LeadFormPreview preview={preview} template={template} /> : null}
        {safePreviewTab === "thank-you" && showThankYou ? (
          <ThankYouPreview
            launchState={launchState}
            pageName={pagePreviewIdentity.isFallback ? null : pagePreviewIdentity.pageName}
            pageUrl={
              connectedPageAsset?.asset_id
                ? `https://www.facebook.com/${connectedPageAsset.asset_id}`
                : null
            }
          />
        ) : null}

        <div className="mt-4 grid gap-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Campaign Goal</p>
                <p className="text-sm font-semibold text-gray-900">{goalDisplay(launchState.campaignGoal)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                <Rocket className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Daily Budget</p>
                <p className="text-sm font-semibold text-gray-900">${launchState.dailyBudget || "25"}/day</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                <BadgeDollarSign className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Target Location</p>
                <p className="text-sm font-semibold text-gray-900">{targetLocation}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100">
                <MapPin className="h-5 w-5 text-rose-600" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Tracking</p>
                <p className="text-sm font-semibold text-gray-900">{launchState.trackingPixelName || "No pixel selected"}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100">
                <Target className="h-5 w-5 text-teal-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewRow({
  label,
  value,
  onEdit,
  icon: Icon,
  iconClassName,
}: {
  label: string;
  value: React.ReactNode;
  onEdit: () => void;
  icon: React.ComponentType<{ className?: string }>;
  iconClassName: string;
}) {
  return (
    <div className="rounded-[20px] border border-gray-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", iconClassName)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">{label}</p>
            <div className="mt-1 text-sm font-semibold leading-6 text-gray-900">{value}</div>
          </div>
        </div>
        <button type="button" onClick={onEdit} className="shrink-0 pt-1 text-sm font-semibold text-blue-600 hover:text-blue-700">
          Edit
        </button>
      </div>
    </div>
  );
}

function LaunchIssueList({
  title,
  tone,
  issues,
}: {
  title: string;
  tone: "error" | "warning";
  issues: LaunchIssue[];
}) {
  if (!issues.length) return null;

  return (
    <div
      className={cn(
        "mt-3 rounded-lg border px-3 py-3 text-xs",
        tone === "error"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-amber-200 bg-amber-50 text-amber-800",
      )}
    >
      <p className="font-semibold">{title}</p>
      <div className="mt-2 space-y-2">
        {issues.map((issue) => (
          <p key={`${issue.code}-${issue.field || issue.message}`}>{issue.message}</p>
        ))}
      </div>
    </div>
  );
}

function buildDefaultPrivacyPolicyUrl(connectNextUrl: string) {
  try {
    if (typeof window !== "undefined" && window.location?.origin) {
      return new URL("/privacy", window.location.origin).toString();
    }
  } catch {}

  try {
    return new URL("/privacy", connectNextUrl).toString();
  } catch {
    return "";
  }
}

async function saveDraftRequest({
  draftId,
  templateSlug,
  state,
}: {
  draftId?: string;
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
  const initialTemplate =
    initialDraftBundle?.template ||
    templates.find((template) => template.slug === initialTemplateSlug) ||
    null;
  const integrationDefaults = {
    adAccountId: metaIntegration?.selected.adAccountId || "",
    pageId: metaIntegration?.selected.pageId || "",
    pixelId: metaIntegration?.selected.pixelId || "",
    leadFormId: metaIntegration?.selected.leadFormId || "",
    instagramActorId: metaIntegration?.selected.instagramActorId || "",
  };
  const metaConnected = Boolean(
    metaIntegration?.connection &&
      metaIntegration.tokenAvailable &&
      metaIntegration.connection.status === "connected",
  );
  const selectedAdAccountAsset = metaIntegration?.assets.adAccounts.find((asset) => asset.asset_id === metaIntegration?.selected.adAccountId) || null;
  const availablePixels = metaIntegration?.assets.pixels || [];
  const availableLeadForms = metaIntegration?.assets.leadForms || [];

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

  const [launchState, setLaunchState] = useState<CampaignLaunchState>(() =>
    initialDraftBundle?.campaign.launch_state_json
      ? (() => {
          const normalized = normalizeCampaignLaunchState(
            initialDraftBundle.campaign.launch_state_json,
            initialDraftBundle.template,
            businessProfile,
          );
          const resolvedLeadFormId =
            normalized.leadForm.selectedFormId ||
            normalized.integrationSelections.leadFormId ||
            integrationDefaults.leadFormId;
          return {
            ...normalized,
            integrationSelections: {
              ...normalized.integrationSelections,
              adAccountId:
                normalized.integrationSelections.adAccountId || integrationDefaults.adAccountId,
              pageId: normalized.integrationSelections.pageId || integrationDefaults.pageId,
              pixelId: normalized.integrationSelections.pixelId || integrationDefaults.pixelId,
              leadFormId: resolvedLeadFormId,
              instagramActorId:
                normalized.integrationSelections.instagramActorId ||
                integrationDefaults.instagramActorId,
            },
            leadForm: {
              ...normalized.leadForm,
              selectedFormId: resolvedLeadFormId,
              selectedFormName:
                normalized.leadForm.selectedFormName ||
                availableLeadForms.find((leadForm) => leadForm.asset_id === resolvedLeadFormId)
                  ?.name ||
                "",
            },
          };
        })()
      : createInitialCampaignLaunchState({
          template: initialTemplate,
          businessProfile,
          partial: {
            category: initialTemplate?.industry || initialTemplate?.category || "",
            industry: initialTemplate?.industry || initialTemplate?.category || "",
            offerType: initialTemplate?.offerType || "",
            currentStep: initialTemplate ? "template" : "platform",
            integrationSelections: integrationDefaults,
            leadForm: {
              mode: "existing",
              selectedFormId: integrationDefaults.leadFormId,
              selectedFormName:
                availableLeadForms.find((leadForm) => leadForm.asset_id === integrationDefaults.leadFormId)?.name || "",
              managedFormName: `${initialTemplate?.name || "Campaign"} Lead Form`,
              fields: ["FULL_NAME", "EMAIL", "PHONE"],
            },
          },
        }),
  );
  const [draftId, setDraftId] = useState<string | null>(initialDraftBundle?.campaign.id || null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [preflight, setPreflight] = useState<LaunchPreflightResponse | null>(null);
  const [preflightMode, setPreflightMode] = useState<CampaignPublishMode>("draft");
  const [preflightError, setPreflightError] = useState<string | null>(null);
  const metaConnectScopeSet =
    launchState.adType === "lead_form" ? "&scopeSet=lead_forms" : "";
  const metaConnectHref = `/api/meta/connect?next=${encodeURIComponent(connectNextUrl)}${metaConnectScopeSet}`;
  const [isPreflighting, setIsPreflighting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
  const [pendingLocation, setPendingLocation] = useState("");
  const deferredLocationQuery = useDeferredValue(pendingLocation);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSearchingLocations, setIsSearchingLocations] = useState(false);
  const [locationSearchError, setLocationSearchError] = useState<string | null>(null);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
  const [reachMorePeople, setReachMorePeople] = useState(true);
  const [industryQuery, setIndustryQuery] = useState("");
  const [templateQuery, setTemplateQuery] = useState("");
  const locationInputWrapRef = useRef<HTMLDivElement | null>(null);
  const locationSuggestionsRef = useRef<HTMLDivElement | null>(null);
  const locationSearchCacheRef = useRef(new Map<string, LocationSuggestion[]>());

  const selectedTemplate =
    templates.find((template) => template.slug === launchState.templateSlug) ||
    initialDraftBundle?.template ||
    initialTemplate ||
    null;
  const selectedTemplateSlug = launchState.templateSlug || initialDraftBundle?.template.slug || initialTemplateSlug || selectedTemplate?.slug || "";
  const selectedIndustryTemplates = templates.filter(
    (template) => !launchState.industry || template.industry === launchState.industry,
  );
  const selectedLocations = launchState.targetLocations || [];
  const activeLocation =
    selectedLocations.find((location) => location.id === activeLocationId) ||
    selectedLocations[0] ||
    null;
  const filteredIndustries = useMemo(() => {
    const query = industryQuery.trim().toLowerCase();
    if (!query) return supportedIndustries;

    return supportedIndustries.filter((industry) => {
      const count = templates.filter((template) => template.industry === industry).length;
      return `${industry} ${count}`.toLowerCase().includes(query);
    });
  }, [industryQuery, templates]);
  const filteredTemplates = useMemo(() => {
    const query = templateQuery.trim().toLowerCase();
    if (!query) return selectedIndustryTemplates;

    return selectedIndustryTemplates.filter((template) =>
      [template.name, template.description, template.offerType, template.industry]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [selectedIndustryTemplates, templateQuery]);
  const placeholderFields = selectedTemplate ? getTemplatePlaceholderFields(selectedTemplate) : [];
  const currentStepIndex = campaignWizardSteps.findIndex((step) => step.id === launchState.currentStep);
  const campaignDetailSteps = useMemo(
    () => getCampaignDetailsStepsForAdType(launchState.adType),
    [launchState.adType],
  );
  const currentDetailsIndex = campaignDetailSteps.findIndex((step) => step.id === launchState.currentDetailsStep);
  const currentDetailsValidation = useMemo(() => {
    const hasAdAccount = Boolean(launchState.integrationSelections.adAccountId);
    const hasPixel = Boolean(launchState.trackingPixelId || launchState.integrationSelections.pixelId);
    const hasLocation = selectedLocations.length > 0;
    const hasBudget = Boolean(parseDailyBudgetAmount(launchState.dailyBudget));
    const placeholderErrors = placeholderFields.filter(
      (field) => !String(launchState.placeholderValues[field.id] || "").trim(),
    );
    const hasPlaceholders = placeholderErrors.length === 0;
    const hasLandingPage = Boolean(launchState.landingPageUrl.trim());
    const hasPhoneNumber = Boolean(launchState.phoneNumber.trim());
    const hasMessengerSetup = Boolean(launchState.messengerWelcomeMessage.trim() && launchState.messengerReplyPrompt.trim());
    const hasCampaignName = Boolean(launchState.advanced.campaignName.trim());
    const hasPage = Boolean(launchState.integrationSelections.pageId);
    const hasLeadFormStrategy = launchState.leadForm.mode === "existing"
      ? Boolean(launchState.leadForm.selectedFormId)
      : Boolean(launchState.leadForm.managedFormName.trim() && launchState.advanced.privacyPolicyUrl.trim());

    const validation = {
      isValid: true,
      reason: "",
      hasBudget,
      hasLocation,
      hasAdAccount,
      hasPixel,
      hasPlaceholders,
      placeholderMissingCount: placeholderErrors.length,
      hasLandingPage,
      hasPhoneNumber,
      hasMessengerSetup,
      hasCampaignName,
      hasPage,
      hasLeadFormStrategy,
    };

    switch (launchState.currentDetailsStep) {
      case "budget":
        validation.isValid = hasBudget;
        validation.reason = hasBudget ? "" : "Enter a daily budget to continue.";
        break;
      case "location":
        validation.isValid = hasLocation;
        validation.reason = hasLocation ? "" : "Add at least one target location to continue.";
        break;
      case "tracking-pixel":
        validation.isValid = hasAdAccount && hasPixel;
        validation.reason = hasAdAccount && hasPixel ? "" : "Choose an ad account and pixel to continue.";
        break;
      case "placeholders":
        validation.isValid = hasPlaceholders;
        validation.reason = hasPlaceholders ? "" : "Fill in every required placeholder to continue.";
        break;
      case "landing-page":
        validation.isValid = hasLandingPage;
        validation.reason = hasLandingPage ? "" : "Enter a landing page URL to continue.";
        break;
      case "phone-number":
        validation.isValid = hasPhoneNumber;
        validation.reason = hasPhoneNumber ? "" : "Enter a business phone number to continue.";
        break;
      case "messenger-setup":
        validation.isValid = hasMessengerSetup;
        validation.reason = hasMessengerSetup ? "" : "Add the Messenger welcome message and reply prompt to continue.";
        break;
      case "advanced":
        validation.isValid = hasCampaignName && hasAdAccount && hasPage && hasLeadFormStrategy;
        validation.reason =
          hasCampaignName && hasAdAccount && hasPage && hasLeadFormStrategy
            ? ""
            : "Finish the campaign name, ad account, page, and lead form setup to continue.";
        break;
      default:
        break;
    }

    return validation;
  }, [
    launchState.advanced.campaignName,
    launchState.advanced.privacyPolicyUrl,
    launchState.dailyBudget,
    launchState.integrationSelections.adAccountId,
    launchState.integrationSelections.pageId,
    launchState.integrationSelections.pixelId,
    launchState.landingPageUrl,
    launchState.leadForm.managedFormName,
    launchState.leadForm.mode,
    launchState.leadForm.selectedFormId,
    launchState.messengerReplyPrompt,
    launchState.messengerWelcomeMessage,
    launchState.phoneNumber,
    launchState.placeholderValues,
    launchState.trackingPixelId,
    launchState.currentDetailsStep,
    placeholderFields,
    selectedLocations.length,
  ]);

  const previewBlueprint = selectedTemplate
    ? createCampaignBlueprint(
        selectedTemplate,
        getTemplateSetupValuesFromLaunchState(selectedTemplate, launchState, businessProfile),
        {
          logoUrl: businessProfile?.logo_url || null,
          beforeImageUrls: [],
          afterImageUrls: [],
        },
      )
    : null;
  const pagePreviewIdentity = resolveMetaPagePreviewIdentity({
    integration: metaIntegration,
    preferredPageId: launchState.integrationSelections.pageId || metaIntegration?.selected.pageId || null,
    fallbackName: metaConnected ? "Select a Facebook Page" : "Connect Meta and select a Facebook Page",
  });
  const connectedPageAsset = pagePreviewIdentity.asset;
  const connectedPageAvatarUrl = pagePreviewIdentity.pageAvatarUrl;

  useEffect(() => {
    if (!selectedLocations.length) {
      if (activeLocationId !== null) setActiveLocationId(null);
      return;
    }

    if (!activeLocation || activeLocation.id !== activeLocationId) {
      setActiveLocationId(selectedLocations[0].id);
    }
  }, [activeLocation, activeLocationId, selectedLocations]);

  function syncLocationSummary(nextLocations: NonNullable<CampaignLaunchState["targetLocations"]>) {
    return nextLocations.length ? nextLocations[0].label : "";
  }

  function normalizeLaunchStateForSubmission(state: CampaignLaunchState): CampaignLaunchState {
    let nextState = { ...state };

    if ((!nextState.targetLocations || nextState.targetLocations.length === 0) && pendingLocation.trim()) {
      const label = pendingLocation.trim();
      const suggestion = locationSuggestions[0];

      if (suggestion) {
        const nextLocation = {
          id: normalizeLocationId(`${suggestion.id}-${suggestion.label}`) || `location-${Date.now()}`,
          label: compactLocationLabel(suggestion.metaLocation.name || suggestion.label, suggestion.scope),
          radius: defaultLocationRadius,
          radiusAllowed: suggestion.radiusAllowed ?? canEditLocationRadius(suggestion.scope),
          distanceUnit: suggestion.distanceUnit || "mile",
          targetingMode: "home" as const,
          scope: suggestion.scope,
          lat: suggestion.lat,
          lon: suggestion.lon,
          countryCode: suggestion.countryCode,
          metaLocation: suggestion.metaLocation,
        };

        nextState = {
          ...nextState,
          targetLocations: [nextLocation],
          targetLocation: nextLocation.label,
        };
      } else {
        const nextLocation = {
          id: normalizeLocationId(label) || `location-${Date.now()}`,
          label,
          radius: defaultLocationRadius,
          radiusAllowed: true,
          distanceUnit: "mile" as const,
          targetingMode: "home" as const,
          scope: "address" as const,
          metaLocation: {
            name: label,
            type: "address",
            classification: "address" as const,
            addressString: label,
          },
        };

        nextState = {
          ...nextState,
          targetLocations: [nextLocation],
          targetLocation: nextLocation.label,
        };
      }
    }

    if (nextState.adType === "lead_form") {
      const hasExistingLeadForm = Boolean(
        nextState.leadForm.selectedFormId || nextState.integrationSelections.leadFormId,
      );

      if (nextState.leadForm.mode === "existing" && !hasExistingLeadForm) {
        const fallbackLeadFormId =
          nextState.integrationSelections.leadFormId || availableLeadForms[0]?.asset_id || "";
        const fallbackLeadFormName =
          availableLeadForms.find((form) => form.asset_id === fallbackLeadFormId)?.name || "";

        if (fallbackLeadFormId) {
          nextState = {
            ...nextState,
            leadForm: {
              ...nextState.leadForm,
              selectedFormId: fallbackLeadFormId,
              selectedFormName: fallbackLeadFormName,
            },
            integrationSelections: {
              ...nextState.integrationSelections,
              leadFormId: fallbackLeadFormId,
            },
          };
        } else {
          nextState = {
            ...nextState,
            leadForm: {
              ...nextState.leadForm,
              mode: "managed_new",
            },
            advanced: {
              ...nextState.advanced,
              privacyPolicyUrl:
                nextState.advanced.privacyPolicyUrl.trim() || buildDefaultPrivacyPolicyUrl(connectNextUrl),
            },
          };
        }
      }
    }

    if (
      !nextState.placeholderValues.price?.trim() &&
      nextState.placeholderValues.offerPrice?.trim()
    ) {
      nextState = {
        ...nextState,
        placeholderValues: {
          ...nextState.placeholderValues,
          price: nextState.placeholderValues.offerPrice,
        },
      };
    }

    return nextState;
  }

  function resetLaunchValidation() {
    setPreflight(null);
    setPreflightError(null);
    setPublishError(null);
    setPublishSuccess(null);
  }

  function updateLaunchState(updater: (current: CampaignLaunchState) => CampaignLaunchState) {
    resetLaunchValidation();
    setLaunchState((current) => updater(current));
  }

  function setStep(step: CampaignLaunchState["currentStep"]) {
    const nextState: CampaignLaunchState = {
      ...launchState,
      currentStep: step,
    };
    resetLaunchValidation();
    setLaunchState(nextState);
    if (selectedTemplateSlug) {
      void persistDraft(nextState, { pushToDraft: !draftId });
    }
  }

  function setDetailsStep(step: CampaignDetailsStep) {
    const nextState: CampaignLaunchState = {
      ...launchState,
      currentStep: "campaign-details",
      currentDetailsStep: step,
    };
    resetLaunchValidation();
    setLaunchState(nextState);
    if (selectedTemplateSlug) {
      void persistDraft(nextState, { pushToDraft: !draftId });
    }
  }

  function goToNextDetailsStep() {
    if (!currentDetailsValidation.isValid) return;
    if (launchState.currentDetailsStep === "advanced") {
      setDetailsStep("review");
      return;
    }
    const nextStep = getNextCampaignDetailsStep(launchState.adType, launchState.currentDetailsStep);
    setDetailsStep(nextStep);
  }

  function goToPreviousDetailsStep() {
    if (launchState.currentDetailsStep === "advanced") {
      setDetailsStep("review");
      return;
    }

    if (currentDetailsIndex <= 0) {
      setStep("template");
      return;
    }
    const previousStep = getPreviousCampaignDetailsStep(launchState.adType, launchState.currentDetailsStep);
    setDetailsStep(previousStep);
  }

  async function persistDraft(nextState: CampaignLaunchState, options?: { pushToDraft?: boolean }) {
    if (!selectedTemplateSlug) return null;

    const submissionState = normalizeLaunchStateForSubmission(nextState);

    setSaveState("saving");
    setSaveError(null);

    const { response, payload } = await saveDraftRequest({
      draftId: draftId || undefined,
      templateSlug: selectedTemplateSlug,
      state: submissionState,
    });

    if (!response.ok) {
      setSaveState("error");
      setSaveError(payload?.error || "Campaign draft could not be saved.");
      return null;
    }

    if (payload?.draftId) {
      setDraftId(payload.draftId);
      if (options?.pushToDraft) {
        router.replace(`/templates/new?draft=${payload.draftId}`, { scroll: false });
      }
    }

    setLaunchState(submissionState);
    setSaveState("saved");
    return payload?.draftId || draftId;
  }

  async function runLaunchPreflight(mode: CampaignPublishMode) {
    setPreflightMode(mode);
    setPreflightError(null);
    setPublishError(null);
    setPublishSuccess(null);
    setIsPreflighting(true);

    try {
      const submissionState = normalizeLaunchStateForSubmission(launchState);
      setLaunchState(submissionState);
      const response = await fetch("/api/meta/preflight", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignId: draftId || undefined,
          templateSlug: selectedTemplateSlug || undefined,
          state: submissionState,
          mode,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | LaunchPreflightResponse
        | { error?: string }
        | null;

      if (!response.ok) {
        setPreflight(null);
        setPreflightError(payload && "error" in payload ? payload.error || "Preflight could not be completed." : "Preflight could not be completed.");
        return null;
      }

      const readyPayload = payload as LaunchPreflightResponse;
      if (readyPayload.draftId) {
        setDraftId(readyPayload.draftId);
      }
      setPreflight(readyPayload);
      if (readyPayload.blockingIssues.length) {
        setPreflightError("Preflight found blocking issues. Resolve them before publishing.");
      }
      return {
        draftId: readyPayload.draftId || draftId,
        preflight: readyPayload,
      };
    } catch {
      setPreflight(null);
      setPreflightError("Preflight could not be completed.");
      return null;
    } finally {
      setIsPreflighting(false);
    }
  }

  async function publishToMeta(mode: CampaignPublishMode) {
    setPublishError(null);
    setPublishSuccess(null);
    setIsPublishing(true);

    const preflightResult = await runLaunchPreflight(mode);
    if (!preflightResult) {
      setIsPublishing(false);
      return;
    }

    if (preflightResult.preflight.blockingIssues.length) {
      setIsPublishing(false);
      return;
    }

    try {
      const response = await fetch("/api/meta/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignId: preflightResult.draftId,
          templateSlug: selectedTemplateSlug || undefined,
          state: normalizeLaunchStateForSubmission(launchState),
          mode,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            error?: string;
            preflight?: LaunchPreflightResponse;
          }
        | null;

      if (!response.ok) {
        if (payload?.preflight) {
          setPreflight(payload.preflight);
        }
        setPublishError(payload?.error || "Meta publish failed.");
        return;
      }

      setPublishSuccess(
        mode === "live"
          ? "Campaign was sent to Meta. Live activation was requested with safe fallbacks."
          : "Draft objects were created in Meta successfully.",
      );
      router.refresh();
    } catch {
      setPublishError("Meta publish failed.");
    } finally {
      setIsPublishing(false);
    }
  }

  async function enterCampaignDetails() {
    if (!selectedTemplate) return;
    const supportedAdTypes = selectedTemplate.supportedAdTypes?.length ? selectedTemplate.supportedAdTypes : null;
    const resolvedAdType =
      supportedAdTypes?.includes(launchState.adType)
        ? launchState.adType
        : selectedTemplate.defaultAdType && supportedAdTypes?.includes(selectedTemplate.defaultAdType)
          ? selectedTemplate.defaultAdType
          : supportedAdTypes?.[0] || launchState.adType || "lead_form";

    const nextState: CampaignLaunchState = {
      ...launchState,
      currentStep: "campaign-details",
      adType: resolvedAdType,
      currentDetailsStep: "ad-type",
      category: selectedTemplate.industry,
      industry: selectedTemplate.industry,
      offerType: selectedTemplate.offerType,
      templateSlug: selectedTemplate.slug,
    };

    setLaunchState(nextState);
    await persistDraft(nextState, { pushToDraft: true });
  }

  useEffect(() => {
    if (!draftId || launchState.currentStep !== "campaign-details" || !selectedTemplate) return;

    const timeoutId = window.setTimeout(() => {
      void (async () => {
        setSaveState("saving");
        setSaveError(null);
        const { response, payload } = await saveDraftRequest({
          draftId,
          templateSlug: selectedTemplate.slug,
          state: launchState,
        });

        if (!response.ok) {
          setSaveState("error");
          setSaveError(payload?.error || "Campaign draft could not be saved.");
          return;
        }

        if (payload?.draftId) {
          setDraftId(payload.draftId);
        }

        setSaveState("saved");
      })();
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [draftId, launchState, selectedTemplate]);

  useEffect(() => {
    const query = deferredLocationQuery.trim();
    if (query.length < 2) {
      setLocationSuggestions([]);
      setIsSearchingLocations(false);
      setLocationSearchError(null);
      return;
    }

    const cachedSuggestions = locationSearchCacheRef.current.get(query.toLowerCase());
    if (cachedSuggestions) {
      setLocationSuggestions(cachedSuggestions);
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void (async () => {
        setIsSearchingLocations(true);
        setLocationSearchError(null);
        try {
          const response = await fetch(`/api/location-search?q=${encodeURIComponent(query)}`, {
            signal: controller.signal,
            cache: "no-store",
          });
          const payload = (await response.json().catch(() => null)) as
            | { suggestions?: LocationSuggestion[]; error?: string }
            | null;

          if (!response.ok) {
            setLocationSuggestions([]);
            setLocationSearchError(payload?.error || "Could not load location suggestions.");
            return;
          }

          const suggestions = payload?.suggestions || [];
          locationSearchCacheRef.current.set(query.toLowerCase(), suggestions);
          setLocationSuggestions(suggestions);
        } catch {
          if (!controller.signal.aborted) {
            setLocationSuggestions([]);
            setLocationSearchError("Could not load location suggestions.");
          }
        } finally {
          if (!controller.signal.aborted) {
            setIsSearchingLocations(false);
          }
        }
      })();
    }, 50);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [deferredLocationQuery]);

  useEffect(() => {
    function closeSuggestionsOnOutsideClick(event: MouseEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (locationInputWrapRef.current?.contains(target)) return;
      if (locationSuggestionsRef.current?.contains(target)) return;
      setShowLocationSuggestions(false);
    }

    window.addEventListener("mousedown", closeSuggestionsOnOutsideClick);
    return () => window.removeEventListener("mousedown", closeSuggestionsOnOutsideClick);
  }, []);

  function addLocation() {
    const label = pendingLocation.trim();
    const normalized = label.toLowerCase();
    const isWorldwideManual = normalized === "world" || normalized === "worldwide" || normalized === "global";
    const looksLikeAddress =
      /\d/.test(label) ||
      /(?:street|st|avenue|ave|road|rd|lane|ln|drive|dr|boulevard|blvd|court|ct|way|suite|ste|apt|apartment|unit)\b/i.test(label);
    const locationId = normalizeLocationId(label) || `location-${Date.now()}`;
    if (!label) return;

    if (!isWorldwideManual && locationSuggestions.length) {
      addLocationFromSuggestion(locationSuggestions[0]);
      return;
    }

    if (!isWorldwideManual && !looksLikeAddress) {
      return;
    }

    updateLaunchState((current) => {
      const existing = current.targetLocations || [];
      if (existing.some((location) => location.label.toLowerCase() === label.toLowerCase())) {
        return current;
      }
      const manualScope: NonNullable<CampaignLaunchState["targetLocations"]>[number]["scope"] = isWorldwideManual
        ? "world"
        : "address";
      const manualMetaLocation: MetaLocationTargeting | undefined = isWorldwideManual
        ? { name: "Worldwide", type: "world" }
        : {
            name: label,
            type: "address",
            classification: "address",
            addressString: label,
          };

      const nextLocation = {
        id: locationId,
        label: isWorldwideManual ? "Worldwide" : label,
        radius: defaultLocationRadius,
        radiusAllowed: isWorldwideManual ? false : true,
        distanceUnit: "mile" as const,
        targetingMode: "home" as const,
        scope: isWorldwideManual ? manualScope : "address",
        metaLocation: manualMetaLocation,
      };

      const nextLocations = isWorldwideManual
        ? [nextLocation]
        : [
        ...existing.filter((location) => location.scope !== "world"),
        nextLocation,
      ];

      return {
        ...current,
        targetLocations: nextLocations,
        targetLocation: syncLocationSummary(nextLocations),
      };
    });
    setPendingLocation("");
    setShowLocationSuggestions(false);
    setLocationSuggestions([]);
  }

  function addLocationFromSuggestion(suggestion: LocationSuggestion) {
    updateLaunchState((current) => {
      const existing = current.targetLocations || [];
      if (
        existing.some(
          (location) =>
            (suggestion.metaLocation.key
              ? location.metaLocation?.key === suggestion.metaLocation.key
              : location.label.toLowerCase() === suggestion.label.toLowerCase() &&
                (location.scope || "address") === suggestion.scope),
        )
      ) {
        return current;
      }

      const nextLocation = {
          id: normalizeLocationId(`${suggestion.id}-${suggestion.label}`) || `location-${existing.length + 1}`,
          label: compactLocationLabel(suggestion.metaLocation.name || suggestion.label, suggestion.scope),
          radius: defaultLocationRadius,
          radiusAllowed: suggestion.radiusAllowed ?? canEditLocationRadius(suggestion.scope),
          distanceUnit: suggestion.distanceUnit || "mile",
          targetingMode: "home" as const,
          scope: suggestion.scope,
          lat: suggestion.lat,
          lon: suggestion.lon,
          countryCode: suggestion.countryCode,
          metaLocation: suggestion.metaLocation,
      };

      const nextLocations =
        suggestion.scope === "world"
          ? [nextLocation]
          : [...existing.filter((location) => location.scope !== "world"), nextLocation];

      return {
        ...current,
        targetLocations: nextLocations,
        targetLocation: syncLocationSummary(nextLocations),
      };
    });
    setPendingLocation("");
    setShowLocationSuggestions(false);
    setLocationSuggestions([]);
    setLocationSearchError(null);
  }

  function updateLocation(
    id: string,
    patch: Partial<NonNullable<CampaignLaunchState["targetLocations"]>[number]>,
  ) {
    updateLaunchState((current) => {
      const nextLocations = (current.targetLocations || []).map((location) =>
        location.id === id ? { ...location, ...patch } : location,
      );
      return {
        ...current,
        targetLocations: nextLocations,
        targetLocation: syncLocationSummary(nextLocations),
      };
    });
  }

  function removeLocation(id: string) {
    updateLaunchState((current) => {
      const nextLocations = (current.targetLocations || []).filter((location) => location.id !== id);
      return {
        ...current,
        targetLocations: nextLocations,
        targetLocation: syncLocationSummary(nextLocations),
      };
    });
    setActiveLocationId((current) => (current === id ? null : current));
  }

  const reviewPlaceholderSummary = placeholderFields.length
    ? placeholderFields
        .map((field) => `${field.label}: ${launchState.placeholderValues[field.id] || "—"}`)
        .join(" • ")
    : "This template has no required placeholders.";
  const normalizedDailyBudget = parseDailyBudgetAmount(launchState.dailyBudget) || 10;
  const budgetDigits = Math.max((launchState.dailyBudget.match(/[0-9]/g) || []).length, 1);
  const isLeadFormAd = launchState.adType === "lead_form";
  const isLandingPageAd = launchState.adType === "landing_page";
  const isCallNowAd = launchState.adType === "call_now";
  const isMessengerAd = launchState.adType === "messenger_leads" || launchState.adType === "messenger_engagement";

  return (
    <div className="space-y-6">
      <WizardProgress
        currentStep={launchState.currentStep}
        onStepClick={(step) => {
          if (step === "campaign-details" && !selectedTemplate) return;
          if (campaignWizardSteps.findIndex((item) => item.id === step) <= currentStepIndex) {
            setStep(step);
          }
        }}
      />

      <StepHero saveState={saveState} saveError={saveError} />

      {launchState.currentStep !== "campaign-details" ? (
        <div className="grid gap-6">
          {launchState.currentStep === "platform" ? (
            <StepSection
              title="Choose a platform"
              description="Start with the ad platform you want this campaign built for. This flow is set up for Meta first."
            >
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <button
                  type="button"
                  onClick={() =>
                    updateLaunchState((current) => ({
                      ...current,
                      platform: "meta",
                    }))
                  }
                  className="rounded-[28px] border border-[rgba(109,94,248,0.18)] bg-[rgba(109,94,248,0.07)] p-6 text-left shadow-[0_16px_32px_rgba(109,94,248,0.06)]"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[var(--brand)] shadow-[0_8px_18px_rgba(15,23,42,0.06)]">
                      <Megaphone className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-base font-semibold text-[var(--ink)]">Meta Ads</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">Facebook + Instagram campaign drafts</p>
                    </div>
                  </div>
                  <p className="mt-5 text-sm leading-6 text-[var(--muted)]">
                    Build a launch-ready Meta campaign with template placeholders, goal selection, location targeting,
                    and a persistent ad preview.
                  </p>
                </button>

                <BuilderTip title="Why this comes first" icon={Rocket}>
                  The platform decides what campaign structure, preview behavior, and asset connections the wizard will use.
                  Connect Facebook here before continuing so the rest of the wizard can use the live workspace account.
                  <div className="mt-4">
                    <Button asChild variant={metaConnected ? "outline" : "primary"} className="w-full sm:w-auto">
                      <Link href={metaConnectHref}>
                        {metaConnected ? "Reconnect Facebook" : "Connect Facebook"}
                      </Link>
                    </Button>
                    {metaConnected ? (
                      <p className="mt-2 text-xs text-emerald-700">Facebook is connected for this workspace.</p>
                    ) : (
                      <p className="mt-2 text-xs text-[var(--muted)]">
                        You need a connected Facebook account before moving to the next step.
                      </p>
                    )}
                  </div>
                </BuilderTip>
              </div>

              <div className="mt-7 flex justify-end">
                <Button onClick={() => setStep("industry")} disabled={!metaConnected}>
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              {!metaConnected ? (
                <p className="mt-3 text-right text-sm text-rose-600">
                  Connect Facebook to continue past this step.
                </p>
              ) : null}
            </StepSection>
          ) : null}

          {launchState.currentStep === "industry" ? (
            <StepSection
              title="Select industry"
              description="Choose the business type this workspace is launching for."
            >
              <div className="mb-5">
                <Input
                  value={industryQuery}
                  onChange={(event) => setIndustryQuery(event.target.value)}
                  placeholder="Search industries"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredIndustries.map((industry) => {
                  const active = launchState.industry === industry;
                  const count = templates.filter((template) => template.industry === industry).length;

                  return (
                    <button
                      key={industry}
                      type="button"
                      onClick={() =>
                        updateLaunchState((current) => ({
                          ...current,
                          category: industry,
                          industry,
                          offerType:
                            current.offerType && templates.some((template) => template.industry === industry && template.offerType === current.offerType)
                              ? current.offerType
                              : "",
                          templateSlug:
                            current.templateSlug &&
                            templates.some((template) => template.slug === current.templateSlug && template.industry === industry)
                              ? current.templateSlug
                              : "",
                        }))
                      }
                      className={cn(
                        "rounded-[26px] border p-5 text-left transition-all duration-200",
                        active
                          ? "border-[rgba(109,94,248,0.18)] bg-[rgba(109,94,248,0.08)] shadow-[0_14px_30px_rgba(109,94,248,0.06)]"
                          : "border-[var(--line)] bg-white hover:bg-[var(--soft-panel)]",
                      )}
                    >
                      <p className="text-base font-semibold text-[var(--ink)]">{industry}</p>
                      <p className="mt-2 text-sm text-[var(--muted)]">{count} templates available</p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-7 flex items-center justify-between">
                <Button variant="outline" onClick={() => setStep("platform")}>
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button onClick={() => setStep("template")} disabled={!launchState.industry}>
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </StepSection>
          ) : null}

          {launchState.currentStep === "template" ? (
            <StepSection
              title="Select template"
              description="Pick the SideKick template you want to turn into a launch-ready Meta campaign."
            >
              <div className="mb-5 flex flex-wrap gap-2">
                {launchState.industry ? <Badge>{launchState.industry}</Badge> : null}
                {selectedTemplate ? <Badge>{selectedTemplate.name}</Badge> : null}
              </div>

              <div className="mb-5">
                <Input
                  value={templateQuery}
                  onChange={(event) => setTemplateQuery(event.target.value)}
                  placeholder="Search templates"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredTemplates.map((template) => {
                  const active = launchState.templateSlug === template.slug;
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() =>
                        updateLaunchState((current) => ({
                          ...current,
                          category: template.industry,
                          industry: template.industry,
                          offerType: template.offerType,
                          templateSlug: template.slug,
                          previewTab: "ad",
                          advanced: {
                            ...current.advanced,
                            campaignName: `${businessProfile?.business_name || "SideKick"} ${template.name}`,
                            leadFormName: `${template.name} Lead Form`,
                          },
                          leadForm: {
                            ...current.leadForm,
                            managedFormName: `${template.name} Lead Form`,
                          },
                          placeholderValues: {
                            ...createInitialCampaignLaunchState({ template, businessProfile }).placeholderValues,
                            ...current.placeholderValues,
                          },
                        }))
                      }
                      className={cn(
                        "group overflow-hidden rounded-[28px] border text-left transition-all duration-200",
                        active
                          ? "border-[rgba(109,94,248,0.18)] bg-[rgba(109,94,248,0.08)] shadow-[0_14px_30px_rgba(109,94,248,0.06)]"
                          : "border-[var(--line)] bg-white hover:bg-[var(--soft-panel)]",
                      )}
                    >
                      <FacebookAdPreview
                        template={template}
                        pageName={pagePreviewIdentity.pageName}
                        pageAvatarUrl={connectedPageAvatarUrl}
                        primaryText={template.adCopy.primary}
                        headline={template.adCopy.headlines[0] || template.name}
                        description={template.promoDetails}
                        ctaLabel={template.ctaDefault}
                        imageUrl={template.previewImage}
                        compact
                        showMetaBar={false}
                        interactiveControls={false}
                        className="rounded-none border-0 shadow-none"
                      />
                      <div className="space-y-3 p-5">
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full border border-[var(--line)] bg-[var(--soft-panel)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-strong)]">
                            {template.offerType}
                          </span>
                        </div>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-semibold text-[var(--ink)]">{template.name}</p>
                            <p className="mt-1 text-xs text-[var(--muted)]">{template.industry}</p>
                          </div>
                          <CircleDot className={cn("h-5 w-5", active ? "text-[var(--brand)]" : "text-transparent")} />
                        </div>
                        <p className="text-sm leading-6 text-[var(--muted)]">{template.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-7 flex items-center justify-between">
                <Button variant="outline" onClick={() => setStep("industry")}>
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button onClick={() => void enterCampaignDetails()} disabled={!selectedTemplate}>
                  Continue to campaign details
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </StepSection>
          ) : null}
        </div>
      ) : selectedTemplate && previewBlueprint ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
          <div className="contents lg:col-span-7 lg:block">
            <div className="space-y-6">
            {launchState.currentDetailsStep === "ad-type" ? (
              <StepSection
                title="Pick Your Ad Type"
                description="Choose the campaign flow this template should launch as. This determines which steps appear next."
              >
                <div className="space-y-8">
                  <div className="text-center">
                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 shadow-lg shadow-blue-500/25">
                      <Rocket className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Pick Your Ad Type</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      We will only show the setup steps required for the ad type you choose here.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {adTypeOptions.map((option) => {
                      const active = launchState.adType === option.id;
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() =>
                            updateLaunchState((current) => ({
                              ...current,
                              adType: option.id,
                              campaignGoal: getCampaignGoalForAdType(option.id),
                              previewTab: option.id === "lead_form" ? current.previewTab || "ad" : "ad",
                              thankYouPage: {
                                ...current.thankYouPage,
                                enabled: option.id === "lead_form" ? current.thankYouPage.enabled : false,
                                buttonAction:
                                  option.id === "call_now"
                                    ? "CALL_BUSINESS"
                                    : current.thankYouPage.buttonAction,
                                buttonLabel:
                                  option.id === "call_now"
                                    ? getDefaultThankYouButtonLabel("CALL_BUSINESS")
                                    : current.thankYouPage.buttonLabel,
                              },
                            }))
                          }
                          className={cn(
                            "group relative flex flex-col items-start rounded-2xl border-2 p-5 text-left transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                            active
                              ? "border-transparent bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/50"
                              : "border-gray-200 bg-white hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md",
                          )}
                          >
                          <div
                            className={cn(
                              "relative mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300",
                              active
                                ? "bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg"
                                : "bg-gray-100 group-hover:scale-105",
                            )}
                          >
                            <span className={cn(active ? "text-white" : "text-gray-600")}>
                              <Icon className="h-6 w-6" />
                            </span>
                          </div>
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 opacity-0 transition-opacity duration-300 group-hover:opacity-5" />
                          <h4 className="relative mb-1 text-base font-semibold text-gray-900">{option.label}</h4>
                          <p className="relative text-sm leading-relaxed text-gray-500">{option.description}</p>
                        </button>
                      );
                    })}
                  </div>

                  <BuilderTip title="Why this comes first" icon={PanelLeft}>
                    Picking the ad type controls whether you need a lead form, landing page, call setup, or Messenger setup.
                  </BuilderTip>
                </div>
              </StepSection>
            ) : null}

            {launchState.currentDetailsStep === "budget" ? (
              <StepSection
                title="Set your daily budget"
                description="Choose the daily spend this campaign should be ready to use when it gets pushed into Meta."
              >
                <div className="space-y-8">
                  <div className="text-center">
                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 shadow-lg shadow-emerald-500/25">
                      <BadgeDollarSign className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Set your daily budget</h3>
                    <p className="mt-2 text-sm text-gray-500">How much do you want to spend per day on your ad?</p>
                  </div>

                  <div className="mx-auto max-w-2xl">
                    <div
                      className={cn(
                        "relative rounded-3xl border bg-gradient-to-br from-gray-50 to-gray-100 p-8",
                        currentDetailsValidation.hasBudget
                          ? "border-gray-200"
                          : "border-rose-300 bg-rose-50/80",
                      )}
                    >
                      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 opacity-20 blur-2xl" />
                      <div className="relative">
                        <div className="flex items-center justify-center gap-3">
                          <span className="text-5xl font-bold text-gray-400">$</span>
                          <input
                            type="text"
                            value={launchState.dailyBudget}
                            onChange={(event) =>
                              updateLaunchState((current) => ({
                                ...current,
                                dailyBudget: event.target.value
                                  .replace(/[^0-9.]/g, "")
                                  .replace(/^(\d*\.?\d{0,2}).*$/, "$1"),
                              }))
                            }
                            inputMode="decimal"
                            autoComplete="off"
                            placeholder="10"
                            style={{
                              ["--budget-digits" as string]: String(budgetDigits),
                              fontSize:
                                "clamp(2.35rem, calc(3.65rem - (var(--budget-digits) * 0.16rem)), 3.35rem)",
                            }}
                            aria-invalid={!currentDetailsValidation.hasBudget}
                            className={cn(
                              "w-44 overflow-hidden border-none bg-transparent text-center font-black leading-none tracking-tight placeholder:text-gray-300 [font-variant-numeric:tabular-nums] focus:outline-none md:w-56",
                              currentDetailsValidation.hasBudget ? "text-gray-900" : "text-rose-700 placeholder:text-rose-300",
                            )}
                          />
                          <span className="text-xl font-medium text-gray-400">/day</span>
                        </div>

                        <div className="mx-auto mt-2 h-1 w-48 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
                      </div>
                    </div>

                    <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                            <BadgeDollarSign className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">Monthly estimate</p>
                            <p className="text-xs text-gray-500">Based on 30.4 days avg</p>
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent">
                          ${String((normalizedDailyBudget * 30.4).toFixed(0))}/mo
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 flex items-start gap-3 rounded-xl border border-purple-200 bg-purple-50 p-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                        <Sparkles className="h-4 w-4 text-purple-600" />
                      </div>
                      <p className="text-sm text-purple-800">
                        <span className="font-semibold">Pro tip:</span> We recommend at least $30/day to give Facebook enough data to optimize your campaign effectively.
                      </p>
                    </div>
                  </div>
                </div>
              </StepSection>
            ) : null}

            {launchState.currentDetailsStep === "location" ? (
              <StepSection
                title="Target Location"
                description="Search Meta locations, pick the right target, and set a radius only where it actually applies."
              >
                {(() => {
                  const selectedLocations = launchState.targetLocations || [];

                  return (
                    <div className="flex h-[620px] flex-col gap-4">
                      <div
                        className={cn(
                          "rounded-[24px] border bg-white p-4 sm:p-5",
                          currentDetailsValidation.hasLocation
                            ? "border-[var(--line)]"
                            : "border-rose-300 bg-rose-50/50",
                        )}
                      >
                          <div ref={locationInputWrapRef} className="relative">
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                                <Input
                                  value={pendingLocation}
                                  onChange={(event) => {
                                    setPendingLocation(event.target.value);
                                    setShowLocationSuggestions(true);
                                  }}
                                  onFocus={() => setShowLocationSuggestions(true)}
                                  placeholder="Search city, state, country, or address…"
                                  className="pl-9"
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                      event.preventDefault();
                                      addLocation();
                                    }
                                  }}
                                />
                              </div>
                              <Button type="button" onClick={addLocation} className="shrink-0 gap-1.5">
                                <Plus className="h-4 w-4" />
                                <span className="hidden sm:inline">Add</span>
                              </Button>
                            </div>

                            {showLocationSuggestions && pendingLocation.trim().length >= 2 ? (
                              <div
                                ref={locationSuggestionsRef}
                                className="mt-2 overflow-hidden rounded-[20px] border border-[var(--line)] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.12)]"
                              >
                                <div className="max-h-64 overflow-auto p-1.5">
                                  {isSearchingLocations ? (
                                    <div className="flex items-center gap-3 px-3 py-3 text-sm text-[var(--muted)]">
                                      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />
                                      Searching Meta locations…
                                    </div>
                                  ) : locationSearchError ? (
                                    <p className="px-3 py-3 text-sm text-red-600">{locationSearchError}</p>
                                  ) : locationSuggestions.length ? (
                                    <div>
                                      <div className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                                        Meta targeting
                                      </div>
                                      {locationSuggestions.map((suggestion) => (
                                        <button
                                          key={suggestion.id}
                                          type="button"
                                          onClick={() => addLocationFromSuggestion(suggestion)}
                                          className="flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left transition-colors hover:bg-[var(--surface)]"
                                        >
                                          <MapPin className="h-4 w-4 shrink-0 text-[var(--brand)]" />
                                          <span className="min-w-0 flex-1">
                                            <span className="block text-sm font-semibold text-[var(--ink)]">{suggestion.label}</span>
                                            <span className="mt-0.5 block text-xs text-[var(--muted)]">
                                              {locationScopeLabel(suggestion.scope)}
                                              {suggestion.metaLocation.countryName ? ` · ${suggestion.metaLocation.countryName}` : ""}
                                              {suggestion.metaLocation.region ? ` · ${suggestion.metaLocation.region}` : ""}
                                            </span>
                                          </span>
                                          <span className="shrink-0 rounded-full bg-[var(--soft-brand)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--brand-ink)]">
                                            {suggestion.source === "manual" ? "Exact" : "Meta"}
                                          </span>
                                        </button>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="px-3 py-3 text-sm text-[var(--muted)]">No results. Try a different query.</p>
                                  )}
                                </div>
                              </div>
                            ) : null}

                            <div className="mt-4 rounded-[20px] border border-dashed border-[var(--line)] bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">
                              Search Meta locations above, then use the selected locations list below to edit targeting details.
                            </div>
                            {!currentDetailsValidation.hasLocation ? (
                              <div className="mt-4 rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                Add at least one target location to continue.
                              </div>
                            ) : null}
                          </div>
                        </div>

                      <div className="flex min-h-0 flex-1 flex-col rounded-[24px] border border-[var(--line)] bg-white p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-[var(--ink)]">All selected locations</p>
                            <p className="mt-1 text-sm text-[var(--muted)]">Click a location to edit its radius, unit, or targeting mode.</p>
                          </div>
                          <span className="rounded-full bg-[var(--soft-panel)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-strong)]">
                            {selectedLocations.length} total
                          </span>
                        </div>

                        {selectedLocations.length ? (
                          <div className="mt-4 min-h-0 flex-1 overflow-auto pr-1">
                            <div className="space-y-3">
                              {selectedLocations.map((location) => {
                                const radiusAllowed = canEditLocationRadius(location.scope, location.radiusAllowed);
                                const isActive = location.id === (activeLocation?.id ?? selectedLocations[0]?.id ?? "");
                                return (
                                  <div
                                    key={location.id}
                                    className={cn(
                                      "w-full rounded-[18px] border p-4 text-left transition-colors",
                                      isActive
                                        ? "border-[rgba(109,94,248,0.2)] bg-[rgba(109,94,248,0.04)]"
                                        : "border-[var(--line)] bg-[var(--surface)] hover:bg-white",
                                    )}
                                  >
                                    <div
                                      onClick={() => setActiveLocationId(location.id)}
                                      className="w-full cursor-pointer text-left"
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                          <p className="truncate text-sm font-semibold text-[var(--ink)]">{location.label}</p>
                                          <p className="mt-0.5 text-xs text-[var(--muted)]">{locationMetadataSummary(location)}</p>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            removeLocation(location.id);
                                          }}
                                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-white text-[var(--muted)] transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                          aria-label={`Remove ${location.label}`}
                                        >
                                          <X className="h-3.5 w-3.5" />
                                        </button>
                                      </div>

                                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--muted-strong)]">
                                        <span className="rounded-full bg-[var(--soft-panel)] px-2.5 py-1 font-semibold uppercase tracking-[0.12em]">
                                          {locationScopeLabel(location.scope)}
                                        </span>
                                        <span className="rounded-full bg-[var(--soft-panel)] px-2.5 py-1 font-semibold uppercase tracking-[0.12em]">
                                          {locationTargetShapeLabel(location)}
                                        </span>
                                        <span className="rounded-full bg-[var(--soft-panel)] px-2.5 py-1 font-semibold uppercase tracking-[0.12em]">
                                          {radiusAllowed ? `${location.radius} ${distanceUnitLabel(location.distanceUnit)}` : "No radius"}
                                        </span>
                                      </div>
                                    </div>

                                    {isActive ? (
                                      <div className="mt-4 space-y-3 border-t border-[var(--line)] pt-4">
                                        <div>
                                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                                            Audience mode
                                          </p>
                                          <select
                                            value={location.targetingMode}
                                            onChange={(event) =>
                                              updateLocation(location.id, {
                                                targetingMode: event.target.value as CampaignLocationTargetingType,
                                              })
                                            }
                                            className="mt-1 h-10 w-full rounded-[12px] border border-[var(--line)] bg-white px-3 text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
                                          >
                                            {locationTargetingModeOptions.map((mode) => (
                                              <option key={mode.value} value={mode.value}>
                                                {mode.label}
                                              </option>
                                            ))}
                                          </select>
                                          <p className="mt-2 text-xs text-[var(--muted)]">
                                            {locationTargetingModeLabel(location.targetingMode)}
                                          </p>
                                        </div>

                                        {radiusAllowed ? (
                                          <div className="rounded-[16px] border border-[var(--line)] bg-white px-4 py-4">
                                            <div className="flex items-center justify-between gap-3">
                                              <div>
                                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                                                  Radius
                                                </p>
                                                <p className="mt-1 text-sm font-semibold text-[var(--ink)]">
                                                  {location.radius} {distanceUnitFullLabel(location.distanceUnit)}
                                                </p>
                                              </div>
                                              <div className="rounded-full bg-[var(--soft-panel)] px-3 py-1.5 text-xs font-semibold text-[var(--muted-strong)]">
                                                {locationTargetShapeLabel(location)}
                                              </div>
                                            </div>
                                            <div className="mt-3 flex items-center gap-3">
                                              <input
                                                type="range"
                                                min={1}
                                                max={maxLocationRadius}
                                                step={1}
                                                value={clampLocationRadius(location.radius)}
                                                onChange={(event) => updateLocation(location.id, { radius: event.target.value })}
                                                className="location-radius-slider h-2 flex-1 cursor-pointer appearance-none rounded-full"
                                              />
                                              <select
                                                value={location.distanceUnit || "mile"}
                                                onChange={(event) =>
                                                  updateLocation(location.id, {
                                                    distanceUnit: event.target.value as "mile" | "kilometer",
                                                  })
                                                }
                                                className="h-10 w-24 rounded-[12px] border border-[var(--line)] bg-white px-2 text-xs text-[var(--ink)] focus:outline-none"
                                              >
                                                <option value="mile">Miles</option>
                                                <option value="kilometer">Km</option>
                                              </select>
                                            </div>
                                            <p className="mt-3 text-xs text-[var(--muted)]">
                                              Meta will save this as a radius-based target around the selected {locationScopeLabel(location.scope).toLowerCase()}. Max radius: {maxLocationRadius} miles.
                                            </p>
                                          </div>
                                        ) : (
                                          <div className="rounded-[16px] border border-[var(--line)] bg-white px-4 py-3">
                                            <p className="text-sm font-semibold text-[var(--ink)]">Broad geo target</p>
                                            <p className="mt-1 text-sm text-[var(--muted)]">
                                              This {locationScopeLabel(location.scope).toLowerCase()} stays broad in Meta, so radius controls are hidden.
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    ) : null}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 flex min-h-0 flex-1 items-center justify-center rounded-[20px] border border-dashed border-[var(--line)] bg-[var(--surface)] px-6 text-center">
                            <div>
                              <p className="text-sm font-semibold text-[var(--ink)]">Search to pick locations</p>
                              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                                Add a Meta location above to start building your targeting list.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </StepSection>
            ) : null}

            {launchState.currentDetailsStep === "tracking-pixel" ? (
              <StepSection
                title="Add a Tracking Pixel"
                description="Choose a pixel from the connected Meta ad account, then save it into this campaign."
              >
                <div className="space-y-5">
                  <div className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Source</p>
                        <h3 className="text-xl font-bold text-[var(--ink)]">Connected Meta account</h3>
                        <p className="text-sm text-[var(--muted)]">
                          The pixels below are pulled from the selected ad account in your workspace integration.
                        </p>
                      </div>
                      <div className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--muted-strong)] shadow-sm">
                        {metaConnected ? "Synced from Meta" : "Meta not connected"}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[18px] border border-[var(--line)] bg-white px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Ad account</p>
                        <p className="mt-1 text-sm font-semibold text-[var(--ink)]">
                          {selectedAdAccountAsset?.name || metaIntegration?.selected.adAccountId || "No ad account selected"}
                        </p>
                      </div>
                      <div className="rounded-[18px] border border-[var(--line)] bg-white px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">Pixels found</p>
                        <p className="mt-1 text-sm font-semibold text-[var(--ink)]">{availablePixels.length}</p>
                      </div>
                    </div>
                  </div>

                  {!currentDetailsValidation.hasAdAccount || !currentDetailsValidation.hasPixel ? (
                    <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      Choose an ad account and pixel to continue.
                    </div>
                  ) : null}

                  {!metaConnected ? (
                    <div className="rounded-[22px] border border-dashed border-[var(--line)] bg-[var(--surface)] p-6 text-center">
                      <p className="text-sm font-semibold text-[var(--ink)]">Connect Meta to load pixels</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                        Once Meta is connected and an ad account is selected, your available pixels will appear here.
                      </p>
                    </div>
                  ) : !selectedAdAccountAsset ? (
                    <div className="rounded-[22px] border border-dashed border-[var(--line)] bg-[var(--surface)] p-6 text-center">
                      <p className="text-sm font-semibold text-[var(--ink)]">Select an ad account in workspace settings</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                        Pixels are loaded from the chosen Meta ad account. Pick one in workspace settings, then refresh assets.
                      </p>
                    </div>
                  ) : availablePixels.length ? (
                    <div className="space-y-3">
                      {availablePixels.map((pixel) => {
                        const selected = launchState.trackingPixelId === pixel.asset_id;
                        return (
                          <button
                            key={pixel.asset_id}
                            type="button"
                            onClick={() => {
                              const selectedPixel = availablePixels.find((item) => item.asset_id === pixel.asset_id);
                              updateLaunchState((current) => ({
                                ...current,
                                trackingPixelId: pixel.asset_id,
                                trackingPixelName: selectedPixel?.name || "",
                                integrationSelections: {
                                  ...current.integrationSelections,
                                  pixelId: pixel.asset_id,
                                },
                              }));
                            }}
                            className={cn(
                              "w-full rounded-[20px] border p-4 text-left transition-colors",
                              selected
                                ? "border-[rgba(109,94,248,0.2)] bg-[rgba(109,94,248,0.04)]"
                                : "border-[var(--line)] bg-white hover:bg-[var(--surface)]",
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-[var(--ink)]">{pixel.name || pixel.asset_id}</p>
                                <p className="mt-1 text-xs text-[var(--muted)]">Pixel ID {pixel.asset_id}</p>
                              </div>
                              <span className="rounded-full bg-[var(--soft-panel)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--muted-strong)]">
                                {selected ? "Selected" : "Choose"}
                              </span>
                            </div>
                          </button>
                        );
                      })}

                      <div className="rounded-[18px] border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--muted)]">
                        If the pixel you want is missing, refresh assets in workspace settings so this page can pull the latest Meta account data.
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-[22px] border border-dashed border-[var(--line)] bg-[var(--surface)] p-6 text-center">
                      <p className="text-sm font-semibold text-[var(--ink)]">No pixels found on this ad account</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                        Meta is connected, but this ad account does not currently expose any pixels.
                      </p>
                    </div>
                  )}

                  <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                      <Target className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className="text-sm text-blue-800">
                      Pixels are optional for lead-form campaigns and recommended for traffic or sales campaigns.
                    </p>
                  </div>
                </div>
              </StepSection>
            ) : null}

            {launchState.currentDetailsStep === "placeholders" ? (
              <StepSection
                title="Fill Placeholders"
                description="These values come directly from the selected template. Fill the core offer details before you review the launch."
              >
                <div className="space-y-8">
                  <div className="text-center">
                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-500 shadow-lg shadow-indigo-500/25">
                      <Sparkles className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Fill Placeholders</h3>
                    <p className="mt-2 text-sm text-gray-500">These values come directly from the selected template.</p>
                  </div>
                  <div className="mx-auto max-w-2xl">
                    <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    {placeholderFields.map((field, index) => (
                      <div key={field.id} className={cn(index > 0 ? "border-t border-gray-100 pt-5" : "")}>
                        <label
                          className={cn(
                            "mb-2 flex items-center gap-2 text-sm font-semibold",
                            !String(launchState.placeholderValues[field.id] || "").trim()
                              ? "text-rose-700"
                              : "text-gray-900",
                          )}
                        >
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-600">
                            {index + 1}
                          </span>
                          {field.label}
                          <span className="text-red-500">*</span>
                        </label>
                        <Input
                          aria-invalid={!String(launchState.placeholderValues[field.id] || "").trim()}
                          className="rounded-xl border-gray-300 py-3 focus:border-indigo-500 focus:ring-indigo-500"
                          value={launchState.placeholderValues[field.id] || ""}
                          onChange={(event) =>
                            updateLaunchState((current) => ({
                              ...current,
                              placeholderValues: {
                                ...current.placeholderValues,
                                [field.id]: event.target.value,
                              },
                            }))
                          }
                          placeholder={field.placeholder}
                        />
                      </div>
                      ))}
                    </div>
                    {!currentDetailsValidation.hasPlaceholders ? (
                      <div className="mt-4 rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        Fill in every required placeholder to continue.
                      </div>
                    ) : null}
                    <div className="mt-6 flex items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                        <Sparkles className="h-4 w-4 text-indigo-600" />
                      </div>
                      <p className="text-sm text-indigo-800">
                        These values feed the ad copy, preview, and campaign review automatically.
                      </p>
                    </div>
                  </div>
                </div>
              </StepSection>
            ) : null}

            {launchState.currentDetailsStep === "landing-page" ? (
              <StepSection
                title="Landing Page"
                description="Set the website destination for this campaign. This should match the page people land on after clicking the ad."
              >
                <div className="space-y-6">
                  <div
                    className={cn(
                      "rounded-3xl border bg-white p-5 shadow-sm",
                      currentDetailsValidation.hasLandingPage
                        ? "border-gray-200"
                        : "border-rose-300 bg-rose-50/40",
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Destination</p>
                        <h3 className="mt-1 text-lg font-semibold text-gray-900">Landing page URL</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          This is the website visitors will reach when they click the ad.
                        </p>
                      </div>
                      <Badge className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">Website</Badge>
                    </div>

                    <div className="mt-4 flex">
                      <span className="inline-flex items-center rounded-l-xl border border-r-0 border-gray-300 bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700">
                        https://
                      </span>
                      <Input
                        value={launchState.landingPageUrl.replace(/^https?:\/\//, "")}
                        onChange={(event) =>
                          updateLaunchState((current) => ({
                            ...current,
                            landingPageUrl: `https://${event.target.value.replace(/^https?:\/\//, "")}`,
                          }))
                        }
                        placeholder="yourwebsite.com/landing-page"
                        className="rounded-l-none"
                        aria-invalid={!currentDetailsValidation.hasLandingPage}
                      />
                    </div>
                  </div>

                  {!currentDetailsValidation.hasLandingPage ? (
                    <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      Enter a landing page URL to continue.
                    </div>
                  ) : null}

                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm font-semibold text-gray-900">Pixel note</p>
                    <p className="mt-1 text-sm text-gray-600">
                      Tracking pixel is configured in the previous step. Keep this URL aligned with the page you want Meta to send traffic to.
                    </p>
                  </div>
                </div>
              </StepSection>
            ) : null}

            {launchState.currentDetailsStep === "phone-number" ? (
              <StepSection
                title="Phone Number"
                description="Add the number people should call from this campaign."
              >
                <div className="space-y-6">
                  <div
                    className={cn(
                      "rounded-3xl border bg-white p-5 shadow-sm",
                      currentDetailsValidation.hasPhoneNumber
                        ? "border-gray-200"
                        : "border-rose-300 bg-rose-50/40",
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Call destination</p>
                        <h3 className="mt-1 text-lg font-semibold text-gray-900">Business phone number</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          This number will be used in the call-focused campaign flow.
                        </p>
                      </div>
                      <Badge className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">Call Now</Badge>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-[110px_minmax(0,1fr)]">
                      <select
                        value={launchState.thankYouPage.completionCountryCode || "+1"}
                        onChange={(event) =>
                          updateLaunchState((current) => ({
                            ...current,
                            thankYouPage: {
                              ...current.thankYouPage,
                              completionCountryCode: event.target.value,
                            },
                          }))
                        }
                        className="h-11 rounded-[14px] border border-gray-300 bg-white px-3 text-sm text-gray-800"
                      >
                        <option value="+1">+1</option>
                        <option value="+44">+44</option>
                        <option value="+61">+61</option>
                        <option value="+91">+91</option>
                      </select>
                      <Input
                        value={launchState.phoneNumber}
                        onChange={(event) =>
                          updateLaunchState((current) => ({
                            ...current,
                            phoneNumber: event.target.value,
                            thankYouPage: {
                              ...current.thankYouPage,
                              completionPhone: event.target.value,
                            },
                          }))
                        }
                        placeholder="(555) 123-4567"
                        aria-invalid={!currentDetailsValidation.hasPhoneNumber}
                      />
                    </div>
                  </div>

                  {!currentDetailsValidation.hasPhoneNumber ? (
                    <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      Enter a business phone number to continue.
                    </div>
                  ) : null}
                </div>
              </StepSection>
            ) : null}

            {launchState.currentDetailsStep === "messenger-setup" ? (
              <StepSection
                title="Messenger Setup"
                description="Set the messaging copy that should appear when people start a Messenger conversation."
              >
                <div className="space-y-6">
                  <div
                    className={cn(
                      "rounded-3xl border bg-white p-5 shadow-sm",
                      currentDetailsValidation.hasMessengerSetup
                        ? "border-gray-200"
                        : "border-rose-300 bg-rose-50/40",
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Conversation</p>
                        <h3 className="mt-1 text-lg font-semibold text-gray-900">Welcome message</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Keep it short and helpful so the Messenger flow feels natural.
                        </p>
                      </div>
                      <Badge className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700">Messenger</Badge>
                    </div>

                    <div className="mt-4 space-y-4">
                      <Textarea
                        value={launchState.messengerWelcomeMessage}
                        onChange={(event) =>
                          updateLaunchState((current) => ({
                            ...current,
                            messengerWelcomeMessage: event.target.value,
                          }))
                        }
                        placeholder="Hi! Thanks for reaching out. How can we help today?"
                        aria-invalid={!currentDetailsValidation.hasMessengerSetup}
                      />
                      <Input
                        value={launchState.messengerReplyPrompt}
                        onChange={(event) =>
                          updateLaunchState((current) => ({
                            ...current,
                            messengerReplyPrompt: event.target.value,
                          }))
                        }
                        placeholder="Reply prompt or first question"
                        aria-invalid={!currentDetailsValidation.hasMessengerSetup}
                      />
                    </div>
                  </div>

                  {!currentDetailsValidation.hasMessengerSetup ? (
                    <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      Add the Messenger welcome message and reply prompt to continue.
                    </div>
                  ) : null}

                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm font-semibold text-gray-900">Connected page</p>
                    <p className="mt-1 text-sm text-gray-600">
                      {connectedPageAsset?.name || metaIntegration?.selected.pageId || "Select a Facebook Page in your integration settings."}
                    </p>
                  </div>
                </div>
              </StepSection>
            ) : null}

            {launchState.currentDetailsStep === "thank-you" ? (
              <StepSection
                title="Thank You Page"
                description="Optional redirect after form submission."
              >
                <div className="space-y-3">
                  <div className="rounded-[18px] border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-100 px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-rose-500 shadow-md shadow-fuchsia-500/15">
                          <ExternalLink className="h-3.5 w-3.5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-gray-900">Thank You Page</h3>
                          <p className="mt-0.5 text-[11px] leading-4 text-gray-500">
                            Where should leads go after submitting the form? (optional)
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="px-4 py-4">
                      <div className="mx-auto max-w-lg space-y-3">
                        <div className="rounded-[16px] border border-gray-200 bg-white p-3.5 shadow-sm">
                          <div className="flex flex-col gap-2.5">
                            <div>
                              <p className="text-xs font-semibold text-gray-900">
                                Thank You Page URL <span className="text-gray-400">(optional)</span>
                              </p>
                            </div>
                            <div className="flex flex-col gap-0 sm:flex-row">
                              <select
                                value={launchState.thankYouPage.websiteUrl.startsWith("https://") ? "https://" : "http://"}
                                onChange={(event) =>
                                  updateLaunchState((current) => ({
                                    ...current,
                                    thankYouPage: {
                                      ...current.thankYouPage,
                                      websiteUrl: current.thankYouPage.websiteUrl.replace(/^https?:\/\//, `${event.target.value}`),
                                    },
                                  }))
                                }
                                className="h-10 w-full rounded-b-none border border-gray-300 bg-gray-50 px-2.5 text-xs font-semibold text-gray-700 sm:w-28 sm:rounded-r-none sm:rounded-l-xl sm:rounded-b-xl"
                              >
                                <option value="http://">http://</option>
                                <option value="https://">https://</option>
                              </select>
                              <Input
                                value={launchState.thankYouPage.websiteUrl.replace(/^https?:\/\//, "")}
                                onChange={(event) =>
                                  updateLaunchState((current) => ({
                                    ...current,
                                    thankYouPage: {
                                      ...current.thankYouPage,
                                      websiteUrl: `${current.thankYouPage.websiteUrl.startsWith("https://") ? "https://" : "http://"}${event.target.value.replace(/^https?:\/\//, "")}`,
                                    },
                                  }))
                                }
                                placeholder="sidekickstudioss.com/"
                                className="h-10 rounded-t-none border-gray-300 px-2.5 text-xs sm:rounded-l-none sm:rounded-r-xl sm:rounded-t-xl"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="rounded-[14px] border border-amber-200 bg-amber-50 p-2.5">
                          <div className="flex items-start gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                              <Smartphone className="h-3 w-3" />
                            </div>
                            <p className="text-[11px] font-medium leading-4 text-amber-900">
                              <span className="font-bold">Mobile first:</span> Make sure your page is mobile-friendly
                              since most users browse on phones.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 px-4 py-3.5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <Button variant="outline" onClick={goToPreviousDetailsStep}>
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <Button
                          className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-5 shadow-lg shadow-indigo-500/25 hover:-translate-y-0.5 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700"
                          onClick={goToNextDetailsStep}
                        >
                          Continue
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </StepSection>
            ) : null}

            {launchState.currentDetailsStep === "review" ? (
              <StepSection
                title="Review & Launch"
                description="Review the campaign settings before launch. Only the sections relevant to the chosen ad type are shown here."
                hideHeader
              >
                <div className="space-y-6">
                  <div className="pt-1 text-center">
                    <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 shadow-lg shadow-emerald-500/20">
                      <CheckCircle2 className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight text-gray-900">Review &amp; Launch</h3>
                    <p className="mt-2 text-sm text-gray-500">Review your campaign settings before launching</p>
                  </div>

                  <div className="space-y-4">
                  <ReviewRow
                    label="Campaign goal"
                    value={getAdTypeLabel(launchState.adType)}
                    onEdit={() => setDetailsStep("ad-type")}
                    icon={Rocket}
                    iconClassName="bg-blue-100 text-blue-600"
                  />
                  <ReviewRow
                    label="Daily budget"
                    value={`$${launchState.dailyBudget || "25"}/day`}
                    onEdit={() => setDetailsStep("budget")}
                    icon={BadgeDollarSign}
                    iconClassName="bg-emerald-100 text-emerald-600"
                  />
                  <ReviewRow
                    label="Target location"
                    value={deriveLocationSummary(launchState)}
                    onEdit={() => setDetailsStep("location")}
                    icon={MapPin}
                    iconClassName="bg-rose-100 text-rose-600"
                  />
                  {isLandingPageAd ? (
                    <ReviewRow
                      label="Tracking"
                      value={launchState.trackingPixelName || "No pixel selected"}
                      onEdit={() => setDetailsStep("tracking-pixel")}
                      icon={Target}
                      iconClassName="bg-teal-100 text-teal-600"
                    />
                  ) : null}
                  <ReviewRow
                    label="Placeholders"
                    value={reviewPlaceholderSummary}
                    onEdit={() => setDetailsStep("placeholders")}
                    icon={Sparkles}
                    iconClassName="bg-indigo-100 text-indigo-600"
                  />
                  {isLeadFormAd ? (
                    <ReviewRow
                      label="Thank you page"
                      value={
                        <div className="space-y-1">
                          <p>{launchState.thankYouPage.enabled ? launchState.thankYouPage.headline : "Disabled"}</p>
                          <p className="text-xs text-[var(--muted)]">
                            {launchState.thankYouPage.enabled
                              ? `${thankYouButtonActionLabel(launchState.thankYouPage.buttonAction)} • ${launchState.thankYouPage.buttonLabel || "No label set"}`
                              : "Optional step skipped"}
                          </p>
                          <p className="text-xs text-[var(--muted)]">
                            {launchState.thankYouPage.enabled
                              ? launchState.thankYouPage.buttonAction === "CALL_BUSINESS"
                                ? launchState.thankYouPage.completionPhone || "No phone set yet"
                                : launchState.thankYouPage.websiteUrl || "No URL set yet"
                              : "No post-submit destination configured"}
                          </p>
                        </div>
                      }
                      onEdit={() => setDetailsStep("thank-you")}
                      icon={ExternalLink}
                      iconClassName="bg-purple-100 text-purple-600"
                    />
                  ) : null}
                  {isLandingPageAd ? (
                    <ReviewRow
                      label="Landing page"
                      value={launchState.landingPageUrl || "No landing page URL set yet"}
                      onEdit={() => setDetailsStep("landing-page")}
                      icon={ExternalLink}
                      iconClassName="bg-sky-100 text-sky-600"
                    />
                  ) : null}
                  {isCallNowAd ? (
                    <ReviewRow
                      label="Phone number"
                      value={launchState.phoneNumber || "No phone number set yet"}
                      onEdit={() => setDetailsStep("phone-number")}
                      icon={Smartphone}
                      iconClassName="bg-amber-100 text-amber-600"
                    />
                  ) : null}
                  {isMessengerAd ? (
                    <ReviewRow
                      label="Messenger setup"
                      value={
                        <div className="space-y-1">
                          <p>{launchState.messengerWelcomeMessage || "No welcome message set yet"}</p>
                          <p className="text-xs text-[var(--muted)]">
                            {launchState.messengerReplyPrompt || "No reply prompt set yet"}
                          </p>
                        </div>
                      }
                      onEdit={() => setDetailsStep("messenger-setup")}
                      icon={Users}
                      iconClassName="bg-indigo-100 text-indigo-600"
                    />
                  ) : null}
                  </div>

                <details className="group mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-sm">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-200 text-gray-600">
                        <Settings2 className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <p className="text-base font-semibold text-gray-900">Advanced Settings</p>
                          <span className="text-sm font-medium text-gray-400">(optional)</span>
                        </div>
                      </div>
                    </div>
                    <ChevronDown className="h-5 w-5 text-gray-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="border-t border-gray-200 bg-white px-5 py-5">
                    <p className="text-sm text-gray-500">Customize campaign name, pixel, audience, and more</p>
                    <div className="mt-4 space-y-4">
                      <details open className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-gray-900">
                          Campaign naming
                        </summary>
                        <div className="grid gap-4 px-5 pb-5">
                          <Input
                            value={launchState.advanced.campaignName}
                            onChange={(event) =>
                              updateLaunchState((current) => ({
                                ...current,
                                advanced: {
                                  ...current.advanced,
                                  campaignName: event.target.value,
                                },
                              }))
                            }
                            placeholder="Campaign name"
                          />
                        </div>
                      </details>

                      <details className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-gray-900">
                          Connected Meta assets
                        </summary>
                        <div className="grid gap-4 px-5 pb-5 md:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-800">Ad account</label>
                            <select
                              value={launchState.integrationSelections.adAccountId}
                              onChange={(event) =>
                                updateLaunchState((current) => ({
                                  ...current,
                                  integrationSelections: {
                                    ...current.integrationSelections,
                                    adAccountId: event.target.value,
                                    pixelId: "",
                                  },
                                  trackingPixelId: "",
                                  trackingPixelName: "",
                                }))
                              }
                              className="h-11 w-full rounded-[14px] border border-gray-200 bg-white px-3 text-sm text-gray-800"
                              disabled={!metaConnected}
                            >
                              <option value="">
                                {metaConnected ? "Select ad account" : "Connect Meta first"}
                              </option>
                              {(metaIntegration?.assets.adAccounts || []).map((asset) => (
                                <option key={asset.asset_id} value={asset.asset_id}>
                                  {asset.name || asset.asset_id}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-800">Facebook Page</label>
                            <select
                              value={launchState.integrationSelections.pageId}
                              onChange={(event) =>
                                updateLaunchState((current) => ({
                                  ...current,
                                  integrationSelections: {
                                    ...current.integrationSelections,
                                    pageId: event.target.value,
                                    leadFormId: "",
                                  },
                                  leadForm: {
                                    ...current.leadForm,
                                    selectedFormId: "",
                                    selectedFormName: "",
                                  },
                                }))
                              }
                              className="h-11 w-full rounded-[14px] border border-gray-200 bg-white px-3 text-sm text-gray-800"
                              disabled={!metaConnected}
                            >
                              <option value="">
                                {metaConnected ? "Select page" : "Connect Meta first"}
                              </option>
                              {(metaIntegration?.assets.pages || []).map((asset) => (
                                <option key={asset.asset_id} value={asset.asset_id}>
                                  {asset.name || asset.asset_id}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </details>

                      <details className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-gray-900">
                          Lead form strategy
                        </summary>
                        <div className="space-y-4 px-5 pb-5">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <button
                              type="button"
                              onClick={() =>
                                updateLaunchState((current) => ({
                                  ...current,
                                  leadForm: {
                                    ...current.leadForm,
                                    mode: "existing",
                                    selectedFormId:
                                      current.leadForm.selectedFormId ||
                                      current.integrationSelections.leadFormId,
                                  },
                                }))
                              }
                              className={cn(
                                "rounded-xl border px-4 py-3 text-left text-sm",
                                launchState.leadForm.mode === "existing"
                                  ? "border-indigo-300 bg-indigo-50 text-indigo-900"
                                  : "border-gray-200 bg-white text-gray-700",
                              )}
                            >
                              Use existing Meta lead form
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateLaunchState((current) => ({
                                  ...current,
                                  leadForm: {
                                    ...current.leadForm,
                                    mode: "managed_new",
                                  },
                                }))
                              }
                              className={cn(
                                "rounded-xl border px-4 py-3 text-left text-sm",
                                launchState.leadForm.mode === "managed_new"
                                  ? "border-indigo-300 bg-indigo-50 text-indigo-900"
                                  : "border-gray-200 bg-white text-gray-700",
                              )}
                            >
                              Create/manage from SideKick
                            </button>
                          </div>

                          {launchState.leadForm.mode === "existing" ? (
                            <div>
                              <label className="mb-2 block text-sm font-medium text-gray-800">
                                Existing lead form
                              </label>
                              <select
                                value={launchState.leadForm.selectedFormId}
                                onChange={(event) => {
                                  const selected = availableLeadForms.find(
                                    (form) => form.asset_id === event.target.value,
                                  );
                                  updateLaunchState((current) => ({
                                    ...current,
                                    leadForm: {
                                      ...current.leadForm,
                                      selectedFormId: event.target.value,
                                      selectedFormName: selected?.name || "",
                                    },
                                    integrationSelections: {
                                      ...current.integrationSelections,
                                      leadFormId: event.target.value,
                                    },
                                  }));
                                }}
                                className="h-11 w-full rounded-[14px] border border-gray-200 bg-white px-3 text-sm text-gray-800"
                                disabled={!metaConnected}
                              >
                                <option value="">
                                  {metaConnected
                                    ? "Select existing lead form"
                                    : "Connect Meta to load lead forms"}
                                </option>
                                {availableLeadForms.map((leadForm) => (
                                  <option key={leadForm.asset_id} value={leadForm.asset_id}>
                                    {leadForm.name || leadForm.asset_id}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div className="grid gap-3 md:grid-cols-2">
                              <div>
                                <label className="mb-2 block text-sm font-medium text-gray-800">
                                  Managed lead form name
                                </label>
                                <Input
                                  value={launchState.leadForm.managedFormName}
                                  onChange={(event) =>
                                    updateLaunchState((current) => ({
                                      ...current,
                                      leadForm: {
                                        ...current.leadForm,
                                        managedFormName: event.target.value,
                                      },
                                      advanced: {
                                        ...current.advanced,
                                        leadFormName: event.target.value,
                                      },
                                    }))
                                  }
                                  placeholder="Summer Offer Lead Form"
                                />
                              </div>
                              <div>
                                <label className="mb-2 block text-sm font-medium text-gray-800">
                                  Privacy policy URL
                                </label>
                                <Input
                                  value={launchState.advanced.privacyPolicyUrl}
                                  onChange={(event) =>
                                    updateLaunchState((current) => ({
                                      ...current,
                                      advanced: {
                                        ...current.advanced,
                                        privacyPolicyUrl: event.target.value,
                                      },
                                    }))
                                  }
                                  placeholder="https://example.com/privacy"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-medium text-gray-800">
                                  Lead form fields
                                </label>
                                <div className="grid gap-2 sm:grid-cols-3">
                                  {managedLeadFieldOptions.map((field) => {
                                    const active = launchState.leadForm.fields.includes(field.id);
                                    return (
                                      <label
                                        key={field.id}
                                        className={cn(
                                          "flex cursor-pointer flex-col gap-1 rounded-xl border px-3 py-2 text-sm transition-colors",
                                          active
                                            ? "border-indigo-300 bg-indigo-50 text-indigo-900"
                                            : "border-gray-200 bg-white text-gray-700",
                                        )}
                                      >
                                        <span className="flex items-center gap-2 font-medium">
                                          <input
                                            type="checkbox"
                                            checked={active}
                                            onChange={(event) =>
                                              updateLaunchState((current) => {
                                                const currentFields = current.leadForm.fields;
                                                const nextFields = event.target.checked
                                                  ? Array.from(new Set([...currentFields, field.id]))
                                                  : currentFields.filter((value) => value !== field.id);
                                                return {
                                                  ...current,
                                                  leadForm: {
                                                    ...current.leadForm,
                                                    fields: nextFields,
                                                  },
                                                };
                                              })
                                            }
                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                          />
                                          {field.label}
                                        </span>
                                        <span className="text-xs text-gray-500">{field.hint}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </details>

                      <details className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-gray-900">
                          Targeting defaults
                        </summary>
                        <div className="grid gap-4 px-5 pb-5">
                          <div className="grid gap-3 sm:grid-cols-3">
                            <div>
                              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                                Age min
                              </label>
                              <Input
                                value={launchState.targeting.ageMin}
                                onChange={(event) =>
                                  updateLaunchState((current) => ({
                                    ...current,
                                    targeting: {
                                      ...current.targeting,
                                      ageMin: event.target.value.replace(/[^0-9]/g, ""),
                                    },
                                  }))
                                }
                                placeholder="23"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                                Age max
                              </label>
                              <Input
                                value={launchState.targeting.ageMax}
                                onChange={(event) =>
                                  updateLaunchState((current) => ({
                                    ...current,
                                    targeting: {
                                      ...current.targeting,
                                      ageMax: event.target.value.replace(/[^0-9]/g, ""),
                                    },
                                  }))
                                }
                                placeholder="65"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                                Gender
                              </label>
                              <select
                                value={launchState.targeting.gender}
                                onChange={(event) =>
                                  updateLaunchState((current) => ({
                                    ...current,
                                    targeting: {
                                      ...current.targeting,
                                      gender: event.target.value as CampaignLaunchState["targeting"]["gender"],
                                    },
                                  }))
                                }
                                className="h-11 w-full rounded-[14px] border border-gray-200 bg-white px-3 text-sm text-gray-800"
                              >
                                <option value="all">All</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                              Interests (Meta IDs optional)
                            </label>
                            <Input
                              value={launchState.targeting.interests}
                              onChange={(event) =>
                                updateLaunchState((current) => ({
                                  ...current,
                                  targeting: {
                                    ...current.targeting,
                                    interests: event.target.value,
                                  },
                                }))
                              }
                              placeholder="Cars (6003139266461), Auto Detailing (6003020834693)"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                              Custom audiences
                            </label>
                            <Input
                              value={launchState.targeting.customAudiences}
                              onChange={(event) =>
                                updateLaunchState((current) => ({
                                  ...current,
                                  targeting: {
                                    ...current.targeting,
                                    customAudiences: event.target.value,
                                  },
                                  advanced: {
                                    ...current.advanced,
                                    customAudiences: event.target.value,
                                  },
                                }))
                              }
                              placeholder="VIP list, previous leads, website visitors"
                            />
                          </div>
                        </div>
                      </details>
                    </div>
                  </div>
                </details>

                <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-gray-900">Launch readiness</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Run preflight before publish to validate assets, placeholders, token scopes, and objective requirements.
                  </p>
                  {preflightError ? (
                    <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                      {preflightError}
                    </p>
                  ) : null}
                  {publishError ? (
                    <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                      {publishError}
                    </p>
                  ) : null}
                  {publishSuccess ? (
                    <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                      {publishSuccess}
                    </p>
                  ) : null}
                  {preflight ? (
                    <div className="mt-3 grid gap-2 text-xs text-gray-700 sm:grid-cols-2">
                      <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                        Blocking issues: {preflight.blockingIssues.length}
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                        Warnings: {preflight.warnings.length}
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                        Ad account: {preflight.resolvedAssets.adAccount?.name || "Missing"}
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                        Page: {preflight.resolvedAssets.page?.name || "Missing"}
                      </div>
                    </div>
                  ) : null}
                  {preflight?.blockingIssues?.length ? (
                    <LaunchIssueList
                      title="Blocking issues"
                      tone="error"
                      issues={preflight.blockingIssues}
                    />
                  ) : null}
                  {preflight?.warnings?.length ? (
                    <LaunchIssueList
                      title="Warnings"
                      tone="warning"
                      issues={preflight.warnings}
                    />
                  ) : null}
                </div>

                <div className="border-t border-gray-200 pt-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                    <Button
                      variant="outline"
                      disabled={isPublishing || isPreflighting || !selectedTemplateSlug}
                      onClick={() => void persistDraft(launchState, { pushToDraft: true })}
                    >
                      {saveState === "saving" ? "Saving..." : "Save draft"}
                    </Button>
                    <Button
                      className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 shadow-lg shadow-green-500/25 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600"
                      disabled={isPublishing || isPreflighting}
                      onClick={async () => {
                        await publishToMeta("live");
                      }}
                    >
                      {isPublishing && preflightMode === "live" ? "Publishing live..." : "Launch Campaign"}
                    </Button>
                  </div>
                </div>
                </div>
              </StepSection>
            ) : null}

            {launchState.currentDetailsStep === "advanced" ? (
              <StepSection
                title="Advanced Settings"
                description="Finalize lead-form behavior, targeting defaults, and launch readiness."
              >
                <div className="space-y-4">
                  <details
                    open
                    className={cn(
                      "rounded-2xl border bg-white shadow-sm",
                      currentDetailsValidation.hasCampaignName ? "border-gray-200" : "border-rose-300",
                    )}
                  >
                    <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-gray-900">Campaign naming</summary>
                    <div className="grid gap-4 px-5 pb-5">
                      <Input
                        value={launchState.advanced.campaignName}
                        onChange={(event) =>
                          updateLaunchState((current) => ({
                            ...current,
                            advanced: {
                              ...current.advanced,
                              campaignName: event.target.value,
                            },
                          }))
                        }
                        placeholder="Campaign name"
                        aria-invalid={!currentDetailsValidation.hasCampaignName}
                      />
                    </div>
                  </details>

                  <details className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-gray-900">Connected Meta assets</summary>
                    <div className="grid gap-4 px-5 pb-5 md:grid-cols-2">
                      <div>
                        <label className={cn("mb-2 block text-sm font-medium", currentDetailsValidation.hasAdAccount ? "text-gray-800" : "text-rose-700")}>
                          Ad account
                        </label>
                        <select
                          value={launchState.integrationSelections.adAccountId}
                          onChange={(event) =>
                            updateLaunchState((current) => ({
                              ...current,
                              integrationSelections: {
                                ...current.integrationSelections,
                                adAccountId: event.target.value,
                                pixelId: "",
                              },
                              trackingPixelId: "",
                              trackingPixelName: "",
                            }))
                          }
                          className={cn(
                            "h-11 w-full rounded-[14px] border bg-white px-3 text-sm",
                            currentDetailsValidation.hasAdAccount
                              ? "border-gray-200 text-gray-800"
                              : "border-rose-300 text-rose-700",
                          )}
                          aria-invalid={!currentDetailsValidation.hasAdAccount}
                          disabled={!metaConnected}
                        >
                          <option value="">
                            {metaConnected ? "Select ad account" : "Connect Meta first"}
                          </option>
                          {(metaIntegration?.assets.adAccounts || []).map((asset) => (
                            <option key={asset.asset_id} value={asset.asset_id}>
                              {asset.name || asset.asset_id}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={cn("mb-2 block text-sm font-medium", currentDetailsValidation.hasPage ? "text-gray-800" : "text-rose-700")}>
                          Facebook Page
                        </label>
                        <select
                          value={launchState.integrationSelections.pageId}
                          onChange={(event) =>
                            updateLaunchState((current) => ({
                              ...current,
                              integrationSelections: {
                                ...current.integrationSelections,
                                pageId: event.target.value,
                                leadFormId: "",
                              },
                              leadForm: {
                                ...current.leadForm,
                                selectedFormId: "",
                                selectedFormName: "",
                              },
                            }))
                          }
                          className={cn(
                            "h-11 w-full rounded-[14px] border bg-white px-3 text-sm",
                            currentDetailsValidation.hasPage
                              ? "border-gray-200 text-gray-800"
                              : "border-rose-300 text-rose-700",
                          )}
                          aria-invalid={!currentDetailsValidation.hasPage}
                          disabled={!metaConnected}
                        >
                          <option value="">
                            {metaConnected ? "Select page" : "Connect Meta first"}
                          </option>
                          {(metaIntegration?.assets.pages || []).map((asset) => (
                            <option key={asset.asset_id} value={asset.asset_id}>
                              {asset.name || asset.asset_id}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </details>

                  <details className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-gray-900">Lead form strategy</summary>
                    <div className="space-y-4 px-5 pb-5">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateLaunchState((current) => ({
                              ...current,
                              leadForm: {
                                ...current.leadForm,
                                mode: "existing",
                                selectedFormId:
                                  current.leadForm.selectedFormId ||
                                  current.integrationSelections.leadFormId,
                              },
                            }))
                          }
                          className={cn(
                            "rounded-xl border px-4 py-3 text-left text-sm",
                            launchState.leadForm.mode === "existing"
                              ? "border-indigo-300 bg-indigo-50 text-indigo-900"
                              : "border-gray-200 bg-white text-gray-700",
                          )}
                        >
                          Use existing Meta lead form
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateLaunchState((current) => ({
                              ...current,
                              leadForm: {
                                ...current.leadForm,
                                mode: "managed_new",
                              },
                            }))
                          }
                          className={cn(
                            "rounded-xl border px-4 py-3 text-left text-sm",
                            launchState.leadForm.mode === "managed_new"
                              ? "border-indigo-300 bg-indigo-50 text-indigo-900"
                              : "border-gray-200 bg-white text-gray-700",
                          )}
                        >
                          Create/manage from SideKick
                        </button>
                      </div>

                      {launchState.leadForm.mode === "existing" ? (
                        <div>
                          <label className={cn("mb-2 block text-sm font-medium", currentDetailsValidation.hasLeadFormStrategy ? "text-gray-800" : "text-rose-700")}>
                            Existing lead form
                          </label>
                          <select
                            value={launchState.leadForm.selectedFormId}
                            onChange={(event) => {
                              const selected = availableLeadForms.find(
                                (form) => form.asset_id === event.target.value,
                              );
                              updateLaunchState((current) => ({
                                ...current,
                                leadForm: {
                                  ...current.leadForm,
                                  selectedFormId: event.target.value,
                                  selectedFormName: selected?.name || "",
                                },
                                integrationSelections: {
                                  ...current.integrationSelections,
                                  leadFormId: event.target.value,
                                },
                              }));
                            }}
                            className={cn(
                              "h-11 w-full rounded-[14px] border bg-white px-3 text-sm",
                              currentDetailsValidation.hasLeadFormStrategy
                                ? "border-gray-200 text-gray-800"
                                : "border-rose-300 text-rose-700",
                            )}
                            aria-invalid={!currentDetailsValidation.hasLeadFormStrategy}
                            disabled={!metaConnected}
                          >
                            <option value="">
                              {metaConnected
                                ? "Select existing lead form"
                                : "Connect Meta to load lead forms"}
                            </option>
                            {availableLeadForms.map((leadForm) => (
                              <option key={leadForm.asset_id} value={leadForm.asset_id}>
                                {leadForm.name || leadForm.asset_id}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="grid gap-3 md:grid-cols-2">
                          <div>
                            <label className={cn("mb-2 block text-sm font-medium", currentDetailsValidation.hasLeadFormStrategy ? "text-gray-800" : "text-rose-700")}>
                              Managed lead form name
                            </label>
                            <Input
                              value={launchState.leadForm.managedFormName}
                              onChange={(event) =>
                                updateLaunchState((current) => ({
                                  ...current,
                                  leadForm: {
                                    ...current.leadForm,
                                    managedFormName: event.target.value,
                                  },
                                  advanced: {
                                    ...current.advanced,
                                    leadFormName: event.target.value,
                                  },
                              }))
                            }
                            placeholder="Summer Offer Lead Form"
                            aria-invalid={!currentDetailsValidation.hasLeadFormStrategy}
                          />
                        </div>
                        <div>
                            <label className={cn("mb-2 block text-sm font-medium", currentDetailsValidation.hasLeadFormStrategy ? "text-gray-800" : "text-rose-700")}>
                              Privacy policy URL
                            </label>
                            <Input
                              value={launchState.advanced.privacyPolicyUrl}
                              onChange={(event) =>
                                updateLaunchState((current) => ({
                                  ...current,
                                  advanced: {
                                    ...current.advanced,
                                    privacyPolicyUrl: event.target.value,
                                  },
                              }))
                            }
                            placeholder="https://example.com/privacy"
                            aria-invalid={!currentDetailsValidation.hasLeadFormStrategy}
                          />
                          </div>
                          <div className="md:col-span-2">
                            <label className="mb-2 block text-sm font-medium text-gray-800">
                              Lead form fields
                            </label>
                            <div className="grid gap-2 sm:grid-cols-3">
                              {managedLeadFieldOptions.map((field) => {
                                const active = launchState.leadForm.fields.includes(field.id);
                                return (
                                  <label
                                    key={field.id}
                                    className={cn(
                                      "flex cursor-pointer flex-col gap-1 rounded-xl border px-3 py-2 text-sm transition-colors",
                                      active
                                        ? "border-indigo-300 bg-indigo-50 text-indigo-900"
                                        : "border-gray-200 bg-white text-gray-700",
                                    )}
                                  >
                                    <span className="flex items-center gap-2 font-medium">
                                      <input
                                        type="checkbox"
                                        checked={active}
                                        onChange={(event) =>
                                          updateLaunchState((current) => {
                                            const currentFields = current.leadForm.fields;
                                            const nextFields = event.target.checked
                                              ? Array.from(new Set([...currentFields, field.id]))
                                              : currentFields.filter((value) => value !== field.id);
                                            return {
                                              ...current,
                                              leadForm: {
                                                ...current.leadForm,
                                                fields: nextFields,
                                              },
                                            };
                                          })
                                        }
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                      />
                                      {field.label}
                                    </span>
                                    <span className="text-xs text-gray-500">{field.hint}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </details>

                  <details className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-gray-900">Targeting defaults</summary>
                    <div className="grid gap-4 px-5 pb-5">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                            Age min
                          </label>
                          <Input
                            value={launchState.targeting.ageMin}
                            onChange={(event) =>
                              updateLaunchState((current) => ({
                                ...current,
                                targeting: {
                                  ...current.targeting,
                                  ageMin: event.target.value.replace(/[^0-9]/g, ""),
                                },
                              }))
                            }
                            placeholder="23"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                            Age max
                          </label>
                          <Input
                            value={launchState.targeting.ageMax}
                            onChange={(event) =>
                              updateLaunchState((current) => ({
                                ...current,
                                targeting: {
                                  ...current.targeting,
                                  ageMax: event.target.value.replace(/[^0-9]/g, ""),
                                },
                              }))
                            }
                            placeholder="65"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                            Gender
                          </label>
                          <select
                            value={launchState.targeting.gender}
                            onChange={(event) =>
                              updateLaunchState((current) => ({
                                ...current,
                                targeting: {
                                  ...current.targeting,
                                  gender: event.target.value as CampaignLaunchState["targeting"]["gender"],
                                },
                              }))
                            }
                            className="h-11 w-full rounded-[14px] border border-gray-200 bg-white px-3 text-sm text-gray-800"
                          >
                            <option value="all">All</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                          Interests (Meta IDs optional)
                        </label>
                        <Input
                          value={launchState.targeting.interests}
                          onChange={(event) =>
                            updateLaunchState((current) => ({
                              ...current,
                              targeting: {
                                ...current.targeting,
                                interests: event.target.value,
                              },
                            }))
                          }
                          placeholder="Cars (6003139266461), Auto Detailing (6003020834693)"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                          Custom audiences
                        </label>
                        <Input
                          value={launchState.targeting.customAudiences}
                          onChange={(event) =>
                            updateLaunchState((current) => ({
                              ...current,
                              targeting: {
                                ...current.targeting,
                                customAudiences: event.target.value,
                              },
                              advanced: {
                                ...current.advanced,
                                customAudiences: event.target.value,
                              },
                            }))
                          }
                          placeholder="VIP list, previous leads, website visitors"
                        />
                      </div>
                    </div>
                  </details>

                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm font-semibold text-gray-900">Launch readiness</p>
                    <p className="mt-1 text-sm text-gray-600">
                      Run preflight before publish to validate assets, placeholders, token scopes, and objective requirements.
                    </p>
                    {preflightError ? (
                      <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                        {preflightError}
                      </p>
                    ) : null}
                    {publishError ? (
                      <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                        {publishError}
                      </p>
                    ) : null}
                    {publishSuccess ? (
                      <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                        {publishSuccess}
                      </p>
                    ) : null}
                    {preflight ? (
                      <div className="mt-3 grid gap-2 text-xs text-gray-700 sm:grid-cols-2">
                        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                          Blocking issues: {preflight.blockingIssues.length}
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                          Warnings: {preflight.warnings.length}
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                          Ad account: {preflight.resolvedAssets.adAccount?.name || "Missing"}
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                          Page: {preflight.resolvedAssets.page?.name || "Missing"}
                        </div>
                      </div>
                    ) : null}
                    {preflight?.blockingIssues?.length ? (
                      <LaunchIssueList
                        title="Blocking issues"
                        tone="error"
                        issues={preflight.blockingIssues}
                      />
                    ) : null}
                    {preflight?.warnings?.length ? (
                      <LaunchIssueList
                        title="Warnings"
                        tone="warning"
                        issues={preflight.warnings}
                      />
                    ) : null}
                  </div>
                </div>
              </StepSection>
            ) : null}

            {launchState.currentDetailsStep !== "review" ? (
              <div className="mt-10 border-t border-gray-200 pt-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink)]">
                      {selectedTemplate.name} • {draftId ? "Draft connected" : "Draft not created yet"}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      This flow saves against a real campaign draft so Meta publishing can plug in later without changing the builder.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button variant="outline" onClick={goToPreviousDetailsStep}>
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>

                    {!currentDetailsValidation.isValid ? (
                      <div className="sm:order-first sm:mr-3 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {currentDetailsValidation.reason}
                      </div>
                    ) : null}

                    <Button
                      onClick={goToNextDetailsStep}
                      disabled={isPublishing || isPreflighting || !currentDetailsValidation.isValid}
                      className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/25 hover:-translate-y-0.5 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 disabled:translate-y-0 disabled:opacity-50"
                    >
                      Continue
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
            </div>
          </div>

          <div className="contents lg:col-span-5 lg:block">
            <BuilderPreview
              launchState={launchState}
              onPreviewTabChange={(tab) =>
                updateLaunchState((current) => ({
                  ...current,
                  previewTab: tab,
                }))
              }
              template={selectedTemplate}
              preview={previewBlueprint}
              businessProfile={businessProfile}
              pagePreviewIdentity={pagePreviewIdentity}
              connectedPageAsset={connectedPageAsset}
              connectedPageAvatarUrl={connectedPageAvatarUrl}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
