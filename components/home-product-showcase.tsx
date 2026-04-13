"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Layers3,
  Link2,
  Mail,
  MousePointerClick,
  Megaphone,
  Phone,
  Send,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ShowcaseItem = {
  id: string;
  title: string;
  shortLabel: string;
  description: string;
  href: string;
  cta: string;
  icon: LucideIcon;
  highlights: string[];
  previewLabel: string;
  previewTitle: string;
  previewDescription: string;
  previewSteps: string[];
  previewStats: string[];
};

const showcaseItems: ShowcaseItem[] = [
  {
    id: "templates",
    title: "Ready-to-go templates",
    shortLabel: "Templates",
    description: "Choose your industry and start from a template built for that kind of offer.",
    href: "/product/templates",
    cta: "Explore templates",
    icon: Layers3,
    highlights: ["Choose your industry", "Template-first setup", "Cleaner launch path"],
    previewLabel: "Template system",
    previewTitle: "Start from the right template, not a blank page",
    previewDescription: "Pick the business type, choose the template, and move straight into launch mode.",
    previewSteps: ["Industry selected", "Template chosen", "Launch-ready layout"],
    previewStats: ["5x faster setup", "3 clean steps", "Zero blank-page drag"],
  },
  {
    id: "ads",
    title: "Plug-and-play ads",
    shortLabel: "Ads",
    description: "Launch campaigns faster from proven ad-ready setups.",
    href: "/product/ads",
    cta: "See ads",
    icon: Megaphone,
    highlights: ["Proven structure", "Less setup drag", "Cleaner campaigns"],
    previewLabel: "Ad flow",
    previewTitle: "A clearer path from offer to live campaign",
    previewDescription: "Move from campaign idea to launch without piecing the whole setup together by hand.",
    previewSteps: ["Offer chosen", "Campaign aligned", "Launch path ready"],
    previewStats: ["1 cleaner workflow", "Less setup drag", "Built for small teams"],
  },
  {
    id: "lead-capture",
    title: "Lead capture",
    shortLabel: "Lead Capture",
    description: "Capture inquiries in a cleaner path from click to form.",
    href: "/product/lead-capture",
    cta: "See lead capture",
    icon: MousePointerClick,
    highlights: ["Focused forms", "Cleaner inquiry flow", "Fewer drop-offs"],
    previewLabel: "Lead capture",
    previewTitle: "Turn clicks into real inquiries",
    previewDescription: "Keep the path from campaign page to form simple enough to finish on mobile.",
    previewSteps: ["Visitor lands", "Form stays focused", "Inquiry is captured"],
    previewStats: ["Higher-intent flow", "Mobile-first forms", "Cleaner handoff"],
  },
  {
    id: "lead-management",
    title: "Lead management",
    shortLabel: "Lead Management",
    description: "Track, view, and organize leads without leaving the platform.",
    href: "/product/lead-management",
    cta: "See lead management",
    icon: Layers3,
    highlights: ["Lead list", "Status updates", "Clear next step"],
    previewLabel: "Lead management",
    previewTitle: "Keep every lead visible in one place",
    previewDescription: "The inquiry comes in, the lead stays visible, and the next action is easier to track.",
    previewSteps: ["Lead captured", "Status updated", "Next action visible"],
    previewStats: ["Cleaner pipeline", "One place to work", "Less lost follow-up"],
  },
  {
    id: "outreach",
    title: "Outreach and follow-up",
    shortLabel: "Outreach",
    description: "Keep the next step tied to the lead instead of sending it into another tool.",
    href: "/product/outreach",
    cta: "See outreach",
    icon: Send,
    highlights: ["Faster replies", "Cleaner outreach", "Less manual chasing"],
    previewLabel: "Outreach",
    previewTitle: "Keep follow-up moving from the same system",
    previewDescription: "Respond faster and keep the conversation tied to the lead that already came in.",
    previewSteps: ["Lead comes in", "Outreach starts", "Conversation keeps moving"],
    previewStats: ["1 cleaner system", "Faster response flow", "Less dropped follow-up"],
  },
  {
    id: "integrations",
    title: "Lean integrations",
    shortLabel: "Integrations",
    description: "Connect the essentials without turning your setup into a maze.",
    href: "/product/integrations",
    cta: "See integrations",
    icon: Link2,
    highlights: ["Core tools only", "Cleaner stack", "Future-ready hooks"],
    previewLabel: "Connected",
    previewTitle: "The tools you need, without the clutter",
    previewDescription: "Keep the product focused while still connecting the pieces that matter.",
    previewSteps: ["Auth and data", "Lead follow-up", "Expansion-ready later"],
    previewStats: ["4 jobs in 1 flow", "No bloated stack", "Expandable when needed"],
  },
];

const panelVariants = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

