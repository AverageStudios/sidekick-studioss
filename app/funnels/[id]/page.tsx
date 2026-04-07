import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { publishFunnelAction } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FunnelRenderer } from "@/components/funnel-renderer";
import { PublicLeadForm } from "@/components/public-lead-form";
import { requireUser } from "@/lib/auth";
import { getFunnelBundleById } from "@/lib/data";

export default async function FunnelManagerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const bundle = await getFunnelBundleById(user.id, id);

  if (!bundle) {
    notFound();
  }

  return (
    <AppShell currentPath="/dashboard">
      <Card className="p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Badge>{bundle.funnel.is_published ? "Published" : "Draft"}</Badge>
            <h1 className="text-4xl font-semibold tracking-[-0.06em] text-[var(--ink)]">Funnel manager</h1>
            <p className="max-w-2xl text-base leading-7 text-[var(--muted-strong)]">
              V1 keeps this simple: one generated funnel, one clean public link, and a focused mobile-first preview.
            </p>
          </div>
          <div className="flex gap-3">
            {!bundle.funnel.is_published ? (
              <form action={publishFunnelAction}>
                <input type="hidden" name="funnelId" value={bundle.funnel.id} />
                <Button type="submit">Publish funnel</Button>
              </form>
            ) : null}
            <Button asChild variant="outline">
              <Link href={`/f/${bundle.funnel.slug}`} target="_blank">
                Open public funnel
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </Card>
      <FunnelRenderer
        config={bundle.funnel.config_json as never}
        showLeadForm={
          <PublicLeadForm
            funnelSlug={bundle.funnel.slug}
            campaignId={bundle.campaign.id}
            funnelId={bundle.funnel.id}
            userId={bundle.campaign.user_id}
            businessName={(bundle.funnel.config_json as { businessName?: string }).businessName || bundle.campaign.name}
          />
        }
      />
    </AppShell>
  );
}
