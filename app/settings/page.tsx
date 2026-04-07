import { AppShell } from "@/components/app-shell";
import { updateSettingsAction } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
      <Card className="p-6">
        <div className="space-y-2">
          <Badge>Settings</Badge>
          <h1 className="text-4xl font-semibold tracking-[-0.06em] text-[var(--ink)]">Business defaults</h1>
          <p className="max-w-2xl text-base leading-7 text-[var(--muted-strong)]">
            Keep your brand and contact info ready so campaign setup stays quick.
          </p>
        </div>
        {saved ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Settings saved.
          </div>
        ) : null}
      </Card>

      <form action={updateSettingsAction}>
        <Card className="grid gap-5 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="businessName" defaultValue={profile?.business_name || ""} placeholder="Business name" required />
            <Input name="location" defaultValue={profile?.location || ""} placeholder="Location" required />
            <Input name="phone" defaultValue={profile?.phone || ""} placeholder="Phone" required />
            <Input name="email" defaultValue={profile?.email || ""} placeholder="Email" required />
            <Input name="brandColor" type="color" defaultValue={profile?.brand_color || "#6D5EF8"} className="h-14 p-2" />
            <Input name="defaultCta" defaultValue={profile?.default_cta || "Get My Quote"} placeholder="Default CTA" />
            <div className="sm:col-span-2">
              <Input name="logo" type="file" accept="image/*" />
            </div>
          </div>
          <Textarea
            name="description"
            defaultValue={profile?.description || ""}
            placeholder="Short business description"
          />
          <div className="flex justify-end">
            <Button type="submit" size="lg">
              Save settings
            </Button>
          </div>
        </Card>
      </form>
    </AppShell>
  );
}
