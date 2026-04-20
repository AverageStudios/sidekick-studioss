import Link from "next/link";
import { ArrowUpRight, BarChart3, CheckCircle2, CircleDashed, Goal, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getDashboardSnapshot, getLeads } from "@/lib/data";
import { CampaignRecord, LeadRecord } from "@/types";

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function buildLeadTrend(leads: LeadRecord[]) {
  const formatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
  const currentWeekStart = startOfWeek(new Date());

  return Array.from({ length: 6 }, (_, index) => {
    const start = addDays(currentWeekStart, (index - 5) * 7);
    const end = addDays(start, 7);
    const count = leads.filter((lead) => {
      const createdAt = new Date(lead.created_at);
      return createdAt >= start && createdAt < end;
    }).length;

    return {
      label: formatter.format(start),
      value: count,
    };
  });
}

function getCampaignRows(campaigns: CampaignRecord[], leads: LeadRecord[]) {
  return campaigns
    .map((campaign) => {
      const campaignLeads = leads.filter((lead) => lead.campaign_id === campaign.id);
      const booked = campaignLeads.filter((lead) => lead.status === "booked").length;

      return {
        id: campaign.id,
        name: campaign.name,
        updatedAt: campaign.updated_at,
        leads: campaignLeads.length,
        booked,
        bookingRate: campaignLeads.length ? Math.round((booked / campaignLeads.length) * 100) : 0,
        status: campaign.status,
      };
    })
    .sort((a, b) => b.leads - a.leads || +new Date(b.updatedAt) - +new Date(a.updatedAt));
}

