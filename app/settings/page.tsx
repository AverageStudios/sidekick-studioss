import { AppShell } from "@/components/app-shell";
import { updateSettingsAction } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import { Textarea } from "@/components/ui/textarea";
import { requireUser } from "@/lib/auth";
import { getBusinessProfile } from "@/lib/data";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await requireUser();
  const profile = await getBusinessProfile(user.id);
  const { saved } = await searchParams;

  return (
    <AppShell currentPath="/settings">
      <PageHeader
        badge="Settings"
        title="Business defaults"
        description="Keep your brand and contact info ready so campaign setup stays quick."
      />
      {saved ? (
        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Settings saved.
        </div>
      ) : null}

      <form action={updateSettingsAction}>
        <div className="grid gap-5 lg:gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="grid gap-5 lg:gap-6">
            <Card className="p-6 sm:p-7">
              <div className="mb-5">
                <Badge>Business info</Badge>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">Shop basics</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input name="businessName" defaultValue={profile?.business_name || ""} placeholder="Business name" required />
                <Input name="location" defaultValue={profile?.location || ""} placeholder="Location" required />
              </div>
              <div className="mt-[1.125rem]">
                <Textarea
                  name="description"
                  defaultValue={profile?.description || ""}
                  placeholder="Short business description"
                />
              </div>
            </Card>

            <Card className="p-6 sm:p-7">
              <div className="mb-5">
                <Badge>Contact defaults</Badge>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">Lead response details</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input name="phone" defaultValue={profile?.phone || ""} placeholder="Phone" required />
                <Input name="email" defaultValue={profile?.email || ""} placeholder="Email" required />
                <div className="sm:col-span-2">
                  <Input name="defaultCta" defaultValue={profile?.default_cta || "Get My Quote"} placeholder="Default CTA" />
                </div>
              </div>
            </Card>
          </div>

          <div className="grid gap-5 lg:gap-6">
            <Card className="p-6 sm:p-7">
              <div className="mb-5">
                <Badge>Branding</Badge>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">Logo and color</h2>
              </div>
              <div className="grid gap-5">
                <div className="rounded-[24px] bg-[var(--soft-panel)] p-4">
                  <label className="mb-2 block text-sm font-medium text-[var(--ink)]">Brand color</label>
                  <Input
                    name="brandColor"
                    type="color"
                    defaultValue={profile?.brand_color || "#6D5EF8"}
                    className="h-14 p-2"
                  />
                </div>
                <div className="rounded-[24px] bg-[var(--soft-panel)] p-4">
                  <label className="mb-2 block text-sm font-medium text-[var(--ink)]">Logo upload</label>
                  <Input name="logo" type="file" accept="image/*" />
                </div>
              </div>
            </Card>

            <Card className="p-6 sm:p-7">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">Save and keep moving</h2>
                <p className="text-sm leading-6 text-[var(--muted-strong)]">
                  These defaults prefill your next campaign so setup stays fast.
                </p>
              </div>
              <div className="mt-6 flex justify-end">
                <Button type="submit" size="lg">
                  Save settings
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </AppShell>
  );
}
