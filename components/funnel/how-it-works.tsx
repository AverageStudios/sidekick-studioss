import { Briefcase, LayoutTemplate, Rocket } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

const STEPS = [
  {
    icon: Briefcase,
    title: "Choose your industry",
    description: "Start with the type of business you run.",
  },
  {
    icon: LayoutTemplate,
    title: "Pick a template",
    description: "Choose a ready-to-go campaign instead of starting from zero.",
  },
  {
    icon: Rocket,
    title: "Launch and manage leads",
    description: "Go live, capture inquiries, and keep outreach organized in one workspace.",
  },
];

export function HowItWorks() {
  return (
    <section className="px-5 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="site-h2">From idea to live campaign in 3 steps.</h2>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:mt-14 sm:grid-cols-3">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <Reveal key={step.title} delay={index * 0.08}>
                <div className="group h-full rounded-[22px] border border-[rgba(15,17,22,0.1)] bg-white p-6 shadow-[0_1px_2px_rgba(15,17,22,0.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_56px_-22px_rgba(21,16,31,0.22)]">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-[rgba(101,88,246,0.1)] text-[var(--public-accent)]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="font-heading text-sm font-semibold text-[var(--public-accent)]">
                      Step {index + 1}
                    </span>
                  </div>
                  <h3 className="site-h3 mt-4">{step.title}</h3>
                  <p className="site-body mt-2">{step.description}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
