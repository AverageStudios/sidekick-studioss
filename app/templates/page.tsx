import Link from "next/link";
import { Folder } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FacebookAdPreview } from "@/components/facebook-ad-preview";
import { resolveTemplateCtaLabel } from "@/data/template-taxonomy";
import { requireUser } from "@/lib/auth";
import { getDashboardSnapshot, getTemplates, getWorkspaceMetaIntegrationForUser } from "@/lib/data";
import { resolveMetaPagePreviewIdentity } from "@/lib/meta-page-identity";

export default async function TemplatesPage() {
  const user = await requireUser();
  const [snapshot, templates, metaIntegration] = await Promise.all([
    getDashboardSnapshot(user.id),
    getTemplates(),
    getWorkspaceMetaIntegrationForUser(user.id),
  ]);
  const pagePreviewIdentity = resolveMetaPagePreviewIdentity({
    integration: metaIntegration,
    fallbackName: "No Facebook Page selected",
  });

  const templateMap = new Map(templates.map((template) => [template.id, template]));
  const draftCampaigns = snapshot.campaigns.filter((campaign) => campaign.status === "draft");
  const publishedCampaigns = snapshot.campaigns.filter((campaign) => campaign.status === "published");
  const hasDrafts = draftCampaigns.length > 0;

  return (
    <AppShell currentPath="/templates">
      <div className="space-y-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[2.2rem] font-semibold tracking-[-0.05em] text-[var(--ink)]">All Campaigns</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Published campaigns running from this workspace.
            </p>
          </div>

          <Button asChild className="rounded-[18px] px-5">
            <Link href="/templates/new">New Campaign</Link>
          </Button>
        </div>

        {publishedCampaigns.length || hasDrafts ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {hasDrafts ? (
              <Link href="/templates/drafts" className="block">
                <Card className="group flex min-h-[12rem] items-center justify-center overflow-hidden rounded-[24px] border-[var(--line)] bg-white px-6 py-6 transition duration-200 hover:shadow-[0_8px_28px_rgba(16,24,40,0.06)]">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <span className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[var(--soft-panel)] text-[var(--brand)] shadow-[0_8px_20px_rgba(109,94,248,0.08)]">
                      <Folder className="h-8 w-8" />
                    </span>
                    <div>
                      <p className="text-[1.1rem] font-semibold tracking-[-0.03em] text-[var(--ink)]">Drafts</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {draftCampaigns.length} saved campaign{draftCampaigns.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ) : null}

            {publishedCampaigns.map((campaign) => {
              const template = templateMap.get(campaign.template_id);

              return (
                <Link key={campaign.id} href={`/campaigns/${campaign.id}`} className="block">
                  <Card className="group max-w-[20rem] overflow-hidden rounded-[24px] border-[var(--line)] bg-white transition duration-200 hover:shadow-[0_8px_28px_rgba(16,24,40,0.06)]">
                    <FacebookAdPreview
                      template={template || undefined}
                      pageName={pagePreviewIdentity.pageName}
                      pageAvatarUrl={pagePreviewIdentity.pageAvatarUrl}
                      primaryText={template?.adCopy.primary || campaign.name}
                      headline={template?.adCopy.headlines?.[0] || campaign.name}
                      description={template?.adCopy.descriptions?.[0] || template?.description || "Campaign preview"}
                      ctaLabel={resolveTemplateCtaLabel(template, "Open")}
                      imageUrl={template?.previewImage || null}
                      compact
                      showMetaBar
                      mediaAspectMode="uniform"
                      className="rounded-none border-0 shadow-none"
                    />

                    <div className="space-y-3 p-4">
                      <div>
                        <h2 className="text-[1.05rem] font-semibold tracking-[-0.02em] text-[var(--ink)]">{campaign.name}</h2>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          Last edited {new Date(campaign.updated_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-[#ecfdf3] px-2.5 py-1 text-[11px] font-medium text-[#15803d]">
                          Live
                        </span>
                        <span className="rounded-full bg-[var(--soft-panel)] px-2.5 py-1 text-[11px] font-medium text-[var(--muted-strong)]">
                          {template?.name || "Campaign"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="rounded-[12px] border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5 text-[11px] text-[var(--muted)]">
                          Open
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card className="max-w-[32rem] rounded-[28px] border-[var(--line)] bg-white p-8 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            <h2 className="text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">No live campaigns yet</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Start a new campaign from a published template and it will show up here once it is published.
            </p>
            <div className="mt-6">
              <Button asChild className="rounded-[18px] px-5">
                <Link href="/templates/new">New Campaign</Link>
              </Button>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
