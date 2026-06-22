import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { LazyFacebookAdPreview } from "@/components/lazy-facebook-ad-preview";
import { AsyncSubmitButton } from "@/components/ui/async-submit-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { resolveTemplateCtaLabel } from "@/data/template-taxonomy";
import { deleteDraftCampaignAction } from "@/app/actions";
import { requireProductAccessUser } from "@/lib/auth";
import { getCampaignPreviewDisplayLink, normalizeCampaignLaunchState } from "@/lib/campaign-launch";
import { getTemplates, getWorkspaceCampaignsForUser, getWorkspaceMetaIntegrationForUser } from "@/lib/data";
import { resolveMetaPagePreviewIdentity } from "@/lib/meta-page-identity";

export default async function DraftCampaignsPage() {
  const user = await requireProductAccessUser("/templates/drafts");
  const [campaigns, templates, metaIntegration] = await Promise.all([
    getWorkspaceCampaignsForUser(user.id, false, false),
    getTemplates(),
    getWorkspaceMetaIntegrationForUser(user.id),
  ]);
  const pagePreviewIdentity = resolveMetaPagePreviewIdentity({
    integration: metaIntegration,
    fallbackName: "No Facebook Page selected",
  });

  const templateMap = new Map(templates.map((template) => [template.id, template]));
  const draftCampaigns = campaigns.filter((campaign) => campaign.status === "draft");

  return (
    <AppShell currentPath="/campaigns">
      <div className="space-y-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Campaigns</p>
            <h1 className="mt-2 text-[2.2rem] font-semibold tracking-[-0.05em] text-[var(--ink)]">Drafts</h1>
          </div>

          <div className="flex gap-3">
            <Button asChild variant="outline" className="rounded-[18px] px-5">
              <Link href="/campaigns" prefetch>Back to campaigns</Link>
            </Button>
            <Button asChild className="rounded-[18px] px-5">
              <Link href="/templates/new" prefetch>New Campaign</Link>
            </Button>
          </div>
        </div>

        {draftCampaigns.length ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {draftCampaigns.map((campaign) => {
              const template = templateMap.get(campaign.template_id);
              const launchState = campaign.launch_state_json && template
                ? normalizeCampaignLaunchState(campaign.launch_state_json, template, null)
                : null;
              const displayLink = launchState && template
                ? getCampaignPreviewDisplayLink(launchState, template.displayLink || null)
                : null;

              return (
                <Card key={campaign.id} className="group max-w-[22rem] overflow-hidden rounded-[24px] border-[var(--line)] bg-white transition duration-200 hover:shadow-[0_8px_28px_rgba(16,24,40,0.06)]">
                  <Link href={`/campaigns/${campaign.id}`} prefetch className="block">
                    <LazyFacebookAdPreview
                      template={template || undefined}
                      pageName={pagePreviewIdentity.pageName}
                      pageAvatarUrl={pagePreviewIdentity.pageAvatarUrl}
                      primaryText={campaign.ad_copy_json?.primary || template?.adCopy.primary || campaign.name}
                      headline={campaign.ad_copy_json?.headlines?.[0] || template?.adCopy.headlines?.[0] || campaign.name}
                      description={campaign.ad_copy_json?.descriptions?.[0] || template?.adCopy.descriptions?.[0] || template?.description || "Draft preview"}
                      displayLink={displayLink}
                      ctaLabel={resolveTemplateCtaLabel(template, "Continue")}
                      imageUrl={template?.previewImage || null}
                      placeholderValues={campaign.launch_state_json?.placeholders?.values || {}}
                      compact
                      collapsedPrimaryLines={5}
                      showCompactDescription
                      mediaAspectMode="uniform"
                      className="rounded-none border-0 shadow-none"
                    />
                  </Link>

                  <div className="space-y-3 p-4">
                    <div>
                      <h2 className="text-[1.05rem] font-semibold tracking-[-0.02em] text-[var(--ink)]">{campaign.name}</h2>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        Last edited {new Date(campaign.updated_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-[#fff4e8] px-2.5 py-1 text-[11px] font-medium text-[#9c6328]">
                        Draft
                      </span>
                      <span className="rounded-full bg-[var(--soft-panel)] px-2.5 py-1 text-[11px] font-medium text-[var(--muted-strong)]">
                        {template?.name || "Campaign"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <form action={deleteDraftCampaignAction}>
                        <input type="hidden" name="campaignId" value={campaign.id} />
                        <input type="hidden" name="redirectTo" value="/templates/drafts" />
                        <AsyncSubmitButton
                          label="Delete"
                          pendingLabel="Deleting..."
                          variant="outline"
                          className="h-8 rounded-[12px] border-rose-200 px-3 text-[11px] font-medium text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                        />
                      </form>
                    </div>
                  </div>
                </Card>
              );
              })}
          </div>
        ) : (
          <Card className="max-w-[32rem] rounded-[28px] border-[var(--line)] bg-white p-8 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            <h2 className="text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">No drafts right now</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Start a new campaign and save it as a draft to keep working on it later.
            </p>
            <div className="mt-6">
              <Button asChild className="rounded-[18px] px-5">
                <Link href="/templates/new" prefetch>New Campaign</Link>
              </Button>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
