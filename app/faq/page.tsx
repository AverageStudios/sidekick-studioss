import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { HomeFinalCta } from "@/components/home-final-cta";
import { publicFaqs } from "@/data/public-faqs";

export const metadata: Metadata = {
  title: "FAQ | SideKick Studioss",
  description:
    "What SideKick is, how it works, and what you can do inside it: templates, campaign launch, leads, and follow-up.",
};

export default function FaqPage() {
  return (
    <main className="public-site min-h-screen">
      <MarketingNav />

      <section className="site-container pb-20 pt-36 sm:pb-24 sm:pt-44">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="site-h2 text-[clamp(2.2rem,1.4rem+3vw,3.4rem)]">
            Questions, answered plainly
          </h1>
          <p className="site-lead mx-auto mt-5">
            What SideKick is, how it works, and what happens to your leads.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-2xl divide-y divide-[rgba(15,17,22,0.08)] border-y border-[rgba(15,17,22,0.08)] sm:mt-16">
          {publicFaqs.map((item) => (
            <details key={item.question} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-[16px] font-semibold text-[var(--public-text)] transition-colors hover:text-[var(--public-accent)] [&::-webkit-details-marker]:hidden">
                {item.question}
                <ChevronDown className="h-4 w-4 shrink-0 text-[rgba(15,17,22,0.45)] transition-transform duration-300 group-open:rotate-180" />
              </summary>
              <p className="pb-6 pr-8 text-[15px] leading-[1.7] text-[rgba(15,17,22,0.68)]">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      <HomeFinalCta
        title="The rest you'll learn by trying it."
        subtitle="Start the trial, pick a template, and see how launch, leads, and follow-up fit together."
      />

      <PublicSiteFooter />
    </main>
  );
}
