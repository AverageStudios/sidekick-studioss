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
      <div className="mb-5 space-y-2">
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
        description="These details personalize your campaign instance without changing the master template."
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
        description="Customize the offer essentials people see first so the template fits your business."
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
        description="Add the brand details and proof assets that make the campaign instance feel like your business."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[22px] bg-[var(--soft-panel)] p-3">
            <label className="mb-2 block text-sm font-medium text-[var(--ink)]">Brand color</label>
            <Input name="brandColor" type="color" defaultValue={profile?.brand_color || "#6D5EF8"} className="h-12 p-2" />
          </div>
          <div className="rounded-[22px] border border-[var(--line)] bg-white/82 p-4">
            <label className="mb-2 block text-sm font-medium text-[var(--ink)]">Logo upload</label>
            <Input name="logo" type="file" accept="image/*" />
          </div>
          <div className="rounded-[22px] border border-[var(--line)] bg-white/82 p-4">
            <label className="mb-2 block text-sm font-medium text-[var(--ink)]">Before image</label>
            <Input name="before1" type="file" accept="image/*" />
          </div>
          <div className="rounded-[22px] border border-[var(--line)] bg-white/82 p-4">
            <label className="mb-2 block text-sm font-medium text-[var(--ink)]">After image</label>
            <Input name="after1" type="file" accept="image/*" />
          </div>
          <div className="rounded-[22px] border border-[var(--line)] bg-white/82 p-4">
            <label className="mb-2 block text-sm font-medium text-[var(--ink)]">Optional extra before image</label>
            <Input name="before2" type="file" accept="image/*" />
          </div>
          <div className="rounded-[22px] border border-[var(--line)] bg-white/82 p-4 sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-[var(--ink)]">Optional extra after image</label>
            <Input name="after2" type="file" accept="image/*" />
          </div>
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
        description="One believable testimonial is enough to help the template feel real and trustworthy."
      >
        <Textarea name="testimonialText" placeholder="Optional testimonial text" />
      </SetupSection>

      <SetupSection
        title="Launch settings"
        description="Choose whether you want to launch now or save the campaign instance as a draft and come back."
      >
        <div className="flex flex-col gap-4 rounded-[24px] bg-[var(--soft-panel)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-[var(--ink)]">Send confirmation email</p>
            <p className="text-sm text-[var(--muted)]">Optional confirmation email after a lead submits.</p>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-[var(--muted-strong)]">
            <input
              type="checkbox"
              name="followUpEnabled"
              defaultChecked
              className="h-4 w-4 rounded border-[var(--line)] text-[var(--brand)] focus:ring-2 focus:ring-[var(--soft-brand)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]"
            />
            Enabled
          </label>
        </div>
      </SetupSection>

      <div className="flex flex-col gap-4 rounded-[28px] border border-[var(--line)] bg-white/80 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Badge>{template.category}</Badge>
          <p className="mt-2 text-lg font-semibold text-[var(--ink)]">{template.name}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">This creates your own campaign instance from the published master template.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" name="intent" value="draft" size="lg" variant="outline">
            Save draft
          </Button>
          <Button type="submit" name="intent" value="launch" size="lg">
            Create and launch
          </Button>
        </div>
      </div>
    </form>
  );
}
