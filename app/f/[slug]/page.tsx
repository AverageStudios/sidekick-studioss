import { notFound } from "next/navigation";
import { FunnelRenderer } from "@/components/funnel-renderer";
import { PublicLeadForm } from "@/components/public-lead-form";
import { getFunnelBySlug } from "@/lib/data";

export default async function PublicFunnelPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { slug } = await params;
  const { submitted } = await searchParams;
  const bundle = await getFunnelBySlug(slug);

  if (!bundle) {
    notFound();
  }

  const funnelConfig = bundle.funnel.config_json as { businessName?: string };

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
      <FunnelRenderer
        config={bundle.funnel.config_json as never}
        showLeadForm={
          <PublicLeadForm
            funnelSlug={bundle.funnel.slug}
            campaignId={bundle.campaign.id}
            funnelId={bundle.funnel.id}
            userId={bundle.campaign.user_id}
            businessName={funnelConfig.businessName || bundle.campaign.name}
            submitted={submitted === "1"}
          />
        }
      />
    </main>
  );
}

