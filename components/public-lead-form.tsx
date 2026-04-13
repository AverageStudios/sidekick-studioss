import { submitLeadAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function PublicLeadForm({
  funnelSlug,
  campaignId,
  funnelId,
  userId,
  businessName,
  submitted,
}: {
  funnelSlug: string;
  campaignId: string;
  funnelId: string;
  userId: string;
  businessName: string;
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
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="businessName" value={businessName} />
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
      <Input name="name" placeholder="Your name" required />
      <Input name="phone" placeholder="Phone number" required />
      <Input name="email" type="email" placeholder="Email address" required />
      <Input name="serviceInterest" placeholder="Service interested in" required />
      <Textarea name="message" placeholder="Optional message" className="min-h-28" />
      <Button type="submit" size="lg" className="w-full">
        Send my request
      </Button>
    </form>
  );
}
