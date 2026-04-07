import Link from "next/link";
import { ArrowRight, ChevronRight, Sparkles } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { SectionHeading } from "@/components/section-heading";
import { TemplateCard } from "@/components/template-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { detailingTemplates } from "@/data/templates";

export default function Home() {
  return (
    <div className="min-h-screen">
      <MarketingNav />
      <main>
        <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/80 px-4 py-2 text-sm text-[var(--muted-strong)] shadow-sm">
              <Sparkles className="h-4 w-4 text-[var(--brand)]" />
              Built for solo detailers and small shops
            </div>
            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.07em] text-[var(--ink)] sm:text-6xl">
                Plug-and-play ads and funnels for car detailers
              </h1>
              <p className="max-w-xl text-lg leading-8 text-[var(--muted-strong)]">
                Pick a template, swap a few details, publish a clean funnel, and start capturing leads without building from scratch.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/signup">Start Free Trial</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/templates">See Templates</Link>
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                "Launch in minutes",
                "Built for detailers",
                "Simple follow-up included",
              ].map((item) => (
                <div key={item} className="rounded-[24px] border border-[var(--line)] bg-white/70 px-4 py-4 text-sm text-[var(--muted-strong)] shadow-sm">
                  {item}
                </div>
              ))}
            </div>
          </div>
          <Card className="ambient-grid overflow-hidden p-5 sm:p-6">
            <div className="rounded-[28px] bg-[linear-gradient(135deg,#171127_0%,#6d5ef8_100%)] p-5 text-white shadow-[0_24px_50px_rgba(26,16,64,0.22)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/70">Launch flow</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em]">From template to live funnel</h2>
                </div>
                <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-semibold">Mobile first</span>
              </div>
              <div className="mt-6 grid gap-3">
                {[
                  "Choose a campaign template",
                  "Customize your offer and brand",
                  "Publish a lightweight funnel",
                  "Capture and follow up with leads",
                ].map((step, index) => (
                  <div key={step} className="flex items-center gap-3 rounded-[20px] bg-white/10 px-4 py-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/14 text-sm font-semibold">
                      0{index + 1}
                    </span>
                    <span className="text-sm text-white/88">{step}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-[24px] bg-white/96 p-4 text-[var(--ink)]">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand)]">
                  Funnel snapshot
                </p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-[20px] bg-[var(--soft-panel)] px-4 py-4">
                    <p className="text-sm font-medium">Full Detail Promo</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">Limited offer for Charlotte drivers</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[20px] bg-[var(--soft-panel)] px-4 py-4 text-sm text-[var(--muted)]">
                      Offer price
                      <div className="mt-1 text-lg font-semibold text-[var(--ink)]">$179</div>
                    </div>
                    <div className="rounded-[20px] bg-[var(--soft-panel)] px-4 py-4 text-sm text-[var(--muted)]">
                      CTA
                      <div className="mt-1 text-lg font-semibold text-[var(--ink)]">Get My Quote</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Launch faster",
                body: "Skip the blank page and start with offers made for detailing services.",
              },
              {
                title: "Capture leads",
                body: "Use clean mobile-first funnels designed for paid traffic and simple forms.",
              },
              {
                title: "Follow up simply",
                body: "Keep confirmation emails lightweight and leave room for SMS later.",
              },
            ].map((item) => (
              <Card key={item.title} className="p-6">
                <h3 className="text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--muted-strong)]">{item.body}</p>
              </Card>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <SectionHeading
            eyebrow="How it works"
            title="Click a few buttons and launch"
            description="Everything is built around a calm, narrow flow so detailers can move quickly without learning a big system."
          />
          <div className="mt-10 grid gap-5 lg:grid-cols-4">
            {[
              ["Sign up", "Create an account and land in a lightweight dashboard."],
              ["Pick a template", "Choose the offer that fits the campaign you want to run."],
              ["Customize a few fields", "Update business info, pricing, CTA, proof, and brand color."],
              ["Publish and collect leads", "Share the funnel link and keep follow-up simple."],
            ].map(([title, body], index) => (
              <Card key={title} className="p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--soft-brand)] font-semibold text-[var(--brand)]">
                  0{index + 1}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[var(--ink)]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">{body}</p>
              </Card>
            ))}
          </div>
        </section>

        <section id="templates" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              eyebrow="Templates"
              title="Made for the campaigns detailers actually run"
              description="Five focused campaigns. No niche switching. No noisy template marketplace."
            />
            <Button asChild variant="outline">
              <Link href="/templates">
                See all templates
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {detailingTemplates.slice(0, 3).map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        </section>

        <section id="faq" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <SectionHeading
            eyebrow="FAQ"
            title="Simple answers for a simple product"
            description="V1 stays intentionally narrow so the setup stays fast."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {[
              [
                "Is this a full CRM?",
                "No. It is a focused campaign launcher with lead capture and lightweight follow-up.",
              ],
              [
                "Can I edit the funnel layout?",
                "You can customize fields and content, but V1 uses fixed high-converting sections instead of a full page builder.",
              ],
              [
                "Can I publish Facebook ads directly?",
                "Not in V1. The product generates ad-ready copy, headlines, and funnel assets so you can launch faster.",
              ],
              [
                "Does it work without Supabase configured?",
                "Yes in demo mode. Connect Supabase to enable real auth, persistence, uploads, and production lead capture.",
              ],
            ].map(([question, answer]) => (
              <Card key={question} className="p-6">
                <h3 className="text-lg font-semibold text-[var(--ink)]">{question}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--muted-strong)]">{answer}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <Card className="overflow-hidden bg-[linear-gradient(135deg,#151126_0%,#2a1d55_58%,#40308c_100%)] p-8 text-white sm:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">Ready to launch</p>
                <h2 className="text-4xl font-semibold tracking-[-0.06em]">The simplest way for a car detailer to launch a campaign</h2>
                <p className="text-base leading-7 text-white/80">
                  Start with a clean template, publish a polished funnel, and keep the process light from day one.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="bg-white text-[var(--ink)] hover:bg-white/90">
                  <Link href="/signup">Get Started</Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="text-white hover:bg-white/12 hover:text-white">
                  <Link href="/templates">
                    See Templates
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        </section>
      </main>
      <footer className="border-t border-[var(--line)] py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>SideKick Studioss. Plug-and-play ads and funnels for car detailers.</p>
          <div className="flex items-center gap-5">
            <Link href="/login">Login</Link>
            <Link href="/signup">Start Free Trial</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
