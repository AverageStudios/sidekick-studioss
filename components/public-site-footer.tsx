import Link from "next/link";
import { Logo } from "@/components/logo";

export function PublicSiteFooter() {
  return (
    <footer className="page-section pb-10 pt-6 sm:pt-8">
      <div className="flex flex-col gap-6 border-t border-[rgba(15,17,22,0.08)] py-8 sm:flex-row sm:items-end sm:justify-between sm:py-9">
        <div className="flex flex-col gap-4">
          <Logo tone="dark" />
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-[rgba(17,18,22,0.88)]">
              Software for small businesses to choose an industry, pick a template, and launch faster.
            </p>
            <p className="text-sm public-text-soft">
              Manage leads and keep follow-up moving from the same SideKick system.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm public-text-soft sm:justify-end">
          <Link href="/product" className="font-medium transition hover:text-[var(--public-text)]">
            Product
          </Link>
          <Link href="/pricing" className="font-medium transition hover:text-[var(--public-text)]">
            Pricing
          </Link>
          <Link href="/product/templates" className="font-medium transition hover:text-[var(--public-text)]">
            Templates
          </Link>
          <Link href="/faq" className="font-medium transition hover:text-[var(--public-text)]">
            FAQ
          </Link>
          <Link href="/login" className="font-medium transition hover:text-[var(--public-text)]">
            Login
          </Link>
          <Link href="/signup" className="font-medium text-[var(--public-text)] transition hover:text-[var(--public-accent)]">
            Start Free Trial
          </Link>
        </div>
      </div>
    </footer>
  );
}
