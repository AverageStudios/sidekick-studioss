"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeDollarSign,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  ExternalLink,
  Goal,
  Eye,
  Megaphone,
  MapPin,
  PanelLeft,
  Plus,
  Rocket,
  Sparkles,
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
import { cn } from "@/lib/utils";
import {
  campaignDetailsSteps,
  campaignGoalOptions,
  campaignWizardSteps,
  createInitialCampaignLaunchState,
  getTemplatePlaceholderFields,
  locationTargetingModeOptions,
  getTemplateSetupValuesFromLaunchState,
  normalizeCampaignLaunchState,
  parseDailyBudgetAmount,
} from "@/lib/campaign-launch";
import { createCampaignBlueprint } from "@/lib/template-engine";
import {
  BusinessProfile,
  CampaignBundle,
  CampaignDetailsStep,
  CampaignGoal,
  CampaignLaunchState,
  CampaignPublishMode,
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
    pages: Array<{ asset_id: string; name: string | null }>;
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
const radiusEnabledScopes: NonNullable<CampaignLaunchState["targetLocations"]>[number]["scope"][] = ["city", "address"];
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
  lat: number;
  lon: number;
  countryCode?: string;
};

function goalDisplay(goal: CampaignGoal) {
  return campaignGoalOptions.find((option) => option.id === goal)?.label || "Leads";
}

