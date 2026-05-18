import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { MarketingNav } from "@/components/marketing-nav";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { Button } from "@/components/ui/button";
import { InteractiveGlowCard } from "@/components/ui/interactive-glow-card";

export const metadata: Metadata = {
  title: "Terms of Service | SideKick Studioss",
  description:
    "Terms of Service for a florist website covering orders, custom arrangements, delivery, substitutions, cancellations, and event services.",
};

const sectionGroups = [
  {
    title: "Orders and availability",
    body:
      "By placing an order or sending an inquiry, you agree to the information shown on the website, including pricing, timing, and availability. Fresh flowers are seasonal, and certain blooms may not be available at all times. When necessary, we may substitute flowers or packaging with items of equal or greater value while keeping the overall style and color palette consistent.",
  },
  {
    title: "Custom arrangements and event work",
    body:
      "Custom bouquets, wedding flowers, and event installations may require extra consultation, deposits, or final approval before production begins. Final designs may vary from inspiration images because each arrangement is made with fresh product and seasonal availability in mind. Changes after approval may affect pricing and timing.",
  },
  {
    title: "Delivery and pickup",
    body:
      "Delivery windows, pickup times, and service areas are provided as accurately as possible, but exact timing can be affected by weather, traffic, product availability, or special event schedules. It is the customer's responsibility to provide correct delivery details and a reachable phone number. Additional fees may apply for special delivery requests or same-day handling.",
  },
  {
    title: "Cancellations and refunds",
    body:
      "Because flowers are perishable and many orders are custom-made, cancellations and refunds may be limited once preparation has started or flowers have been purchased. Event and wedding orders often have separate deposit and cancellation terms. If there is a delivery issue or an order concern, please contact us as soon as possible so we can review the situation.",
  },
  {
    title: "Website use",
    body:
      "You may use the site to browse products, submit inquiries, and place orders for legitimate personal or business use. Please do not attempt to interfere with the site, submit false information, or misuse the forms or content. Images, copy, and branding on the site belong to the business or its licensors and may not be reused without permission.",
  },
  {
    title: "Limitations of liability",
    body:
      "To the fullest extent allowed by law, the florist is not responsible for indirect or incidental losses arising from site use, missed delivery windows caused by incorrect information, or variations in natural products. Our liability for any order issue is limited to the amount paid for the applicable product or service, unless the law requires otherwise.",
  },
];

export default function TermsPage() {
  return (
    <main className="public-site min-h-screen">
      <MarketingNav />

      <section className="page-section pt-34 sm:pt-40">
        <div className="public-section-shell relative overflow-hidden px-6 py-10 sm:px-8 sm:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(143,124,255,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(143,124,255,0.08),transparent_34%)]" />
          <div className="relative max-w-3xl">
            <p className="public-accent-kicker text-[11px] font-semibold uppercase tracking-[0.24em]">
              Terms of Service
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-[var(--public-text)] sm:text-5xl md:text-[4rem] md:leading-[0.98]">
              The rules for browsing and placing orders
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 public-text-muted sm:text-base">
              These terms are written for a flower shop or florist website and cover inquiries, custom work, delivery,
              pickup, event orders, and website use.
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
                <Link href="/privacy">View Privacy Policy</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="page-section marketing-section pt-8 sm:pt-10">
        <div className="grid gap-4 lg:grid-cols-2">
          {sectionGroups.map((section) => (
            <InteractiveGlowCard
              key={section.title}
              className="rounded-[30px] border border-[var(--public-line)] bg-[var(--public-surface)] px-5 py-5 sm:px-6 sm:py-6"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] public-text-faint">
                Policy
              </p>
              <h2 className="mt-4 text-xl font-semibold tracking-[-0.03em] text-[var(--public-text)]">
                {section.title}
              </h2>
              <p className="mt-3 text-sm leading-7 public-text-muted">{section.body}</p>
            </InteractiveGlowCard>
          ))}
        </div>
      </section>

      <section className="page-section marketing-section pt-0">
        <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
          <InteractiveGlowCard className="rounded-[30px] border border-[var(--public-line)] bg-[var(--public-surface)] px-5 py-5 sm:px-6 sm:py-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] public-text-faint">Payment and deposits</p>
            <h2 className="mt-4 text-xl font-semibold tracking-[-0.03em] text-[var(--public-text)]">
              Deposits may apply
            </h2>
            <p className="mt-3 text-sm leading-7 public-text-muted">
              Some orders, especially weddings and larger events, may require a deposit or advance payment to reserve design
              time, product, and delivery space. Any remaining balance must be paid according to the terms provided at the time
              of booking or invoicing.
            </p>
          </InteractiveGlowCard>

          <InteractiveGlowCard className="rounded-[30px] border border-[var(--public-line)] bg-[var(--public-surface)] px-5 py-5 sm:px-6 sm:py-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] public-text-faint">Questions and updates</p>
            <h2 className="mt-4 text-xl font-semibold tracking-[-0.03em] text-[var(--public-text)]">
              Need to change an order?
            </h2>
            <p className="mt-3 text-sm leading-7 public-text-muted">
              If you need to change delivery details, timing, recipient information, or event specs, contact us as soon as
              possible. We will do our best to help, but changes may not be possible once the order has been prepared or
              dispatched.
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
                These terms can be revised if the flower shop changes its ordering process, delivery policy, cancellation
                rules, or event service terms.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="rounded-[18px] border border-[rgba(143,124,255,0.55)] bg-[linear-gradient(180deg,var(--public-accent)_0%,var(--public-accent-strong)_100%)] !font-bold !text-white shadow-[0_18px_44px_rgba(109,94,248,0.24)] hover:border-[rgba(173,160,255,0.68)] hover:bg-[linear-gradient(180deg,#9b8cff_0%,#7567ff_100%)] [&_svg]:!text-white"
            >
              <Link href="/privacy">
                View Privacy Policy
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