function PreviewFrame({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[26px] border border-[var(--public-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(247,243,255,0.84))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.96)] sm:p-6">
      <div className="flex items-center justify-between gap-4 border-b border-[var(--public-line)] pb-4">
        <div>
          <p className="text-sm font-medium text-[var(--public-text)]">{title}</p>
          <p className="mt-1 text-sm public-text-soft">{description}</p>
        </div>
        <span className="rounded-full border border-[var(--public-line)] bg-white/84 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--public-accent)]">
          Live flow
        </span>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function TemplatesPreview({ item }: { item: ShowcaseItem }) {
  return (
    <PreviewFrame title={item.previewTitle} description={item.previewDescription}>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          {
            label: "Full detail promo",
            meta: "Offer-led template",
          },
          {
            label: "Interior cleanup push",
            meta: "Seasonal campaign",
          },
        ].map((template) => (
          <div
            key={template.label}
            className="rounded-[22px] border border-[var(--public-line)] bg-white/84 p-4"
          >
            <div className="rounded-[18px] border border-[rgba(101,88,246,0.12)] bg-[linear-gradient(180deg,rgba(101,88,246,0.08),rgba(255,255,255,0.72))] p-4">
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-[var(--public-line)] bg-white/82 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--public-accent)]">
                  Template
                </span>
                <span className="text-[11px] public-text-faint">Ready now</span>
              </div>
              <div className="mt-5 space-y-2.5">
                <div className="h-3 w-2/3 rounded-full bg-[rgba(15,17,22,0.14)]" />
                <div className="h-2.5 w-full rounded-full bg-[rgba(15,17,22,0.08)]" />
                <div className="h-2.5 w-5/6 rounded-full bg-[rgba(15,17,22,0.07)]" />
              </div>
            </div>
            <p className="mt-4 text-sm font-semibold text-[var(--public-text)]">{template.label}</p>
            <p className="mt-1 text-xs public-text-soft">{template.meta}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {item.previewStats.map((stat) => (
          <div
            key={stat}
            className="rounded-[18px] border border-[rgba(101,88,246,0.12)] bg-[rgba(101,88,246,0.05)] px-4 py-3"
          >
            <p className="text-sm font-medium text-[var(--public-text)]">{stat}</p>
          </div>
        ))}
      </div>
    </PreviewFrame>
  );
}

function AdsPreview({ item }: { item: ShowcaseItem }) {
  return (
    <PreviewFrame title={item.previewTitle} description={item.previewDescription}>
      <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="rounded-[22px] border border-[var(--public-line)] bg-white/84 p-4">
          <div className="rounded-[20px] border border-[rgba(101,88,246,0.14)] bg-[linear-gradient(140deg,rgba(101,88,246,0.12),rgba(255,255,255,0.85))] p-5">
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-[var(--public-line)] bg-white/84 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--public-accent)]">
                Ad draft
              </span>
              <Megaphone className="h-4 w-4 text-[var(--public-accent)]" />
            </div>
            <p className="mt-5 text-xl font-semibold tracking-[-0.03em] text-[var(--public-text)]">
              Clear offer. Tight CTA. Cleaner launch path.
            </p>
            <div className="mt-4 space-y-2.5">
              <div className="h-2.5 w-full rounded-full bg-[rgba(15,17,22,0.08)]" />
              <div className="h-2.5 w-11/12 rounded-full bg-[rgba(15,17,22,0.08)]" />
              <div className="h-2.5 w-4/5 rounded-full bg-[rgba(15,17,22,0.07)]" />
            </div>
          </div>
        </div>
        <div className="grid gap-3">
          {item.previewSteps.map((step, index) => (
            <div
              key={step}
              className="rounded-[20px] border border-[var(--public-line)] bg-white/82 px-4 py-4"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] public-text-faint">
                Stage 0{index + 1}
              </p>
              <p className="mt-2.5 text-sm font-semibold text-[var(--public-text)]">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </PreviewFrame>
  );
}

