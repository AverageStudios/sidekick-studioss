import Image from "next/image";
import { CheckCircle2, PhoneCall } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

type FunnelConfig = {
  headline: string;
  subheadline: string;
  offerLabel: string;
  ctaText: string;
  benefits: string[];
  whyChooseUs: string[];
  finalCta: string;
  faq: Array<{ question: string; answer: string }>;
  testimonialText: string;
  beforeImageUrls: string[];
  afterImageUrls: string[];
  logoUrl?: string | null;
  businessDescription?: string;
  brandColor?: string;
  city?: string;
  businessName?: string;
  phone?: string;
  email?: string;
  offerPrice?: string;
  regularPrice?: string;
};

export function FunnelRenderer({
  config,
  showLeadForm,
}: {
  config: FunnelConfig;
  showLeadForm: React.ReactNode;
}) {
  const brandStyle = {
    ["--brand" as string]: config.brandColor || "#6D5EF8",
    ["--soft-brand" as string]: "color-mix(in oklab, var(--brand) 16%, white)",
  } as React.CSSProperties;

  const gallery = config.beforeImageUrls.length
    ? config.beforeImageUrls.map((before, index) => ({
        before,
        after: config.afterImageUrls[index] || config.afterImageUrls[0] || before,
      }))
    : [
        { before: "/demo/before-1.svg", after: "/demo/after-1.svg" },
        { before: "/demo/before-2.svg", after: "/demo/after-2.svg" },
      ];

  return (
    <div className="space-y-5" style={brandStyle}>
      <Card className="overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(109,94,248,0.15),transparent_32%),linear-gradient(180deg,#fdfdff_0%,#f6f7fb_100%)] p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <Badge>{config.offerLabel}</Badge>
          <span className="text-sm text-[var(--muted)]">{config.city}</span>
        </div>
        <div className="mt-5 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-[-0.06em] text-[var(--ink)] sm:text-5xl">
              {config.headline}
            </h1>
            <p className="max-w-xl text-base leading-7 text-[var(--muted-strong)]">{config.subheadline}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--muted-strong)]">
              <span className="rounded-full bg-white px-4 py-2 shadow-sm">
                Offer {formatCurrency(Number(config.offerPrice))}
              </span>
              <span className="rounded-full bg-white px-4 py-2 shadow-sm">
                Regular {formatCurrency(Number(config.regularPrice))}
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="lg">{config.ctaText}</Button>
              {config.phone ? (
                <Button size="lg" variant="outline">
                  <PhoneCall className="mr-2 h-4 w-4" />
                  {config.phone}
                </Button>
              ) : null}
            </div>
          </div>
          <Card className="p-5">
            <p className="text-sm font-medium text-[var(--muted)]">Why this page converts</p>
            <div className="mt-4 space-y-3">
              {config.whyChooseUs.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl bg-[var(--soft-panel)] p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-[var(--brand)]" />
                  <span className="text-sm text-[var(--muted-strong)]">{item}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">The offer</p>
          <p className="mt-3 text-lg leading-8 text-[var(--muted-strong)]">
            {config.businessDescription || "A straightforward offer built to help local drivers take the next step quickly."}
          </p>
          <ul className="mt-6 grid gap-3">
            {config.benefits.map((benefit) => (
              <li key={benefit} className="rounded-2xl bg-[var(--soft-panel)] px-4 py-3 text-sm text-[var(--muted-strong)]">
                {benefit}
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-6">{showLeadForm}</Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">Before and after</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
              Quick proof without a complicated page builder
            </h2>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {gallery.map((item, index) => (
            <div key={`${item.before}-${index}`} className="grid gap-4 sm:grid-cols-2">
              <div className="relative overflow-hidden rounded-[24px] bg-[var(--soft-panel)]">
                <Image src={item.before} alt="Before detail" width={600} height={420} className="h-full min-h-48 w-full object-cover" />
              </div>
              <div className="relative overflow-hidden rounded-[24px] bg-[var(--soft-panel)]">
                <Image src={item.after} alt="After detail" width={600} height={420} className="h-full min-h-48 w-full object-cover" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="grid gap-6 p-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">Social proof</p>
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">Simple trust for paid traffic</h2>
        </div>
        <div className="rounded-[28px] bg-[var(--soft-panel)] p-6 text-lg leading-8 text-[var(--muted-strong)]">
          “{config.testimonialText}”
        </div>
      </Card>

      <Card className="p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">FAQ</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {config.faq.map((item) => (
            <div key={item.question} className="rounded-[24px] bg-[var(--soft-panel)] p-5">
              <h3 className="text-base font-semibold text-[var(--ink)]">{item.question}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">{item.answer}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">Final CTA</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
            {config.finalCta}
          </h2>
        </div>
        <Button size="lg">{config.ctaText}</Button>
      </Card>
    </div>
  );
}
