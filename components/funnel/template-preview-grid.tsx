import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { FUNNEL_TEMPLATES_HREF } from "@/components/funnel/funnel-links";

// >>> PLACEHOLDER TEMPLATES <<<
// Illustrative examples of the kinds of campaigns SideKick ships. Swap these for
// real published templates (or wire to getTemplates()) once cross-industry
// templates exist in the app. No fake stats/claims here — just example titles.
const TEMPLATES = [
  {
    category: "Automotive",
    title: "Full Detail Promo",
    description: "Turn a flagship detail offer into a live lead campaign in minutes.",
  },
  {
    category: "Automotive",
    title: "Interior Cleanup Push",
    description: "A focused seasonal offer built to bring in interior-detail inquiries.",
  },
  {
    category: "Seasonal",
    title: "Seasonal Campaign",
    description: "Run a time-bound offer that gives customers a reason to book now.",
  },
  {
    category: "Home services",
    title: "Roofing Estimate Campaign",
    description: "Collect qualified estimate requests with a clear, simple lead form.",
  },
  {
    category: "Home services",
    title: "House Cleaning Offer",
    description: "Promote a recurring or first-clean offer and capture new bookings.",
  },
  {
    category: "Beauty / wellness",
    title: "Med Spa Consultation",
    description: "Invite local clients to book a consultation from one clean flow.",
  },
];

export function TemplatePreviewGrid() {
  return (
    <section className="px-5 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="site-h2">Start from templates built for real small-business offers.</h2>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:mt-14 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((template, index) => (
            <Reveal key={template.title} delay={Math.min(index % 3, 2) * 0.08} amount={0.15}>
              <div className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-[rgba(15,17,22,0.1)] bg-white shadow-[0_1px_2px_rgba(15,17,22,0.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_56px_-22px_rgba(21,16,31,0.2)]">
                <div className="relative flex aspect-[16/10] items-end bg-[linear-gradient(150deg,#241a3d_0%,#37265c_60%,#5646ec_140%)] p-4">
                  <span className="absolute left-3 top-3 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/90">
                    {template.category}
                  </span>
                  <p className="font-heading text-[15px] font-semibold leading-tight text-white">
                    {template.title}
                  </p>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="site-body line-clamp-2">{template.description}</p>
                  <Link
                    href={FUNNEL_TEMPLATES_HREF}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--public-accent)] transition-colors hover:text-[var(--public-accent-strong)]"
                  >
                    Preview template
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
