"use client";

import {
  useActionState,
  useMemo,
  useState,
} from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  CircleX,
  ChevronDown,
  Eye,
  Home,
  Landmark,
  LayoutGrid,
  Megaphone,
  MessageCircle,
  Globe,
  Languages,
  Plus,
  PenSquare,
  Sparkles,
  Settings2,
  Trash2,
  Wand2,
  Image as MediaImage,
  Video as MediaVideo,
  Target,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FacebookAdPreview } from "@/components/facebook-ad-preview";
import { supportedIndustries } from "@/data/template-taxonomy";
import {
  AdminTemplateActionState,
  AdminTemplateFormData,
  AdminTemplateFieldName,
  emptyAdminTemplateActionState,
  getEmptyLeadFormSettings,
  type LeadFormSettings,
} from "@/lib/admin-template-form";
import { cn, slugify } from "@/lib/utils";

type MediaAssetKind = "image" | "video";

const supportedAdTypeOptions = [
  { id: "lead_form", label: "Lead Form", hint: "Instant form with optional thank-you page" },
  { id: "landing_page", label: "Landing Page", hint: "Send traffic to a website destination" },
  { id: "call_now", label: "Call Now", hint: "Route clicks to a business phone call" },
  { id: "messenger_leads", label: "Messenger (Leads)", hint: "Start a Messenger lead flow" },
  { id: "messenger_engagement", label: "Messenger (Engagement)", hint: "Optimize for Messenger conversation starts" },
] as const;

const campaignTypeOptions = [
  { id: "standard", label: "Standard", hint: "Lead Gen" },
  { id: "time_bound", label: "Time-bound", hint: "Lead Gen with an End Date" },
  { id: "awareness", label: "Awareness", hint: "Brand Reach" },
] as const;

const audienceTypeOptions = [
  { id: "b2c", label: "B2C", hint: "Consumers" },
  { id: "b2b", label: "B2B", hint: "Business Owners" },
] as const;

const offerFrameworkOptions = [
  { id: "direct_response", label: "Direct Response", hint: "Offers" },
  { id: "lead_magnet", label: "Lead Magnet", hint: "Content" },
] as const;

const adSetStructureOptions = [
  {
    id: "one_ad_set_multiple_ads",
    title: "One ad set with multiple ads",
    description: "Best for most campaigns - create multiple ad variations within a single set that Facebook can optimize between",
  },
  {
    id: "multiple_ad_sets_one_ad_each",
    title: "Multiple ad sets with one ad each",
    description: "Recommended for testing audiences - create separate ad sets, each with its own targeting and a single ad",
  },
] as const;

const advantagePlusOptions = [
  {
    id: "automatic",
    title: "Automatic",
    description: "Automatically enable optimal Advantage+ settings",
  },
  {
    id: "manual",
    title: "Manual",
    description: "Choose specific Advantage+ settings to enable",
  },
] as const;

const placementsOptions = [
  {
    id: "automatic",
    title: "Automatic Placements",
    description: "Facebook optimizes placement for best results",
  },
  {
    id: "manual",
    title: "Manual Placements",
    description: "Choose exactly where your ads appear",
  },
] as const;

const dynamicCreativeOptions = [
  {
    id: "on",
    title: "On",
    description: "Let Facebook test multiple creative combinations",
  },
  {
    id: "off",
    title: "Off",
    description: "Only your primary ad copy is published. Additional variations are saved as alternates for future optimization.",
  },
] as const;

const conversionEventOptions = [
  "Lead",
  "Complete Registration",
  "Purchase",
  "View Content",
  "Contact",
] as const;

const adFormatOptions = [
  {
    id: "individual",
    title: "Individual",
    description: "Single image or video with maximum impact",
    icon: MediaImage,
  },
  {
    id: "carousel",
    title: "Carousel",
    description: "2-10 scrollable cards to showcase multiple items",
    icon: LayoutGrid,
  },
] as const;

const mediaTypeOptions = [
  {
    id: "image",
    title: "Image",
    description: "Upload or generate with AI",
    icon: MediaImage,
  },
  {
    id: "video",
    title: "Video",
    description: "Upload or generate with AI",
    icon: MediaVideo,
  },
] as const;

const ctaButtonOptions = [
  "Learn more",
  "Get started",
  "Sign up",
  "Book now",
  "Call now",
  "Contact us",
  "Get quote",
  "Send message",
  "Apply now",
  "Download",
] as const;

const specialAdCategoryOptions = [
  {
    id: "none",
    label: "None",
    description: "This ad does not fall into any special category",
    icon: CircleX,
  },
  {
    id: "housing",
    label: "Housing",
    description: "Ads for real estate listings, homeowners insurance, mortgage loans, etc.",
    icon: Home,
  },
  {
    id: "financial_products_and_services",
    label: "Financial products and services",
    description: "Credit cards, loans, banking, insurance, investments, or financial planning",
    icon: Landmark,
  },
  {
    id: "employment",
    label: "Employment",
    description: "Job listings, recruitment, career fairs, or employment services",
    icon: BriefcaseBusiness,
  },
  {
    id: "social_issues_elections_or_politics",
    label: "Social issues, elections or politics",
    description: "Political candidates, elections, legislation, or social issues",
    icon: Megaphone,
  },
] as const satisfies readonly {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
}[];

function getOptionLabel<T extends { id: string; label: string }>(
  options: readonly T[],
  id?: string,
) {
  return options.find((option) => option.id === id)?.label || id || "Not set";
}

const steps = [
  {
    id: "basics",
    label: "Template Info",
    description: "Name, niche, featured state, and basic settings",
    icon: PenSquare,
  },
  {
    id: "offer",
    label: "Ad Text",
    description: "Headline, CTA, promo details, and positioning",
    icon: Wand2,
  },
  {
    id: "facebook",
    label: "Ad Media",
    description: "Primary text, headline variations, audience notes, and creative guidance",
    icon: Megaphone,
  },
  {
    id: "lead-flow",
    label: "Capture Lead Info",
    description: "Page copy, ad type defaults, FAQs, and next steps",
    icon: Eye,
  },
  {
    id: "follow-up",
    label: "Targeting",
    description: "Audience, budget, and launch notes",
    icon: Sparkles,
  },
  {
    id: "review",
    label: "Review & publish",
    description: "Preview the blueprint and set status",
    icon: CheckCircle2,
  },
] as const;

type StepId = (typeof steps)[number]["id"];

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-6 sm:p-7">
      <div className="mb-5 space-y-2">
        <h2 className="text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
          {title}
        </h2>
        <p className="text-sm leading-6 text-[var(--muted-strong)]">
          {description}
        </p>
      </div>
      {children}
    </Card>
  );
}

function FieldLabel({
  children,
  required,
  invalid,
}: {
  children: React.ReactNode;
  required?: boolean;
  invalid?: boolean;
}) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <label className="text-sm font-medium text-[var(--ink)]">{children}</label>
      {required ? (
        <span
          className={cn(
            "text-xs font-semibold uppercase tracking-[0.12em]",
            invalid ? "text-rose-600" : "text-[var(--brand-ink)]",
          )}
        >
          Required
        </span>
      ) : null}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-sm text-rose-600">{message}</p>;
}

function PreviewChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-[var(--line)] bg-white/88 px-3 py-2 text-xs font-medium text-[var(--muted-strong)]">
      {children}
    </span>
  );
}

function normalizeLeadFormSettings(input: Partial<LeadFormSettings> | null | undefined): LeadFormSettings {
  const defaults = getEmptyLeadFormSettings();

  return {
    ...defaults,
    ...(input || {}),
    multipleChoiceQuestions: Array.isArray(input?.multipleChoiceQuestions) && input?.multipleChoiceQuestions.length
      ? input.multipleChoiceQuestions.map((question) => ({
          label: question.label || "",
          options: Array.isArray(question.options) && question.options.length
            ? question.options.map((option) => option || "")
            : ["", ""],
        }))
      : defaults.multipleChoiceQuestions,
    shortQuestions: Array.isArray(input?.shortQuestions) && input.shortQuestions.length
      ? input.shortQuestions.map((question) => question || "")
      : defaults.shortQuestions,
    standardQuestions: Array.isArray(input?.standardQuestions) && input.standardQuestions.length
      ? input.standardQuestions.map((question) => question || "")
      : defaults.standardQuestions,
  };
}

function parseLeadFormSettingsJson(value: string): LeadFormSettings {
  try {
    return normalizeLeadFormSettings(JSON.parse(value || "{}") as Partial<LeadFormSettings>);
  } catch {
    return getEmptyLeadFormSettings();
  }
}

function LeadFormSectionCard({
  icon: Icon,
  title,
  description,
  children,
  accentClass = "bg-[linear-gradient(135deg,#2f7ef7_0%,#7c4dff_100%)]",
  collapsible = false,
  defaultOpen = false,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
  accentClass?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const content = (
    <>
      <div className="flex items-start gap-3">
        <span className={cn("flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-[0_12px_24px_rgba(109,94,248,0.18)]", accentClass)}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--ink)]">{title}</p>
          <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </>
  );

  if (!collapsible) {
    return (
      <Card className="border-[var(--line)] bg-[rgba(255,255,255,0.92)] p-5 shadow-[var(--shadow-soft)]">
        {content}
      </Card>
    );
  }

  return (
    <details
      open={defaultOpen}
      className="group rounded-[24px] border border-[var(--line)] bg-[rgba(255,255,255,0.92)] p-5 shadow-[var(--shadow-soft)]"
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className={cn("flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-[0_12px_24px_rgba(109,94,248,0.18)]", accentClass)}>
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--ink)]">{title}</p>
            <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">{description}</p>
          </div>
        </div>
        <ChevronDown className="mt-1 h-5 w-5 text-[var(--muted)] transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="mt-5">{children}</div>
    </details>
  );
}

function LeadFormDisclosureCard({
  title,
  description,
  children,
  defaultOpen = false,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-[20px] border border-[var(--line)] bg-white px-4 py-4 shadow-[var(--shadow-soft)]"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--ink)]">{title}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--muted-strong)]">{description}</p>
        </div>
        <ChevronDown className="h-5 w-5 text-[var(--muted)] transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

