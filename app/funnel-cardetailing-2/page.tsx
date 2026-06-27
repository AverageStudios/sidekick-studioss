"use client";

import { type FormEvent, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, Check, ChevronLeft, Clock, Sparkles } from "lucide-react";
import Link from "next/link";

type FormState = {
  name: string;
  businessName: string;
  phone: string;
  email: string;
};

type StepKey = "pain" | "agitate" | "outcome" | "mechanism" | "proof" | "offer" | "thanks";

type FunnelStep = {
  key: StepKey;
  eyebrow: string;
  title: string;
  cta: string;
};

const steps: FunnelStep[] = [
  {
    key: "pain",
    eyebrow: "For car detailers",
    title: "Keep your bays booked every week, even when word of mouth gets quiet.",
    cta: "Show me",
  },
  {
    key: "agitate",
    eyebrow: "The real problem",
    title: "You did not start detailing to become a Facebook ads expert.",
    cta: "That is me",
  },
  {
    key: "outcome",
    eyebrow: "What you want",
    title: "Picture your calendar full before Monday hits.",
    cta: "Here is how",
  },
  {
    key: "mechanism",
    eyebrow: "Simple path",
    title: "Pick. Set. Launch. Leads come to you.",
    cta: "Show proof",
  },
  {
    key: "proof",
    eyebrow: "Proof area",
    title: "Real proof goes here before you scale this page.",
    cta: "Start free",
  },
  {
    key: "offer",
    eyebrow: "Your next step",
    title: "Try SideKick free for 14 days.",
    cta: "Start my free trial",
  },
  {
    key: "thanks",
    eyebrow: "You are set",
    title: "Thanks. Your next step is almost ready.",
    cta: "Done",
  },
];

const starterForm: FormState = {
  name: "",
  businessName: "",
  phone: "",
  email: "",
};

