import Link from "next/link";
import { submitLeadAction } from "@/app/actions";
import { AsyncSubmitButton } from "@/components/ui/async-submit-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function PublicLeadForm({
  funnelSlug,
  campaignId,
  funnelId,
  businessName,
  privacyPolicyHref = "/privacy",
  termsHref = "/terms",
  submitted,
}: {
  funnelSlug: string;
  campaignId: string;
  funnelId: string;
  userId: string;
  businessName: string;
  privacyPolicyHref?: string;
  termsHref?: string;
  submitted?: boolean;
}) {
  if (submitted) {
    return (
      <div className="rounded-[28px] bg-[var(--soft-panel)] p-5 text-sm leading-7 text-[var(--muted-strong)]">
        <p className="font-semibold text-[var(--ink)]">Thanks, you&apos;re in.</p>
        <p className="mt-2">Your request was sent to {businessName}. Expect a follow-up shortly.</p>
      </div>
    );
  }

  return (
    <form action={submitLeadAction} className="space-y-4">
      <input type="hidden" name="funnelSlug" value={funnelSlug} />
      <input type="hidden" name="campaignId" value={campaignId} />
      <input type="hidden" name="funnelId" value={funnelId} />
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">Get your quote</p>
        <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
          Quick lead form
        </h3>
        <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">
          Keep it simple. A short form usually converts best for detailing traffic.
        </p>
      </div>
      <div className="rounded-[22px] bg-[var(--soft-panel)] px-4 py-3 text-sm text-[var(--muted-strong)]">
        Usually best for: name, phone, email, service, and one optional note.
      </div>
      <p className="text-xs leading-6 text-[var(--muted)]">
        By submitting this form, you agree that we may use your information to respond to your request and follow up about your order or inquiry. Read our{" "}
        <Link href={privacyPolicyHref} className="font-medium text-[var(--brand)] hover:underline">
          Privacy Policy
        </Link>
        {" "}and{" "}
        <Link href={termsHref} className="font-medium text-[var(--brand)] hover:underline">
          Terms of Service
        </Link>
        .
      </p>
      <Input name="name" placeholder="Your name" required />
      <Input name="phone" placeholder="Phone number" required />
      <Input name="email" type="email" placeholder="Email address" required />
      <Input name="serviceInterest" placeholder="Service interested in" required />
      <Textarea name="message" placeholder="Optional message" className="min-h-28" />
      <AsyncSubmitButton label="Send my request" pendingLabel="Sending..." size="lg" className="w-full" />
    </form>
  );
}
