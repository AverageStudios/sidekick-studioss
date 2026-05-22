import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { archiveCampaignAction, pauseCampaignAction, resumeCampaignAction, syncCampaignStatusAction } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { getCampaignBundle } from "@/lib/data";
import {
  getCampaignLastSyncedAt,
  getCampaignLifecycleLabel,
  getCampaignLifecycleState,
  getCampaignMetaIdentifiers,
  getCampaignSyncState,
} from "@/lib/campaign-management";
import { cn } from "@/lib/utils";

export default async function CampaignPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const user = await requireUser();
  const bundle = await getCampaignBundle(user.id, id);

  if (!bundle) {
    notFound();
  }

  const lifecycleState = getCampaignLifecycleState(bundle.campaign);
  const lifecycleLabel = getCampaignLifecycleLabel(bundle.campaign);
  const metaIds = getCampaignMetaIdentifiers(bundle.campaign);
  const redirectTo = `/campaigns/${bundle.campaign.id}`;
  const hasMetaIds = Boolean(metaIds.campaignId || metaIds.adSetId || metaIds.adId || metaIds.leadFormId);
  const canPause = lifecycleState === "active";
  const canResume = lifecycleState === "paused";
  const canArchive = lifecycleState === "active" || lifecycleState === "paused" || lifecycleState === "unknown";
  const openInMetaHref = "https://business.facebook.com/adsmanager";
  const lastSyncedAt = getCampaignLastSyncedAt(bundle.campaign);
  const syncState = getCampaignSyncState(bundle.campaign);

  const description =
    lifecycleState === "draft"
      ? "Your campaign instance is saved as a draft. Review the copy, finish the funnel details, and publish when you are ready."
      : lifecycleState === "paused"
        ? "This launched campaign is currently paused. Resume it when you want Meta to spend again."
        : lifecycleState === "archived"
          ? "This campaign is archived locally for history and troubleshooting. It stays out of the active views."
          : lifecycleState === "unknown"
            ? "This launched campaign needs a fresh Meta status sync before the app can confidently label it active or paused."
            : "Your launched campaign is active. Use the controls below to pause, archive, or inspect the launch metadata.";

  return (
    <AppShell currentPath="/dashboard">
      {query.success ? (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {query.success}
        </div>
      ) : null}
      {query.error ? (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {query.error}
        </div>
      ) : null}

      <PageHeader
        badge={bundle.template.name}
        title={bundle.campaign.name}
        description={description}
        actions={
          <>
            {bundle.campaign.status === "draft" ? (
              <Button asChild variant="outline">
                <Link href={`/templates/new?draft=${bundle.campaign.id}`}>Continue launch wizard</Link>
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href={`/funnels/${bundle.funnel.id}`}>Open funnel manager</Link>
              </Button>
            )}
            {hasMetaIds ? (
              <Button asChild variant="outline">
                <Link href={openInMetaHref} target="_blank" rel="noreferrer">
                  Open in Meta
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            ) : null}
            {bundle.funnel.is_published ? (
              <Button asChild>
                <Link href={`/f/${bundle.funnel.slug}`} target="_blank">
                  View public funnel
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/templates">Choose another template</Link>
              </Button>
            )}
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
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">Campaign status</p>
                <h2 className="mt-3 text-lg font-semibold text-[var(--ink)]">{lifecycleLabel}</h2>
              </div>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium",
                  lifecycleState === "active"
                    ? "bg-emerald-50 text-emerald-700"
                    : lifecycleState === "paused"
                      ? "bg-amber-50 text-amber-700"
                      : lifecycleState === "archived"
                        ? "bg-slate-100 text-slate-600"
                        : "bg-[var(--soft-panel)] text-[var(--ink)]",
                )}
              >
                {lifecycleLabel}
              </span>
            </div>

            <div className="mt-5 space-y-2 text-sm text-[var(--muted-strong)]">
              <p>
                <span className="font-medium text-[var(--ink)]">Published:</span>{" "}
                {bundle.campaign.published_at ? new Date(bundle.campaign.published_at).toLocaleString() : "Not yet"}
              </p>
              <p>
                <span className="font-medium text-[var(--ink)]">Archived:</span>{" "}
                {bundle.campaign.archived_at ? new Date(bundle.campaign.archived_at).toLocaleString() : "Not archived"}
              </p>
              <p>
                <span className="font-medium text-[var(--ink)]">External status:</span>{" "}
                {bundle.campaign.external_publish_status || "Not started"}
              </p>
              <p>
                <span className="font-medium text-[var(--ink)]">Meta effective status:</span>{" "}
                {bundle.campaign.meta_effective_status || "Unknown"}
              </p>
              <p>
                <span className="font-medium text-[var(--ink)]">Last synced:</span>{" "}
                {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : "Not synced yet"}
              </p>
              <p>
                <span className="font-medium text-[var(--ink)]">Sync state:</span>{" "}
                {syncState === "synced"
                  ? "Synced"
                  : syncState === "stale"
                    ? "Stale"
                    : syncState === "error"
                      ? "Sync error"
                      : syncState === "unknown"
                        ? "Unknown"
                        : "Not live"}
              </p>
              <p>
                <span className="font-medium text-[var(--ink)]">Workspace:</span> {bundle.campaign.workspace_id || "No workspace"}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {bundle.campaign.status === "published" ? (
                <form action={syncCampaignStatusAction}>
                  <input type="hidden" name="campaignId" value={bundle.campaign.id} />
                  <input type="hidden" name="redirectTo" value={redirectTo} />
                  <Button type="submit" variant="outline">
                    Refresh Meta status
                  </Button>
                </form>
              ) : null}
              {canPause ? (
                <form action={pauseCampaignAction}>
                  <input type="hidden" name="campaignId" value={bundle.campaign.id} />
                  <input type="hidden" name="redirectTo" value={redirectTo} />
                  <Button type="submit" variant="outline">
                    Pause campaign
                  </Button>
                </form>
              ) : null}
              {canResume ? (
                <form action={resumeCampaignAction}>
                  <input type="hidden" name="campaignId" value={bundle.campaign.id} />
                  <input type="hidden" name="redirectTo" value={redirectTo} />
                  <Button type="submit">
                    Resume campaign
                  </Button>
                </form>
              ) : null}
              {canArchive ? (
                <form action={archiveCampaignAction}>
                  <input type="hidden" name="campaignId" value={bundle.campaign.id} />
                  <input type="hidden" name="redirectTo" value={redirectTo} />
                  <Button
                    type="submit"
                    variant="outline"
                    className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                  >
                    Archive campaign
                  </Button>
                </form>
              ) : null}
            </div>
          </Card>

          <Card className="p-6 sm:p-7">
            <h2 className="text-lg font-semibold text-[var(--ink)]">Funnel link</h2>
            <p className="mt-3 rounded-[20px] bg-[var(--soft-panel)] px-4 py-4 text-sm text-[var(--muted-strong)]">
              {bundle.funnel.is_published ? `/f/${bundle.funnel.slug}` : "This funnel is still in draft mode."}
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

          <Card className="p-6 sm:p-7">
            <h2 className="text-lg font-semibold text-[var(--ink)]">Meta IDs</h2>
            <div className="mt-4 space-y-3 text-sm text-[var(--muted-strong)]">
              <p>
                <span className="font-medium text-[var(--ink)]">Campaign:</span> {metaIds.campaignId || "Not saved"}
              </p>
              <p>
                <span className="font-medium text-[var(--ink)]">Ad set:</span> {metaIds.adSetId || "Not saved"}
              </p>
              <p>
                <span className="font-medium text-[var(--ink)]">Ad:</span> {metaIds.adId || "Not saved"}
              </p>
              <p>
                <span className="font-medium text-[var(--ink)]">Lead form:</span> {metaIds.leadFormId || "Not saved"}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
