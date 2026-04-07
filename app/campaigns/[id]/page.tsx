import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
      <Card className="p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Badge>{bundle.template.name}</Badge>
            <h1 className="text-4xl font-semibold tracking-[-0.06em] text-[var(--ink)]">{bundle.campaign.name}</h1>
            <p className="max-w-2xl text-base leading-7 text-[var(--muted-strong)]">
              Your campaign output is ready. Use the copy below, share the funnel link, and keep the launch process simple.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="outline">
              <Link href={`/funnels/${bundle.funnel.id}`}>Open funnel manager</Link>
            </Button>
            <Button asChild>
              <Link href={`/f/${bundle.funnel.slug}`} target="_blank">
                View public funnel
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-6">
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
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-[var(--ink)]">Funnel link</h2>
            <p className="mt-3 rounded-[20px] bg-[var(--soft-panel)] px-4 py-4 text-sm text-[var(--muted-strong)]">
              /f/{bundle.funnel.slug}
            </p>
          </Card>
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-[var(--ink)]">Targeting suggestion</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted-strong)]">{bundle.campaign.ad_copy_json.targeting}</p>
          </Card>
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-[var(--ink)]">Recommended budget</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted-strong)]">{bundle.campaign.ad_copy_json.budget}</p>
          </Card>
          <Card className="p-6">
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

