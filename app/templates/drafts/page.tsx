import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getDashboardSnapshot, getTemplates } from "@/lib/data";

export default async function DraftCampaignsPage() {
  const user = await requireUser();
  const [snapshot, templates] = await Promise.all([
    getDashboardSnapshot(user.id),
    getTemplates(),
  ]);

  const templateMap = new Map(templates.map((template) => [template.id, template]));
  const draftCampaigns = snapshot.campaigns.filter((campaign) => campaign.status === "draft");

  return (
    <AppShell currentPath="/templates">
      <div className="space-y-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Campaigns</p>
            <h1 className="mt-2 text-[2.2rem] font-semibold tracking-[-0.05em] text-[var(--ink)]">Drafts</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Saved campaigns that are still being edited before they go live.
            </p>
          </div>

          <div className="flex gap-3">
            <Button asChild variant="outline" className="rounded-[18px] px-5">
              <Link href="/templates">Back to campaigns</Link>
            </Button>
            <Button asChild className="rounded-[18px] px-5">
              <Link href="/templates/new">New Campaign</Link>
            </Button>
          </div>
        </div>

        {draftCampaigns.length ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {draftCampaigns.map((campaign) => {
              const template = templateMap.get(campaign.template_id);

              return (
                <Link key={campaign.id} href={`/campaigns/${campaign.id}`} className="block">
                  <Card className="group max-w-[20rem] overflow-hidden rounded-[24px] border-[var(--line)] bg-white transition duration-200 hover:shadow-[0_8px_28px_rgba(16,24,40,0.06)]">
                    <div className="aspect-[16/9] overflow-hidden border-b border-[var(--line)] bg-[var(--soft-panel)]">
                      {template ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={template.previewImage}
                          alt={campaign.name}
                          className="h-full w-full object-cover opacity-90 transition duration-300 group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">
                          Draft preview
                        </div>
                      )}
                    </div>

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
                        <span className="rounded-[12px] border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5 text-[11px] text-[var(--muted)]">
                          Continue editing
                        </span>
                        <MoreHorizontal className="h-4 w-4 text-[var(--muted)]" />
                      </div>
                    </div>
                  </Card>
                </Link>
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
                <Link href="/templates/new">New Campaign</Link>
              </Button>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
