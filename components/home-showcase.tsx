"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BrowserFrame } from "@/components/ui/browser-frame";
import { Reveal, SITE_EASE } from "@/components/ui/reveal";
import { FollowUpMockup, LeadsMockup, TemplatesMockup } from "@/components/home-mockups";
import { cn } from "@/lib/utils";

const tabs = [
  {
    id: "templates",
    label: "Templates",
    title: "A template library that knows your business",
    description:
      "Browse campaigns by industry, preview the actual ad, and start from one that fits your offer.",
    bullets: [
      "Filter by industry and offer type",
      "Preview the real ad before you commit",
      "New templates added by the SideKick team",
    ],
    href: "/product/templates",
    cta: "Explore templates",
    mockup: TemplatesMockup,
  },
  {
    id: "leads",
    label: "Leads",
    title: "Every lead in one list, with a clear next step",
    description:
      "Leads from Meta forms land in SideKick within seconds, tied to the campaign that produced them.",
    bullets: [
      "Status tracking from new to booked",
      "Campaign source on every lead",
      "Export to CSV whenever you want",
    ],
    href: "/product/lead-management",
    cta: "See lead management",
    mockup: LeadsMockup,
  },
  {
    id: "follow-up",
    label: "Follow-up",
    title: "Follow-up that starts without you",
    description:
      "SideKick confirms each inquiry automatically and keeps the whole conversation tied to the lead.",
    bullets: [
      "Automatic confirmation email on every inquiry",
      "Scheduled reminders so leads don't go cold",
      "Reply straight from the lead's timeline",
    ],
    href: "/product/outreach",
    cta: "See follow-up",
    mockup: FollowUpMockup,
  },
];

export function HomeShowcase() {
  const [activeId, setActiveId] = useState(tabs[0].id);
  const reduceMotion = useReducedMotion();
  const activeTab = tabs.find((tab) => tab.id === activeId) ?? tabs[0];
  const Mockup = activeTab.mockup;

  return (
    <section className="site-container py-24 sm:py-32" id="product-showcase">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="site-h2">One place to launch, track, and follow up</h2>
        <p className="site-lead mx-auto mt-4">
          The campaign, the leads it produces, and the follow-up they need live on
          the same screen, not across five tools.
        </p>
      </Reveal>

      <Reveal delay={0.1}>
        <div
          role="tablist"
          aria-label="SideKick product areas"
          className="mt-10 flex justify-center gap-1 border-b border-[rgba(15,17,22,0.1)]"
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activeId;

            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => setActiveId(tab.id)}
                className={cn(
                  "relative px-4 py-3 text-sm font-semibold transition-colors",
                  isActive ? "text-[var(--public-text)]" : "text-[rgba(15,17,22,0.5)] hover:text-[rgba(15,17,22,0.78)]",
                )}
              >
                {tab.label}
                {isActive ? (
                  <motion.span
                    layoutId="showcase-underline"
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : { duration: 0.4, ease: SITE_EASE }
                    }
                    className="absolute inset-x-3 -bottom-px h-[2px] rounded-full bg-[var(--public-accent)]"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </Reveal>

      <div className="mt-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab.id}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.32, ease: SITE_EASE }}
            className="grid items-center gap-10 lg:grid-cols-[0.42fr_0.58fr] lg:gap-14"
          >
            <div>
              <h3 className="font-heading text-2xl font-semibold tracking-[-0.022em] text-[var(--public-text)]">
                {activeTab.title}
              </h3>
              <p className="site-body mt-3 max-w-[46ch] text-base">{activeTab.description}</p>
              <ul className="mt-6 space-y-3">
                {activeTab.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3">
                    <span className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--public-accent)]" />
                    <span className="site-body text-[rgba(15,17,22,0.78)]">{bullet}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={activeTab.href}
                className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--public-accent)] transition-colors hover:text-[var(--public-accent-strong)]"
              >
                {activeTab.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <BrowserFrame className="shadow-[0_1px_2px_rgba(15,17,22,0.05),0_24px_56px_-18px_rgba(21,16,31,0.18)]">
              <Mockup />
            </BrowserFrame>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
