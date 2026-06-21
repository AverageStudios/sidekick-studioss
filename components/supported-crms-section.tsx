"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { supportedCrms } from "@/data/supported-crms";
import { cn } from "@/lib/utils";

export function SupportedCrmsSection({
  className,
  eyebrow = "Integrations",
  title = "Connect the CRM your team already uses.",
  subtitle = "SideKick keeps new campaign leads organized in your workspace, then sends them to your connected CRM so your sales process can keep moving.",
  showCta = true,
}: {
  className?: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  showCta?: boolean;
}) {
  return (
    <section id="supported-crms" className={cn("site-container py-24 sm:py-32", className)}>
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--public-accent)]">
          {eyebrow}
        </p>
        <h2 className="site-h2 mt-3">{title}</h2>
        <p className="site-lead mx-auto mt-5">{subtitle}</p>
      </Reveal>

      <div className="mx-auto mt-14 grid max-w-5xl gap-5 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3">
        {supportedCrms.map((crm, index) => (
          <Reveal key={crm.name} className="h-full" delay={Math.min(index % 3, 2) * 0.08} amount={0.2}>
            <div className="group flex h-full flex-col rounded-[18px] border border-[rgba(15,17,22,0.1)] bg-white p-6 shadow-[0_1px_2px_rgba(15,17,22,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_56px_-20px_rgba(21,16,31,0.22)]">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-[rgba(15,17,22,0.08)] bg-white shadow-[0_1px_2px_rgba(15,17,22,0.04)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={crm.logoPath}
                    alt={`${crm.name} logo`}
                    width={28}
                    height={28}
                    loading="lazy"
                    className="h-7 w-7 object-contain"
                  />
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  <Check className="h-3 w-3" strokeWidth={3} />
                  Supported
                </span>
              </div>

              <h3 className="mt-5 text-[16px] font-semibold tracking-[-0.01em] text-[var(--public-text)]">
                {crm.name}
              </h3>
              <p className="site-body mt-2 flex-1">{crm.description}</p>
              <p className="mt-5 text-[13px] font-medium text-[rgba(15,17,22,0.5)]">
                Connect inside Workspace Settings
              </p>
            </div>
          </Reveal>
        ))}
      </div>

      {showCta ? (
        <Reveal className="mt-12 flex justify-center" delay={0.1}>
          <Link href="/signup" className="site-cta-secondary">
            Start free trial
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
      ) : null}
    </section>
  );
}
