import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Filter,
  Inbox,
  Layers,
  MapPin,
  LayoutGrid,
  LayoutTemplate,
  LineChart,
  Send,
  Wand2,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Reveal } from "@/components/ui/reveal";
import { FunnelHero } from "@/components/funnel/funnel-hero";
import { FUNNEL_TEMPLATES_HREF, FUNNEL_TRIAL_HREF } from "@/components/funnel/funnel-links";
import { FunnelQuiz } from "@/components/funnel/funnel-quiz";
import { FunnelStats } from "@/components/funnel/funnel-stats";
import { HowItWorks } from "@/components/funnel/how-it-works";
import { TemplatePreviewGrid } from "@/components/funnel/template-preview-grid";
import { OldVsNew } from "@/components/funnel/old-vs-new";
import { FunnelCTA } from "@/components/funnel/funnel-cta";

export const metadata: Metadata = {
  title: "Launch your next campaign faster | SideKick Studioss",
  description:
    "SideKick helps small businesses choose an industry, pick a ready-to-go template, capture leads, and manage the launch from one clean system.",
};

const PROBLEMS = [
  { icon: FileText, title: "Staring at a blank page", description: "Every campaign starts from zero." },
  { icon: Layers, title: "Too many disconnected tools", description: "A stack that never quite fits together." },
  { icon: Filter, title: "Leads slipping through", description: "Messy follow-up means inquiries go cold." },
];

const BENEFITS = [
  { icon: MapPin, title: "Reach local buyers", description: "Put your offer in front of people in your service area." },
  { icon: Wand2, title: "Capture interest", description: "Send traffic to a focused campaign page or lead flow." },
  { icon: Send, title: "Route the lead", description: "Move new inquiries into your CRM/outreach system." },
  { icon: LineChart, title: "Test and improve", description: "Use the numbers to see what offer gets attention." },
];

export default function FunnelDetailingPage() {
  return (
    <main className="public-site min-h-screen pb-24 sm:pb-0">
      <header className="sticky top-0 z-40 border-b border-[rgba(15,17,22,0.06)] bg-[rgba(248,247,243,0.82)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3 sm:px-6">
          <Logo tone="dark" markOnly className="sm:hidden" />
          <Logo tone="dark" className="hidden sm:inline-flex" />
          <Link href={FUNNEL_TRIAL_HREF} className="site-cta-primary !h-10 !px-4 text-sm">
            Start Free Trial
          </Link>
        </div>
      </header>

      <FunnelHero />

      <section className="px-5 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="site-h2">Most businesses don&rsquo;t need more random tools.</h2>
            <p className="site-lead mx-auto mt-4">
              They need a faster way to turn an offer into a live campaign.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-4 sm:mt-14 sm:grid-cols-3">
            {PROBLEMS.map((problem, index) => {
              const Icon = problem.icon;
              return (
                <Reveal key={problem.title} delay={index * 0.08}>
                  <div className="h-full rounded-[20px] border border-[rgba(15,17,22,0.1)] bg-white p-5 shadow-[0_1px_2px_rgba(15,17,22,0.04)]">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[rgba(15,17,22,0.04)] text-[var(--public-text)]">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <h3 className="mt-4 text-[15px] font-semibold text-[var(--public-text)]">{problem.title}</h3>
                    <p className="site-body mt-1">{problem.description}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <FunnelQuiz />

      <FunnelStats />

      <HowItWorks />

      <TemplatePreviewGrid />

      <section className="px-5 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="site-h2">Your customers are already scrolling.</h2>
            <p className="site-lead mx-auto mt-4">
              Facebook and Instagram give local businesses a way to reach people where attention already is. SideKick helps you turn that attention into a campaign path.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-4 sm:mt-14 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Reveal key={benefit.title} delay={Math.min(index, 3) * 0.07}>
                  <div className="group h-full rounded-[20px] border border-[rgba(15,17,22,0.1)] bg-white p-5 shadow-[0_1px_2px_rgba(15,17,22,0.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_48px_-20px_rgba(21,16,31,0.2)]">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[rgba(101,88,246,0.1)] text-[var(--public-accent)]">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <h3 className="mt-4 text-[15px] font-semibold text-[var(--public-text)]">{benefit.title}</h3>
                    <p className="site-body mt-1">{benefit.description}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <OldVsNew />

      <FunnelCTA />

      <footer className="border-t border-[rgba(15,17,22,0.07)] px-5 py-8 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <p className="text-[13px] text-[rgba(15,17,22,0.5)]">
            © {new Date().getFullYear()} SideKick Studioss. Built for small service businesses.
          </p>
          <div className="flex gap-5 text-[13px] text-[rgba(15,17,22,0.55)]">
            <Link href="/privacy" className="transition-colors hover:text-[var(--public-text)]">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-[var(--public-text)]">
              Terms
            </Link>
            <Link href={FUNNEL_TEMPLATES_HREF} className="transition-colors hover:text-[var(--public-text)]">
              Templates
            </Link>
          </div>
        </div>
      </footer>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[rgba(15,17,22,0.08)] bg-[rgba(248,247,243,0.92)] px-4 py-3 backdrop-blur-xl sm:hidden">
        <Link
          href={FUNNEL_TRIAL_HREF}
          className="site-cta-primary w-full"
          style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom))" }}
        >
          Start Free Trial
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </main>
  );
}
