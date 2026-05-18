import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { Button } from "@/components/ui/button";
import { InteractiveGlowCard } from "@/components/ui/interactive-glow-card";

export const metadata: Metadata = {
  title: "Privacy Policy | SideKick Studioss",
  description:
    "Privacy Policy for a florist website covering inquiries, orders, delivery details, custom arrangements, and analytics.",
};

const collectedItems = [
  "Contact details such as your name, email address, and phone number.",
  "Order and inquiry details, including custom bouquet requests, event dates, delivery instructions, and preferred flowers.",
  "Messages you send through contact or quote forms.",
  "Basic website usage data, such as pages viewed, device information, and referral data if analytics tools are enabled.",
];

const useItems = [
  "Respond to inquiries and provide quotes for bouquets, arrangements, delivery, pickup, weddings, and events.",
  "Process and confirm orders, coordinate substitutions when seasonal flowers are unavailable, and communicate about timing or delivery changes.",
  "Send order updates, follow-up messages, and customer service communications.",
  "Improve the website, forms, and customer experience.",
];

const sharingItems = [
  "Service providers that help us run the website, store data, send email, or process payments.",
  "Delivery partners or staff who need order details to complete a delivery or pickup.",
  "Professional advisors or authorities if required by law or to protect our rights and business.",
];

const rightsItems = [
  "Request access to the personal information we have about you.",
  "Ask us to update or correct information that is inaccurate.",
  "Request that we stop sending marketing messages where applicable.",
  "Contact us if you have questions about how we handled your inquiry or order data.",
];

export default function PrivacyPage() {
  return (
    <main className="public-site min-h-screen">
      <MarketingNav />

      <section className="page-section pt-34 sm:pt-40">
        <div className="public-section-shell relative overflow-hidden px-6 py-10 sm:px-8 sm:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(143,124,255,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(143,124,255,0.08),transparent_34%)]" />
          <div className="relative max-w-3xl">
            <p className="public-accent-kicker text-[11px] font-semibold uppercase tracking-[0.24em]">
              Privacy Policy
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-[var(--public-text)] sm:text-5xl md:text-[4rem] md:leading-[0.98]">
              How we handle customer information
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 public-text-muted sm:text-base">
              This policy explains how we collect and use information for flower orders, delivery details, custom arrangements,
              and event inquiries on this website.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="rounded-[18px] border border-[rgba(143,124,255,0.55)] bg-[linear-gradient(180deg,var(--public-accent)_0%,var(--public-accent-strong)_100%)] !font-bold !text-white shadow-[0_18px_44px_rgba(109,94,248,0.24)] hover:border-[rgba(173,160,255,0.68)] hover:bg-[linear-gradient(180deg,#9b8cff_0%,#7567ff_100%)] [&_svg]:!text-white"
              >
                <Link href="/">
                  Back to home
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-[var(--public-line)] bg-white/74 text-[var(--public-text)] hover:border-[var(--public-line-strong)] hover:bg-[rgba(109,94,248,0.05)] hover:text-[var(--public-text)]"
              >
                <Link href="/terms">View Terms of Service</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="page-section marketing-section pt-8 sm:pt-10">
        <div className="grid gap-4 lg:grid-cols-[1.12fr_0.88fr]">
          <InteractiveGlowCard className="rounded-[30px] border border-[var(--public-line)] bg-[var(--public-surface)] px-5 py-5 sm:px-6 sm:py-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] public-text-faint">What we collect</p>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--public-text)]">
              Information you share with us
            </h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 public-text-muted">
              {collectedItems.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--public-accent)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <h3 className="mt-8 text-xl font-semibold tracking-[-0.03em] text-[var(--public-text)]">
              How we use it
            </h3>
            <ul className="mt-4 space-y-3 text-sm leading-7 public-text-muted">
              {useItems.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--public-accent)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </InteractiveGlowCard>

          <div className="grid gap-4">
            <InteractiveGlowCard className="rounded-[30px] border border-[var(--public-line)] bg-[var(--public-surface)] px-5 py-5 sm:px-6 sm:py-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] public-text-faint">Sharing</p>
              <h2 className="mt-4 text-xl font-semibold tracking-[-0.03em] text-[var(--public-text)]">
                When we share information
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-7 public-text-muted">
                {sharingItems.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--public-accent)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </InteractiveGlowCard>

            <InteractiveGlowCard className="rounded-[30px] border border-[var(--public-line)] bg-[var(--public-surface)] px-5 py-5 sm:px-6 sm:py-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] public-text-faint">Cookies and analytics</p>
              <h2 className="mt-4 text-xl font-semibold tracking-[-0.03em] text-[var(--public-text)]">
                Basic site measurements
              </h2>
              <p className="mt-3 text-sm leading-7 public-text-muted">
                We may use cookies or similar tools to help the website work properly, remember preferences, and understand
                how visitors use the site. If analytics are enabled, they help us improve pages, forms, and customer flow.
              </p>
            </InteractiveGlowCard>
          </div>
        </div>
      </section>

      <section className="page-section marketing-section pt-0">
        <div className="grid gap-4 lg:grid-cols-2">
          <InteractiveGlowCard className="rounded-[30px] border border-[var(--public-line)] bg-[var(--public-surface)] px-5 py-5 sm:px-6 sm:py-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] public-text-faint">Retention and security</p>
            <h2 className="mt-4 text-xl font-semibold tracking-[-0.03em] text-[var(--public-text)]">
              Keeping records only as needed
            </h2>
            <p className="mt-3 text-sm leading-7 public-text-muted">
              We keep inquiry and order information for as long as needed to complete the order, support customer service,
              comply with legal obligations, and maintain our business records. We use reasonable safeguards to protect
              information, but no online system is completely secure.
            </p>
          </InteractiveGlowCard>

          <InteractiveGlowCard className="rounded-[30px] border border-[var(--public-line)] bg-[var(--public-surface)] px-5 py-5 sm:px-6 sm:py-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] public-text-faint">Your choices</p>
            <h2 className="mt-4 text-xl font-semibold tracking-[-0.03em] text-[var(--public-text)]">
              Questions or updates
            </h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 public-text-muted">
              {rightsItems.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--public-accent)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-7 public-text-muted">
              If you have a privacy question or want to update information tied to an order or event inquiry, contact us
              using the business contact details published on the website.
            </p>
          </InteractiveGlowCard>
        </div>
      </section>

      <section className="page-section marketing-section pt-0">
        <div className="public-section-shell relative overflow-hidden px-6 py-10 sm:px-8 sm:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(143,124,255,0.1),transparent_34%)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="public-accent-kicker text-[11px] font-semibold uppercase tracking-[0.24em]">
                Effective date
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--public-text)] sm:text-4xl">
                Last updated May 18, 2026
              </h2>
              <p className="mt-4 text-sm leading-7 public-text-muted sm:text-base">
                This page is designed for a florist or flower shop website and can be edited later if the business changes
                how it collects or uses customer information.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="rounded-[18px] border border-[rgba(143,124,255,0.55)] bg-[linear-gradient(180deg,var(--public-accent)_0%,var(--public-accent-strong)_100%)] !font-bold !text-white shadow-[0_18px_44px_rgba(109,94,248,0.24)] hover:border-[rgba(173,160,255,0.68)] hover:bg-[linear-gradient(180deg,#9b8cff_0%,#7567ff_100%)] [&_svg]:!text-white"
            >
              <Link href="/terms">
                View Terms of Service
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <PublicSiteFooter />
    </main>
  );
}
