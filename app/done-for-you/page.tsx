import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { submitDoneForYouRequestAction } from "@/app/actions";
import { MarketingNav } from "@/components/marketing-nav";
import { PublicSiteFooter } from "@/components/public-site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";

export default async function DoneForYouPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; error?: string }>;
}) {
  const [{ submitted, error }, user, profile] = await Promise.all([
    searchParams,
    getCurrentUser().catch(() => null),
    getCurrentProfile().catch(() => null),
  ]);
  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim();

  return (
    <main className="public-site min-h-screen">
      <MarketingNav />

      <section className="site-container pb-24 pt-36 sm:pb-28 sm:pt-44">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <Link href="/pricing" className="inline-flex items-center gap-2 text-sm font-semibold text-[rgba(15,17,22,0.58)] hover:text-[var(--public-text)]">
              <ArrowLeft className="h-4 w-4" />
              Back to pricing
            </Link>
            <p className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-[#5646ec]">Done for you</p>
            <h1 className="site-h2 mt-3 text-[clamp(2.15rem,1.4rem+3vw,3.55rem)]">
              We set it up. You take the calls.
            </h1>
            <p className="site-lead mt-5 max-w-xl">
              SideKick gives car detailers a plug and play campaign system for more local leads, booked details, and a fuller calendar.
            </p>

            <div className="mt-8 rounded-[24px] border border-[rgba(15,17,22,0.1)] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
              <p className="text-sm font-semibold text-[var(--public-text)]">Done-For-You includes</p>
              <ul className="mt-4 space-y-3 text-sm text-[rgba(15,17,22,0.72)]">
                {[
                  "Workspace setup",
                  "Logo and branding setup",
                  "Campaign setup and launch support",
                  "Lead flow monitoring",
                  "Full visibility without the homework",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5646ec]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-[28px] border border-[rgba(15,17,22,0.1)] bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-8">
            {submitted === "1" ? (
              <div className="space-y-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--public-text)]">
                    We got your request.
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-[rgba(15,17,22,0.62)]">
                    We&apos;ll reach out to help set up your SideKick system.
                  </p>
                </div>
                <Button asChild>
                  <Link href="/pricing">
                    View pricing
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#5646ec]">Apply</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--public-text)]">
                    Tell us about your detailing business
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[rgba(15,17,22,0.62)]">
                    We&apos;ll review your request and follow up with next steps for a managed setup.
                  </p>
                </div>
                {error ? (
                  <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                ) : null}
                <form action={submitDoneForYouRequestAction} className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input name="name" defaultValue={fullName} placeholder="Your name" required maxLength={120} />
                    <Input name="email" type="email" defaultValue={user?.email || ""} placeholder="Email" required maxLength={254} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input name="phone" placeholder="Phone" maxLength={40} />
                    <Input name="businessName" placeholder="Business name" required maxLength={160} />
                  </div>
                  <Input name="businessUrl" placeholder="Website, Instagram, or Facebook link" maxLength={240} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input name="serviceArea" placeholder="City or service area" required maxLength={160} />
                    <Input name="monthlyJobs" placeholder="Current monthly details/jobs" maxLength={120} />
                  </div>
                  <Textarea name="message" placeholder="What should we know before we reach out?" maxLength={1500} rows={5} />
                  <Button type="submit" className="w-full justify-center sm:w-auto">
                    Apply for Done-For-You
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      <PublicSiteFooter />
    </main>
  );
}
