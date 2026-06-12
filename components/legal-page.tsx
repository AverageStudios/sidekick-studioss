import Link from "next/link";
import { MarketingNav } from "@/components/marketing-nav";
import { PublicSiteFooter } from "@/components/public-site-footer";

export type LegalSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export function LegalPage({
  title,
  intro,
  updated,
  sections,
  crossLink,
}: {
  title: string;
  intro: string;
  updated: string;
  sections: LegalSection[];
  crossLink: { label: string; href: string };
}) {
  return (
    <main className="public-site min-h-screen">
      <MarketingNav />

      <section className="site-container pb-24 pt-36 sm:pt-44">
        <div className="mx-auto max-w-[44rem]">
          <h1 className="site-h2 text-[clamp(2rem,1.4rem+2.4vw,3rem)]">{title}</h1>
          <p className="site-lead mt-5">{intro}</p>
          <p className="mt-4 text-[13px] text-[rgba(15,17,22,0.5)]">{updated}</p>

          <div className="mt-12 space-y-12 border-t border-[rgba(15,17,22,0.08)] pt-10">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="font-heading text-xl font-semibold tracking-[-0.018em] text-[var(--public-text)]">
                  {section.title}
                </h2>
                <div className="mt-4 space-y-4">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="text-[15px] leading-[1.75] text-[rgba(15,17,22,0.72)]">
                      {paragraph}
                    </p>
                  ))}
                </div>
                {section.bullets?.length ? (
                  <ul className="mt-4 space-y-2.5">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-3 text-[15px] leading-[1.7] text-[rgba(15,17,22,0.72)]">
                        <span className="mt-[0.65rem] h-1 w-1 shrink-0 rounded-full bg-[rgba(15,17,22,0.4)]" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>

          <p className="mt-14 border-t border-[rgba(15,17,22,0.08)] pt-8 text-sm text-[rgba(15,17,22,0.55)]">
            See also:{" "}
            <Link
              href={crossLink.href}
              className="font-semibold text-[var(--public-accent)] transition-colors hover:text-[var(--public-accent-strong)]"
            >
              {crossLink.label}
            </Link>
          </p>
        </div>
      </section>

      <PublicSiteFooter />
    </main>
  );
}