function buildPreviewGoalLabel(goal: CampaignGoal) {
  if (goal === "OUTCOME_AWARENESS") return "Awareness";
  if (goal === "OUTCOME_TRAFFIC") return "Website traffic";
  if (goal === "OUTCOME_ENGAGEMENT") return "Engagement";
  if (goal === "OUTCOME_APP_PROMOTION") return "App promotion";
  if (goal === "OUTCOME_SALES") return "Sales";
  return "Leads";
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

function showsLeadFormPreview(goal: CampaignGoal) {
  return goal === "OUTCOME_LEADS" || goal === "OUTCOME_ENGAGEMENT" || goal === "OUTCOME_SALES";
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
  if (scope === "address") return "Address";
  return "Location";
}

function canEditLocationRadius(scope?: NonNullable<CampaignLaunchState["targetLocations"]>[number]["scope"]) {
  if (!scope) return true;
  return radiusEnabledScopes.includes(scope);
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
  if (scope === "city") return parts.slice(0, 3).join(", ");
  return parts.slice(0, 4).join(", ");
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
          Almost there! Let&apos;s set campaign type, budget, url and radius.
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
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="p-6">
        <div className="mb-8 text-center">
          <p className="mt-2 text-sm text-gray-500">{description}</p>
        </div>
        {children}
      </div>
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
}: {
  value: NonNullable<CampaignLaunchState["previewTab"]>;
  onChange: (tab: NonNullable<CampaignLaunchState["previewTab"]>) => void;
  showLeadForm: boolean;
}) {
  const tabs: Array<{ id: NonNullable<CampaignLaunchState["previewTab"]>; label: string }> = [
    { id: "ad", label: "Ad Preview" },
    ...(showLeadForm ? [{ id: "lead-form" as const, label: "Lead Form" }] : []),
    { id: "thank-you", label: "Thank You" },
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
            {tab.label === "Ad Preview" ? "Ad" : tab.label === "Lead Form" ? "Lead Form" : "Thank You"}
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
}: {
  template: TemplateSeed;
  preview: ReturnType<typeof createCampaignBlueprint>;
  launchState: CampaignLaunchState;
  businessProfile: BusinessProfile | null;
}) {
  const businessName = businessProfile?.business_name || "Your business";
  const targetLocation = deriveLocationSummary(launchState);
  const businessInitial = businessName.charAt(0).toUpperCase() || "B";

  return (
    <div className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
      <div className="flex flex-row items-center gap-2 rounded-t-lg bg-white px-4 pt-4">
        <div className="relative flex w-full items-center space-x-3">
          <div className="rounded-full bg-gray-200 p-0">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-700">
              {businessInitial}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900">{businessName}</p>
            <p className="truncate text-xs text-gray-500">Sponsored • {targetLocation}</p>
          </div>
          <div className="-mt-1 mr-1 text-sm text-gray-800">...</div>
        </div>
      </div>

      <div className="relative bg-white">
        <div className="relative">
          <div className="mt-2 h-24 overflow-hidden px-4 py-2 text-sm leading-relaxed text-gray-800">
            {preview.adCopy.primary}
          </div>
        </div>
      </div>

      <div className="-mt-2 flex flex-row justify-end bg-white">
        <div className="items-end px-4 py-2 text-xs text-gray-800">
          <button type="button" className="cursor-default border-0 bg-transparent p-0 text-xs text-blue-600">
            see more
          </button>
        </div>
      </div>

      <hr className="border-gray-300" />

      <div className="relative flex items-center justify-center bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={template.previewImage} alt={template.name} className="w-full h-auto" />
      </div>

      <div className="grid grid-cols-3 gap-2 bg-gray-200 px-4 py-3">
        <div className="relative col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex-grow">
              <p className="text-left text-base font-bold leading-tight text-gray-900">
                {preview.adCopy.headlines[0] || template.name}
              </p>
              <p className="mt-0.5 text-left text-sm text-gray-600">
                {preview.adCopy.descriptions[0] || preview.funnelConfig.subheadline}
              </p>
            </div>
          </div>
        </div>
        <div className="col-span-1 flex items-center justify-end">
          <button
            type="button"
            className="cursor-default whitespace-nowrap rounded-md bg-gray-300 px-3 py-2 text-xs font-semibold text-gray-800"
          >
            {preview.funnelConfig.ctaText}
          </button>
        </div>
      </div>

      <div className="flex flex-row items-center justify-between bg-white px-4 py-2">
        <div className="flex flex-row items-center gap-2">
          <span className="text-xs text-gray-500">129</span>
        </div>
        <div className="flex flex-row items-center text-xs text-gray-500">12 Comments 8 Shares</div>
      </div>

      <hr className="border-gray-300" />

      <div className="flex h-12 flex-row justify-between rounded-b-lg bg-white px-4 py-2 text-sm text-gray-700">
        <div className="flex items-center gap-2">Like</div>
        <div className="flex items-center gap-2">Comment</div>
        <div className="flex items-center gap-2">Share</div>
      </div>
    </div>
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
  preview,
}: {
  preview: ReturnType<typeof createCampaignBlueprint>;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 text-center">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 shadow-lg shadow-green-500/25">
          <CheckCircle2 className="h-7 w-7 text-white" />
        </div>
        <p className="text-xl font-bold text-gray-900">{preview.funnelConfig.thankYouPage.headline}</p>
        <p className="mt-2 text-sm text-gray-500">{preview.funnelConfig.thankYouPage.description}</p>
      </div>
      <button
        type="button"
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900"
      >
        {preview.funnelConfig.thankYouPage.buttonLabel}
      </button>
    </div>
  );
}

