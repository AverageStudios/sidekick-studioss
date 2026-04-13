import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const coreFeatures = [
  "Choose your industry",
  "Ready-to-go templates",
  "Lead management in one place",
  "Simple outreach and follow-up",
  "14-day free trial",
];

export function PricingBase() {
  return (
    <section className="page-section marketing-section pb-16 pt-34 sm:pb-20 sm:pt-40">
      <div className="mx-auto max-w-2xl space-y-5 text-center">
        <p className="public-accent-kicker text-[11px] font-semibold uppercase tracking-[0.24em]">
          Pricing
        </p>
        <h1 className="text-center text-4xl font-semibold tracking-[-0.06em] text-[var(--public-text)] sm:text-5xl md:text-[4.2rem] md:leading-[0.98]">
          Simple pricing for one clearer system
        </h1>
        <p className="mx-auto max-w-xl text-sm leading-7 public-text-muted sm:text-base">
          Start free, choose your industry, test the templates, and see how SideKick handles leads and follow-up before you commit.
        </p>
      </div>

      <div className="mt-10 flex justify-center md:mt-16">
        <Card className="relative w-full max-w-[34rem] rounded-[34px] border-[var(--public-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(247,243,255,0.82))] text-[var(--public-text)] shadow-[0_0_0_1px_rgba(17,24,39,0.04),0_28px_90px_rgba(17,24,39,0.08)] backdrop-blur-sm">
          <div className="pointer-events-none absolute inset-0 rounded-[34px] bg-[radial-gradient(circle_at_top,rgba(109,94,248,0.1),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(109,94,248,0.06),transparent_38%)]" />

          <span className="absolute inset-x-0 -top-3 mx-auto flex h-7 w-fit items-center rounded-full border border-[rgba(109,94,248,0.18)] bg-[linear-gradient(180deg,rgba(109,94,248,0.16),rgba(109,94,248,0.08))] px-3.5 py-1 text-xs font-medium text-[var(--public-text)] shadow-[0_10px_24px_rgba(109,94,248,0.1)] backdrop-blur-md">
            14-day free trial included
          </span>

          <div className="absolute inset-0 rounded-[34px] shadow-[inset_0_1px_0_rgba(255,255,255,0.96)]" />

          <div className="relative flex h-full flex-col">
            <CardHeader className="items-center p-7 text-center sm:p-8">
              <CardTitle className="text-xl font-medium text-[var(--public-text)]">Core</CardTitle>
              <span className="mt-4 block text-5xl font-semibold tracking-[-0.06em] text-[var(--public-text)] sm:text-6xl">
                $39<span className="ml-1 text-xl font-medium text-[var(--public-muted)] sm:text-2xl">/month</span>
              </span>
              <CardDescription className="mt-4 text-sm public-text-muted">
                Choose your industry, launch faster, and manage leads from one platform.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 px-7 pb-0 pt-0 sm:px-8">
              <div className="border-t border-dashed border-[var(--public-line)]" />
              <ul className="space-y-3.5 text-sm text-[rgba(17,18,22,0.78)]">
                {coreFeatures.map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <Check className="size-4 text-[#b7a8ff]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter className="mt-8 p-7 pt-0 sm:p-8 sm:pt-0">
              <Button
                asChild
                className="w-full rounded-[18px] border border-[rgba(143,124,255,0.55)] bg-[linear-gradient(180deg,var(--public-accent)_0%,var(--public-accent-strong)_100%)] !font-bold !text-white shadow-[0_18px_44px_rgba(109,94,248,0.28)] hover:border-[rgba(173,160,255,0.68)] hover:bg-[linear-gradient(180deg,#9b8cff_0%,#7567ff_100%)] [&_svg]:!text-white"
              >
                <Link href="/signup">Start Free Trial</Link>
              </Button>
            </CardFooter>
          </div>
        </Card>
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm public-text-faint md:mt-16">
        <span>No long-term contracts</span>
        <span className="hidden h-4 w-px bg-[var(--public-line)] md:block" />
        <span>Built for small businesses</span>
        <span className="hidden h-4 w-px bg-[var(--public-line)] md:block" />
        <span>Templates, leads, and outreach in one system</span>
      </div>
    </section>
  );
}