function LeadCapturePreview({ item }: { item: ShowcaseItem }) {
  return (
    <PreviewFrame title={item.previewTitle} description={item.previewDescription}>
      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[22px] border border-[var(--public-line)] bg-white/84 p-4">
          <p className="text-sm font-semibold text-[var(--public-text)]">Lead form</p>
          <div className="mt-4 space-y-3">
            {["Name", "Phone", "Service interested in", "Message"].map((field) => (
              <div
                key={field}
                className="rounded-[16px] border border-[var(--public-line)] bg-white/88 px-4 py-3 text-sm text-[rgba(15,17,22,0.46)]"
              >
                {field}
              </div>
            ))}
            <div className="rounded-[16px] border border-[rgba(101,88,246,0.16)] bg-[rgba(101,88,246,0.08)] px-4 py-3 text-sm font-semibold text-[var(--public-accent)]">
              Submit inquiry
            </div>
          </div>
        </div>
        <div className="rounded-[22px] border border-[var(--public-line)] bg-white/84 p-4">
          <p className="text-sm font-semibold text-[var(--public-text)]">Incoming lead</p>
          <div className="mt-4 rounded-[20px] border border-[rgba(101,88,246,0.12)] bg-[linear-gradient(180deg,rgba(101,88,246,0.07),rgba(255,255,255,0.72))] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--public-text)]">Alex Morgan</p>
                <p className="mt-1 text-xs public-text-soft">Interior detail inquiry</p>
              </div>
              <span className="rounded-full bg-emerald-500/12 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                New lead
              </span>
            </div>
            <div className="mt-4 grid gap-2.5">
              <div className="flex items-center gap-2 text-sm text-[var(--public-text)]">
                <Phone className="h-3.5 w-3.5 text-[var(--public-accent)]" />
                (555) 018-2204
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--public-text)]">
                <Mail className="h-3.5 w-3.5 text-[var(--public-accent)]" />
                alex@sidekickdemo.com
              </div>
              <div className="rounded-[16px] border border-[var(--public-line)] bg-white/84 px-3.5 py-3 text-sm public-text-soft">
                Looking for a faster turnaround this week.
              </div>
            </div>
          </div>
        </div>
      </div>
    </PreviewFrame>
  );
}

