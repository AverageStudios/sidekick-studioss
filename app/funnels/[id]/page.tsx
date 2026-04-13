import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { publishFunnelAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { FunnelRenderer } from "@/components/funnel-renderer";
import { PageHeader } from "@/components/page-header";
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
      <PageHeader
        badge={bundle.funnel.is_published ? "Published" : "Draft"}
        title="Funnel manager"
        description="V1 keeps this simple: one generated funnel, one clean public link, and a focused mobile-first preview."
        actions={
          <>
            {!bundle.funnel.is_published ? (
              <form action={publishFunnelAction}>
                <input type="hidden" name="funnelId" value={bundle.funnel.id} />
                <Button type="submit">Publish funnel</Button>
              </form>
            ) : null}
            <Button asChild variant="outline">
              <Link href={`/f/${bundle.funnel.slug}`} target="_blank">
                Open public funnel
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </>
        }
      />
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
