"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Check, LayoutTemplate, Sparkles } from "lucide-react";
import { completeOnboardingAction } from "@/app/actions";
import { onboardingIndustries } from "@/data/onboarding";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TemplateSeed } from "@/types";
import { cn } from "@/lib/utils";

const onboardingSteps = [
  { id: "01", title: "Choose your industry" },
  { id: "02", title: "Pick a starting template" },
  { id: "03", title: "Continue into the app" },
];

export function DashboardOnboarding({
  templates,
  initialIndustry,
  initialTemplateId,
}: {
  templates: TemplateSeed[];
  initialIndustry?: string | null;
  initialTemplateId?: string | null;
}) {
  const availableIndustries = onboardingIndustries.filter((industry) => industry.status === "available");
  const defaultIndustry = initialIndustry && onboardingIndustries.some((industry) => industry.id === initialIndustry)
    ? initialIndustry
    : (availableIndustries[0]?.id ?? "");
  const defaultTemplate = initialTemplateId && templates.some((template) => template.id === initialTemplateId)
    ? initialTemplateId
    : (templates[0]?.id ?? "");

  const [industry, setIndustry] = useState(defaultIndustry);
  const [templateId, setTemplateId] = useState(defaultTemplate);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === templateId) ?? templates[0],
    [templateId, templates],
  );

  return (
    <div className="grid gap-6 lg:gap-7">
      <Card className="overflow-hidden border-[color-mix(in_oklab,var(--brand)_12%,white)] bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(246,242,255,0.9)_58%,rgba(250,249,245,0.96)_100%)] p-6 shadow-[0_22px_46px_rgba(16,24,40,0.05)] sm:p-7 lg:p-8">
        <div className="space-y-5">
          <div className="space-y-4">
            <Badge>First run</Badge>
            <div className="space-y-3">
              <h1 className="max-w-3xl text-3xl font-semibold tracking-[-0.06em] text-[var(--ink)] sm:text-[2.6rem]">
                Set up your workspace in three quick steps
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-[var(--muted-strong)] sm:text-base">
                SideKick starts with one clear path: choose the industry library you want, pick the template you want to launch from, then move into your workspace with the right starting point already saved.
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {onboardingSteps.map((step, index) => (
              <div
                key={step.id}
                className="rounded-[22px] border border-[var(--line)] bg-white/78 px-4 py-4 shadow-[var(--shadow-soft)]"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[var(--soft-brand)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--brand-ink)]">
                    {step.id}
                  </span>
                  {index < 2 ? <ArrowRight className="h-4 w-4 text-[var(--brand)]" /> : <Sparkles className="h-4 w-4 text-[var(--brand)]" />}
                </div>
                <p className="mt-4 text-sm font-medium text-[var(--ink)]">{step.title}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <form action={completeOnboardingAction} className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <Card className="p-6 sm:p-7">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-ink)]">
              Step 1
            </p>
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">Choose your industry</h2>
            <p className="text-sm leading-7 text-[var(--muted-strong)]">
              Pick the industry library you want this workspace centered around. More industries are coming, but the current live library is built for detailing businesses.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {onboardingIndustries.map((item) => {
              const available = item.status === "available";
              const selected = industry === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={!available}
                  onClick={() => available && setIndustry(item.id)}
                  className={cn(
                    "w-full rounded-[24px] border px-5 py-5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklab,var(--brand)_50%,white)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]",
                    available
                      ? selected
                        ? "border-[color-mix(in_oklab,var(--brand)_32%,white)] bg-[var(--soft-brand)] shadow-[0_16px_32px_rgba(109,94,248,0.12)]"
                        : "border-[var(--line)] bg-white/82 shadow-[var(--shadow-soft)] hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--brand)_18%,white)] hover:bg-white active:translate-y-px"
                      : "border-dashed border-[var(--line)] bg-[var(--soft-panel)] opacity-70",
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-[var(--ink)]">{item.label}</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">{item.description}</p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
                        available
                          ? "bg-white text-[var(--brand-ink)]"
                          : "bg-white/70 text-[var(--muted)]",
                      )}
                    >
                      {item.helper}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          <input type="hidden" name="industry" value={industry} />
        </Card>

        <Card className="p-6 sm:p-7">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-ink)]">
              Step 2
            </p>
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">Pick a starting template</h2>
            <p className="text-sm leading-7 text-[var(--muted-strong)]">
              This choice sets the first campaign you will land on. You can always come back and launch a different template later.
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {templates.map((template) => {
              const selected = templateId === template.id;

              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setTemplateId(template.id)}
                  className={cn(
                    "rounded-[24px] border p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklab,var(--brand)_50%,white)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]",
                    selected
                      ? "border-[color-mix(in_oklab,var(--brand)_32%,white)] bg-[var(--soft-brand)] shadow-[0_16px_32px_rgba(109,94,248,0.12)]"
                      : "border-[var(--line)] bg-white/82 shadow-[var(--shadow-soft)] hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--brand)_18%,white)] hover:bg-white active:translate-y-px",
                  )}
                >
                  <div className="rounded-[20px] border border-white/70 bg-[linear-gradient(135deg,#fafbff_0%,#f0efff_45%,#f5f3ee_100%)] p-4">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-white/86">{template.category}</Badge>
                      {selected ? <Check className="h-4 w-4 text-[var(--brand)]" /> : <LayoutTemplate className="h-4 w-4 text-[var(--brand)]" />}
                    </div>
                    <div className="mt-5 rounded-[18px] bg-white/90 p-3 shadow-[0_10px_18px_rgba(17,24,39,0.05)]">
                      <div className="h-3 w-2/3 rounded-full bg-[#cfd4ff]" />
                      <div className="mt-3 grid gap-2">
                        <div className="h-2.5 rounded-full bg-[#e9ebfa]" />
                        <div className="h-2.5 w-5/6 rounded-full bg-[#ececf5]" />
                      </div>
                    </div>
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-[var(--ink)]">{template.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">{template.description}</p>
                </button>
              );
            })}
          </div>
          <input type="hidden" name="templateSlug" value={selectedTemplate?.slug ?? ""} />

          <div className="mt-6 rounded-[24px] border border-[var(--line)] bg-white/82 p-5 shadow-[var(--shadow-soft)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-ink)]">
              Step 3
            </p>
            <h3 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">Continue into your workspace</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">
              We will save <span className="font-medium text-[var(--ink)]">{selectedTemplate?.name}</span> as your starting point so the dashboard opens with a clearer next step.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-[var(--muted)]">
                You can change templates, launch more campaigns, and update business defaults later.
              </div>
              <Button type="submit" size="lg">
                Continue to workspace
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}
