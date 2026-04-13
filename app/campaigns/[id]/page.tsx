import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { getCampaignBundle } from "@/lib/data";

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const bundle = await getCampaignBundle(user.id, id);

  if (!bundle) {
    notFound();
  }

  return (
    <AppShell currentPath="/dashboard">
      <PageHeader
        badge={bundle.template.name}
        title={bundle.campaign.name}
        description="Your campaign output is ready. Use the copy below, share the funnel link, and keep the launch process simple."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/funnels/${bundle.funnel.id}`}>Open funnel manager</Link>
            </Button>
            <Button asChild>
              <Link href={`/f/${bundle.funnel.slug}`} target="_blank">
                View public funnel
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-6 sm:p-7">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">Primary ad text</p>
          <p className="mt-4 text-base leading-8 text-[var(--muted-strong)]">{bundle.campaign.ad_copy_json.primary}</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <h2 className="text-lg font-semibold text-[var(--ink)]">Headline options</h2>
              <ul className="mt-3 space-y-3">
                {bundle.campaign.ad_copy_json.headlines.map((headline) => (
                  <li key={headline} className="rounded-[20px] bg-[var(--soft-panel)] px-4 py-4 text-sm text-[var(--muted-strong)]">
                    {headline}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--ink)]">Description options</h2>
              <ul className="mt-3 space-y-3">
                {bundle.campaign.ad_copy_json.descriptions.map((description) => (
                  <li key={description} className="rounded-[20px] bg-[var(--soft-panel)] px-4 py-4 text-sm text-[var(--muted-strong)]">
                    {description}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        <div className="grid gap-5">
          <Card className="p-6 sm:p-7">
            <h2 className="text-lg font-semibold text-[var(--ink)]">Funnel link</h2>
            <p className="mt-3 rounded-[20px] bg-[var(--soft-panel)] px-4 py-4 text-sm text-[var(--muted-strong)]">
              /f/{bundle.funnel.slug}
            </p>
          </Card>
          <Card className="p-6 sm:p-7">
            <h2 className="text-lg font-semibold text-[var(--ink)]">Targeting suggestion</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted-strong)]">{bundle.campaign.ad_copy_json.targeting}</p>
          </Card>
          <Card className="p-6 sm:p-7">
            <h2 className="text-lg font-semibold text-[var(--ink)]">Recommended budget</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted-strong)]">{bundle.campaign.ad_copy_json.budget}</p>
          </Card>
          <Card className="p-6 sm:p-7">
            <h2 className="text-lg font-semibold text-[var(--ink)]">Creative guidance</h2>
            <ul className="mt-3 space-y-3">
              {bundle.campaign.ad_copy_json.creativeGuidance.map((item) => (
                <li key={item} className="rounded-[20px] bg-[var(--soft-panel)] px-4 py-4 text-sm text-[var(--muted-strong)]">
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