function LeadManagementPreview({ item }: { item: ShowcaseItem }) {
  return (
    <PreviewFrame title={item.previewTitle} description={item.previewDescription}>
      <div className="rounded-[22px] border border-[var(--public-line)] bg-white/84 p-4">
        <div className="grid gap-3">
          {[
            { name: "Alex Morgan", status: "New" },
            { name: "Jordan Lee", status: "Contacted" },
            { name: "Taylor West", status: "Booked" },
          ].map((lead) => (
            <div
              key={lead.name}
              className="flex items-center justify-between rounded-[18px] border border-[var(--public-line)] bg-white/82 px-4 py-4"
            >
              <div>
                <p className="text-sm font-semibold text-[var(--public-text)]">{lead.name}</p>
                <p className="mt-1 text-xs public-text-soft">Lead tied to campaign source</p>
              </div>
              <span className="rounded-full border border-[var(--public-line)] bg-[rgba(101,88,246,0.06)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--public-accent)]">
                {lead.status}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {item.previewStats.map((stat) => (
            <div
              key={stat}
              className="rounded-[18px] border border-[rgba(101,88,246,0.12)] bg-[rgba(101,88,246,0.05)] px-4 py-3"
            >
              <p className="text-sm font-medium text-[var(--public-text)]">{stat}</p>
            </div>
          ))}
        </div>
      </div>
    </PreviewFrame>
  );
}

function FollowUpPreview({ item }: { item: ShowcaseItem }) {
  return (
    <PreviewFrame title={item.previewTitle} description={item.previewDescription}>
      <div className="grid gap-3">
        {[
          {
            label: "Lead captured",
            body: "Inquiry lands with contact info and service interest.",
            tone: "bg-emerald-500/12 text-emerald-700",
          },
          {
            label: "Follow-up queued",
            body: "Confirmation goes out without leaving the workflow.",
            tone: "bg-[rgba(101,88,246,0.1)] text-[var(--public-accent)]",
          },
          {
            label: "Conversation moving",
            body: "Small teams can reply faster and keep the next step clear.",
            tone: "bg-[rgba(15,17,22,0.06)] text-[var(--public-text)]",
          },
        ].map((row, index) => (
          <div
            key={row.label}
            className="flex gap-4 rounded-[22px] border border-[var(--public-line)] bg-white/84 px-4 py-4"
          >
            <div className="flex flex-col items-center">
              <div className={cn("inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold", row.tone)}>
                0{index + 1}
              </div>
              {index < 2 ? <div className="mt-2 h-full w-px bg-[var(--public-line)]" /> : null}
            </div>
            <div className="pb-1">
              <p className="text-sm font-semibold text-[var(--public-text)]">{row.label}</p>
              <p className="mt-1.5 text-sm leading-6 public-text-soft">{row.body}</p>
            </div>
          </div>
        ))}
      </div>
    </PreviewFrame>
  );
}

function IntegrationsPreview({ item }: { item: ShowcaseItem }) {
  return (
    <PreviewFrame title={item.previewTitle} description={item.previewDescription}>
      <div className="rounded-[24px] border border-[var(--public-line)] bg-white/84 p-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
          {[
            { label: "Campaign launch", icon: Megaphone },
            { label: "Lead capture", icon: MousePointerClick },
            { label: "Follow-up", icon: Send },
          ].map((node, index) => {
            const Icon = node.icon;

            return (
              <div key={node.label} className="contents">
                <div className="rounded-[20px] border border-[var(--public-line)] bg-[linear-gradient(180deg,rgba(101,88,246,0.08),rgba(255,255,255,0.76))] px-4 py-5 text-center">
                  <span className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--public-line)] bg-white/82 text-[var(--public-accent)]">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-[var(--public-text)]">{node.label}</p>
                </div>
                {index < 2 ? (
                  <div className="hidden sm:flex items-center justify-center">
                    <Workflow className="h-5 w-5 text-[var(--public-accent)]" />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {item.previewStats.map((stat) => (
            <div
              key={stat}
              className="rounded-[18px] border border-[rgba(101,88,246,0.12)] bg-[rgba(101,88,246,0.05)] px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[var(--public-accent)]" />
                <p className="text-sm font-medium text-[var(--public-text)]">{stat}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PreviewFrame>
  );
}

function ActivePreview({ item }: { item: ShowcaseItem }) {
  switch (item.id) {
    case "templates":
      return <TemplatesPreview item={item} />;
    case "ads":
      return <AdsPreview item={item} />;
    case "lead-capture":
      return <LeadCapturePreview item={item} />;
    case "lead-management":
      return <LeadManagementPreview item={item} />;
    case "outreach":
      return <FollowUpPreview item={item} />;
    case "integrations":
      return <IntegrationsPreview item={item} />;
    default:
      return <TemplatesPreview item={item} />;
  }
}

export function HomeProductShowcase() {
  const [activeId, setActiveId] = useState(showcaseItems[0].id);
  const activeItem = showcaseItems.find((item) => item.id === activeId) ?? showcaseItems[0];
  const ActiveIcon = activeItem.icon;

  return (
    <section className="page-section marketing-section" id="product-showcase">
      <div className="public-section-shell relative overflow-hidden px-6 py-8 sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(101,88,246,0.08),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(101,88,246,0.05),transparent_24%)]" />

        <div className="relative">
          <div className="mx-auto max-w-3xl text-center">
            <p className="public-accent-kicker text-[11px] font-semibold uppercase tracking-[0.24em]">
              Product system
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--public-text)] sm:text-4xl">
              The core parts of the SideKick platform
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 public-text-muted sm:text-base">
              Choose your industry, pick a template, launch, manage leads, and keep outreach moving from one clearer system.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-2.5 sm:mt-9">
            {showcaseItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === activeId;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveId(item.id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition",
                    isActive
                      ? "border-[rgba(101,88,246,0.2)] bg-[rgba(101,88,246,0.08)] text-[var(--public-text)] shadow-[0_14px_34px_rgba(15,17,22,0.05)]"
                      : "border-[var(--public-line)] bg-white/74 text-[var(--public-muted)] hover:border-[var(--public-line-strong)] hover:bg-[rgba(101,88,246,0.045)] hover:text-[var(--public-text)]",
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive ? "text-[var(--public-accent)]" : "text-[var(--public-muted-soft)]")} />
                  {item.shortLabel}
                </button>
              );
            })}
          </div>

          <div className="mt-8 sm:mt-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeItem.id}
                variants={panelVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]"
              >
                <div className="public-surface-card-strong rounded-[30px] p-6 sm:p-7">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--public-line)] bg-[var(--public-accent-soft)] text-[var(--public-accent)]">
                    <ActiveIcon className="h-5 w-5" />
                  </div>

                  <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] public-accent-kicker">
                    {activeItem.previewLabel}
                  </p>
                  <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--public-text)] sm:text-[2rem] sm:leading-[1.02]">
                    {activeItem.title}
                  </h3>
                  <p className="mt-4 max-w-lg text-sm leading-7 public-text-muted sm:text-base">
                    {activeItem.description}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2.5">
                    {activeItem.highlights.map((highlight) => (
                      <span
                        key={highlight}
                        className="rounded-full border border-[var(--public-line)] bg-white/76 px-3.5 py-1.5 text-xs font-medium text-[rgba(15,17,22,0.74)]"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>

                  <Button
                    asChild
                    className="mt-7 rounded-[18px] border border-[rgba(143,124,255,0.55)] bg-[linear-gradient(180deg,var(--public-accent)_0%,var(--public-accent-strong)_100%)] !font-bold !text-white shadow-[0_18px_44px_rgba(109,94,248,0.24)] hover:border-[rgba(173,160,255,0.68)] hover:bg-[linear-gradient(180deg,#9b8cff_0%,#7567ff_100%)] [&_svg]:!text-white"
                  >
                    <Link href={activeItem.href}>
                      {activeItem.cta}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>

                <div className="public-surface-card rounded-[30px] p-5 sm:p-6">
                  <ActivePreview item={activeItem} />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