export function AdminTemplateForm({
  mode,
  initialValues,
  action,
}: {
  mode: "create" | "edit";
  initialValues: AdminTemplateFormData;
  action: (
    state: AdminTemplateActionState,
    formData: FormData,
  ) => Promise<AdminTemplateActionState>;
}) {
  const [state, formAction, isPending] = useActionState(
    action,
    emptyAdminTemplateActionState,
  );
  const [values, setValues] = useState(initialValues);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [mediaUploadError, setMediaUploadError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(Boolean(initialValues.slug));
  const [currentStep, setCurrentStep] = useState<StepId>("basics");
  const [leadFormSettings, setLeadFormSettings] = useState<LeadFormSettings>(() =>
    parseLeadFormSettingsJson(initialValues.leadFormSettingsJson),
  );
  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);
  const stepValidation = useMemo(() => {
    const fieldErrors: Partial<Record<AdminTemplateFieldName, string>> = {};

    if (currentStep === "basics") {
      if (!values.name.trim()) fieldErrors.name = "Template name is required.";
      if (!values.category.trim()) fieldErrors.category = "Category is required.";
      if (!values.description.trim()) fieldErrors.description = "Short description is required.";
    }

    if (currentStep === "offer") {
      if (!values.headline.trim()) fieldErrors.headline = "Headline is required.";
      if (!values.adPrimary.trim()) fieldErrors.adPrimary = "Primary text is required.";
      if (!values.ctaDefault.trim()) fieldErrors.ctaDefault = "Call to action is required.";
    }

    return {
      fieldErrors,
      isValid: Object.keys(fieldErrors).length === 0,
    };
  }, [
    currentStep,
    values.adPrimary,
    values.category,
    values.ctaDefault,
    values.description,
    values.headline,
    values.name,
  ]);

  const preview = useMemo(() => {
    const parseLines = (value: string) =>
      value
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

    return {
      benefits: parseLines(values.benefits).slice(0, 3),
      offerStructure: parseLines(values.offerStructure).slice(0, 3),
      headlines: parseLines(values.adHeadlines).slice(0, 3),
      descriptions: parseLines(values.adDescriptions).slice(0, 2),
      formFields: parseLines(values.formFields).slice(0, 4),
      nextStepFlow: parseLines(values.nextStepFlow).slice(0, 3),
      faq: values.faq
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 2),
      creativeGuidance: parseLines(values.creativeGuidance).slice(0, 3),
    };
  }, [values]);

  function update<K extends keyof AdminTemplateFormData>(
    key: K,
    value: AdminTemplateFormData[K],
  ) {
    setValues((current) => {
      const next = { ...current, [key]: value };
      if (key === "name" && !slugTouched) {
        next.slug = slugify(String(value));
      }
      return next;
    });
  }

  function appendMediaAssets(kind: MediaAssetKind, urls: string[]) {
    setValues((current) => {
      if (kind === "image") {
        const nextImages = [...current.mediaImageUrls, ...urls];
        return {
          ...current,
          mediaImageUrls: nextImages,
          previewImageUrl: current.previewImageUrl || nextImages[0] || "",
        };
      }

      return {
        ...current,
        mediaVideoUrls: [...current.mediaVideoUrls, ...urls],
      };
    });
  }

  function removeMediaAsset(kind: MediaAssetKind, url: string) {
    setValues((current) => {
      if (kind === "image") {
        const nextImages = current.mediaImageUrls.filter((item) => item !== url);
        const previewImageUrl =
          current.previewImageUrl === url ? nextImages[0] || "" : current.previewImageUrl;

        return {
          ...current,
          mediaImageUrls: nextImages,
          previewImageUrl,
        };
      }

      return {
        ...current,
        mediaVideoUrls: current.mediaVideoUrls.filter((item) => item !== url),
      };
    });
  }

  function updateLeadFormSettings<K extends keyof LeadFormSettings>(key: K, value: LeadFormSettings[K]) {
    setLeadFormSettings((current) => ({ ...current, [key]: value }));
  }

  function updateMultipleChoiceQuestion(index: number, updates: Partial<LeadFormSettings["multipleChoiceQuestions"][number]>) {
    setLeadFormSettings((current) => ({
      ...current,
      multipleChoiceQuestions: current.multipleChoiceQuestions.map((question, questionIndex) =>
        questionIndex === index ? { ...question, ...updates } : question,
      ),
    }));
  }

  function addMultipleChoiceQuestion() {
    setLeadFormSettings((current) => ({
      ...current,
      multipleChoiceQuestions: [...current.multipleChoiceQuestions, { label: "", options: ["", ""] }],
    }));
  }

  function removeMultipleChoiceQuestion(index: number) {
    setLeadFormSettings((current) => ({
      ...current,
      multipleChoiceQuestions: current.multipleChoiceQuestions.filter((_, questionIndex) => questionIndex !== index),
    }));
  }

  function addMultipleChoiceOption(questionIndex: number) {
    setLeadFormSettings((current) => ({
      ...current,
      multipleChoiceQuestions: current.multipleChoiceQuestions.map((question, index) =>
        index === questionIndex ? { ...question, options: [...question.options, ""] } : question,
      ),
    }));
  }

  function updateMultipleChoiceOption(questionIndex: number, optionIndex: number, value: string) {
    setLeadFormSettings((current) => ({
      ...current,
      multipleChoiceQuestions: current.multipleChoiceQuestions.map((question, index) =>
        index === questionIndex
          ? {
              ...question,
              options: question.options.map((option, currentOptionIndex) =>
                currentOptionIndex === optionIndex ? value : option,
              ),
            }
          : question,
      ),
    }));
  }

  function removeMultipleChoiceOption(questionIndex: number, optionIndex: number) {
    setLeadFormSettings((current) => ({
      ...current,
      multipleChoiceQuestions: current.multipleChoiceQuestions.map((question, index) =>
        index === questionIndex
          ? { ...question, options: question.options.filter((_, currentOptionIndex) => currentOptionIndex !== optionIndex) }
          : question,
      ),
    }));
  }

  function addShortQuestion() {
    setLeadFormSettings((current) => ({
      ...current,
      shortQuestions: [...current.shortQuestions, ""],
    }));
  }

  function updateShortQuestion(index: number, value: string) {
    setLeadFormSettings((current) => ({
      ...current,
      shortQuestions: current.shortQuestions.map((question, questionIndex) =>
        questionIndex === index ? value : question,
      ),
    }));
  }

  function removeShortQuestion(index: number) {
    setLeadFormSettings((current) => ({
      ...current,
      shortQuestions: current.shortQuestions.filter((_, questionIndex) => questionIndex !== index),
    }));
  }

  function toggleStandardQuestion(key: string) {
    setLeadFormSettings((current) => {
      const exists = current.standardQuestions.includes(key);
      return {
        ...current,
        standardQuestions: exists
          ? current.standardQuestions.filter((item) => item !== key)
          : [...current.standardQuestions, key],
      };
    });
  }

  async function uploadMediaFiles(kind: MediaAssetKind, files: FileList | null) {
    const selectedFiles = Array.from(files || []);
    if (selectedFiles.length === 0) {
      return;
    }

    setIsUploadingMedia(true);
    setMediaUploadError(null);

    try {
      const uploadedUrls: string[] = [];

      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/admin/template-media-upload", {
          method: "POST",
          body: formData,
        });
        const payload = (await response.json()) as { url?: string; error?: string };

        if (!response.ok || !payload.url) {
          throw new Error(payload.error || `Upload failed for ${file.name}.`);
        }

        uploadedUrls.push(payload.url);
      }

      appendMediaAssets(kind, uploadedUrls);
    } catch (error) {
      setMediaUploadError(
        error instanceof Error ? error.message : "Media upload failed.",
      );
    } finally {
      setIsUploadingMedia(false);
    }
  }

  function handleMediaInputChange(
    kind: MediaAssetKind,
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    void uploadMediaFiles(kind, event.currentTarget.files);
    event.currentTarget.value = "";
  }

  function goToStep(step: StepId) {
    const targetIndex = steps.findIndex((item) => item.id === step);
    if (targetIndex > currentStepIndex && !stepValidation.isValid) {
      return;
    }
    setCurrentStep(step);
  }

  function goNext() {
    if (currentStepIndex < steps.length - 1 && stepValidation.isValid) {
      setCurrentStep(steps[currentStepIndex + 1].id);
    }
  }

  function goBack() {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id);
    }
  }

  const reviewSummary = [
    { label: "Industry", value: values.industry || "Not set" },
    { label: "Category", value: values.category || "Not set" },
    { label: "Campaign type", value: getOptionLabel(campaignTypeOptions, values.campaignType) },
    { label: "Audience", value: getOptionLabel(audienceTypeOptions, values.audienceType) },
    { label: "Offer framework", value: getOptionLabel(offerFrameworkOptions, values.offerFramework) },
    { label: "Offer type", value: values.offerType || "Not set" },
    {
      label: "Ad types",
      value: values.supportedAdTypes.length
        ? values.supportedAdTypes
            .map((type) => supportedAdTypeOptions.find((option) => option.id === type)?.label || type)
            .join(", ")
        : "Not set",
    },
    {
      label: "Default flow",
      value:
        supportedAdTypeOptions.find((option) => option.id === values.defaultAdType)?.label ||
        values.defaultAdType ||
        "Not set",
    },
    { label: "Ad format", value: values.adFormat || "Not set" },
    { label: "Media type", value: values.mediaType || "Not set" },
    { label: "Objective", value: values.campaignObjective || "Not set" },
    { label: "Status", value: values.status },
    { label: "CTA", value: values.ctaDefault || "Not set" },
  ];
  const mediaAssetCount = values.mediaImageUrls.length + values.mediaVideoUrls.length;
  const reviewHeadline = values.headline || "Headline not set yet";
  const reviewPrimaryText = values.adPrimary || "Primary text not set yet";
  const reviewLeadFormMode = leadFormSettings.formType === "higher_intent" ? "Higher intent" : "More volume";
  const reviewReadinessChecks = [
    {
      label: "Core copy",
      ready: Boolean(values.headline && values.adPrimary),
      detail: values.headline ? "Headline and primary text are in place." : "Add headline and primary text.",
    },
    {
      label: "Creative assets",
      ready: mediaAssetCount > 0,
      detail: mediaAssetCount > 0 ? `${mediaAssetCount} asset${mediaAssetCount === 1 ? "" : "s"} attached.` : "Upload at least one image or video.",
    },
    {
      label: "Audience guidance",
      ready: Boolean(values.targeting.trim()),
      detail: values.targeting.trim()
        ? "Targeting notes are ready for launch."
        : "Add audience guidance before publishing.",
    },
    {
      label: "Tracking",
      ready: Boolean(values.utmParameters.trim()),
      detail: values.utmParameters.trim()
        ? "UTM parameters are configured."
        : "Add UTM parameters for reporting.",
    },
    {
      label: "Lead flow",
      ready: Boolean(leadFormSettings.greetingTitle || leadFormSettings.greetingBody || values.formCta),
      detail: "Lead form messaging is ready to review.",
    },
  ];
  const activeStep = steps[currentStepIndex];

  return (
    <form action={formAction} className="space-y-6">
      <div className="rounded-[30px] border border-[var(--line)] bg-[rgba(255,255,255,0.94)] p-6 shadow-[var(--shadow-soft)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--brand-ink)]">
              Create new template
            </p>
            <h2 className="mt-2 text-[2.15rem] font-semibold tracking-[-0.06em] text-[var(--ink)]">
              {mode === "create"
                ? "Build a new master template"
                : "Refine the template blueprint"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-strong)]">
              Get started by filling in the information below to create your new template and shape the launch defaults that carry into the customer flow.
            </p>
          </div>

          <Button
            type="submit"
            name="intent"
            value="draft"
            variant="outline"
          disabled={isPending}
          >
            {isPending ? "Saving..." : "Save Template"}
          </Button>
        </div>

        <div className="mt-6 rounded-[24px] border border-[var(--line)] bg-white px-4 py-4 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-3 overflow-x-auto">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const active = step.id === currentStep;
              const complete = index < currentStepIndex;

              return (
                <div key={step.id} className="flex min-w-[172px] flex-1 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => goToStep(step.id)}
                    disabled={index > currentStepIndex && !stepValidation.isValid}
                    className={cn(
                      "flex items-center gap-3 rounded-[20px] px-3 py-2 text-left transition-all",
                      active ? "bg-[var(--soft-brand)] shadow-[var(--shadow-soft)]" : "hover:bg-[var(--soft-panel)]",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold",
                        active || complete
                          ? "bg-[var(--brand)] text-white"
                          : "bg-[var(--soft-panel)] text-[var(--brand-ink)]",
                      )}
                    >
                      {complete ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </span>
                    <span>
                      <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                        Step {index + 1}
                      </span>
                      <span className={cn("block text-sm font-semibold", active ? "text-[var(--ink)]" : "text-[var(--muted-strong)]")}>
                        {step.label}
                      </span>
                    </span>
                  </button>
                  {index < steps.length - 1 ? (
                <div className="h-px min-w-12 flex-1 bg-[var(--line)]" />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.16fr)_0.84fr]">
        <div className="space-y-6">
        {mode === "edit" ? (
          <input type="hidden" name="templateId" value={values.templateId || ""} />
        ) : null}
        {mode === "edit" ? (
          <input
            type="hidden"
            name="currentVersion"
            value={values.currentVersion || 1}
          />
        ) : null}
        <input type="hidden" name="previewImageUrl" value={values.previewImageUrl} />
        <input
          type="hidden"
          name="leadFormSettingsJson"
          value={JSON.stringify(leadFormSettings)}
        />
        {values.mediaImageUrls.map((url) => (
          <input key={url} type="hidden" name="mediaImageUrls" value={url} />
        ))}
        {values.mediaVideoUrls.map((url) => (
          <input key={url} type="hidden" name="mediaVideoUrls" value={url} />
        ))}
        {state.formError ? (
          <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {state.formError}
          </div>
        ) : null}

        <div className={currentStep === "basics" ? "grid gap-6" : "hidden"}>
          <FormSection
            title="Template Configuration"
            description="Template type, name, and basic settings"
          >
            <div className="flex items-center justify-between rounded-[22px] border border-[var(--line)] bg-[var(--soft-panel)] px-4 py-4">
              <div>
                <p className="text-sm font-semibold text-[var(--ink)]">Enabled</p>
                <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">
                  Toggle whether this template is active in the live library.
                </p>
              </div>
              <label className="inline-flex items-center gap-3 rounded-full border border-[var(--line)] bg-white px-3 py-2 text-sm font-medium text-[var(--muted-strong)] shadow-[var(--shadow-soft)]">
                <input
                  type="checkbox"
                  checked={values.status === "published"}
                  onChange={(event) =>
                    update("status", event.target.checked ? "published" : "draft")
                  }
                  className="h-4 w-4 rounded border-[var(--line)] text-[var(--brand)] focus:ring-2 focus:ring-[var(--soft-brand)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]"
                />
                {values.status === "published" ? "Enabled" : "Disabled"}
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel required invalid={Boolean(stepValidation.fieldErrors.name)}>Template name</FieldLabel>
                <Input
                  name="name"
                  value={values.name}
                  onChange={(event) => update("name", event.target.value)}
                  placeholder="Enter a descriptive template name"
                  aria-invalid={Boolean(stepValidation.fieldErrors.name)}
                />
                <FieldError message={stepValidation.fieldErrors.name || state.fieldErrors.name} />
              </div>

              <div>
                <FieldLabel required invalid={Boolean(stepValidation.fieldErrors.category)}>Category</FieldLabel>
                <Select
                  name="category"
                  value={values.category}
                  onChange={(event) => {
                    const next = event.target.value;
                    update("category", next);
                    update("industry", next);
                  }}
                  aria-invalid={Boolean(stepValidation.fieldErrors.category)}
                >
                  <option value="">Select a category</option>
                  {supportedIndustries.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </Select>
                <FieldError message={stepValidation.fieldErrors.category || state.fieldErrors.industry} />
              </div>

              <div className="sm:col-span-2">
                <FieldLabel required invalid={Boolean(stepValidation.fieldErrors.description)}>Short description</FieldLabel>
                <Textarea
                  name="description"
                  value={values.description}
                  onChange={(event) => update("description", event.target.value)}
                  placeholder="Short summary of the campaign template and who it is built for."
                  className="min-h-[110px]"
                  aria-invalid={Boolean(stepValidation.fieldErrors.description)}
                />
                <FieldError message={stepValidation.fieldErrors.description || state.fieldErrors.description} />
              </div>
            </div>

            <div className="grid gap-4">
              <div>
                <FieldLabel>Campaign Type</FieldLabel>
                <div className="grid gap-3 md:grid-cols-3">
                  {campaignTypeOptions.map((option) => {
                    const active = values.campaignType === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => update("campaignType", option.id)}
                        className={cn(
                          "rounded-[18px] border px-4 py-3 text-center transition-all",
                          active
                            ? "border-[var(--brand)] bg-white shadow-[var(--shadow-soft)]"
                            : "border-[var(--line)] bg-white/70 hover:bg-white",
                        )}
                      >
                        <div className="text-sm font-semibold text-[var(--ink)]">{option.label}</div>
                        <div className="mt-1 text-xs leading-5 text-[var(--muted-strong)]">{option.hint}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <FieldLabel>Who are you advertising to?</FieldLabel>
                <div className="grid gap-3 md:grid-cols-2">
                  {audienceTypeOptions.map((option) => {
                    const active = values.audienceType === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => update("audienceType", option.id)}
                        className={cn(
                          "rounded-[18px] border px-4 py-3 text-left transition-all",
                          active
                            ? "border-[var(--brand)] bg-white shadow-[var(--shadow-soft)]"
                            : "border-[var(--line)] bg-white/70 hover:bg-white",
                        )}
                      >
                        <div className="text-sm font-semibold text-[var(--ink)]">
                          {option.label} <span className="font-normal text-[var(--muted-strong)]">- {option.hint}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <FieldLabel>What type of offer are you promoting?</FieldLabel>
                <div className="grid gap-3 md:grid-cols-2">
                  {offerFrameworkOptions.map((option) => {
                    const active = values.offerFramework === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => update("offerFramework", option.id)}
                        className={cn(
                          "rounded-[18px] border px-4 py-3 text-left transition-all",
                          active
                            ? "border-[var(--brand)] bg-white shadow-[var(--shadow-soft)]"
                            : "border-[var(--line)] bg-white/70 hover:bg-white",
                        )}
                      >
                        <div className="text-sm font-semibold text-[var(--ink)]">
                          {option.label} <span className="font-normal text-[var(--muted-strong)]">- {option.hint}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <input
                type="hidden"
                name="slug"
                value={values.slug}
                readOnly
              />
              <input type="hidden" name="campaignType" value={values.campaignType} />
              <input type="hidden" name="audienceType" value={values.audienceType} />
              <input type="hidden" name="offerFramework" value={values.offerFramework} />
              <input type="hidden" name="displayLink" value={values.displayLink} />
              <input type="hidden" name="adFormat" value={values.adFormat} />
              <input type="hidden" name="mediaType" value={values.mediaType} />
              <input type="hidden" name="offerType" value={values.offerType} />
              <input type="hidden" name="adSetStructure" value={values.adSetStructure} />
              <input type="hidden" name="advantagePlusSettings" value={values.advantagePlusSettings} />
              <input type="hidden" name="placements" value={values.placements} />
              <input type="hidden" name="dynamicCreative" value={values.dynamicCreative} />
              <input type="hidden" name="specialAdCategory" value={values.specialAdCategory} />
              {values.supportedAdTypes.map((type) => (
                <input key={type} type="hidden" name="supportedAdTypes" value={type} />
              ))}
              <input type="hidden" name="defaultAdType" value={values.defaultAdType} />
            </div>

            <label className="mt-5 inline-flex items-center gap-3 rounded-[22px] border border-[var(--line)] bg-white/86 px-4 py-4 text-sm font-medium text-[var(--muted-strong)] shadow-[var(--shadow-soft)]">
              <input
                type="checkbox"
                name="isFeatured"
                checked={values.isFeatured}
                onChange={(event) => update("isFeatured", event.target.checked)}
                className="h-4 w-4 rounded border-[var(--line)] text-[var(--brand)] focus:ring-2 focus:ring-[var(--soft-brand)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]"
              />
              Feature this template in the live library
            </label>

            <details className="mt-6 rounded-[24px] border border-[var(--line)] bg-[rgba(255,255,255,0.88)] shadow-[var(--shadow-soft)]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--ink)]">Campaign Settings</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">
                    Configure how Facebook will optimize and deliver your ads for maximum performance.
                  </p>
                </div>
                <span className="text-[var(--muted)]">⌄</span>
              </summary>
              <div className="border-t border-[var(--line)] px-5 py-5">
                <div className="grid gap-4">
                  <details className="rounded-[20px] border border-[var(--line)] bg-white px-4 py-4 shadow-[var(--shadow-soft)]">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--ink)]">Ad Set Structure</p>
                        <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">
                          Choose how to organize your ads and ad sets for optimal performance
                        </p>
                      </div>
                      <span className="text-[var(--muted)]">⌄</span>
                    </summary>
                    <div className="mt-4 rounded-[20px] border border-[color-mix(in_oklab,var(--brand)_18%,white)] bg-[color-mix(in_oklab,var(--soft-brand)_40%,white)] p-4">
                      <p className="text-sm font-semibold text-[var(--brand-ink)]">How this affects your campaigns</p>
                      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[var(--brand-ink)]">
                        <li><strong>One ad set:</strong> We will create 1 ad set with 1 ad per selected creative. Each image or video uploaded will be used to create a single ad. This option is easier to manage and is recommended if you are testing media creative or allowing your clients to launch ads themselves.</li>
                        <li><strong>Multiple ad sets:</strong> We will create 1 ad set per selected creative. Each ad set has its own targeting and a single ad. Recommended if you are testing different audiences or want to compare performance across audience segments.</li>
                      </ul>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {adSetStructureOptions.map((option) => {
                        const active = values.adSetStructure === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => update("adSetStructure", option.id)}
                            className={cn(
                              "rounded-[18px] border p-4 text-left transition-all",
                              active
                                ? "border-[var(--brand)] bg-[color-mix(in_oklab,var(--soft-brand)_26%,white)] shadow-[var(--shadow-soft)]"
                                : "border-[var(--line)] bg-white hover:bg-white/80",
                            )}
                          >
                            <p className="text-sm font-semibold text-[var(--ink)]">{option.title}</p>
                            <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">{option.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </details>

                  <details className="rounded-[20px] border border-[var(--line)] bg-white px-4 py-4 shadow-[var(--shadow-soft)]">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--ink)]">Advantage+ Settings</p>
                        <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">
                          Let Facebook’s AI optimize your audience targeting, enhance your media, and adjust how your ads appear to users on different platforms
                        </p>
                      </div>
                      <span className="text-[var(--muted)]">⌄</span>
                    </summary>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {advantagePlusOptions.map((option) => {
                        const active = values.advantagePlusSettings === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => update("advantagePlusSettings", option.id)}
                            className={cn(
                              "rounded-[18px] border p-4 text-left transition-all",
                              active
                                ? "border-[var(--brand)] bg-[color-mix(in_oklab,var(--soft-brand)_26%,white)] shadow-[var(--shadow-soft)]"
                                : "border-[var(--line)] bg-white hover:bg-white/80",
                            )}
                          >
                            <p className="text-sm font-semibold text-[var(--ink)]">{option.title}</p>
                            <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">{option.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </details>

                  <details className="rounded-[20px] border border-[var(--line)] bg-white px-4 py-4 shadow-[var(--shadow-soft)]">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--ink)]">Ad Placements</p>
                        <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">
                          Control where your ads appear across Facebook, Instagram, Messenger, and Audience Network
                        </p>
                      </div>
                      <span className="text-[var(--muted)]">⌄</span>
                    </summary>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {placementsOptions.map((option) => {
                        const active = values.placements === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => update("placements", option.id)}
                            className={cn(
                              "rounded-[18px] border p-4 text-left transition-all",
                              active
                                ? "border-[var(--brand)] bg-[color-mix(in_oklab,var(--soft-brand)_26%,white)] shadow-[var(--shadow-soft)]"
                                : "border-[var(--line)] bg-white hover:bg-white/80",
                            )}
                          >
                            <p className="text-sm font-semibold text-[var(--ink)]">{option.title}</p>
                            <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">{option.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </details>

                  <details className="rounded-[20px] border border-[var(--line)] bg-white px-4 py-4 shadow-[var(--shadow-soft)]">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--ink)]">Dynamic Creative</p>
                        <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">
                          Facebook tests different combinations of your creative elements to find what works best
                        </p>
                      </div>
                      <span className="text-[var(--muted)]">⌄</span>
                    </summary>
                    <div className="mt-4 rounded-[20px] border border-[color-mix(in_oklab,var(--brand)_18%,white)] bg-[color-mix(in_oklab,var(--soft-brand)_40%,white)] p-4">
                      <p className="text-sm font-semibold text-[var(--brand-ink)]">How it works</p>
                      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[var(--brand-ink)]">
                        <li>Test up to 10 different images or videos you upload</li>
                        <li>Mix and match headlines, descriptions, and media automatically</li>
                        <li>Learn which combinations perform best for your audience</li>
                        <li>Optimize delivery to show the winning combinations more often</li>
                      </ul>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {dynamicCreativeOptions.map((option) => {
                        const active = values.dynamicCreative === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => update("dynamicCreative", option.id)}
                            className={cn(
                              "rounded-[18px] border p-4 text-left transition-all",
                              active
                                ? "border-[var(--brand)] bg-[color-mix(in_oklab,var(--soft-brand)_26%,white)] shadow-[var(--shadow-soft)]"
                                : "border-[var(--line)] bg-white hover:bg-white/80",
                            )}
                          >
                            <p className="text-sm font-semibold text-[var(--ink)]">{option.title}</p>
                            <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">{option.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </details>

                  <details className="rounded-[20px] border border-[var(--line)] bg-white px-4 py-4 shadow-[var(--shadow-soft)]">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--ink)]">Conversion Event</p>
                        <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">
                          Select the website event to optimize your campaigns for
                        </p>
                      </div>
                      <span className="text-[var(--muted)]">⌄</span>
                    </summary>
                    <div className="mt-4">
                      <FieldLabel>Website Conversion Event</FieldLabel>
                      <Select
                        name="conversionEvent"
                        value={values.conversionEvent}
                        onChange={(event) => update("conversionEvent", event.target.value)}
                      >
                        {conversionEventOptions.map((eventName) => (
                          <option key={eventName} value={eventName}>
                            {eventName}
                          </option>
                        ))}
                      </Select>
                      <p className="mt-3 text-sm leading-6 text-[var(--muted-strong)]">
                        Tell Facebook what event you want it to optimize for (e.g., purchases, leads, sign-ups). This helps Facebook understand what success looks like for your ads. This is part of your pixel setup when using a landing page, don't worry we will show the needed codes and how to install them when you launch your campaign.
                      </p>
                    </div>
                  </details>
                </div>
              </div>
            </details>

            <details className="mt-5 rounded-[24px] border border-[var(--line)] bg-[rgba(255,255,255,0.88)] shadow-[var(--shadow-soft)]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--ink)]">Additional Settings</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">
                    Configure special categories, KPIs, and tracking parameters.
                  </p>
                </div>
                <span className="text-[var(--muted)]">⌄</span>
              </summary>
              <div className="border-t border-[var(--line)] px-5 py-5">
                <div className="grid gap-4">
                  <details className="rounded-[20px] border border-[var(--line)] bg-white px-4 py-4 shadow-[var(--shadow-soft)]">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--ink)]">Special Ad Categories</p>
                        <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">
                          Required for ads about credit, employment, housing, or social/political topics
                        </p>
                      </div>
                      <span className="text-[var(--muted)]">⌄</span>
                    </summary>
                    <div className="mt-4 grid gap-3">
                      {specialAdCategoryOptions.map((option) => {
                        const active = values.specialAdCategory === option.id;
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => update("specialAdCategory", option.id)}
                            className={cn(
                              "flex w-full items-start gap-3 rounded-[18px] border px-4 py-3 text-left transition-all",
                              active
                                ? "border-[var(--brand)] bg-[color-mix(in_oklab,var(--soft-brand)_28%,white)] shadow-[var(--shadow-soft)]"
                                : "border-[var(--line)] bg-white hover:bg-white/80",
                            )}
                          >
                            <span
                              className={cn(
                                "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] border",
                                active
                                  ? "border-[var(--brand)] bg-white text-[var(--brand-ink)]"
                                  : "border-[var(--line)] bg-[var(--soft-panel)] text-[var(--muted-strong)]",
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center justify-between gap-3">
                                <span className="text-sm font-semibold text-[var(--ink)]">{option.label}</span>
                                {active ? (
                                  <span className="text-sm font-semibold text-[var(--brand)]">✓</span>
                                ) : null}
                              </span>
                              <span className="mt-1 block text-sm leading-6 text-[var(--muted-strong)]">
                                {option.description}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </details>

                  <details className="rounded-[20px] border border-[var(--line)] bg-white px-4 py-4 shadow-[var(--shadow-soft)]">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--ink)]">KPI Thresholds</p>
                        <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">
                          Set performance thresholds to automatically flag underperforming campaigns for review
                        </p>
                      </div>
                      <span className="text-[var(--muted)]">⌄</span>
                    </summary>
                    <div className="mt-4 rounded-[20px] border border-[color-mix(in_oklab,var(--brand)_18%,white)] bg-[color-mix(in_oklab,var(--soft-brand)_24%,white)] p-4">
                      <p className="text-sm font-semibold text-[var(--brand-ink)]">How thresholds work</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--brand-ink)]">
                        When campaigns fall below these performance metrics, they will be:
                      </p>
                      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[var(--brand-ink)]">
                        <li>Automatically flagged in your dashboard for review</li>
                        <li>Highlighted with warning indicators</li>
                        <li>Prioritized for optimization or pausing</li>
                      </ul>
                      <p className="mt-3 text-xs leading-6 text-[var(--brand-ink)]">
                        Leave fields blank to skip monitoring that metric
                      </p>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-[18px] border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-soft)]">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-[var(--ink)]">CTR All (Click-Through Rate)</p>
                            <p className="mt-1 text-xs leading-5 text-[var(--muted-strong)]">
                              Percentage of people who click after seeing your ad
                            </p>
                          </div>
                          <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-500">
                            Flag if below
                          </span>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <Input
                            name="kpiCtrAll"
                            value={values.kpiCtrAll}
                            onChange={(event) => update("kpiCtrAll", event.target.value)}
                            placeholder="e.g., 1.50"
                          />
                          <span className="text-sm font-semibold text-[var(--muted-strong)]">%</span>
                        </div>
                      </div>

                      <div className="rounded-[18px] border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-soft)]">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-[var(--ink)]">CTR Link (Link Click-Through Rate)</p>
                            <p className="mt-1 text-xs leading-5 text-[var(--muted-strong)]">
                              Percentage who click your call-to-action link
                            </p>
                          </div>
                          <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-500">
                            Flag if below
                          </span>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <Input
                            name="kpiCtrLink"
                            value={values.kpiCtrLink}
                            onChange={(event) => update("kpiCtrLink", event.target.value)}
                            placeholder="e.g., 0.75"
                          />
                          <span className="text-sm font-semibold text-[var(--muted-strong)]">%</span>
                        </div>
                      </div>

                      <div className="rounded-[18px] border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-soft)]">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-[var(--ink)]">CR (Conversion Rate)</p>
                            <p className="mt-1 text-xs leading-5 text-[var(--muted-strong)]">
                              Percentage of clicks that result in conversions
                            </p>
                          </div>
                          <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-500">
                            Flag if below
                          </span>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <Input
                            name="kpiCr"
                            value={values.kpiCr}
                            onChange={(event) => update("kpiCr", event.target.value)}
                            placeholder="e.g., 2.00"
                          />
                          <span className="text-sm font-semibold text-[var(--muted-strong)]">%</span>
                        </div>
                      </div>

                      <div className="rounded-[18px] border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-soft)]">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-[var(--ink)]">CPA (Cost Per Acquisition)</p>
                            <p className="mt-1 text-xs leading-5 text-[var(--muted-strong)]">
                              Maximum acceptable cost per conversion
                            </p>
                          </div>
                          <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-500">
                            Flag if above
                          </span>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-sm font-semibold text-[var(--muted-strong)]">$</span>
                          <Input
                            name="kpiCpa"
                            value={values.kpiCpa}
                            onChange={(event) => update("kpiCpa", event.target.value)}
                            placeholder="e.g., 50.00"
                          />
                        </div>
                      </div>
                    </div>
                  </details>

                  <div className="rounded-[20px] border border-[var(--line)] bg-white px-4 py-4 shadow-[var(--shadow-soft)]">
                    <FieldLabel>UTM Parameters</FieldLabel>
                    <Input
                      name="utmParameters"
                      value={values.utmParameters}
                      onChange={(event) => update("utmParameters", event.target.value)}
                      placeholder="utm_source=Facebook&utm_campaign={{campaign.name}}&utm_medium={{adset.name}}"
                    />
                    <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">
                      Custom UTM parameters for your landing page URLs. Use key=value format separated by &. You can include dynamic variables like {"{{campaign.name}}"}, {"{{adset.id}}"}, {"{{ad.name}}"}.
                      Mandatory keys: utm_source, utm_campaign, utm_medium.
                    </p>
                  </div>
                </div>
              </div>
            </details>
          </FormSection>
        </div>

        <div className={currentStep === "offer" ? "grid gap-6" : "hidden"}>
          <FormSection
            title="Step 2: Ad Text"
            description="Write the ad copy admins will inherit, then set the display link and CTA in the ad details dropdown."
          >
            <div className="grid gap-5">
              <Card className="border-[var(--line)] bg-[rgba(255,255,255,0.92)] p-5 shadow-[var(--shadow-soft)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink)]">Ad Copy</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">
                      Write compelling copy that captures attention and drives action.
                    </p>
                  </div>
                  <span className="rounded-full bg-[color-mix(in_oklab,var(--soft-brand)_24%,white)] px-3 py-1 text-xs font-semibold text-[var(--brand-ink)]">
                    Dynamic Creative is off
                  </span>
                </div>

                <div className="mt-4 grid gap-4">
                  <div>
                    <FieldLabel required invalid={Boolean(stepValidation.fieldErrors.headline)}>Headline</FieldLabel>
                    <Input
                      name="headline"
                      value={values.headline}
                      onChange={(event) => update("headline", event.target.value)}
                      placeholder="Enter an attention-grabbing headline"
                      aria-invalid={Boolean(stepValidation.fieldErrors.headline)}
                    />
                    <FieldError message={stepValidation.fieldErrors.headline} />
                    <p className="mt-2 text-sm text-[var(--muted-strong)]">Recommended: 30 characters for best display</p>
                  </div>

                  <div>
                    <FieldLabel>Link Description</FieldLabel>
                    <Input
                      name="promoDetails"
                      value={values.promoDetails}
                      onChange={(event) => update("promoDetails", event.target.value)}
                      placeholder="Brief description that appears with your link"
                    />
                    <p className="mt-2 text-sm text-[var(--muted-strong)]">This appears below your headline</p>
                  </div>

                  <div>
                    <FieldLabel required invalid={Boolean(stepValidation.fieldErrors.adPrimary)}>Primary Text</FieldLabel>
                    <Textarea
                      name="adPrimary"
                      value={values.adPrimary}
                      onChange={(event) => update("adPrimary", event.target.value)}
                      placeholder="Write your main ad copy here. Be clear, compelling, and action-oriented."
                      className="min-h-[140px]"
                      aria-invalid={Boolean(stepValidation.fieldErrors.adPrimary)}
                    />
                    <FieldError message={stepValidation.fieldErrors.adPrimary} />
                    <p className="mt-2 text-sm text-[var(--muted-strong)]">This is the main body of your ad. Keep it engaging and focused on your value proposition.</p>
                  </div>
                </div>
              </Card>

              <details className="rounded-[24px] border border-[var(--line)] bg-[rgba(255,255,255,0.92)] shadow-[var(--shadow-soft)]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink)]">Ad Details</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">
                      Additional settings for your ad display
                    </p>
                  </div>
                  <span className="text-[var(--muted)]">⌄</span>
                </summary>
                <div className="border-t border-[var(--line)] px-5 py-5">
                  <div className="grid gap-4">
                    <div>
                      <FieldLabel>Display Link</FieldLabel>
                      <Input
                        name="displayLink"
                        value={values.displayLink}
                        onChange={(event) => update("displayLink", event.target.value)}
                        placeholder="yourdomain.com"
                      />
                      <p className="mt-2 text-sm text-[var(--muted-strong)]">The display URL shown in your ad (optional)</p>
                    </div>

                    <div>
                      <FieldLabel required invalid={Boolean(stepValidation.fieldErrors.ctaDefault)}>Call to Action Button</FieldLabel>
                      <Select
                        name="ctaDefault"
                        value={values.ctaDefault}
                        onChange={(event) => update("ctaDefault", event.target.value)}
                        aria-invalid={Boolean(stepValidation.fieldErrors.ctaDefault)}
                      >
                        {ctaButtonOptions.map((cta) => (
                          <option key={cta} value={cta}>
                            {cta}
                          </option>
                        ))}
                      </Select>
                      <FieldError message={stepValidation.fieldErrors.ctaDefault} />
                      <p className="mt-2 text-sm text-[var(--muted-strong)]">Choose the action you want users to take</p>
                    </div>
                  </div>
                </div>
              </details>
            </div>
          </FormSection>
        </div>

        <div className={currentStep === "facebook" ? "grid gap-6" : "hidden"}>
          <FormSection
            title="Step 3: Ad Media"
            description="Choose the ad format and media type that shape how the creative will appear."
          >
            <input type="hidden" name="campaignObjective" value={values.campaignObjective} readOnly />

            <div className="grid gap-5">
              <Card className="border-[var(--line)] bg-[rgba(255,255,255,0.92)] p-5 shadow-[var(--shadow-soft)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink)]">Ad Format</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">
                      Choose how your ads will be displayed to your audience
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {adFormatOptions.map((option) => {
                    const active = values.adFormat === option.id;
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => update("adFormat", option.id)}
                        className={cn(
                          "flex flex-col items-center justify-center rounded-[18px] border px-5 py-7 text-center transition-all",
                          active
                            ? "border-[var(--brand)] bg-[color-mix(in_oklab,var(--soft-brand)_24%,white)] shadow-[var(--shadow-soft)]"
                            : "border-[var(--line)] bg-white hover:bg-white/80",
                        )}
                      >
                        <span className={cn(
                          "mb-2 flex h-10 w-10 items-center justify-center rounded-full border",
                          active ? "border-[var(--brand)] bg-white text-[var(--brand)]" : "border-[var(--line)] bg-[var(--soft-panel)] text-[var(--muted-strong)]",
                        )}>
                          <Icon className="h-5 w-5" />
                        </span>
                        <p className="text-sm font-semibold text-[var(--ink)]">{option.title}</p>
                        <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">{option.description}</p>
                      </button>
                    );
                  })}
                </div>
              </Card>

              <Card className="border-[var(--line)] bg-[rgba(255,255,255,0.92)] p-5 shadow-[var(--shadow-soft)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink)]">Media Type</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">
                      Choose the type of media for your ads
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {mediaTypeOptions.map((option) => {
                    const active = values.mediaType === option.id;
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => update("mediaType", option.id)}
                        className={cn(
                          "flex flex-col items-center justify-center rounded-[18px] border px-5 py-7 text-center transition-all",
                          active
                            ? "border-[var(--brand)] bg-[color-mix(in_oklab,var(--soft-brand)_24%,white)] shadow-[var(--shadow-soft)]"
                            : "border-[var(--line)] bg-white hover:bg-white/80",
                        )}
                      >
                        <span className={cn(
                          "mb-2 flex h-10 w-10 items-center justify-center rounded-full border",
                          active ? "border-[var(--brand)] bg-white text-[var(--brand)]" : "border-[var(--line)] bg-[var(--soft-panel)] text-[var(--muted-strong)]",
                        )}>
                          <Icon className="h-5 w-5" />
                        </span>
                        <p className="text-sm font-semibold text-[var(--ink)]">{option.title}</p>
                        <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">{option.description}</p>
                      </button>
                    );
                  })}
                </div>
              </Card>

              <Card className="border-[var(--line)] bg-[rgba(255,255,255,0.92)] p-5 shadow-[var(--shadow-soft)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink)]">Media Gallery</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">
                      Upload template images and videos that will be saved with this blueprint.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[24px] border border-dashed border-[var(--line)] bg-[linear-gradient(180deg,rgba(248,250,252,0.6),rgba(255,255,255,0.98))] px-5 py-8 text-center transition hover:border-[var(--brand)] hover:bg-white">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--soft-panel)] text-[var(--brand)]">
                      <MediaImage className="h-7 w-7" />
                    </span>
                    <span className="text-sm font-semibold text-[var(--ink)]">Upload images</span>
                    <span className="text-sm leading-6 text-[var(--muted-strong)]">
                      Add JPG, PNG, WEBP, or GIF files. The first image becomes the template preview image.
                    </span>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(event) => handleMediaInputChange("image", event)}
                      disabled={isUploadingMedia}
                    />
                  </label>

                  <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[24px] border border-dashed border-[var(--line)] bg-[linear-gradient(180deg,rgba(248,250,252,0.6),rgba(255,255,255,0.98))] px-5 py-8 text-center transition hover:border-[var(--brand)] hover:bg-white">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--soft-panel)] text-[var(--brand)]">
                      <MediaVideo className="h-7 w-7" />
                    </span>
                    <span className="text-sm font-semibold text-[var(--ink)]">Upload videos</span>
                    <span className="text-sm leading-6 text-[var(--muted-strong)]">
                      Add MP4, WebM, MOV, or AVI files for future launch workflows.
                    </span>
                    <Input
                      type="file"
                      accept="video/*"
                      multiple
                      className="hidden"
                      onChange={(event) => handleMediaInputChange("video", event)}
                      disabled={isUploadingMedia}
                    />
                  </label>
                </div>

                {mediaUploadError ? (
                  <div className="mt-4 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {mediaUploadError}
                  </div>
                ) : null}

                <div className="mt-5 rounded-[24px] border border-[var(--line)] bg-[var(--soft-panel)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--ink)]">
                        Uploaded assets
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">
                        {isUploadingMedia
                          ? "Uploading selected files..."
                          : `${values.mediaImageUrls.length} image(s) and ${values.mediaVideoUrls.length} video(s) saved to this template.`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <PreviewChip>{values.mediaImageUrls.length} images</PreviewChip>
                      <PreviewChip>{values.mediaVideoUrls.length} videos</PreviewChip>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {values.mediaImageUrls.map((url, index) => (
                      <div key={url} className="overflow-hidden rounded-[20px] border border-[var(--line)] bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Uploaded image ${index + 1}`} className="h-40 w-full object-cover" />
                        <div className="flex items-center justify-between gap-3 px-3 py-3 text-xs text-[var(--muted-strong)]">
                          <span>Image {index + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeMediaAsset("image", url)}
                            className="font-semibold text-[var(--brand-ink)] hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}

                    {values.mediaVideoUrls.map((url, index) => (
                      <div key={url} className="overflow-hidden rounded-[20px] border border-[var(--line)] bg-white">
                        <video
                          className="h-40 w-full object-cover"
                          controls
                          preload="metadata"
                        >
                          <source src={url} />
                          Your browser does not support the video tag.
                        </video>
                        <div className="flex items-center justify-between gap-3 px-3 py-3 text-xs text-[var(--muted-strong)]">
                          <span>Video {index + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeMediaAsset("video", url)}
                            className="font-semibold text-[var(--brand-ink)] hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}

                    {!values.mediaImageUrls.length && !values.mediaVideoUrls.length ? (
                      <div className="col-span-full flex min-h-[180px] items-center justify-center rounded-[20px] border border-dashed border-[var(--line)] bg-white text-sm text-[var(--muted)]">
                        No media uploaded yet. Pick an image or video to begin.
                      </div>
                    ) : null}
                  </div>
                </div>
              </Card>
            </div>
          </FormSection>
        </div>

        <div className={currentStep === "lead-flow" ? "grid gap-6" : "hidden"}>
          <FormSection
            title="Step 4: Capture Lead Info"
            description="Set the lead form defaults, thank-you state, and any Messenger fallback."
          >
            <details className="group rounded-[24px] border border-[var(--line)] bg-[rgba(255,255,255,0.92)] p-5 shadow-[var(--shadow-soft)]">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2f7ef7_0%,#7c4dff_100%)] text-white shadow-[0_12px_24px_rgba(109,94,248,0.18)]">
                    <LayoutGrid className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink)]">Lead Form</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">
                      A Facebook lead form opens inside the app so people can share details without leaving Facebook. A Facebook Pixel is not needed for a lead form campaign.
                    </p>
                  </div>
                </div>
                <ChevronDown className="mt-1 h-5 w-5 text-[var(--muted)] transition-transform duration-200 group-open:rotate-180" />
              </summary>

              <div className="mt-5 space-y-4">
                <LeadFormDisclosureCard
                  title="Form Settings"
                  description="Configure form complexity and language preferences."
                >
                  <div className="space-y-6">
                    <LeadFormDisclosureCard
                      title="Form Complexity"
                      description="Choose how much friction you want before a lead submits."
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="group relative cursor-pointer">
                          <input
                            className="peer sr-only"
                            type="radio"
                            value="higher_intent"
                            name="leadFormFormType"
                            checked={leadFormSettings.formType === "higher_intent"}
                            onChange={() => updateLeadFormSettings("formType", "higher_intent")}
                          />
                          <div className="rounded-[18px] border-2 border-[var(--line)] bg-white p-4 transition-all peer-checked:border-[var(--brand)] peer-checked:bg-[color-mix(in_oklab,var(--soft-brand)_18%,white)]">
                            <div className="flex items-start gap-3">
                              <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#8b5cf6_0%,#4f46e5_100%)] text-white">
                                <CheckCircle2 className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-[var(--ink)]">Higher Intent</span>
                                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                    Recommended
                                  </span>
                                </div>
                                <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">
                                  It takes a little more effort with extra friction so leads are more serious.
                                </p>
                              </div>
                            </div>
                          </div>
                        </label>

                        <label className="group relative cursor-pointer">
                          <input
                            className="peer sr-only"
                            type="radio"
                            value="more_volume"
                            name="leadFormFormType"
                            checked={leadFormSettings.formType === "more_volume"}
                            onChange={() => updateLeadFormSettings("formType", "more_volume")}
                          />
                          <div className="rounded-[18px] border-2 border-[var(--line)] bg-white p-4 transition-all peer-checked:border-[var(--brand)] peer-checked:bg-[color-mix(in_oklab,var(--soft-brand)_18%,white)]">
                            <div className="flex items-start gap-3">
                              <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#60a5fa_0%,#2563eb_100%)] text-white">
                                <Sparkles className="h-5 w-5" />
                              </div>
                              <div>
                                <span className="text-sm font-semibold text-[var(--ink)]">More Volume</span>
                                <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">
                                  Faster and easier for leads, with less friction on submit.
                                </p>
                              </div>
                            </div>
                          </div>
                        </label>
                      </div>
                    </LeadFormDisclosureCard>

                    <LeadFormDisclosureCard
                      title="Form Language"
                      description="Set the language the lead form should use."
                    >
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <FieldLabel>Language</FieldLabel>
                          <div className="relative">
                            <Languages className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                            <Select
                              name="leadFormLocale"
                              value={leadFormSettings.locale}
                              onChange={(event) => updateLeadFormSettings("locale", event.target.value)}
                              className="pl-9"
                            >
                              <option value="EN_US">English (US)</option>
                              <option value="EN_GB">English (UK)</option>
                              <option value="ES_ES">Español (España)</option>
                              <option value="ES_LA">Español (LatAm)</option>
                            </Select>
                          </div>
                        </div>

                        <div className="rounded-[18px] border border-[var(--line)] bg-[var(--soft-panel)] p-4 text-sm leading-6 text-[var(--muted-strong)]">
                          Use the same lead form configuration across all ad sets in this campaign.
                        </div>
                      </div>
                    </LeadFormDisclosureCard>

                    <LeadFormDisclosureCard
                      title="Lead Form Options"
                      description="Toggles that affect the lead form submission flow."
                    >
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="inline-flex items-center justify-between gap-3 rounded-[18px] border border-[var(--line)] bg-[var(--soft-panel)] px-4 py-3 text-sm text-[var(--muted-strong)]">
                          <span className="font-medium text-[var(--ink)]">Use Same Lead Form</span>
                          <input
                            type="checkbox"
                            name="sameLeadForm"
                            checked={leadFormSettings.sameLeadForm}
                            onChange={(event) => updateLeadFormSettings("sameLeadForm", event.target.checked)}
                            className="h-4 w-4 rounded border-[var(--line)] text-[var(--brand)]"
                          />
                        </label>

                        <label className="inline-flex items-center justify-between gap-3 rounded-[18px] border border-[var(--line)] bg-[var(--soft-panel)] px-4 py-3 text-sm text-[var(--muted-strong)]">
                          <span className="font-medium text-[var(--ink)]">Enable Phone OTP Verification</span>
                          <input
                            type="checkbox"
                            name="enablePhoneOtp"
                            checked={leadFormSettings.enablePhoneOtp}
                            onChange={(event) => updateLeadFormSettings("enablePhoneOtp", event.target.checked)}
                            className="h-4 w-4 rounded border-[var(--line)] text-[var(--brand)]"
                          />
                        </label>
                      </div>

                      <div className="mt-4">
                        <FieldLabel>Form CTA</FieldLabel>
                        <Input
                          name="formCta"
                          value={values.formCta}
                          onChange={(event) => update("formCta", event.target.value)}
                          placeholder="Request details"
                        />
                      </div>
                    </LeadFormDisclosureCard>
                  </div>
                </LeadFormDisclosureCard>

              <LeadFormSectionCard
                icon={MediaImage}
                title="Background Image"
                description="We'll use your ad image by default. Switch to a custom image if you want the lead form to feel different."
                collapsible
                defaultOpen={false}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="group relative cursor-pointer">
                    <input
                      className="peer sr-only"
                      type="radio"
                      name="backgroundImageSource"
                      value="default"
                      checked={leadFormSettings.backgroundImageSource === "default"}
                      onChange={() => updateLeadFormSettings("backgroundImageSource", "default")}
                    />
                    <div className="rounded-[18px] border-2 border-[var(--line)] bg-white p-4 transition-all peer-checked:border-[var(--brand)] peer-checked:bg-[color-mix(in_oklab,var(--soft-brand)_18%,white)]">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#60a5fa_0%,#2563eb_100%)] text-white">
                          <MediaImage className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[var(--ink)]">Use Ad Image</span>
                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                              Recommended
                            </span>
                          </div>
                          <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">
                            Automatically uses the image from your ad creative.
                          </p>
                        </div>
                      </div>
                    </div>
                  </label>

                  <label className="group relative cursor-pointer">
                    <input
                      className="peer sr-only"
                      type="radio"
                      name="backgroundImageSource"
                      value="custom"
                      checked={leadFormSettings.backgroundImageSource === "custom"}
                      onChange={() => updateLeadFormSettings("backgroundImageSource", "custom")}
                    />
                    <div className="rounded-[18px] border-2 border-[var(--line)] bg-white p-4 transition-all peer-checked:border-[var(--brand)] peer-checked:bg-[color-mix(in_oklab,var(--soft-brand)_18%,white)]">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#a855f7_0%,#d946ef_100%)] text-white">
                          <MediaImage className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-[var(--ink)]">Custom Image</span>
                          <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">
                            Use your uploaded template image instead of the default creative image.
                          </p>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>

                <div className="mt-4 rounded-[18px] border border-[var(--line)] bg-[var(--soft-panel)] p-4 text-sm leading-6 text-[var(--muted-strong)]">
                  {values.previewImageUrl || values.mediaImageUrls[0]
                    ? "The current uploaded ad image will be used when custom image mode is selected."
                    : "Upload an image in the media step first if you want to use a custom image here."}
                </div>
              </LeadFormSectionCard>

              <LeadFormSectionCard
                icon={Megaphone}
                title="Greeting"
                description="Most won't read your full ad, so this is where they learn what the offer is and why it matters."
                collapsible
                defaultOpen={false}
              >
                <div className="rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-700">
                  Optional but recommended. Keep it short, clear, and easy to understand.
                </div>

                <div className="mt-4 grid gap-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <FieldLabel>Headline</FieldLabel>
                      <span className="text-xs text-[var(--muted)]">({leadFormSettings.greetingTitle.length}/60)</span>
                    </div>
                    <Input
                      name="greetingTitle"
                      value={leadFormSettings.greetingTitle}
                      onChange={(event) => updateLeadFormSettings("greetingTitle", event.target.value)}
                      maxLength={60}
                      placeholder="Welcome! We'd love to learn more about you"
                    />
                  </div>
                  <div>
                    <FieldLabel>Description</FieldLabel>
                    <Textarea
                      name="greetingBody"
                      value={leadFormSettings.greetingBody}
                      onChange={(event) => updateLeadFormSettings("greetingBody", event.target.value)}
                      placeholder="Tell people what your offer is about and what information you'll need from them..."
                      className="min-h-[140px]"
                    />
                  </div>
                </div>
              </LeadFormSectionCard>

              <LeadFormSectionCard
                icon={LayoutGrid}
                title="Questions"
                description="Collect the information you need to qualify and contact a lead."
                collapsible
                defaultOpen={false}
              >
                <div className="space-y-6">
                  <div className="rounded-[18px] border border-[var(--line)] bg-[var(--soft-panel)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--ink)]">Multiple Choice Questions</p>
                        <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">
                          Use this for qualifying questions with predefined answers.
                        </p>
                      </div>
                      <Button type="button" variant="outline" onClick={addMultipleChoiceQuestion}>
                        <Plus className="h-4 w-4" />
                        Add Question
                      </Button>
                    </div>

                    <div className="mt-4 space-y-4">
                      {leadFormSettings.multipleChoiceQuestions.map((question, questionIndex) => (
                        <div key={questionIndex} className="rounded-[18px] border border-[var(--line)] bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="grid flex-1 gap-3">
                              <div>
                                <FieldLabel>Question</FieldLabel>
                                <Input
                                  value={question.label}
                                  onChange={(event) => updateMultipleChoiceQuestion(questionIndex, { label: event.target.value })}
                                  placeholder="Example: How soon are you looking to buy?"
                                />
                              </div>
                              <div>
                                <FieldLabel>Answers</FieldLabel>
                                <div className="space-y-2">
                                  {question.options.map((option, optionIndex) => (
                                    <div key={`${questionIndex}-${optionIndex}`} className="flex items-center gap-2">
                                      <Input
                                        value={option}
                                        onChange={(event) =>
                                          updateMultipleChoiceOption(questionIndex, optionIndex, event.target.value)
                                        }
                                        placeholder="Enter an answer"
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => removeMultipleChoiceOption(questionIndex, optionIndex)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                                <button
                                  type="button"
                                  className="mt-3 inline-flex items-center gap-2 rounded-[14px] border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold text-[var(--ink)]"
                                  onClick={() => addMultipleChoiceOption(questionIndex)}
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  Add Answer
                                </button>
                              </div>
                            </div>
                            <Button type="button" variant="outline" onClick={() => removeMultipleChoiceQuestion(questionIndex)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[18px] border border-[var(--line)] bg-[var(--soft-panel)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--ink)]">Short Questions</p>
                        <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">
                          Use this for quick open-ended follow-up questions.
                        </p>
                      </div>
                      <Button type="button" variant="outline" onClick={addShortQuestion}>
                        <Plus className="h-4 w-4" />
                        Add Question
                      </Button>
                    </div>

                    <div className="mt-4 space-y-2">
                      {leadFormSettings.shortQuestions.map((question, index) => (
                        <div key={`${index}-${question}`} className="flex items-center gap-2">
                          <Input
                            value={question}
                            onChange={(event) => updateShortQuestion(index, event.target.value)}
                            placeholder="Enter a short question"
                          />
                          <Button type="button" variant="outline" onClick={() => removeShortQuestion(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[18px] border border-[var(--line)] bg-[var(--soft-panel)] p-4">
                    <p className="text-sm font-semibold text-[var(--ink)]">Default Contact Information</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">
                      UpHex collects the following lead information by default. Click to include or exclude fields.
                    </p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {[
                        { key: "FULL_NAME", label: "Full name" },
                        { key: "FIRST_NAME", label: "First name" },
                        { key: "LAST_NAME", label: "Last name" },
                        { key: "COMPANY_NAME", label: "Company name" },
                        { key: "PHONE", label: "Phone" },
                        { key: "EMAIL", label: "Email" },
                        { key: "STREET_ADDRESS", label: "Street address" },
                        { key: "CITY", label: "City" },
                        { key: "STATE", label: "State" },
                        { key: "ZIP", label: "Zipcode" },
                        { key: "DOB", label: "Date of birth" },
                        { key: "GENDER", label: "Gender" },
                      ].map((field) => {
                        const checked = leadFormSettings.standardQuestions.includes(field.key);
                        return (
                          <label key={field.key} className="group relative cursor-pointer">
                            <input
                              type="checkbox"
                              className="peer sr-only"
                              checked={checked}
                              onChange={() => toggleStandardQuestion(field.key)}
                            />
                            <div className="flex items-center justify-between rounded-[14px] border-2 border-[var(--line)] bg-white px-4 py-3 transition-all peer-checked:border-[var(--brand)] peer-checked:bg-[color-mix(in_oklab,var(--soft-brand)_18%,white)]">
                              <span className="text-sm font-medium text-[var(--ink)]">{field.label}</span>
                              <CheckCircle2 className={cn("h-5 w-5 text-[var(--brand)]", checked ? "opacity-100" : "opacity-0")} />
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </LeadFormSectionCard>

              <LeadFormSectionCard
                icon={Globe}
                title="Privacy"
                description="Make sure to include any required legal text so the form stays compliant."
                accentClass="bg-[linear-gradient(135deg,#10b981_0%,#059669_100%)]"
                collapsible
                defaultOpen={false}
              >
                <div className="space-y-5">
                  <div className="rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">
                    Optional but recommended. The first three fields are needed when using a custom disclaimer.
                  </div>
                  <div>
                    <FieldLabel>Disclaimer Title</FieldLabel>
                    <Input
                      value={leadFormSettings.disclaimerTitle}
                      onChange={(event) => updateLeadFormSettings("disclaimerTitle", event.target.value)}
                      placeholder="e.g., Privacy Notice"
                    />
                  </div>
                  <div>
                    <FieldLabel>Disclaimer Text</FieldLabel>
                    <Textarea
                      value={leadFormSettings.disclaimerBody}
                      onChange={(event) => updateLeadFormSettings("disclaimerBody", event.target.value)}
                      placeholder="Describe how you'll use their information and protect their privacy..."
                      className="min-h-[120px]"
                    />
                  </div>
                  <div>
                    <FieldLabel>Disclaimer Consent Checkbox Label</FieldLabel>
                    <Input
                      value={leadFormSettings.disclaimerConsent}
                      onChange={(event) => updateLeadFormSettings("disclaimerConsent", event.target.value)}
                      placeholder="I agree to the terms and conditions"
                    />
                  </div>
                  <div>
                    <FieldLabel>Privacy Policy URL</FieldLabel>
                    <Input
                      value={leadFormSettings.privacyPolicyUrl}
                      onChange={(event) => updateLeadFormSettings("privacyPolicyUrl", event.target.value)}
                      placeholder="https://yourwebsite.com/privacy-policy"
                    />
                  </div>
                </div>
              </LeadFormSectionCard>

              <LeadFormSectionCard
                icon={Megaphone}
                title="Completion"
                description="Set the thank-you state people see after they submit the form."
                accentClass="bg-[linear-gradient(135deg,#8b5cf6_0%,#6d28d9_100%)]"
                collapsible
                defaultOpen={false}
              >
                <div className="space-y-4">
                  <label className="inline-flex items-center gap-3 rounded-[18px] border border-[var(--line)] bg-[var(--soft-panel)] px-4 py-3 text-sm text-[var(--muted-strong)]">
                    <input
                      type="checkbox"
                      checked={values.thankYouEnabled}
                      onChange={(event) => update("thankYouEnabled", event.target.checked)}
                      className="h-4 w-4 rounded border-[var(--line)] text-[var(--brand)]"
                    />
                    Enable thank-you page by default
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <FieldLabel>Headline</FieldLabel>
                      <Input
                        name="thankYouHeadline"
                        value={values.thankYouHeadline}
                        onChange={(event) => update("thankYouHeadline", event.target.value)}
                        placeholder="Thanks, we got your request."
                      />
                    </div>
                    <div>
                      <FieldLabel>Call-to-Action Button Text</FieldLabel>
                      <Input
                        name="thankYouButtonText"
                        value={values.thankYouButtonText}
                        onChange={(event) => update("thankYouButtonText", event.target.value)}
                        placeholder="View website"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <FieldLabel>Description</FieldLabel>
                      <Textarea
                        name="thankYouDescription"
                        value={values.thankYouDescription}
                        onChange={(event) => update("thankYouDescription", event.target.value)}
                        placeholder="You can visit our website and exit the form now."
                        className="min-h-[112px]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <FieldLabel>Thank-you website URL</FieldLabel>
                      <Input
                        name="thankYouWebsiteUrl"
                        value={values.thankYouWebsiteUrl}
                        onChange={(event) => update("thankYouWebsiteUrl", event.target.value)}
                        placeholder="https://sidekickstudioss.com/thank-you"
                      />
                    </div>
                  </div>

                  <div className="rounded-[18px] border border-[var(--line)] bg-[var(--soft-panel)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--ink)]">Connect with Leads in Messenger</p>
                        <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">
                          After a lead submits the form and agrees to receive messages, a conversation can start in Messenger.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={leadFormSettings.enableMessenger}
                        onChange={(event) => updateLeadFormSettings("enableMessenger", event.target.checked)}
                        className="h-4 w-4 rounded border-[var(--line)] text-[var(--brand)]"
                      />
                    </div>
                  </div>
                </div>
              </LeadFormSectionCard>
              </div>
            </details>
            <LeadFormSectionCard
              icon={MessageCircle}
              title="Facebook Messenger"
              description="When someone clicks your ad, this message can open in their Facebook Messenger inbox."
              accentClass="bg-[linear-gradient(135deg,#3b82f6_0%,#4f46e5_100%)]"
              collapsible
              defaultOpen={false}
            >
              <div className="space-y-4">
                <div className="rounded-[18px] border border-[var(--line)] bg-[var(--soft-panel)] px-4 py-3 text-sm leading-6 text-[var(--muted-strong)]">
                  Use the welcome message to greet people, set expectations, and ask for the next step.
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <FieldLabel>Welcome Message</FieldLabel>
                    <span className="text-xs text-[var(--muted)]">({values.messengerWelcomeMessage.length}/300)</span>
                  </div>
                  <Textarea
                    name="messengerWelcomeMessage"
                    value={values.messengerWelcomeMessage}
                    onChange={(event) => update("messengerWelcomeMessage", event.target.value)}
                    placeholder="Hi! Thanks for your interest in our services. How can I help you today?"
                    className="min-h-[120px]"
                    maxLength={300}
                  />
                </div>

                <div>
                  <FieldLabel>Reply Prompt</FieldLabel>
                  <Input
                    name="messengerReplyPrompt"
                    value={values.messengerReplyPrompt}
                    onChange={(event) => update("messengerReplyPrompt", event.target.value)}
                    placeholder="How can we help today?"
                  />
                </div>
              </div>
            </LeadFormSectionCard>
          </FormSection>
        </div>

        <div className={currentStep === "follow-up" ? "grid gap-6" : "hidden"}>
          <FormSection
            title="Step 5: Targeting"
            description="Review the launch defaults and capture the audience guidance that should travel with the template."
          >
            <div className="space-y-6">
              <div className="rounded-[22px] border border-[var(--line)] bg-[rgba(255,255,255,0.92)] p-5 shadow-[var(--shadow-soft)]">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2563eb_0%,#7c3aed_100%)] text-white shadow-[0_12px_24px_rgba(37,99,235,0.16)]">
                    <Settings2 className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--ink)]">Launch defaults</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">
                      These are the defaults already set in Template Configuration, shown here as a quick checkpoint.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: "Campaign type", value: getOptionLabel(campaignTypeOptions, values.campaignType) },
                    { label: "Audience", value: getOptionLabel(audienceTypeOptions, values.audienceType) },
                    { label: "Offer framework", value: getOptionLabel(offerFrameworkOptions, values.offerFramework) },
                    { label: "Special category", value: getOptionLabel(specialAdCategoryOptions, values.specialAdCategory) },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[18px] border border-[var(--line)] bg-[var(--soft-panel)] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                        {item.label}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[var(--ink)]">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-[20px] border border-[color-mix(in_oklab,var(--brand)_18%,white)] bg-[color-mix(in_oklab,var(--soft-brand)_18%,white)] p-4 text-sm leading-6 text-[var(--brand-ink)]">
                  Jump back to Step 1 if you want to change the underlying campaign structure.
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {adSetStructureOptions.map((option) => {
                    const active = values.adSetStructure === option.id;

                    return (
                      <div
                        key={option.id}
                        className={cn(
                          "rounded-[20px] border p-4 transition-all",
                          active
                            ? "border-[var(--brand)] bg-[color-mix(in_oklab,var(--soft-brand)_18%,white)]"
                            : "border-[var(--line)] bg-white",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
                              active
                                ? "border-[var(--brand)] bg-white text-[var(--brand)]"
                                : "border-[var(--line)] bg-[var(--soft-panel)] text-[var(--muted-strong)]",
                            )}
                          >
                            <LayoutGrid className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-[var(--ink)]">{option.title}</p>
                              {active ? (
                                <Badge className="rounded-full bg-[var(--brand)] text-white hover:bg-[var(--brand)]">
                                  Selected
                                </Badge>
                              ) : null}
                            </div>
                            <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">{option.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <details className="group rounded-[22px] border border-[var(--line)] bg-[rgba(255,255,255,0.92)] p-5 shadow-[var(--shadow-soft)]">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#8b5cf6_0%,#4f46e5_100%)] text-white shadow-[0_12px_24px_rgba(109,94,248,0.18)]">
                      <Sparkles className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--ink)]">Advantage+ and placements</p>
                      <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">
                        Keep delivery settings broad by default, or tighten them if the template needs stricter control.
                      </p>
                    </div>
                  </div>
                  <ChevronDown className="mt-1 h-5 w-5 text-[var(--muted)] transition-transform duration-200 group-open:rotate-180" />
                </summary>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-[20px] border border-[var(--line)] bg-[var(--soft-panel)] p-4">
                    <p className="text-sm font-semibold text-[var(--ink)]">Advantage+ Settings</p>
                    <div className="mt-4 grid gap-3">
                      {advantagePlusOptions.map((option) => {
                        const active = values.advantagePlusSettings === option.id;

                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => update("advantagePlusSettings", option.id)}
                            className={cn(
                              "rounded-[18px] border p-4 text-left transition-all",
                              active
                                ? "border-[var(--brand)] bg-white shadow-[var(--shadow-soft)]"
                                : "border-[var(--line)] bg-white/80 hover:bg-white",
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <span
                                className={cn(
                                  "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
                                  active
                                    ? "border-[var(--brand)] bg-white text-[var(--brand)]"
                                    : "border-[var(--line)] bg-[var(--soft-panel)] text-[var(--muted-strong)]",
                                )}
                              >
                                {option.id === "automatic" ? (
                                  <Sparkles className="h-4 w-4" />
                                ) : (
                                  <Settings2 className="h-4 w-4" />
                                )}
                              </span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold text-[var(--ink)]">{option.title}</p>
                                  {active ? (
                                    <Badge className="rounded-full bg-[var(--brand)] text-white hover:bg-[var(--brand)]">
                                      Active
                                    </Badge>
                                  ) : null}
                                </div>
                                <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">
                                  {option.description}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-[20px] border border-[var(--line)] bg-[var(--soft-panel)] p-4">
                    <p className="text-sm font-semibold text-[var(--ink)]">Placements</p>
                    <div className="mt-4 grid gap-3">
                      {placementsOptions.map((option) => {
                        const active = values.placements === option.id;

                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => update("placements", option.id)}
                            className={cn(
                              "rounded-[18px] border p-4 text-left transition-all",
                              active
                                ? "border-[var(--brand)] bg-white shadow-[var(--shadow-soft)]"
                                : "border-[var(--line)] bg-white/80 hover:bg-white",
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <span
                                className={cn(
                                  "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
                                  active
                                    ? "border-[var(--brand)] bg-white text-[var(--brand)]"
                                    : "border-[var(--line)] bg-[var(--soft-panel)] text-[var(--muted-strong)]",
                                )}
                              >
                                <Megaphone className="h-4 w-4" />
                              </span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold text-[var(--ink)]">{option.title}</p>
                                  {active ? (
                                    <Badge className="rounded-full bg-[var(--brand)] text-white hover:bg-[var(--brand)]">
                                      Active
                                    </Badge>
                                  ) : null}
                                </div>
                                <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">
                                  {option.description}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </details>

              <Card className="border-[var(--line)] bg-[rgba(255,255,255,0.92)] p-5 shadow-[var(--shadow-soft)]">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0ea5e9_0%,#2563eb_100%)] text-white shadow-[0_12px_24px_rgba(37,99,235,0.16)]">
                    <Target className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--ink)]">Audience notes</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">
                      Add the guidance that should be carried into the template and shown to anyone launching it.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4">
                  <div>
                    <FieldLabel>Targeting guidance</FieldLabel>
                    <Textarea
                      name="targeting"
                      value={values.targeting}
                      onChange={(event) => update("targeting", event.target.value)}
                      placeholder="Example: Focus on homeowners in warm climates, exclude existing customers, and keep placements broad unless testing manual delivery."
                      className="min-h-[120px]"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <FieldLabel>Budget notes</FieldLabel>
                      <Textarea
                        name="budget"
                        value={values.budget}
                        onChange={(event) => update("budget", event.target.value)}
                        placeholder="Example: Start at $50/day, scale only after 3 stable days."
                        className="min-h-[110px]"
                      />
                    </div>

                    <div>
                      <FieldLabel>Creative guidance</FieldLabel>
                      <Textarea
                        name="creativeGuidance"
                        value={values.creativeGuidance}
                        onChange={(event) => update("creativeGuidance", event.target.value)}
                        placeholder="Example: Use UGC-style hooks, keep copy concise, and test one CTA per variation."
                        className="min-h-[110px]"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              <details className="group rounded-[22px] border border-[var(--line)] bg-[rgba(255,255,255,0.92)] p-5 shadow-[var(--shadow-soft)]">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#f59e0b_0%,#ea580c_100%)] text-white shadow-[0_12px_24px_rgba(245,158,11,0.16)]">
                      <Megaphone className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--ink)]">Monitoring and compliance</p>
                      <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">
                        Keep special categories, KPI thresholds, and tracking in one compact place.
                      </p>
                    </div>
                  </div>
                  <ChevronDown className="mt-1 h-5 w-5 text-[var(--muted)] transition-transform duration-200 group-open:rotate-180" />
                </summary>

                <div className="mt-5 grid gap-4">
                  <div>
                    <FieldLabel>Special Ad Category</FieldLabel>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {specialAdCategoryOptions.map((option) => {
                        const active = values.specialAdCategory === option.id;
                        const Icon = option.icon;

                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => update("specialAdCategory", option.id)}
                            className={cn(
                              "flex items-start gap-3 rounded-[18px] border p-4 text-left transition-all",
                              active
                                ? "border-[var(--brand)] bg-[color-mix(in_oklab,var(--soft-brand)_16%,white)]"
                                : "border-[var(--line)] bg-white hover:bg-white/80",
                            )}
                          >
                            <span
                              className={cn(
                                "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
                                active
                                  ? "border-[var(--brand)] bg-white text-[var(--brand)]"
                                  : "border-[var(--line)] bg-[var(--soft-panel)] text-[var(--muted-strong)]",
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="min-w-0">
                              <span className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-[var(--ink)]">{option.label}</span>
                                {active ? (
                                  <Badge className="rounded-full bg-[var(--brand)] text-white hover:bg-[var(--brand)]">
                                    Selected
                                  </Badge>
                                ) : null}
                              </span>
                              <span className="mt-1 block text-sm leading-6 text-[var(--muted-strong)]">
                                {option.description}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-[20px] border border-[var(--line)] bg-[var(--soft-panel)] p-4">
                      <FieldLabel>CTR All threshold</FieldLabel>
                      <Input
                        name="kpiCtrAll"
                        value={values.kpiCtrAll}
                        onChange={(event) => update("kpiCtrAll", event.target.value)}
                        placeholder="e.g., 1.50"
                      />
                    </div>

                    <div className="rounded-[20px] border border-[var(--line)] bg-[var(--soft-panel)] p-4">
                      <FieldLabel>CTR Link threshold</FieldLabel>
                      <Input
                        name="kpiCtrLink"
                        value={values.kpiCtrLink}
                        onChange={(event) => update("kpiCtrLink", event.target.value)}
                        placeholder="e.g., 0.75"
                      />
                    </div>

                    <div className="rounded-[20px] border border-[var(--line)] bg-[var(--soft-panel)] p-4">
                      <FieldLabel>CR threshold</FieldLabel>
                      <Input
                        name="kpiCr"
                        value={values.kpiCr}
                        onChange={(event) => update("kpiCr", event.target.value)}
                        placeholder="e.g., 2.00"
                      />
                    </div>

                    <div className="rounded-[20px] border border-[var(--line)] bg-[var(--soft-panel)] p-4">
                      <FieldLabel>CPA threshold</FieldLabel>
                      <Input
                        name="kpiCpa"
                        value={values.kpiCpa}
                        onChange={(event) => update("kpiCpa", event.target.value)}
                        placeholder="e.g., 50.00"
                      />
                    </div>
                  </div>

                  <div className="rounded-[20px] border border-[var(--line)] bg-[var(--soft-panel)] p-4">
                    <FieldLabel>UTM Parameters</FieldLabel>
                    <Input
                      name="utmParameters"
                      value={values.utmParameters}
                      onChange={(event) => update("utmParameters", event.target.value)}
                      placeholder="utm_source=Facebook&utm_campaign={{campaign.name}}"
                    />
                  </div>
                </div>
              </details>
            </div>
          </FormSection>
        </div>

        <div className={currentStep === "review" ? "grid gap-6" : "hidden"}>
          <FormSection
            title="Step 6: Review & publish"
            description="Check the final blueprint, confirm readiness, and choose whether to save as a draft or publish."
          >
            <div className="space-y-6">
              <Card className="overflow-hidden border-[var(--line)] bg-[rgba(255,255,255,0.92)] shadow-[var(--shadow-soft)]">
                <div className="bg-[linear-gradient(90deg,#276ef1_0%,#5b3fe0_52%,#9333ea_100%)] px-5 py-4 text-white">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
                        <CheckCircle2 className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold">Ready to ship?</p>
                        <p className="mt-0.5 text-xs text-white/85">
                          Draft keeps it private. Publish makes the template live in the library.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="submit"
                        name="intent"
                        value="draft"
                        variant="outline"
                        disabled={isPending}
                        className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                      >
                        Save draft
                      </Button>
                      <Button
                        type="submit"
                        name="intent"
                        value="publish"
                        disabled={isPending}
                        className="border border-black/10 bg-[var(--ink)] text-white shadow-[0_12px_24px_rgba(15,23,42,0.24)] hover:bg-black/90"
                      >
                        {isPending
                          ? "Saving..."
                          : mode === "create"
                            ? "Publish template"
                            : "Save and publish"}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-5 p-5">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {reviewSummary.map((item) => (
                      <div key={item.label} className="rounded-[18px] border border-[var(--line)] bg-[var(--soft-panel)] p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                          {item.label}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[var(--ink)]">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-[22px] border border-[var(--line)] bg-[var(--soft-panel)] p-5">
                      <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0ea5e9_0%,#2563eb_100%)] text-white">
                          <Eye className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[var(--ink)]">Creative snapshot</p>
                          <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">
                            A quick read on the copy, assets, and lead flow that will ship with this template.
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4">
                        <div className="rounded-[18px] border border-[var(--line)] bg-white p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Headline</p>
                          <p className="mt-2 text-sm leading-6 text-[var(--ink)]">{reviewHeadline}</p>
                        </div>

                        <div className="rounded-[18px] border border-[var(--line)] bg-white p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Primary text</p>
                          <p className="mt-2 text-sm leading-6 text-[var(--ink)]">
                            {reviewPrimaryText.length > 180 ? `${reviewPrimaryText.slice(0, 180)}...` : reviewPrimaryText}
                          </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="rounded-[18px] border border-[var(--line)] bg-white p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Media</p>
                            <p className="mt-2 text-sm font-semibold text-[var(--ink)]">
                              {mediaAssetCount} asset{mediaAssetCount === 1 ? "" : "s"}
                            </p>
                          </div>
                          <div className="rounded-[18px] border border-[var(--line)] bg-white p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Lead form</p>
                            <p className="mt-2 text-sm font-semibold text-[var(--ink)]">{reviewLeadFormMode}</p>
                          </div>
                          <div className="rounded-[18px] border border-[var(--line)] bg-white p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">CTA</p>
                            <p className="mt-2 text-sm font-semibold text-[var(--ink)]">{values.ctaDefault || "Not set"}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[22px] border border-[var(--line)] bg-[var(--soft-panel)] p-5">
                      <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#8b5cf6_0%,#4f46e5_100%)] text-white">
                          <Sparkles className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[var(--ink)]">Readiness checklist</p>
                          <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">
                            Green checks help you spot what is ready before you hit publish.
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 space-y-3">
                        {reviewReadinessChecks.map((item) => (
                          <div
                            key={item.label}
                            className={cn(
                              "flex items-start gap-3 rounded-[18px] border p-4",
                              item.ready
                                ? "border-emerald-200 bg-emerald-50"
                                : "border-amber-200 bg-amber-50",
                            )}
                          >
                            <span
                              className={cn(
                                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                                item.ready ? "bg-emerald-500 text-white" : "bg-amber-500 text-white",
                              )}
                            >
                              {item.ready ? <CheckCircle2 className="h-4 w-4" /> : <CircleX className="h-4 w-4" />}
                            </span>
                            <div className="min-w-0">
                              <p className={cn("text-sm font-semibold", item.ready ? "text-emerald-900" : "text-amber-900")}>
                                {item.label}
                              </p>
                              <p className={cn("mt-1 text-sm leading-6", item.ready ? "text-emerald-800" : "text-amber-800")}>
                                {item.detail}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
                    <Card className="border-[var(--line)] bg-[rgba(255,255,255,0.82)] p-5 shadow-[var(--shadow-soft)]">
                      <p className="text-sm font-semibold text-[var(--ink)]">Publishing state</p>
                      <div className="mt-4">
                        <FieldLabel>Template status</FieldLabel>
                        <Select
                          name="status"
                          value={values.status}
                          onChange={(event) =>
                            update(
                              "status",
                              event.target.value as AdminTemplateFormData["status"],
                            )
                          }
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                          <option value="archived">Archived</option>
                        </Select>
                      </div>
                      <div className="mt-4 rounded-[18px] bg-[var(--soft-panel)] p-4 text-sm leading-6 text-[var(--muted-strong)]">
                        {values.status === "published"
                          ? "Published templates are visible to normal users in the live library."
                          : values.status === "archived"
                            ? "Archived templates stay out of the live library but remain editable for admins."
                            : "Draft templates stay private while you keep refining the blueprint."}
                      </div>
                    </Card>

                    <Card className="border-[var(--line)] bg-[rgba(255,255,255,0.82)] p-5 shadow-[var(--shadow-soft)]">
                      <p className="text-sm font-semibold text-[var(--ink)]">What happens next</p>
                      <div className="mt-4 grid gap-3">
                        <div className="rounded-[18px] bg-[var(--soft-panel)] p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Draft</p>
                          <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">
                            Save the template privately so you can keep iterating without publishing it to the library.
                          </p>
                        </div>
                      <div className="rounded-[18px] bg-[var(--soft-panel)] p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Publish</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">
                          Push the template into the live library so users can launch from it immediately.
                        </p>
                      </div>
                      </div>
                    </Card>
                  </div>

                  <Card className="border-[var(--line)] bg-[rgba(255,255,255,0.82)] p-5 shadow-[var(--shadow-soft)]">
                    <p className="text-sm font-semibold text-[var(--ink)]">Builder review</p>
                    <div className="mt-4 grid gap-3">
                      <div className="rounded-[18px] bg-[var(--soft-panel)] p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                          Landing flow
                        </p>
                        <div className="mt-2 space-y-2 text-sm leading-6 text-[var(--muted-strong)]">
                          {preview.nextStepFlow.length ? (
                            preview.nextStepFlow.map((item) => (
                              <div key={item}>• {item}</div>
                            ))
                          ) : (
                            <div>Add next-step flow notes to preview them here.</div>
                          )}
                        </div>
                      </div>
                      <div className="rounded-[18px] bg-[var(--soft-panel)] p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                          Additional settings
                        </p>
                        <div className="mt-2 space-y-2 text-sm leading-6 text-[var(--muted-strong)]">
                          <div>Special category: {getOptionLabel(specialAdCategoryOptions, values.specialAdCategory)}</div>
                          <div>
                            KPI thresholds: {values.kpiCtrAll || "—"} / {values.kpiCtrLink || "—"} / {values.kpiCr || "—"} / {values.kpiCpa || "—"}
                          </div>
                          <div>UTM parameters: {values.utmParameters || "Not set."}</div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </Card>
            </div>
          </FormSection>
        </div>
        </div>

        <Card className="sticky top-28 overflow-hidden border-[var(--line)] bg-[rgba(255,255,255,0.94)] shadow-[var(--shadow-soft)]">
          <div className="bg-[linear-gradient(90deg,#276ef1_0%,#5b3fe0_52%,#9333ea_100%)] px-5 py-4 text-white">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/16">
                  <Eye className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Ad Preview</p>
                  <p className="text-xs text-white/80">Live preview of your template</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]">
                <span className="rounded-full bg-white/16 px-3 py-1">Preview</span>
                <span className="rounded-full bg-white/12 px-3 py-1">Facebook</span>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="rounded-[28px] border border-[var(--line)] bg-[linear-gradient(145deg,#fafbff_0%,#f2efff_48%,#fbfaf5_100%)] p-5">
              <div className="rounded-[22px] border border-white/80 bg-white/92 p-5 shadow-[0_18px_36px_rgba(17,24,39,0.06)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Badge>{values.industry || "Industry"}</Badge>
                  <div className="flex flex-wrap gap-2">
                    {values.isFeatured ? (
                      <span className="rounded-full bg-[var(--soft-brand)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--brand-ink)]">
                        Featured
                      </span>
                    ) : null}
                    <PreviewChip>{values.industry || "Industry"}</PreviewChip>
                    <PreviewChip>{values.campaignObjective || "Objective"}</PreviewChip>
                    <PreviewChip>
                      {supportedAdTypeOptions.find((option) => option.id === values.defaultAdType)?.label ||
                        values.defaultAdType ||
                        "Lead Form"}
                    </PreviewChip>
                  </div>
                </div>

                <div className="mt-5 overflow-hidden rounded-[24px] border border-[var(--line)] bg-[var(--surface)]">
                  <FacebookAdPreview
                    pageName={values.name || "Your Page Name"}
                    primaryText={values.adPrimary || values.description}
                    headline={values.headline || values.name || "Template headline"}
                    description={values.promoDetails}
                    ctaLabel={values.ctaDefault}
                    imageUrl={values.previewImageUrl || values.mediaImageUrls[0] || null}
                    videoUrl={values.mediaVideoUrls[0] || null}
                    compact={false}
                    className="shadow-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--line)] bg-[var(--soft-panel)] px-5 py-3 text-sm text-[var(--muted-strong)]">
            Preview updates automatically as you edit
          </div>
        </Card>
      </div>

      <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-[26px] border border-[var(--line)] bg-[rgba(255,255,255,0.92)] p-4 shadow-[0_18px_36px_rgba(16,24,40,0.08)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-[var(--muted-strong)]">
          <span className="rounded-full bg-[var(--soft-brand)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--brand-ink)]">
            {activeStep.label}
          </span>
          <span>{activeStep.description}</span>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {currentStepIndex > 0 ? (
            <Button type="button" variant="outline" onClick={goBack}>
              Back
            </Button>
          ) : null}

          {currentStep !== "review" ? (
            <Button type="button" onClick={goNext} disabled={isPending || !stepValidation.isValid}>
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <>
              <Button
                type="submit"
                name="intent"
                value="draft"
                variant="outline"
                disabled={isPending}
              >
                Save draft
              </Button>
              <Button
                type="submit"
                name="intent"
                value="publish"
                disabled={isPending}
              >
                {isPending
                  ? "Saving..."
                  : mode === "create"
                    ? "Publish template"
                    : "Save and publish"}
              </Button>
            </>
          )}
        </div>
      </div>
    </form>
  );
}
