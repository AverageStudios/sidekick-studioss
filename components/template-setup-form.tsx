import { createCampaignAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { TemplateSeed, BusinessProfile } from "@/types";

function SetupSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5 space-y-1">
        <h3 className="text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">{title}</h3>
        <p className="text-sm leading-6 text-[var(--muted-strong)]">{description}</p>
      </div>
      {children}
    </Card>
  );
}

export function TemplateSetupForm({
  template,
  profile,
}: {
  template: TemplateSeed;
  profile: BusinessProfile | null;
}) {
  return (
    <form action={createCampaignAction} className="grid gap-5">
      <input type="hidden" name="templateSlug" value={template.slug} />
      <SetupSection
        title="Business info"
        description="Keep this tight. These fields drive the page copy, lead flow, and confirmation messages."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input name="businessName" defaultValue={profile?.business_name || ""} placeholder="Business name" required />
          <Input name="city" defaultValue={profile?.location || ""} placeholder="City or service area" required />
          <Input name="phone" defaultValue={profile?.phone || ""} placeholder="Phone number" required />
          <Input name="email" defaultValue={profile?.email || ""} placeholder="Email address" required />
        </div>
      </SetupSection>

      <SetupSection
        title="Offer"
        description="Simple fields only. Enough to launch a convincing detail offer without building anything custom."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input name="offerPrice" placeholder="Offer price" defaultValue="179" />
          <Input name="regularPrice" placeholder="Regular price" defaultValue="249" />
          <Input name="ctaText" placeholder="CTA text" defaultValue={profile?.default_cta || template.ctaDefault} />
          <Input name="headline" placeholder="Headline override (optional)" />
        </div>
        <div className="mt-4">
          <Input name="subheadline" placeholder="Subheadline override (optional)" />
        </div>
      </SetupSection>

      <SetupSection
        title="Branding"
        description="Add just enough brand detail to make the funnel feel like your shop, not a generic template."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input name="brandColor" type="color" defaultValue={profile?.brand_color || "#6D5EF8"} className="h-14 p-2" />
          <Input name="logo" type="file" accept="image/*" />
          <Input name="before1" type="file" accept="image/*" />
          <Input name="after1" type="file" accept="image/*" />
          <Input name="before2" type="file" accept="image/*" />
          <Input name="after2" type="file" accept="image/*" />
        </div>
        <div className="mt-4">
          <Textarea
            name="businessDescription"
            defaultValue={profile?.description || ""}
            placeholder="Short business description"
          />
        </div>
      </SetupSection>

      <SetupSection
        title="Social proof"
        description="Keep it short. One believable testimonial is enough to add trust to a paid traffic page."
      >
        <Textarea name="testimonialText" placeholder="Optional testimonial text" />
      </SetupSection>

      <SetupSection
        title="Publish settings"
        description="V1 follow-up stays intentionally lightweight so detailers can move fast."
      >
        <div className="flex items-center justify-between rounded-[24px] bg-[var(--soft-panel)] px-4 py-4">
          <div>
            <p className="font-medium text-[var(--ink)]">Send confirmation email</p>
            <p className="text-sm text-[var(--muted)]">Optional confirmation email after a lead submits.</p>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-[var(--muted-strong)]">
            <input type="checkbox" name="followUpEnabled" defaultChecked className="h-4 w-4" />
            Enabled
          </label>
        </div>
      </SetupSection>

      <div className="flex items-center justify-between rounded-[28px] border border-[var(--line)] bg-white/75 p-5">
        <div>
          <Badge>{template.category}</Badge>
          <p className="mt-2 text-lg font-semibold text-[var(--ink)]">{template.name}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Generate campaign assets and a published funnel in one step.</p>
        </div>
        <Button type="submit" size="lg">
          Create campaign
        </Button>
      </div>
    </form>
  );
}