export default async function PerformancePage() {
  const user = await requireUser();
  const [snapshot, allLeads] = await Promise.all([
    getDashboardSnapshot(user.id),
    getLeads(user.id, "all"),
  ]);

  const publishedCampaigns = snapshot.campaigns.filter((campaign) => campaign.status === "published");
  const draftCampaigns = snapshot.campaigns.filter((campaign) => campaign.status === "draft");
  const leadTrend = buildLeadTrend(allLeads);
  const trendMax = Math.max(...leadTrend.map((point) => point.value), 1);
  const campaignRows = getCampaignRows(publishedCampaigns, allLeads);
  const bookedLeads = allLeads.filter((lead) => lead.status === "booked").length;
  const contactedLeads = allLeads.filter((lead) => lead.status === "contacted").length;
  const closedLeads = allLeads.filter((lead) => lead.status === "closed").length;
  const averageLeadsPerCampaign = publishedCampaigns.length ? (allLeads.length / publishedCampaigns.length).toFixed(1) : "0.0";
  const bookingRate = allLeads.length ? Math.round((bookedLeads / allLeads.length) * 100) : 0;
  const pipelineSegments = [
    { label: "New", value: snapshot.newLeads, tone: "bg-[#dbeafe]" },
    { label: "Contacted", value: contactedLeads, tone: "bg-[#ede9fe]" },
    { label: "Booked", value: bookedLeads, tone: "bg-[#dcfce7]" },
    { label: "Closed", value: closedLeads, tone: "bg-[#fee2e2]" },
  ];
  const pipelineTotal = Math.max(pipelineSegments.reduce((sum, segment) => sum + segment.value, 0), 1);

  return (
    <AppShell currentPath="/performance">
      <div className="space-y-10">
        <PageHeader
          variant="plain"
          badge="Performance"
          title="See how your campaigns are performing"
          description="Track live campaign momentum from one workspace. Meta spend, impressions, clicks, and CTR will drop into this view once Facebook is connected."
          actions={
            <>
              <Button asChild variant="outline">
                <Link href="/templates">Open campaigns</Link>
              </Button>
              <Button asChild>
                <Link href="/templates/new">New campaign</Link>
              </Button>
            </>
          }
        />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Published campaigns",
              value: publishedCampaigns.length,
              note: "Currently running from this workspace",
            },
            {
              label: "Draft campaigns",
              value: draftCampaigns.length,
              note: "Still being prepared before launch",
            },
            {
              label: "Leads captured",
              value: allLeads.length,
              note: `${averageLeadsPerCampaign} avg. per live campaign`,
            },
            {
              label: "Booked leads",
              value: bookedLeads,
              note: `${bookingRate}% booking rate from all leads`,
            },
          ].map((metric) => (
            <Card key={metric.label} className="rounded-[24px] border-[var(--line)] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{metric.label}</p>
              <p className="mt-3 text-[2rem] font-semibold tracking-[-0.05em] text-[var(--ink)]">{metric.value}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">{metric.note}</p>
            </Card>
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(20rem,0.9fr)]">
          <Card className="rounded-[28px] border-[var(--line)] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Lead trend</p>
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">Recent campaign response</h2>
                <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
                  A simple week-by-week view of how many leads your campaigns are pulling in.
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Latest 6 weeks</p>
                <p className="mt-1 text-sm font-medium text-[var(--ink)]">{allLeads.length} total leads</p>
              </div>
            </div>

            <div className="mt-8 flex h-64 items-end gap-3">
              {leadTrend.map((point) => (
                <div key={point.label} className="flex flex-1 flex-col items-center gap-3">
                  <div className="flex h-52 w-full items-end">
                    <div
                      className="w-full rounded-t-[18px] bg-[linear-gradient(180deg,rgba(109,94,248,0.9)_0%,rgba(109,94,248,0.6)_100%)]"
                      style={{ height: `${Math.max((point.value / trendMax) * 100, point.value ? 14 : 4)}%` }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-[var(--ink)]">{point.value}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">{point.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="space-y-5">
            <Card className="rounded-[28px] border-[var(--line)] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-7">
              <div className="flex items-center gap-2">
                <Goal className="h-4.5 w-4.5 text-[var(--brand)]" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Pipeline mix</p>
              </div>
              <h2 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">Where leads are sitting</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                A clean view of how response is moving from new inquiry to booked and closed.
              </p>

              <div className="mt-6 space-y-4">
                {pipelineSegments.map((segment) => {
                  const width = `${Math.max((segment.value / pipelineTotal) * 100, segment.value ? 10 : 4)}%`;

                  return (
                    <div key={segment.label} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-[var(--ink)]">{segment.label}</span>
                        <span className="text-[var(--muted)]">{segment.value}</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-[var(--soft-panel)]">
                        <div className={`h-2.5 rounded-full ${segment.tone}`} style={{ width }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="rounded-[28px] border-[var(--line)] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-7">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-[var(--brand)]" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Meta-ready metrics</p>
              </div>
              <h2 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">Facebook delivery will land here</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Once Meta is connected, this page can layer spend, impressions, clicks, CTR, CPC, and draft publish status on top of the campaign data already shown here.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                {["Spend", "Impressions", "Clicks", "CTR"].map((label) => (
                  <div key={label} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{label}</p>
                    <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">--</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Campaign board</p>
              <h2 className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">Published campaigns</h2>
            </div>
            <Button asChild variant="outline">
              <Link href="/templates">
                View all campaigns
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {campaignRows.length ? (
            <Card className="overflow-hidden rounded-[28px] border-[var(--line)] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
              <div className="divide-y divide-[var(--line)]">
                {campaignRows.map((campaign) => (
                  <Link
                    key={campaign.id}
                    href={`/campaigns/${campaign.id}`}
                    className="flex flex-col gap-4 px-5 py-5 transition-colors hover:bg-[var(--surface)] sm:flex-row sm:items-center sm:justify-between sm:px-6"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-base font-semibold text-[var(--ink)]">{campaign.name}</h3>
                        <span className="rounded-full bg-[#ecfdf3] px-2.5 py-1 text-[11px] font-medium text-[#15803d]">
                          Live
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        Updated {new Date(campaign.updatedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-6 sm:min-w-[18rem]">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Leads</p>
                        <p className="mt-2 text-base font-semibold text-[var(--ink)]">{campaign.leads}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Booked</p>
                        <p className="mt-2 text-base font-semibold text-[var(--ink)]">{campaign.booked}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Rate</p>
                        <p className="mt-2 text-base font-semibold text-[var(--ink)]">{campaign.bookingRate}%</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="rounded-[28px] border-[var(--line)] bg-white p-7 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
              <div className="flex items-start gap-3">
                <CircleDashed className="mt-0.5 h-5 w-5 text-[var(--muted)]" />
                <div>
                  <h3 className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">No published campaigns yet</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                    Launch a campaign and this page will start tracking how many leads it pulls in. Once Meta is connected,
                    Facebook delivery metrics will show here too.
                  </p>
                  <div className="mt-5">
                    <Button asChild>
                      <Link href="/templates/new">Create a campaign</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="rounded-[24px] border-[var(--line)] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4.5 w-4.5 text-[#15803d]" />
                <p className="text-sm font-medium text-[var(--ink)]">Strongest signal today</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                {publishedCampaigns.length
                  ? `${publishedCampaigns.length} live campaign${publishedCampaigns.length === 1 ? "" : "s"} are feeding this workspace, and ${bookedLeads} lead${bookedLeads === 1 ? "" : "s"} already moved into booked.`
                  : "This workspace is ready for campaign reporting as soon as the first campaign is published."}
              </p>
            </Card>

            <Card className="rounded-[24px] border-[var(--line)] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4.5 w-4.5 text-[var(--brand)]" />
                <p className="text-sm font-medium text-[var(--ink)]">What’s next</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                This view is now set up for live Meta reporting. Once Facebook assets are connected, we can layer spend,
                impressions, clicks, and CTR into these campaign rows and charts without changing the overall workflow.
              </p>
            </Card>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