function BuilderPreview({
  launchState,
  onPreviewTabChange,
  template,
  preview,
  businessProfile,
}: {
  launchState: CampaignLaunchState;
  onPreviewTabChange: (tab: NonNullable<CampaignLaunchState["previewTab"]>) => void;
  template: TemplateSeed;
  preview: ReturnType<typeof createCampaignBlueprint>;
  businessProfile: BusinessProfile | null;
}) {
  const previewTab = launchState.previewTab || "ad";
  const showLeadForm = showsLeadFormPreview(launchState.campaignGoal);
  const targetLocation = deriveLocationSummary(launchState);

  return (
    <div className="sticky top-6 space-y-6 lg:space-y-0">
      <div className="rounded-2xl border border-gray-200 bg-gray-100 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Ad Preview</h3>
          <PreviewTabs value={previewTab} onChange={onPreviewTabChange} showLeadForm={showLeadForm} />
        </div>
        {previewTab === "ad" ? <MetaAdPreview template={template} preview={preview} launchState={launchState} businessProfile={businessProfile} /> : null}
        {previewTab === "lead-form" && showLeadForm ? <LeadFormPreview preview={preview} template={template} /> : null}
        {previewTab === "thank-you" ? <ThankYouPreview preview={preview} /> : null}

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
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", iconClassName)}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
            <div className="text-sm font-semibold text-gray-900">{value}</div>
          </div>
        </div>
        <button type="button" onClick={onEdit} className="shrink-0 text-xs font-medium text-blue-600 hover:text-blue-700">
          Edit
        </button>
      </div>
    </div>
  );
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
}: {
  templates: TemplateSeed[];
  businessProfile: BusinessProfile | null;
  initialDraftBundle: CampaignBundle | null;
  initialTemplateSlug?: string | null;
  metaIntegration: WizardMetaIntegration;
}) {
  const router = useRouter();
  const categories = useMemo(() => Array.from(new Set(templates.map((template) => template.category))), [templates]);
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
  const availablePixels = metaIntegration?.assets.pixels || [];
  const availableLeadForms = metaIntegration?.assets.leadForms || [];

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
            category: initialTemplate?.category || "",
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
  const [isPreflighting, setIsPreflighting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
  const [pendingLocation, setPendingLocation] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSearchingLocations, setIsSearchingLocations] = useState(false);
  const [locationSearchError, setLocationSearchError] = useState<string | null>(null);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const locationInputWrapRef = useRef<HTMLDivElement | null>(null);
  const locationSuggestionsRef = useRef<HTMLDivElement | null>(null);

  const selectedTemplate = templates.find((template) => template.slug === launchState.templateSlug) || null;
  const selectedTemplateSlug = selectedTemplate?.slug || "";
  const selectedCategoryTemplates = templates.filter(
    (template) => !launchState.category || template.category === launchState.category,
  );
  const placeholderFields = selectedTemplate ? getTemplatePlaceholderFields(selectedTemplate) : [];
  const currentStepIndex = campaignWizardSteps.findIndex((step) => step.id === launchState.currentStep);
  const currentDetailsIndex = campaignDetailsSteps.findIndex((step) => step.id === launchState.currentDetailsStep);

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

  function syncLocationSummary(nextLocations: NonNullable<CampaignLaunchState["targetLocations"]>) {
    return nextLocations.length ? nextLocations[0].label : "";
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
    const nextStep = campaignDetailsSteps[Math.min(currentDetailsIndex + 1, campaignDetailsSteps.length - 1)];
    setDetailsStep(nextStep.id);
  }

  function goToPreviousDetailsStep() {
    if (currentDetailsIndex <= 0) {
      setStep("template");
      return;
    }
    const previousStep = campaignDetailsSteps[Math.max(currentDetailsIndex - 1, 0)];
    setDetailsStep(previousStep.id);
  }

  async function persistDraft(nextState: CampaignLaunchState, options?: { pushToDraft?: boolean }) {
    if (!selectedTemplateSlug) return null;

    setSaveState("saving");
    setSaveError(null);

    const { response, payload } = await saveDraftRequest({
      draftId: draftId || undefined,
      templateSlug: selectedTemplateSlug,
      state: nextState,
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

    setSaveState("saved");
    return payload?.draftId || draftId;
  }

  async function runLaunchPreflight(mode: CampaignPublishMode) {
    setPreflightMode(mode);
    setPreflightError(null);
    setPublishError(null);
    setPublishSuccess(null);
    setIsPreflighting(true);

    const resolvedDraftId = await persistDraft(launchState, { pushToDraft: true });
    if (!resolvedDraftId) {
      setIsPreflighting(false);
      setPreflightError("Create a campaign draft before running launch preflight.");
      return null;
    }

    try {
      const response = await fetch("/api/meta/preflight", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignId: resolvedDraftId,
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
      setPreflight(readyPayload);
      if (readyPayload.blockingIssues.length) {
        setPreflightError("Preflight found blocking issues. Resolve them before publishing.");
      }
      return {
        draftId: resolvedDraftId,
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

    const nextState: CampaignLaunchState = {
      ...launchState,
      currentStep: "campaign-details",
      currentDetailsStep: launchState.currentDetailsStep || "goal",
      category: selectedTemplate.category,
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
    const query = pendingLocation.trim();
    if (query.length < 2) {
      setLocationSuggestions([]);
      setIsSearchingLocations(false);
      setLocationSearchError(null);
      return;
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

          setLocationSuggestions(payload?.suggestions || []);
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
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [pendingLocation]);

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
    const locationId = normalizeLocationId(label) || `location-${Date.now()}`;
    if (!label) return;

    updateLaunchState((current) => {
      const existing = current.targetLocations || [];
      if (existing.some((location) => location.label.toLowerCase() === label.toLowerCase())) {
        return current;
      }
      const manualScope: NonNullable<CampaignLaunchState["targetLocations"]>[number]["scope"] = isWorldwideManual
        ? "world"
        : "address";

      const nextLocation = {
        id: locationId,
        label: isWorldwideManual ? "Worldwide" : label,
        radius: defaultLocationRadius,
        targetingMode: "home" as const,
        scope: manualScope,
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
            location.label.toLowerCase() === suggestion.label.toLowerCase() &&
            (location.scope || "address") === suggestion.scope,
        )
      ) {
        return current;
      }

      const nextLocation = {
          id: normalizeLocationId(`${suggestion.id}-${suggestion.label}`) || `location-${existing.length + 1}`,
          label: compactLocationLabel(suggestion.label, suggestion.scope),
          radius: defaultLocationRadius,
          targetingMode: "home" as const,
          scope: suggestion.scope,
          lat: suggestion.lat,
          lon: suggestion.lon,
          countryCode: suggestion.countryCode,
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
  }

  const reviewPlaceholderSummary = placeholderFields.length
    ? placeholderFields
        .map((field) => `${field.label}: ${launchState.placeholderValues[field.id] || "—"}`)
        .join(" • ")
    : "This template has no required placeholders.";
  const normalizedDailyBudget = parseDailyBudgetAmount(launchState.dailyBudget) || 10;
  const budgetDigits = Math.max((launchState.dailyBudget.match(/[0-9]/g) || []).length, 1);

  return (
    <div className="space-y-6">
      <WizardProgress
        currentStep={launchState.currentStep}
        onStepClick={(step) => {
          if (step === "campaign-details" && !selectedTemplate) return;
          if (campaignWizardSteps.findIndex((item) => item.id === step) <= currentStepIndex || step === "template") {
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
                </BuilderTip>
              </div>

              <div className="mt-7 flex justify-end">
                <Button onClick={() => setStep("category")}>
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </StepSection>
          ) : null}

          {launchState.currentStep === "category" ? (
            <StepSection
              title="Select a category"
              description="Choose the campaign category that matches what this workspace is about to launch."
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {categories.map((category) => {
                  const active = launchState.category === category;
                  const count = templates.filter((template) => template.category === category).length;

                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() =>
                        updateLaunchState((current) => ({
                          ...current,
                          category,
                          templateSlug:
                            current.templateSlug &&
                            templates.some((template) => template.slug === current.templateSlug && template.category === category)
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
                      <p className="text-base font-semibold text-[var(--ink)]">{category}</p>
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
                <Button onClick={() => setStep("template")} disabled={!launchState.category}>
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
                {launchState.category ? <Badge>{launchState.category}</Badge> : null}
                {selectedTemplate ? <Badge>{selectedTemplate.name}</Badge> : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {selectedCategoryTemplates.map((template) => {
                  const active = launchState.templateSlug === template.slug;
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() =>
                        updateLaunchState((current) => ({
                          ...current,
                          category: template.category,
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
                      <div className="aspect-[1.35/1] overflow-hidden border-b border-[var(--line)] bg-[var(--soft-panel)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={template.previewImage}
                          alt={template.name}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                        />
                      </div>
                      <div className="space-y-3 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-semibold text-[var(--ink)]">{template.name}</p>
                            <p className="mt-1 text-xs text-[var(--muted)]">{template.industry || template.category}</p>
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
                <Button variant="outline" onClick={() => setStep("category")}>
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
            {launchState.currentDetailsStep === "goal" ? (
              <StepSection
                title="Pick ad type and campaign goal"
                description="Choose the goal this campaign should optimize around when it becomes a Meta draft."
              >
                <div className="space-y-8">
                  <div className="text-center">
                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 shadow-lg shadow-blue-500/25">
                      <Rocket className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Pick Your Ad Type</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      There are a few different ways to run ads on Facebook. Choose the goal that best matches what you want to achieve.
                    </p>
                  </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {campaignGoalOptions.map((goal) => {
                    const active = launchState.campaignGoal === goal.id;
                    return (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() =>
                          updateLaunchState((current) => ({
                            ...current,
                            campaignGoal: goal.id,
                            previewTab: showsLeadFormPreview(goal.id) ? current.previewTab || "ad" : "ad",
                          }))
                        }
                        className={cn(
                          "group relative flex flex-col items-start rounded-2xl border-2 p-5 text-left transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                          active
                            ? "border-transparent bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/50"
                            : "border-gray-200 bg-white hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md",
                        )}
                        >
                        {(() => {
                          const Icon = goalIcon(goal.id);
                          return (
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
                          );
                        })()}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 opacity-0 transition-opacity duration-300 group-hover:opacity-5" />
                        <h4 className="relative mb-1 text-base font-semibold text-gray-900">{goal.label}</h4>
                        <p className="relative text-sm leading-relaxed text-gray-500">{goal.description}</p>
                      </button>
                    );
                  })}
                </div>

                  <BuilderTip title="Campaign details overview" icon={PanelLeft}>
                    This section sets the campaign goal, delivery settings, placeholder values, review state, and advanced options before final publish.
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
                    <div className="relative rounded-3xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-8">
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
                            className="w-44 overflow-hidden border-none bg-transparent text-center font-black leading-none tracking-tight text-gray-900 placeholder:text-gray-300 [font-variant-numeric:tabular-nums] focus:outline-none md:w-56"
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
                description="Add the places this campaign should target. Keep the main service area first so the preview and review stay aligned."
              >
                <div className="space-y-5">
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[var(--ink)]">Add a location</label>
                      <div className="relative">
                        <div className="flex gap-2" ref={locationInputWrapRef}>
                        <Input
                          value={pendingLocation}
                          onChange={(event) => {
                            setPendingLocation(event.target.value);
                            setShowLocationSuggestions(true);
                          }}
                          onFocus={() => setShowLocationSuggestions(true)}
                          placeholder="Search country, state, city, or address"
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              addLocation();
                            }
                          }}
                        />
                        <Button type="button" onClick={addLocation} className="shrink-0">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                        {showLocationSuggestions && pendingLocation.trim().length >= 2 ? (
                          <div
                            ref={locationSuggestionsRef}
                            className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-[var(--line)] bg-white p-1 shadow-lg"
                          >
                            {isSearchingLocations ? (
                              <p className="px-3 py-2 text-sm text-[var(--muted)]">Searching locations...</p>
                            ) : locationSearchError ? (
                              <p className="px-3 py-2 text-sm text-red-600">{locationSearchError}</p>
                            ) : locationSuggestions.length ? (
                              locationSuggestions.map((suggestion) => (
                                <button
                                  key={suggestion.id}
                                  type="button"
                                  onClick={() => addLocationFromSuggestion(suggestion)}
                                  className="flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--soft-panel)]"
                                >
                                  <span className="text-sm text-[var(--ink)]">{suggestion.label}</span>
                                  <span className="mt-0.5 shrink-0 rounded-full border border-[var(--line)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                                    {locationScopeLabel(suggestion.scope)}
                                  </span>
                                </button>
                              ))
                            ) : (
                              <p className="px-3 py-2 text-sm text-[var(--muted)]">No matches. Press + to add this manually.</p>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <BuilderTip title="Location targeting help" icon={MapPin}>
                      Search supports countries, states, cities, and exact addresses. Radius is applied to city/address targets only.
                    </BuilderTip>
                  </div>

                  <div className="rounded-[26px] border border-[var(--line)] bg-white">
                    {(launchState.targetLocations || []).length ? (
                      <div className="divide-y divide-[var(--line)]">
                        {(launchState.targetLocations || []).map((location) => (
                          <div key={location.id} className="space-y-4 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold leading-6 text-[var(--ink)]">{location.label}</p>
                                <p className="mt-1 text-xs text-[var(--muted)]">
                                  {locationScopeLabel(location.scope)} targeting area
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeLocation(location.id)}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
                                aria-label={`Remove ${location.label}`}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)] lg:grid-cols-[10rem_16rem_auto]">
                              <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Radius</label>
                                <select
                                  value={location.radius}
                                  onChange={(event) => updateLocation(location.id, { radius: event.target.value })}
                                  disabled={!canEditLocationRadius(location.scope)}
                                  className="h-11 w-full rounded-[14px] border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)] disabled:opacity-60"
                                >
                                  {["5", "10", "15", "20", "25"].map((radius) => (
                                    <option key={radius} value={radius}>
                                      {radius} mi
                                    </option>
                                  ))}
                                </select>
                                {!canEditLocationRadius(location.scope) ? (
                                  <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--muted)]">
                                    Radius not required
                                  </p>
                                ) : null}
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Mode</label>
                                <select
                                  value={location.targetingMode}
                                  onChange={(event) =>
                                    updateLocation(location.id, {
                                      targetingMode: event.target.value as NonNullable<CampaignLaunchState["targetLocations"]>[number]["targetingMode"],
                                    })
                                  }
                                  className="h-11 w-full rounded-[14px] border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)]"
                                >
                                  {locationTargetingModeOptions.map((mode) => (
                                    <option key={mode.value} value={mode.value}>
                                      {mode.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="hidden lg:block" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <p className="text-base font-semibold text-[var(--ink)]">No locations added yet</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                          Add at least one location so the campaign review and preview have a real target area.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </StepSection>
            ) : null}

            {launchState.currentDetailsStep === "pixel" ? (
              <StepSection
                title="Add a Tracking Pixel"
                description="Choose the pixel that should be tied to this campaign once Meta assets are connected."
              >
                <div className="space-y-5">
                  <div className="text-center">
                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-500 shadow-lg shadow-teal-500/25">
                      <Target className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Add a Tracking Pixel</h3>
                    <p className="mt-2 text-sm text-gray-500">Select a Facebook pixel to track conversions on your website (optional)</p>
                  </div>
                  <div>
                    <label className="mb-3 block text-sm font-semibold text-gray-900">Pixels</label>
                    <select
                      value={launchState.trackingPixelId}
                      onChange={(event) =>
                        {
                          const nextPixelId = event.target.value;
                          const selectedPixel = availablePixels.find((pixel) => pixel.asset_id === nextPixelId);
                          updateLaunchState((current) => ({
                            ...current,
                            trackingPixelId: nextPixelId,
                            trackingPixelName: selectedPixel?.name || "",
                            integrationSelections: {
                              ...current.integrationSelections,
                              pixelId: nextPixelId,
                            },
                          }));
                        }
                      }
                      disabled={!metaConnected}
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-500 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">
                        {metaConnected ? "No pixel selected" : "Connect Meta to load available pixels"}
                      </option>
                      {availablePixels.map((pixel) => (
                        <option key={pixel.asset_id} value={pixel.asset_id}>
                          {pixel.name || pixel.asset_id}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                      <Target className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className="text-sm text-blue-800">
                      Pixel is optional for lead-form campaigns and recommended for traffic/sales campaigns.
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
                        <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-600">
                            {index + 1}
                          </span>
                          {field.label}
                          <span className="text-red-500">*</span>
                        </label>
                        <Input
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

            {launchState.currentDetailsStep === "thank-you" ? (
              <StepSection
                title="Thank You Page"
                description="Set what the lead sees after they submit, along with the next step you want them to take."
              >
                <div className="space-y-8">
                  <div className="text-center">
                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 shadow-lg shadow-purple-500/25">
                      <ExternalLink className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Thank You Page</h3>
                    <p className="mt-2 text-sm text-gray-500">Where should leads go after submitting the form? (optional)</p>
                  </div>
                  <div className="mx-auto max-w-2xl space-y-4">
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                      <label className="mb-3 block text-sm font-semibold text-gray-900">
                        Thank You Page URL <span className="ml-2 text-xs font-normal text-gray-400">(optional)</span>
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center rounded-l-xl border border-r-0 border-gray-300 bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700">
                          https://
                        </span>
                        <input
                          value={launchState.thankYouPage.destinationUrl.replace(/^https?:\/\//, "")}
                          onChange={(event) =>
                            updateLaunchState((current) => ({
                              ...current,
                              thankYouPage: {
                                ...current.thankYouPage,
                                destinationUrl: `https://${event.target.value.replace(/^https?:\/\//, "")}`,
                              },
                            }))
                          }
                          placeholder="yourwebsite.com"
                          className="w-full rounded-r-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[var(--ink)]">Thank-you headline</label>
                      <Input
                        value={launchState.thankYouPage.headline}
                        onChange={(event) =>
                          updateLaunchState((current) => ({
                            ...current,
                            thankYouPage: {
                              ...current.thankYouPage,
                              headline: event.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[var(--ink)]">Button label</label>
                      <Input
                        value={launchState.thankYouPage.buttonLabel}
                        onChange={(event) =>
                          updateLaunchState((current) => ({
                            ...current,
                            thankYouPage: {
                              ...current.thankYouPage,
                              buttonLabel: event.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--ink)]">Supporting text</label>
                    <Textarea
                      value={launchState.thankYouPage.description}
                      onChange={(event) =>
                        updateLaunchState((current) => ({
                          ...current,
                          thankYouPage: {
                            ...current.thankYouPage,
                            description: event.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                      <ExternalLink className="h-4 w-4 text-amber-600" />
                    </div>
                    <p className="text-sm text-amber-800">
                      <span className="font-semibold">Mobile first:</span> Make sure your page is mobile-friendly since most users browse on phones.
                    </p>
                  </div>
                  </div>
                </div>
              </StepSection>
            ) : null}

            {launchState.currentDetailsStep === "review" ? (
              <StepSection
                title="Review & Launch"
                description="Review the campaign settings before the final publish step. You can jump back into any section to refine it."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <ReviewRow label="Campaign goal" value={goalDisplay(launchState.campaignGoal)} onEdit={() => setDetailsStep("goal")} icon={Rocket} iconClassName="bg-blue-100 text-blue-600" />
                  <ReviewRow label="Daily budget" value={`$${launchState.dailyBudget || "25"}/day`} onEdit={() => setDetailsStep("budget")} icon={BadgeDollarSign} iconClassName="bg-emerald-100 text-emerald-600" />
                  <ReviewRow label="Target location" value={deriveLocationSummary(launchState)} onEdit={() => setDetailsStep("location")} icon={MapPin} iconClassName="bg-rose-100 text-rose-600" />
                  <ReviewRow label="Tracking" value={launchState.trackingPixelName || "No pixel selected"} onEdit={() => setDetailsStep("pixel")} icon={Target} iconClassName="bg-teal-100 text-teal-600" />
                  <ReviewRow label="Placeholders" value={reviewPlaceholderSummary} onEdit={() => setDetailsStep("placeholders")} icon={Sparkles} iconClassName="bg-indigo-100 text-indigo-600" />
                  <ReviewRow
                    label="Contact"
                    value={
                      <div className="space-y-1">
                        <p>{launchState.thankYouPage.headline}</p>
                        <p className="text-xs text-[var(--muted)]">{launchState.thankYouPage.destinationUrl || "No URL set yet"}</p>
                      </div>
                    }
                    onEdit={() => setDetailsStep("thank-you")}
                    icon={ExternalLink}
                    iconClassName="bg-purple-100 text-purple-600"
                  />
                  <ReviewRow
                    label="Advanced settings"
                    value={
                      <div className="space-y-1">
                        <p>{launchState.advanced.campaignName || "No campaign name yet"}</p>
                        <p className="text-xs text-[var(--muted)]">{launchState.advanced.leadFormName || "No lead form name yet"}</p>
                      </div>
                    }
                    onEdit={() => setDetailsStep("advanced")}
                    icon={PanelLeft}
                    iconClassName="bg-gray-200 text-gray-600"
                  />
                </div>
              </StepSection>
            ) : null}

            {launchState.currentDetailsStep === "advanced" ? (
              <StepSection
                title="Advanced Settings"
                description="Finalize lead-form behavior, targeting defaults, and launch readiness."
              >
                <div className="space-y-4">
                  <details open className="rounded-2xl border border-gray-200 bg-white shadow-sm">
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
                      />
                    </div>
                  </details>

                  <details className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-gray-900">Connected Meta assets</summary>
                    <div className="grid gap-4 px-5 pb-5 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-800">
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
                        <label className="mb-2 block text-sm font-medium text-gray-800">
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
                  </div>
                </div>
              </StepSection>
            ) : null}

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

                  {launchState.currentDetailsStep !== "advanced" ? (
                    <Button className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/25 hover:-translate-y-0.5 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700" onClick={goToNextDetailsStep}>
                      Continue
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <>
                      {draftId ? (
                        <Button variant="outline" asChild>
                          <Link href={`/campaigns/${draftId}`}>Open campaign draft</Link>
                        </Button>
                      ) : null}
                      <Button
                        variant="outline"
                        disabled={isPreflighting || isPublishing || !selectedTemplateSlug}
                        onClick={() => void persistDraft(launchState, { pushToDraft: true })}
                      >
                        {saveState === "saving" ? "Saving..." : "Save draft"}
                      </Button>
                      <Button
                        variant="outline"
                        disabled={isPreflighting || isPublishing}
                        onClick={() => void runLaunchPreflight("draft")}
                      >
                        {isPreflighting && preflightMode === "draft"
                          ? "Running preflight..."
                          : "Run preflight"}
                      </Button>
                      <Button
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-indigo-500/25 hover:from-blue-700 hover:to-indigo-700"
                        disabled={isPublishing || isPreflighting}
                        onClick={() => void publishToMeta("draft")}
                      >
                        {isPublishing && preflightMode === "draft"
                          ? "Publishing draft..."
                          : "Publish draft to Meta"}
                      </Button>
                      <Button
                        className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 shadow-lg shadow-green-500/25 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600"
                        disabled={isPublishing || isPreflighting}
                        onClick={async () => {
                          await publishToMeta("live");
                        }}
                      >
                        {isPublishing && preflightMode === "live"
                          ? "Publishing live..."
                          : "Publish live"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
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
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
