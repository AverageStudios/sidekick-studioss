import Link from "next/link";
import { Logo } from "@/components/logo";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Templates", href: "/product/templates" },
      { label: "Plug-and-play ads", href: "/product/ads" },
      { label: "Lead capture", href: "/product/lead-capture" },
      { label: "Lead management", href: "/product/lead-management" },
      { label: "Outreach", href: "/product/outreach" },
      { label: "Integrations", href: "/product/integrations" },
      { label: "Supported CRMs", href: "/supported-crms" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Product overview", href: "/product" },
      { label: "Academy", href: "/academy" },
      { label: "Pricing", href: "/pricing" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Log in", href: "/login" },
      { label: "Start free trial", href: "/signup" },
    ],
  },
];

export function PublicSiteFooter() {
  return (
    <footer className="border-t border-[rgba(15,17,22,0.08)]">
      <div className="site-container grid gap-12 py-14 sm:py-16 lg:grid-cols-[1.3fr_1fr_1fr_0.8fr]">
        <div className="max-w-xs">
          <Logo tone="dark" />
          <p className="mt-4 text-sm leading-relaxed text-[rgba(15,17,22,0.62)]">
            Ready-to-launch Meta campaigns, lead capture, and simple follow-up
            for small businesses.
          </p>
        </div>

        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <p className="text-[13px] font-semibold text-[var(--public-text)]">{column.title}</p>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[rgba(15,17,22,0.58)] transition-colors hover:text-[var(--public-text)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-[rgba(15,17,22,0.06)]">
        <div className="site-container flex flex-col gap-3 py-6 text-[13px] text-[rgba(15,17,22,0.5)] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} SideKick Studioss. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="transition-colors hover:text-[var(--public-text)]">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-[var(--public-text)]">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
