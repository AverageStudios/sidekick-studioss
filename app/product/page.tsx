import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { HomeFinalCta } from "@/components/home-final-cta";
import { publicProductItems } from "@/data/public-product-pages";

export const metadata: Metadata = {
  title: "Product | SideKick Studioss",
  description:
    "Templates, campaign launch, lead capture, lead management, outreach, and CRM handoff: the SideKick platform for local businesses.",
};

export default function ProductPage() {
  return (
    <main className="public-site min-h-screen">
      <MarketingNav />

      <section className="site-container pb-20 pt-36 sm:pb-24 sm:pt-44">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="site-h2 text-[clamp(2.2rem,1.4rem+3vw,3.4rem)]">
            Everything a campaign needs, in one system
          </h1>
          <p className="site-lead mx-auto mt-5">
            SideKick covers the whole arc of a local Meta campaign: the template
            you start from, the launch, the leads, and the follow-up they need.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-4xl gap-x-12 sm:mt-20 sm:grid-cols-2">
          {publicProductItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.slug}
                href={item.href}
                className="group flex items-start gap-4 border-t border-[rgba(15,17,22,0.08)] py-7"
              >
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[rgba(15,17,22,0.08)] bg-white text-[var(--public-accent)] shadow-[0_1px_2px_rgba(15,17,22,0.04)]">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-[16px] font-semibold text-[var(--public-text)] transition-colors group-hover:text-[var(--public-accent)]">
                    {item.title}
                    <ArrowRight className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
                  </span>
                  <span className="site-body mt-1.5 block">{item.description}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <HomeFinalCta
        title="See the whole flow on a real campaign."
        subtitle="Start the trial, pick a template for your industry, and follow it from launch to the first lead."
      />

      <PublicSiteFooter />
    </main>
  );
}
