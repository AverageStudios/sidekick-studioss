"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  ImageIcon,
  Megaphone,
  PenSquare,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AdminTemplateActionState,
  AdminTemplateFormData,
  emptyAdminTemplateActionState,
} from "@/lib/admin-template-form";
import { cn, slugify } from "@/lib/utils";

const categoryOptions = [
  "Lead Generation",
  "Premium Service",
  "Recurring Revenue",
  "Seasonal Offer",
];

const industryOptions = [
  "Auto detailing",
  "Roofing",
  "Cleaning services",
  "Landscaping",
  "Med spa",
  "Fitness studio",
  "Home services",
  "Real estate",
  "Chiropractic",
];

const offerTypes = [
  "Quote request",
  "Limited-time offer",
  "Consultation",
  "Promo booking",
  "Membership push",
];

const objectiveOptions = [
  "Lead generation",
  "Messages",
  "Traffic",
  "Conversions",
];

const steps = [
  {
    id: "basics",
    label: "Basics",
    description: "Name, niche, featured state, and preview image",
    icon: PenSquare,
  },
  {
    id: "offer",
    label: "Offer",
    description: "Headline, CTA, promo details, and positioning",
    icon: Wand2,
  },
  {
    id: "facebook",
    label: "Facebook ad setup",
    description: "Primary text, headline variations, audience notes",
    icon: Megaphone,
  },
  {
    id: "lead-flow",
    label: "Landing & lead flow",
    description: "Page copy, form defaults, FAQs, and next steps",
    icon: Eye,
  },
  {
    id: "follow-up",
    label: "Follow-up",
    description: "Email, SMS, and reminder defaults",
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
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <label className="text-sm font-medium text-[var(--ink)]">{children}</label>
      {required ? (
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--brand-ink)]">
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
  const [slugTouched, setSlugTouched] = useState(Boolean(initialValues.slug));
  const [currentStep, setCurrentStep] = useState<StepId>("basics");
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null);
  const [removePreviewImage, setRemovePreviewImage] = useState(false);
  const [previewUploadError, setPreviewUploadError] = useState<string | null>(null);
  const [isUploadingPreview, setIsUploadingPreview] = useState(false);
  const previewInputRef = useRef<HTMLInputElement>(null);

  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);

  useEffect(() => {
    return () => {
      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
      }
    };
  }, [previewObjectUrl]);

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

  const previewImage = removePreviewImage
    ? ""
    : previewObjectUrl || values.previewImageUrl;

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

  function goToStep(step: StepId) {
    setCurrentStep(step);
  }

  function goNext() {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].id);
    }
  }

  function goBack() {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id);
    }
  }

  function handlePreviewImageChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setPreviewUploadError(null);

    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
    }

    setPreviewObjectUrl(URL.createObjectURL(file));
    setRemovePreviewImage(false);
    void (async () => {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      try {
        setIsUploadingPreview(true);
        const response = await fetch("/api/admin/template-preview-upload", {
          method: "POST",
          body: uploadFormData,
        });
        const payload = (await response.json()) as {
          url?: string;
          error?: string;
        };

        if (!response.ok || !payload.url) {
          setPreviewUploadError(payload.error || "Preview upload failed.");
          return;
        }

        update("previewImageUrl", payload.url);
      } catch {
        setPreviewUploadError("Preview upload failed. Try again.");
      } finally {
        setIsUploadingPreview(false);
      }
    })();
  }

  function clearPreviewImage() {
    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
      setPreviewObjectUrl(null);
    }

    setRemovePreviewImage(true);
    setPreviewUploadError(null);
    update("previewImageUrl", "");

    if (previewInputRef.current) {
      previewInputRef.current.value = "";
    }
  }

  const reviewSummary = [
    { label: "Industry", value: values.industry || "Not set" },
    { label: "Category", value: values.category || "Not set" },
    { label: "Offer type", value: values.offerType || "Not set" },
    { label: "Objective", value: values.campaignObjective || "Not set" },
    { label: "Status", value: values.status },
    { label: "CTA", value: values.ctaDefault || "Not set" },
  ];

  return (
    <form
      action={formAction}
      className="grid gap-6 xl:grid-cols-[0.84fr_1.16fr]"
    >
      <div className="grid gap-6">
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
        <input
          type="hidden"
          name="removePreviewImage"
          value={removePreviewImage ? "1" : "0"}
        />

        <Card className="overflow-hidden p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-ink)]">
                Campaign template builder
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                {mode === "create"
                  ? "Build a new Facebook-ready blueprint"
                  : "Refine the campaign blueprint"}
              </h2>
            </div>
            <Badge>
              {currentStepIndex + 1} / {steps.length}
            </Badge>
          </div>

          <div className="mt-5 grid gap-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const active = step.id === currentStep;
              const complete = index < currentStepIndex;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => goToStep(step.id)}
                  className={cn(
                    "flex items-start gap-3 rounded-[22px] border px-4 py-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklab,var(--brand)_50%,white)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]",
                    active
                      ? "border-[color-mix(in_oklab,var(--brand)_28%,white)] bg-[var(--soft-brand)] shadow-[0_12px_24px_rgba(109,94,248,0.12)]"
                      : "border-[var(--line)] bg-white/82 shadow-[var(--shadow-soft)] hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--brand)_18%,white)] hover:bg-white",
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-9 w-9 items-center justify-center rounded-full",
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
                  </div>
                  <div>
                    <p className="font-medium text-[var(--ink)]">{step.label}</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">
                      {step.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="sticky top-28 overflow-hidden p-6 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-ink)]">
                Live preview
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
                {values.name || "New template"}
              </h2>
            </div>
            <Badge>{values.status}</Badge>
          </div>

          <div className="mt-5 rounded-[26px] border border-[var(--line)] bg-[linear-gradient(145deg,#fafbff_0%,#f2efff_48%,#fbfaf5_100%)] p-5">
            <div className="rounded-[22px] border border-white/80 bg-white/92 p-5 shadow-[0_18px_36px_rgba(17,24,39,0.06)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Badge>{values.category || "Category"}</Badge>
                <div className="flex flex-wrap gap-2">
                  {values.isFeatured ? (
                    <span className="rounded-full bg-[var(--soft-brand)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--brand-ink)]">
                      Featured
                    </span>
                  ) : null}
                  <PreviewChip>{values.industry || "Industry"}</PreviewChip>
                  <PreviewChip>{values.campaignObjective || "Objective"}</PreviewChip>
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-[22px] border border-[var(--line)] bg-[var(--soft-panel)]">
                {previewImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewImage}
                    alt="Template preview"
                    className="h-44 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-44 items-center justify-center text-sm text-[var(--muted)]">
                    Preview image will show here.
                  </div>
                )}
              </div>

              <h3 className="mt-5 text-2xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
                {values.headline || "Default headline"}
              </h3>
              <p className="mt-3 text-sm leading-6 text-[var(--muted-strong)]">
                {values.subheadline || "Default subheadline"}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {preview.benefits.length ? (
                  preview.benefits.map((benefit) => (
                    <span
                      key={benefit}
                      className="rounded-full border border-[var(--line)] bg-[var(--soft-panel)] px-3 py-2 text-xs font-medium text-[var(--muted-strong)]"
                    >
                      {benefit}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-[var(--muted)]">
                    Benefits preview will show here.
                  </span>
                )}
              </div>

              <div className="mt-6 rounded-[20px] bg-[var(--soft-panel)] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  CTA
                </p>
                <div className="mt-2 inline-flex rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-bold text-white shadow-[0_14px_24px_rgba(80,70,180,0.16)]">
                  {values.ctaDefault || "Default CTA"}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <div className="rounded-[22px] bg-[var(--soft-panel)] p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--brand)]" />
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Ad headlines
                </p>
              </div>
              <div className="mt-3 space-y-2">
                {preview.headlines.length ? (
                  preview.headlines.map((headline) => (
                    <div
                      key={headline}
                      className="rounded-[18px] border border-[var(--line)] bg-white/86 px-3 py-3 text-sm font-medium text-[var(--ink)]"
                    >
                      {headline}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[var(--muted)]">
                    Add ad headlines to preview them here.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-[22px] bg-[var(--soft-panel)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                Lead flow
              </p>
              <div className="mt-3 space-y-2">
                {preview.formFields.length ? (
                  preview.formFields.map((item) => (
                    <div
                      key={item}
                      className="text-sm leading-6 text-[var(--muted-strong)]"
                    >
                      • {item}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[var(--muted)]">
                    Add form fields to preview the lead flow.
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6">
        {state.formError ? (
          <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {state.formError}
          </div>
        ) : null}

        <div className={currentStep === "basics" ? "grid gap-6" : "hidden"}>
          <FormSection
            title="Step 1: Basics"
            description="Start with the template identity, where it belongs in the library, and the image that represents it."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel required>Template name</FieldLabel>
                <Input
                  name="name"
                  value={values.name}
                  onChange={(event) => update("name", event.target.value)}
                  placeholder="High-intent quote request"
                />
                <FieldError message={state.fieldErrors.name} />
              </div>

              <div>
                <FieldLabel required>Slug</FieldLabel>
                <Input
                  name="slug"
                  value={values.slug}
                  onChange={(event) => {
                    setSlugTouched(true);
                    update("slug", slugify(event.target.value));
                  }}
                  placeholder="high-intent-quote-request"
                />
                <FieldError message={state.fieldErrors.slug} />
              </div>

              <div>
                <FieldLabel required>Category</FieldLabel>
                <Select
                  name="category"
                  value={values.category}
                  onChange={(event) => update("category", event.target.value)}
                >
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </Select>
                <FieldError message={state.fieldErrors.category} />
              </div>

              <div>
                <FieldLabel required>Industry</FieldLabel>
                <Input
                  name="industry"
                  list="industry-options"
                  value={values.industry}
                  onChange={(event) => update("industry", event.target.value)}
                  placeholder="Industry / niche"
                />
                <datalist id="industry-options">
                  {industryOptions.map((industry) => (
                    <option key={industry} value={industry} />
                  ))}
                </datalist>
                <FieldError message={state.fieldErrors.industry} />
              </div>

              <div className="sm:col-span-2">
                <FieldLabel required>Short description</FieldLabel>
                <Textarea
                  name="description"
                  value={values.description}
                  onChange={(event) => update("description", event.target.value)}
                  placeholder="Short summary of the campaign template and who it is built for."
                  className="min-h-[110px]"
                />
                <FieldError message={state.fieldErrors.description} />
              </div>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[22px] border border-[var(--line)] bg-white/88 p-5 shadow-[var(--shadow-soft)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <FieldLabel>Preview image</FieldLabel>
                    <p className="text-sm leading-6 text-[var(--muted-strong)]">
                      Upload the main image admins and users will recognize in the template library.
                    </p>
                  </div>
                  <ImageIcon className="h-5 w-5 text-[var(--brand)]" />
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    ref={previewInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/jpg"
                    onChange={handlePreviewImageChange}
                    className="block w-full text-sm text-[var(--muted-strong)] file:mr-4 file:rounded-full file:border-0 file:bg-[var(--soft-brand)] file:px-4 file:py-2 file:font-medium file:text-[var(--brand-ink)]"
                  />
                  {previewImage ? (
                    <Button type="button" variant="outline" onClick={clearPreviewImage}>
                      Remove
                    </Button>
                  ) : null}
                </div>
                {isUploadingPreview ? (
                  <p className="mt-3 text-sm text-[var(--muted-strong)]">
                    Uploading preview image...
                  </p>
                ) : null}
                {previewUploadError ? (
                  <p className="mt-3 text-sm text-rose-600">
                    {previewUploadError}
                  </p>
                ) : null}

                <div className="mt-4">
                  <FieldLabel>Optional external image URL</FieldLabel>
                  <Input
                    name="previewImageUrl"
                    value={values.previewImageUrl}
                    onChange={(event) => {
                      setRemovePreviewImage(false);
                      update("previewImageUrl", event.target.value);
                    }}
                    placeholder="https://..."
                  />
                  <FieldError message={state.fieldErrors.previewImageUrl} />
                </div>
              </div>

              <div className="rounded-[22px] border border-[var(--line)] bg-[var(--soft-panel)] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Preview thumbnail
                </p>
                <div className="mt-4 overflow-hidden rounded-[22px] border border-[var(--line)] bg-white">
                  {previewImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewImage}
                      alt="Preview thumbnail"
                      className="h-44 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-44 items-center justify-center text-sm text-[var(--muted)]">
                      No preview image selected yet.
                    </div>
                  )}
                </div>
              </div>
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
          </FormSection>
        </div>

        <div className={currentStep === "offer" ? "grid gap-6" : "hidden"}>
          <FormSection
            title="Step 2: Offer"
            description="Set the launch angle, the main promise, and the offer framing admins want users to inherit."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>Offer type</FieldLabel>
                <Select
                  name="offerType"
                  value={values.offerType}
                  onChange={(event) => update("offerType", event.target.value)}
                >
                  {offerTypes.map((offerType) => (
                    <option key={offerType} value={offerType}>
                      {offerType}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <FieldLabel required>Primary CTA</FieldLabel>
                <Input
                  name="ctaDefault"
                  value={values.ctaDefault}
                  onChange={(event) => update("ctaDefault", event.target.value)}
                  placeholder="Book now"
                />
                <FieldError message={state.fieldErrors.ctaDefault} />
              </div>

              <div className="sm:col-span-2">
                <FieldLabel>Positioning</FieldLabel>
                <Textarea
                  name="positioning"
                  value={values.positioning}
                  onChange={(event) => update("positioning", event.target.value)}
                  placeholder="Best for local businesses that want a cleaner ad-to-lead path."
                  className="min-h-[100px]"
                />
              </div>

              <div className="sm:col-span-2">
                <FieldLabel required>Headline default</FieldLabel>
                <Input
                  name="headline"
                  value={values.headline}
                  onChange={(event) => update("headline", event.target.value)}
                  placeholder="Launch a cleaner local lead campaign"
                />
                <FieldError message={state.fieldErrors.headline} />
              </div>

              <div className="sm:col-span-2">
                <FieldLabel>Subheadline default</FieldLabel>
                <Input
                  name="subheadline"
                  value={values.subheadline}
                  onChange={(event) => update("subheadline", event.target.value)}
                  placeholder="Built to help small businesses launch faster without stitching tools together."
                />
                <FieldError message={state.fieldErrors.subheadline} />
              </div>

              <div>
                <FieldLabel>Offer label</FieldLabel>
                <Input
                  name="offerLabel"
                  value={values.offerLabel}
                  onChange={(event) => update("offerLabel", event.target.value)}
                  placeholder="Free estimate"
                />
              </div>

              <div>
                <FieldLabel>Promo / price details</FieldLabel>
                <Input
                  name="promoDetails"
                  value={values.promoDetails}
                  onChange={(event) => update("promoDetails", event.target.value)}
                  placeholder="$99 intro detail"
                />
              </div>

              <div className="sm:col-span-2">
                <FieldLabel>Offer structure</FieldLabel>
                <Textarea
                  name="offerStructure"
                  value={values.offerStructure}
                  onChange={(event) => update("offerStructure", event.target.value)}
                  placeholder="One point per line"
                  className="min-h-[132px]"
                />
              </div>
            </div>
          </FormSection>
        </div>

        <div className={currentStep === "facebook" ? "grid gap-6" : "hidden"}>
          <FormSection
            title="Step 3: Facebook ad setup defaults"
            description="Build the default ad copy pack the user starts from, including objective, headline variants, audience notes, and creative direction."
          >
            <div className="grid gap-4">
              <div>
                <FieldLabel>Campaign objective</FieldLabel>
                <Select
                  name="campaignObjective"
                  value={values.campaignObjective}
                  onChange={(event) =>
                    update("campaignObjective", event.target.value)
                  }
                >
                  {objectiveOptions.map((objective) => (
                    <option key={objective} value={objective}>
                      {objective}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <FieldLabel>Primary text</FieldLabel>
                <Textarea
                  name="adPrimary"
                  value={values.adPrimary}
                  onChange={(event) => update("adPrimary", event.target.value)}
                  placeholder="Primary ad copy"
                  className="min-h-[110px]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>Headline variations</FieldLabel>
                  <Textarea
                    name="adHeadlines"
                    value={values.adHeadlines}
                    onChange={(event) =>
                      update("adHeadlines", event.target.value)
                    }
                    placeholder="One headline per line"
                    className="min-h-[132px]"
                  />
                </div>

                <div>
                  <FieldLabel>Description defaults</FieldLabel>
                  <Textarea
                    name="adDescriptions"
                    value={values.adDescriptions}
                    onChange={(event) =>
                      update("adDescriptions", event.target.value)
                    }
                    placeholder="One description per line"
                    className="min-h-[132px]"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>Audience / targeting notes</FieldLabel>
                  <Input
                    name="targeting"
                    value={values.targeting}
                    onChange={(event) => update("targeting", event.target.value)}
                    placeholder="Homeowners within 12 miles"
                  />
                </div>

                <div>
                  <FieldLabel>Budget notes</FieldLabel>
                  <Input
                    name="budget"
                    value={values.budget}
                    onChange={(event) => update("budget", event.target.value)}
                    placeholder="$25/day starter budget"
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Creative guidance</FieldLabel>
                <Textarea
                  name="creativeGuidance"
                  value={values.creativeGuidance}
                  onChange={(event) =>
                    update("creativeGuidance", event.target.value)
                  }
                  placeholder="One creative note per line"
                  className="min-h-[120px]"
                />
              </div>
            </div>
          </FormSection>
        </div>

        <div className={currentStep === "lead-flow" ? "grid gap-6" : "hidden"}>
          <FormSection
            title="Step 4: Landing & lead flow defaults"
            description="Shape the campaign page, lead capture path, and what the lead sees after submitting."
          >
            <div className="grid gap-4">
              <div>
                <FieldLabel>Page intro</FieldLabel>
                <Textarea
                  name="landingIntro"
                  value={values.landingIntro}
                  onChange={(event) => update("landingIntro", event.target.value)}
                  placeholder="Short opening copy for the campaign page"
                  className="min-h-[96px]"
                />
              </div>

              <div>
                <FieldLabel>Benefits</FieldLabel>
                <Textarea
                  name="benefits"
                  value={values.benefits}
                  onChange={(event) => update("benefits", event.target.value)}
                  placeholder="One benefit per line"
                  className="min-h-[132px]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>Form CTA</FieldLabel>
                  <Input
                    name="formCta"
                    value={values.formCta}
                    onChange={(event) => update("formCta", event.target.value)}
                    placeholder="Get my estimate"
                  />
                </div>

                <div>
                  <FieldLabel>Form fields</FieldLabel>
                  <Textarea
                    name="formFields"
                    value={values.formFields}
                    onChange={(event) => update("formFields", event.target.value)}
                    placeholder="One field per line"
                    className="min-h-[132px]"
                  />
                </div>
              </div>

              <div>
                <FieldLabel>FAQ</FieldLabel>
                <Textarea
                  name="faq"
                  value={values.faq}
                  onChange={(event) => update("faq", event.target.value)}
                  placeholder="Question | Answer"
                  className="min-h-[144px]"
                />
              </div>

              <div>
                <FieldLabel>Next-step flow</FieldLabel>
                <Textarea
                  name="nextStepFlow"
                  value={values.nextStepFlow}
                  onChange={(event) =>
                    update("nextStepFlow", event.target.value)
                  }
                  placeholder="One step per line"
                  className="min-h-[132px]"
                />
              </div>
            </div>
          </FormSection>
        </div>

        <div className={currentStep === "follow-up" ? "grid gap-6" : "hidden"}>
          <FormSection
            title="Step 5: Follow-up defaults"
            description="Keep the outreach side clean by setting the default responses, reminders, and next-step nudges users start from."
          >
            <div className="grid gap-4">
              <div>
                <FieldLabel>Follow-up subject</FieldLabel>
                <Input
                  name="followUpSubject"
                  value={values.followUpSubject}
                  onChange={(event) =>
                    update("followUpSubject", event.target.value)
                  }
                  placeholder="Thanks for reaching out"
                />
              </div>

              <div>
                <FieldLabel>Follow-up email</FieldLabel>
                <Textarea
                  name="followUpBody"
                  value={values.followUpBody}
                  onChange={(event) => update("followUpBody", event.target.value)}
                  placeholder="Default follow-up email body"
                  className="min-h-[132px]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>SMS follow-up</FieldLabel>
                  <Textarea
                    name="followUpSms"
                    value={values.followUpSms}
                    onChange={(event) => update("followUpSms", event.target.value)}
                    placeholder="Default text message"
                    className="min-h-[120px]"
                  />
                </div>

                <div>
                  <FieldLabel>Reminder message</FieldLabel>
                  <Textarea
                    name="reminderMessage"
                    value={values.reminderMessage}
                    onChange={(event) =>
                      update("reminderMessage", event.target.value)
                    }
                    placeholder="Default reminder copy"
                    className="min-h-[120px]"
                  />
                </div>
              </div>
            </div>
          </FormSection>
        </div>

        <div className={currentStep === "review" ? "grid gap-6" : "hidden"}>
          <FormSection
            title="Step 6: Review & publish"
            description="Check the campaign template summary, then save it as a draft or publish it into the live library."
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reviewSummary.map((item) => (
                <div key={item.label} className="rounded-[18px] bg-[var(--soft-panel)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    {item.label}
                  </p>
                  <p className="mt-2 font-medium text-[var(--ink)]">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.84fr_1.16fr]">
              <Card className="border-[var(--line)] bg-[rgba(255,255,255,0.8)] p-5 shadow-[var(--shadow-soft)]">
                <p className="text-sm font-medium text-[var(--ink)]">
                  Publishing state
                </p>
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

              <Card className="border-[var(--line)] bg-[rgba(255,255,255,0.8)] p-5 shadow-[var(--shadow-soft)]">
                <p className="text-sm font-medium text-[var(--ink)]">Builder review</p>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-[18px] bg-[var(--soft-panel)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                      Facebook defaults
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">
                      {values.adPrimary || "Primary text not set yet."}
                    </p>
                  </div>
                  <div className="rounded-[18px] bg-[var(--soft-panel)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
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
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                      Follow-up
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">
                      {values.followUpSubject || "No follow-up subject yet."}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </FormSection>
        </div>

        <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-[26px] border border-[var(--line)] bg-[rgba(255,255,255,0.92)] p-4 shadow-[0_18px_36px_rgba(16,24,40,0.08)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-[var(--muted-strong)]">
            <span className="rounded-full bg-[var(--soft-brand)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--brand-ink)]">
              {steps[currentStepIndex].label}
            </span>
            <span>{steps[currentStepIndex].description}</span>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {currentStepIndex > 0 ? (
              <Button type="button" variant="outline" onClick={goBack}>
                Back
              </Button>
            ) : null}

            {currentStep !== "review" ? (
              <Button type="button" onClick={goNext}>
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
                  disabled={isPending || isUploadingPreview}
                >
                  Save draft
                </Button>
                {mode === "edit" ? (
                  <Button
                    type="submit"
                    name="intent"
                    value="archive"
                    variant="outline"
                    disabled={isPending || isUploadingPreview}
                  >
                    Archive
                  </Button>
                ) : null}
                <Button
                  type="submit"
                  name="intent"
                  value="publish"
                  disabled={isPending || isUploadingPreview}
                >
                  {isPending
                    ? "Saving..."
                    : isUploadingPreview
                      ? "Uploading image..."
                    : mode === "create"
                      ? "Publish template"
                      : "Save and publish"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
