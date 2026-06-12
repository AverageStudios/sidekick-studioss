import type { Metadata } from "next";
import Link from "next/link";
import { AcademyIndex } from "@/components/academy-index";
import { MarketingNav } from "@/components/marketing-nav";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { academyArticles } from "@/data/academy";

export const metadata: Metadata = {
  title: "Academy | SideKick Studioss",
  description:
    "Learn how to use SideKick with clear documentation for workspaces, templates, campaign launch, integrations, CRM handoff, performance, and support.",
};

export default function AcademyPage() {
  const overviewSlug = academyArticles[0]?.slug || "sidekick-overview";

  return (
    <main className="public-site min-h-screen">
      <MarketingNav />

      <section className="site-container pb-24 pt-36 sm:pb-32 sm:pt-44">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="site-h2 text-[clamp(2.2rem,1.4rem+3vw,3.4rem)]">SideKick Academy</h1>
          <p className="site-lead mx-auto mt-5">
            Short, practical guides for everything in SideKick: from workspace
            setup to campaign launch, performance, and CRM handoff.
          </p>
          <p className="mt-4 text-sm text-[rgba(15,17,22,0.55)]">
            New here? Start with{" "}
            <Link
              href={`/academy/${overviewSlug}`}
              className="font-semibold text-[var(--public-accent)] transition-colors hover:text-[var(--public-accent-strong)]"
            >
              the SideKick overview
            </Link>
            , or open a{" "}
            <Link
              href="/support/new"
              className="font-semibold text-[var(--public-accent)] transition-colors hover:text-[var(--public-accent-strong)]"
            >
              support ticket
            </Link>{" "}
            if you&rsquo;re stuck.
          </p>
        </div>

        <div className="mt-14 sm:mt-16">
          <AcademyIndex />
        </div>
      </section>

      <PublicSiteFooter />
    </main>
  );
}
