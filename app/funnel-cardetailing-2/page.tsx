"use client";

import { type FormEvent, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  MapPin,
  Sparkles,
  Target,
} from "lucide-react";
import Link from "next/link";

type FormState = {
  name: string;
  businessName: string;
  phone: string;
  email: string;
};

const starterForm: FormState = {
  name: "",
  businessName: "",
  phone: "",
  email: "",
};

export default function CarDetailingFunnelPage() {
  const [form, setForm] = useState<FormState>(starterForm);
  const [submitted, setSubmitted] = useState(false);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // TODO: Connect this to the production lead/trial backend hook.
    setSubmitted(true);
  }

  return (
    <main className="public-site min-h-screen pb-24 text-[var(--public-text)] sm:pb-0">
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Syne:wght@600;700;800&display=swap");

        .detailing-funnel {
          font-family: "DM Sans", var(--font-plus-jakarta-sans), system-ui, sans-serif;
        }

        .detailing-funnel h1,
        .detailing-funnel h2,
        .detailing-funnel h3,
        .detailing-funnel .brand-word {
          font-family: "Syne", var(--font-sora), system-ui, sans-serif;
        }
      `}</style>

      <div className="detailing-funnel">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-[rgba(15,17,22,0.06)] bg-[rgba(248,247,243,0.82)] backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-8">
            <Link href="/" className="inline-flex items-center gap-2.5" aria-label="SideKick Studioss home">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--public-accent)] text-sm font-black text-white shadow-[0_10px_24px_rgba(101,88,246,0.24)]">
                S
              </span>
              <span className="brand-word text-lg font-bold tracking-[-0.02em]">SideKick Studioss</span>
            </Link>
            <a href="#start" className="site-cta-primary !h-10 !px-4 text-sm">
              Start free trial
            </a>
          </div>
        </header>

        {/* Hero */}
        <section className="px-5 pt-14 pb-10 sm:px-8 sm:pt-20">
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_400px]">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-[rgba(101,88,246,0.16)] bg-[rgba(101,88,246,0.08)] px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--public-accent)]">
                For car detailers
              </p>
              <h1 className="max-w-3xl text-[2.6rem] font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-6xl">
                Keep your bays booked every week &mdash; even when word of mouth goes quiet.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-[rgba(15,17,22,0.72)]">
                Pick a ready-made detailing ad, set your budget and area, and launch. New local
                leads come straight to you &mdash; no agency, no guesswork, no learning Facebook ads.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a href="#start" className="site-cta-primary h-12 rounded-xl px-6 text-base">
                  Start my free trial
                  <ArrowRight className="h-4 w-4" />
                </a>
                <p className="text-sm font-semibold text-[rgba(15,17,22,0.52)]">
                  14-day free trial &middot; cancel anytime
                </p>
              </div>
            </div>

            <div className="lg:justify-self-end">
              <PreviewCard />
            </div>
          </div>
        </section>

        {/* Problem */}
        <section className="px-5 py-14 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-[2rem] font-extrabold leading-[1.06] tracking-[-0.03em] sm:text-[2.6rem]">
              You do great work. The problem isn&rsquo;t your detailing.
            </h2>
            <div className="mt-6 space-y-4 text-lg leading-8 text-[rgba(15,17,22,0.72)]">
              <p>
                Your paint corrections shine. Your ceramic jobs look clean. But some weeks your phone
                just doesn&rsquo;t ring &mdash; and you watch busier shops stay packed while your bay sits open.
              </p>
              <p>
                You&rsquo;ve boosted a post. You&rsquo;ve waited on word of mouth. You&rsquo;ve posted before-and-after
                photos and hoped someone would book. It helps a little, but it never gives your week a plan.
              </p>
              <p className="font-semibold text-[var(--public-text)]">
                You didn&rsquo;t start detailing to become a Facebook ads expert. You just need a steady way
                to put your offer in front of local drivers &mdash; and a simple way for them to ask for a quote.
              </p>
            </div>
          </div>
        </section>

        {/* Outcome */}
        <section className="px-5 py-14 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-[2rem] font-extrabold leading-[1.06] tracking-[-0.03em] sm:text-[2.6rem]">
              Picture your calendar full before Monday hits.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[rgba(15,17,22,0.72)]">
              Your week starts with jobs already on the board. You pick the better work instead of
              chasing every cheap wash. You can plan your cash, your supplies, and your time &mdash;
              because your next few days aren&rsquo;t left to hope.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className="px-5 py-14 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.14em] text-[var(--public-accent)]">
                Three simple steps
              </p>
              <h2 className="text-[2rem] font-extrabold leading-[1.06] tracking-[-0.03em] sm:text-[2.6rem]">
                Pick. Set. Launch. Leads come to you.
              </h2>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {steps.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.number}
                    className="rounded-[24px] border border-[rgba(15,17,22,0.08)] bg-white p-6 shadow-[0_1px_2px_rgba(15,17,22,0.04)]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-[rgba(101,88,246,0.1)] text-[var(--public-accent)]">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="text-sm font-extrabold text-[rgba(15,17,22,0.42)]">
                        Step {item.number}
                      </span>
                    </div>
                    <h3 className="mt-5 text-xl font-extrabold tracking-[-0.02em]">{item.title}</h3>
                    <p className="mt-2 text-base leading-7 text-[rgba(15,17,22,0.66)]">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Offer + form */}
        <section id="start" className="scroll-mt-20 px-5 py-14 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-5xl rounded-[32px] border border-[rgba(15,17,22,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,246,255,0.94))] p-6 shadow-[0_24px_70px_rgba(15,17,22,0.08)] sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_1.05fr] lg:items-center">
              <div>
                <h2 className="text-[2rem] font-extrabold leading-[1.06] tracking-[-0.03em] sm:text-[2.4rem]">
                  Try SideKick free for 14 days.
                </h2>
                <p className="mt-5 text-lg leading-8 text-[rgba(15,17,22,0.72)]">
                  You get ready-to-launch Facebook and Instagram ad templates built for detailing
                  shops. Pick one, set your budget and area, then launch. We keep the path clear &mdash;
                  the templates, the launch steps, the lead form. You bring the great work.
                </p>
                <ul className="mt-6 space-y-3 text-base font-semibold text-[var(--public-text)]">
                  {["14-day free trial", "Cancel anytime", "No risk", "Built for detailers"].map((item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-[rgba(101,88,246,0.12)]">
                        <Check className="h-4 w-4 text-[var(--public-accent)]" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {submitted ? (
                <div className="rounded-2xl border border-[rgba(15,17,22,0.08)] bg-white p-8 text-center shadow-[0_1px_2px_rgba(15,17,22,0.04)]">
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[rgba(101,88,246,0.12)]">
                    <Check className="h-7 w-7 text-[var(--public-accent)]" />
                  </span>
                  <h3 className="mt-5 text-2xl font-extrabold tracking-[-0.02em]">You&rsquo;re all set</h3>
                  <p className="mt-3 text-base leading-7 text-[rgba(15,17,22,0.66)]">
                    Thanks{form.name ? `, ${form.name.split(" ")[0]}` : ""}. We&rsquo;ll be in touch to
                    get your first detailing template live.
                  </p>
                  <Link href="/pricing?startTrial=1" className="site-cta-primary mt-6 h-12 rounded-xl px-6 text-base">
                    Open my trial
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <form
                  onSubmit={submitLead}
                  className="space-y-3 rounded-2xl border border-[rgba(15,17,22,0.08)] bg-white p-5 shadow-[0_1px_2px_rgba(15,17,22,0.04)]"
                >
                  <FunnelInput label="Your name" value={form.name} onChange={(v) => updateField("name", v)} autoComplete="name" />
                  <FunnelInput label="Business name" value={form.businessName} onChange={(v) => updateField("businessName", v)} autoComplete="organization" />
                  <FunnelInput label="Phone" value={form.phone} onChange={(v) => updateField("phone", v)} autoComplete="tel" inputMode="tel" />
                  <FunnelInput label="Email" value={form.email} onChange={(v) => updateField("email", v)} autoComplete="email" inputMode="email" />
                  <button type="submit" className="site-cta-primary mt-2 h-12 w-full rounded-xl text-base">
                    Start my free trial
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <p className="text-center text-xs font-semibold text-[rgba(15,17,22,0.48)]">
                    Takes less than one minute. No card required to start.
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[rgba(15,17,22,0.07)] px-5 py-8 sm:px-8">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
            <p className="text-[13px] text-[rgba(15,17,22,0.5)]">
              © {new Date().getFullYear()} SideKick Studioss. Built for detailers.
            </p>
            <div className="flex gap-5 text-[13px] text-[rgba(15,17,22,0.55)]">
              <Link href="/privacy" className="transition-colors hover:text-[var(--public-text)]">Privacy</Link>
              <Link href="/terms" className="transition-colors hover:text-[var(--public-text)]">Terms</Link>
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[rgba(15,17,22,0.08)] bg-[rgba(248,247,243,0.92)] px-4 py-3 backdrop-blur-xl sm:hidden">
        <a href="#start" className="site-cta-primary w-full">
          Start free trial
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </main>
  );
}

const steps = [
  {
    number: "1",
    icon: Target,
    title: "Pick your template",
    text: "Choose a ready Facebook and Instagram ad made for detail work.",
  },
  {
    number: "2",
    icon: MapPin,
    title: "Set budget and area",
    text: "Tell it how much to spend and where your best customers live.",
  },
  {
    number: "3",
    icon: Sparkles,
    title: "Go live",
    text: "Leads come to you and straight into your lead list or CRM.",
  },
];

function FunnelInput({
  label,
  value,
  onChange,
  autoComplete,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  inputMode?: "email" | "tel";
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-[rgba(15,17,22,0.64)]">{label}</span>
      <input
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className="mt-1 h-12 w-full rounded-xl border border-[rgba(15,17,22,0.1)] bg-[#fbfafd] px-4 text-base font-semibold text-[var(--public-text)] outline-none transition focus:border-[rgba(101,88,246,0.45)] focus:bg-white focus:ring-4 focus:ring-[rgba(101,88,246,0.1)]"
      />
    </label>
  );
}

function PreviewCard() {
  return (
    <div className="w-full max-w-sm rounded-[28px] border border-[rgba(15,17,22,0.08)] bg-white p-4 shadow-[0_20px_60px_rgba(15,17,22,0.07)]">
      <div className="rounded-2xl bg-[linear-gradient(180deg,#15101f,#211936)] p-5 text-white">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-white/50">Live preview</p>
          <Sparkles className="h-4 w-4 text-[#b7afff]" />
        </div>
        <h3 className="mt-5 text-2xl font-extrabold leading-tight tracking-[-0.03em] text-white">
          Detailing campaign
        </h3>
        <p className="mt-3 text-sm leading-6 text-white/70">
          Ready-made ads your local drivers actually see &mdash; launched from one place.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <MiniMetric icon={<CalendarDays className="h-4 w-4" />} label="Bays" value="Booked" />
          <MiniMetric icon={<Clock className="h-4 w-4" />} label="Setup" value="Minutes" />
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[rgba(15,17,22,0.08)] bg-[#fbfafd] p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-extrabold text-[var(--public-text)]">Templates</p>
          <span className="rounded-full bg-[rgba(101,88,246,0.1)] px-2.5 py-1 text-xs font-extrabold text-[var(--public-accent)]">
            Detailing
          </span>
        </div>
        <div className="mt-4 space-y-2">
          {["Ceramic coating offer", "Paint correction quote", "Interior deep clean"].map((item, index) => (
            <div
              key={item}
              className="flex items-center justify-between rounded-xl bg-white px-3 py-2 shadow-[0_1px_2px_rgba(15,17,22,0.04)]"
            >
              <span className="text-sm font-bold text-[var(--public-text)]">{item}</span>
              <span className="text-xs font-extrabold text-[rgba(15,17,22,0.42)]">0{index + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.07] p-3">
      <div className="flex items-center gap-1.5 text-white/60">
        {icon}
        <span className="text-xs font-bold">{label}</span>
      </div>
      <p className="mt-2 text-lg font-extrabold text-white">{value}</p>
    </div>
  );
}