export default function CarDetailingFunnelPage() {
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<FormState>(starterForm);
  const step = steps[stepIndex];
  const progress = useMemo(() => ((stepIndex + 1) / steps.length) * 100, [stepIndex]);

  function nextStep() {
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }

  function previousStep() {
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // TODO: Connect this to the production lead/trial backend hook.
    nextStep();
  }

  return (
    <main className="public-site min-h-screen overflow-hidden px-4 py-4 text-[var(--public-text)] sm:px-6 lg:px-8">
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Syne:wght@600;700;800&display=swap");

        .detailing-funnel {
          font-family: "DM Sans", var(--font-plus-jakarta-sans), system-ui, sans-serif;
        }

        .detailing-funnel h1,
        .detailing-funnel h2,
        .detailing-funnel .brand-word {
          font-family: "Syne", var(--font-sora), system-ui, sans-serif;
        }

        @keyframes funnelCardIn {
          from {
            opacity: 0;
            transform: translate3d(18px, 0, 0) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .funnel-step-card {
            animation: none !important;
          }
        }
      `}</style>

      <div className="detailing-funnel mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-6xl flex-col">
        <header className="flex items-center justify-between gap-4 py-2">
          <Link href="/" className="inline-flex items-center gap-2.5" aria-label="SideKick Studioss home">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--public-accent)] text-sm font-black text-white shadow-[0_10px_24px_rgba(101,88,246,0.24)]">
              S
            </span>
            <span className="brand-word text-lg font-bold tracking-[-0.02em]">SideKick Studioss</span>
          </Link>
          <Link
            href="/pricing?startTrial=1"
            className="hidden rounded-xl border border-[rgba(15,17,22,0.1)] bg-white px-4 py-2 text-sm font-bold text-[var(--public-text)] shadow-[0_1px_2px_rgba(15,17,22,0.04)] sm:inline-flex"
          >
            14-day free trial
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-6 py-5 lg:grid-cols-[minmax(0,1fr)_390px] lg:py-8">
          <div className="order-2 lg:order-1">
            <div className="mb-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={previousStep}
                disabled={stepIndex === 0}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-[rgba(15,17,22,0.1)] bg-white px-3 text-sm font-bold text-[var(--public-text)] shadow-[0_1px_2px_rgba(15,17,22,0.04)] transition disabled:pointer-events-none disabled:opacity-35"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
              <p className="text-sm font-bold text-[rgba(15,17,22,0.54)]">
                Step {stepIndex + 1} of {steps.length}
              </p>
            </div>

            <div className="mb-5 h-2 overflow-hidden rounded-full bg-[rgba(15,17,22,0.07)]">
              <div
                className="h-full rounded-full bg-[var(--public-accent)] transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            <article
              key={step.key}
              className="funnel-step-card rounded-[28px] border border-[rgba(15,17,22,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,246,255,0.94))] p-5 shadow-[0_24px_70px_rgba(15,17,22,0.08)] [animation:funnelCardIn_280ms_cubic-bezier(0.22,1,0.36,1)_both] sm:p-8"
            >
              <p className="mb-4 inline-flex rounded-full border border-[rgba(101,88,246,0.16)] bg-[rgba(101,88,246,0.08)] px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--public-accent)]">
                {step.eyebrow}
              </p>

              <h1 className="max-w-3xl text-[2.3rem] font-extrabold leading-[0.98] tracking-[-0.035em] text-[var(--public-text)] sm:text-6xl">
                {step.title}
              </h1>

              <div className="mt-6">{renderStepBody(step.key, form, updateField, submitLead, nextStep)}</div>

              {step.key !== "offer" && step.key !== "thanks" ? (
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={nextStep}
                    className="site-cta-primary h-12 w-full rounded-xl text-base sm:w-auto"
                  >
                    {step.cta}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <p className="text-sm font-semibold text-[rgba(15,17,22,0.48)]">
                    Takes less than one minute.
                  </p>
                </div>
              ) : null}
            </article>
          </div>

          <aside className="order-1 lg:order-2">
            <ProofPanel stepKey={step.key} />
          </aside>
        </section>
      </div>
    </main>
  );
}

function renderStepBody(
  key: StepKey,
  form: FormState,
  updateField: (field: keyof FormState, value: string) => void,
  submitLead: (event: FormEvent<HTMLFormElement>) => void,
  nextStep: () => void,
) {
  if (key === "pain") {
    return (
      <div className="space-y-4 text-lg leading-8 text-[rgba(15,17,22,0.72)]">
        <p>
          You do great work. Your paint corrections shine. Your ceramic jobs look clean. But some weeks your phone just does not ring.
        </p>
        <p>
          You watch lesser shops stay packed while your bay sits open. You know your work is better. You just need more local people to see your offer.
        </p>
      </div>
    );
  }

  if (key === "agitate") {
    return (
      <div className="space-y-4 text-lg leading-8 text-[rgba(15,17,22,0.72)]">
        <p>
          You have boosted posts. You have waited on word of mouth. You have posted before-and-after photos and hoped someone would book.
        </p>
        <p>
          That can help, but it does not give your week a plan. You need a clear offer, shown to local drivers, with a simple way to ask for a quote.
        </p>
      </div>
    );
  }

  if (key === "outcome") {
    return (
      <div className="space-y-4 text-lg leading-8 text-[rgba(15,17,22,0.72)]">
        <p>
          Your week starts with jobs already on the board. You pick better jobs, not every cheap wash. Your name becomes the one local drivers remember.
        </p>
        <p>
          You can plan your cash, your supplies, and your time because your next few days are not left to hope.
        </p>
      </div>
    );
  }

  if (key === "mechanism") {
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["1", "Pick your detailing template", "Choose a ready Facebook and Instagram ad made for detail work."],
          ["2", "Set your budget and area", "Tell it how much to spend and where your best customers live."],
          ["3", "Go live", "Leads come to you and into your lead list or CRM."],
        ].map(([number, title, text]) => (
          <div key={number} className="rounded-2xl border border-[rgba(15,17,22,0.08)] bg-white p-4 shadow-[0_1px_2px_rgba(15,17,22,0.04)]">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[rgba(101,88,246,0.1)] text-sm font-extrabold text-[var(--public-accent)]">
              {number}
            </span>
            <h2 className="mt-4 text-lg font-extrabold tracking-[-0.02em]">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-[rgba(15,17,22,0.64)]">{text}</p>
          </div>
        ))}
      </div>
    );
  }

  if (key === "proof") {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-dashed border-[rgba(101,88,246,0.35)] bg-[rgba(101,88,246,0.06)] p-5">
          <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-[var(--public-accent)]">TODO testimonial slot</p>
          <p className="mt-2 text-lg font-bold text-[var(--public-text)]">
            Add a real detailer quote, lead screenshot, or booked calendar screenshot here.
          </p>
          <p className="mt-2 text-sm leading-6 text-[rgba(15,17,22,0.64)]">
            Do not use this slot until you have real proof from a real shop.
          </p>
        </div>

        <div className="rounded-2xl border border-[rgba(15,17,22,0.08)] bg-white p-5">
          <p className="text-sm font-extrabold text-[var(--public-text)]">Example math, not a real result</p>
          <p className="mt-2 text-lg leading-8 text-[rgba(15,17,22,0.72)]">
            If one full detail is about $200, a few extra booked jobs in a month can cover the tool many times over.
          </p>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.1em] text-[rgba(15,17,22,0.42)]">
            Illustration only. Your numbers can be higher or lower.
          </p>
        </div>
      </div>
    );
  }

  if (key === "offer") {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_1.05fr]">
        <div className="space-y-4 text-lg leading-8 text-[rgba(15,17,22,0.72)]">
          <p>
            You get ready-to-launch Facebook and Instagram ad templates for your detailing shop. Pick one, set your budget and area, then launch.
          </p>
          <div className="rounded-2xl border border-[rgba(15,17,22,0.08)] bg-white p-4 text-base leading-7">
            Our role is simple: our templates, our launch steps, our lead form, our budget prompts, and our support notes keep the path clear. We give the structure. We keep it plain. We do not claim results. Our proof slots stay empty until real shops fill them. We also keep our claims marked.
          </div>
          <ul className="space-y-3 text-base font-semibold text-[var(--public-text)]">
            {["14-day free trial", "Cancel anytime", "No risk", "Built for detailers"].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check className="h-5 w-5 text-[var(--public-accent)]" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={submitLead} className="space-y-3 rounded-2xl border border-[rgba(15,17,22,0.08)] bg-white p-4 shadow-[0_1px_2px_rgba(15,17,22,0.04)]">
          <FunnelInput label="Your name" value={form.name} onChange={(value) => updateField("name", value)} autoComplete="name" />
          <FunnelInput label="Business name" value={form.businessName} onChange={(value) => updateField("businessName", value)} autoComplete="organization" />
          <FunnelInput label="Phone" value={form.phone} onChange={(value) => updateField("phone", value)} autoComplete="tel" inputMode="tel" />
          <FunnelInput label="Email" value={form.email} onChange={(value) => updateField("email", value)} autoComplete="email" inputMode="email" />
          <button type="submit" className="site-cta-primary mt-2 h-12 w-full rounded-xl text-base">
            Start my free trial
            <ArrowRight className="h-4 w-4" />
          </button>
          <p className="text-center text-xs font-semibold text-[rgba(15,17,22,0.48)]">
            TODO: send this form to your trial or lead backend.
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-lg leading-8 text-[rgba(15,17,22,0.72)]">
      <p>
        Your request is saved in this demo funnel. The next production step is to open your trial account and show your first detailing template.
      </p>
      <div className="rounded-2xl border border-dashed border-[rgba(101,88,246,0.35)] bg-[rgba(101,88,246,0.06)] p-5">
        <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-[var(--public-accent)]">TODO confirmation hook</p>
        <p className="mt-2 font-bold text-[var(--public-text)]">
          Add the real checkout, signup, or booked-call next step here.
        </p>
      </div>
      <button type="button" onClick={nextStep} className="site-cta-secondary h-12 rounded-xl">
        Stay on this page
      </button>
    </div>
  );
}

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

function ProofPanel({ stepKey }: { stepKey: StepKey }) {
  const proofCopy: Record<StepKey, { label: string; title: string; body: string }> = {
    pain: {
      label: "Proof beside claim",
      title: "TODO: add slow-week screenshot",
      body: "Use a real calendar screenshot or shop note here. No made-up booked-job claim.",
    },
    agitate: {
      label: "Proof beside claim",
      title: "TODO: add boosted-post receipt",
      body: "Use a real ad spend screenshot or quote from a detailer who tried boosting posts.",
    },
    outcome: {
      label: "Proof beside claim",
      title: "TODO: add booked calendar",
      body: "Use a real calendar screenshot when you have one. Until then, this stays marked as TODO.",
    },
    mechanism: {
      label: "Mechanism",
      title: "Ready template flow",
      body: "Pick a detailing ad template, set budget and area, then launch from SideKick.",
    },
    proof: {
      label: "Proof rule",
      title: "No fake wins",
      body: "Use real testimonials here later. The math shown is only an example.",
    },
    offer: {
      label: "Offer",
      title: "14-day free trial",
      body: "Cancel anytime. No result is promised. Your shop tests the templates with real local drivers.",
    },
    thanks: {
      label: "Next step",
      title: "TODO: real handoff",
      body: "Connect the form to signup, checkout, or a booked-call flow.",
    },
  };
  const copy = proofCopy[stepKey];

  return (
    <div className="rounded-[28px] border border-[rgba(15,17,22,0.08)] bg-white p-4 shadow-[0_20px_60px_rgba(15,17,22,0.07)] lg:sticky lg:top-6">
      <div className="rounded-2xl bg-[linear-gradient(180deg,#15101f,#211936)] p-4 text-white">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-white/50">{copy.label}</p>
          <Sparkles className="h-4 w-4 text-[#b7afff]" />
        </div>
        <h2 className="mt-5 text-2xl font-extrabold leading-tight tracking-[-0.03em]">{copy.title}</h2>
        <p className="mt-3 text-sm leading-6 text-white/68">{copy.body}</p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <MiniMetric icon={<CalendarDays className="h-4 w-4" />} label="Calendar" value="TODO" />
          <MiniMetric icon={<Clock className="h-4 w-4" />} label="Setup" value="Fast" />
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[rgba(15,17,22,0.08)] bg-[#fbfafd] p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-extrabold text-[var(--public-text)]">Live preview</p>
          <span className="rounded-full bg-[rgba(101,88,246,0.1)] px-2.5 py-1 text-xs font-extrabold text-[var(--public-accent)]">
            Detailing
          </span>
        </div>
        <div className="mt-4 space-y-2">
          {["Ceramic coating offer", "Paint correction quote", "Interior deep clean"].map((item, index) => (
            <div key={item} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 shadow-[0_1px_2px_rgba(15,17,22,0.04)]">
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
    <div className="rounded-xl border border-white/10 bg-white/7 p-3">
      <div className="flex items-center gap-1.5 text-white/58">
        {icon}
        <span className="text-xs font-bold">{label}</span>
      </div>
      <p className="mt-2 text-lg font-extrabold">{value}</p>
    </div>
  );
}
