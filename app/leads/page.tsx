import Link from "next/link";
import { AlertCircle, RefreshCcw, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { LeadsTable } from "@/components/leads-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { requireUser } from "@/lib/auth";
import { getLeadInboxData } from "@/lib/data";
import { getCanonicalLeadStatus } from "@/lib/leads";
import { cn } from "@/lib/utils";
import { syncMetaLeadsAction } from "@/app/actions";

const filters = ["all", "new", "contacted", "qualified", "closed", "archived"] as const;

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    q?: string;
    campaign?: string;
    range?: string;
    leadId?: string;
    error?: string;
    synced?: string;
  }>;
}) {
  const user = await requireUser();
  const {
    status = "all",
    q = "",
    campaign = "",
    range = "30d",
    leadId = "",
    error = "",
    synced = "",
  } = await searchParams;
  const inbox = await getLeadInboxData(user.id, {
    status,
    query: q,
    campaignId: campaign,
    dateRange: range,
    leadId,
  });

  const leadCounts = {
    new: inbox.allLeads.filter((lead) => getCanonicalLeadStatus(lead.status) === "new").length,
    contacted: inbox.allLeads.filter((lead) => getCanonicalLeadStatus(lead.status) === "contacted").length,
    qualified: inbox.allLeads.filter((lead) => getCanonicalLeadStatus(lead.status) === "qualified").length,
    closed: inbox.allLeads.filter((lead) => getCanonicalLeadStatus(lead.status) === "closed").length,
    archived: inbox.allLeads.filter((lead) => getCanonicalLeadStatus(lead.status) === "archived").length,
  };

  return (
    <AppShell currentPath="/leads">
      <div className="space-y-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <form action={syncMetaLeadsAction}>
              <input type="hidden" name="redirectTo" value="/leads" />
              <input type="hidden" name="mode" value="incremental" />
              <Button type="submit" variant="outline" className="bg-white/84">
                <RefreshCcw className="h-4 w-4" />
                Sync Meta leads
              </Button>
            </form>
            <form action={syncMetaLeadsAction}>
              <input type="hidden" name="redirectTo" value="/leads" />
              <input type="hidden" name="mode" value="backfill" />
              <Button type="submit" variant="secondary">
                Backfill older leads
              </Button>
            </form>
          </div>
        </div>

        {error ? (
          <Card className="rounded-[24px] border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 shadow-none">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4.5 w-4.5 shrink-0" />
              <div>
                <p className="font-semibold">Lead sync needs attention</p>
                <p className="mt-1 leading-6">{error}</p>
              </div>
            </div>
          </Card>
        ) : null}

        {synced ? (
          <Card className="rounded-[24px] border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 shadow-none">
            <p className="font-semibold">Meta lead sync completed.</p>
            <p className="mt-1 leading-6">The inbox has been refreshed with the latest available lead data from Meta.</p>
          </Card>
        ) : null}

        {inbox.syncHealth?.connected ? (
          inbox.syncHealth.canReadLeads && inbox.syncHealth.webhookSubscriptionReady ? (
            <Card className="rounded-[24px] border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 shadow-none">
              <p className="font-semibold">Automatic Meta lead sync is active.</p>
              <p className="mt-1 leading-6">
                New Meta instant-form leads should flow into this inbox automatically
                {inbox.syncHealth.lastWorkspaceSyncAt ? ` and were last checked ${new Date(inbox.syncHealth.lastWorkspaceSyncAt).toLocaleString()}.` : "."}
              </p>
            </Card>
          ) : (
            <Card className="rounded-[24px] border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-none">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">Automatic Meta lead sync still needs attention.</p>
                  <p className="mt-1 leading-6">
                    {inbox.syncHealth.requiredScopesMissing.length
                      ? `Missing Meta scopes: ${inbox.syncHealth.requiredScopesMissing.join(", ")}.`
                      : !inbox.syncHealth.currentScopes.includes("leads_retrieval")
                        ? "SideKick can still run recovery lead syncs, but true real-time webhook delivery needs Meta app approval for leads_retrieval."
                      : inbox.syncHealth.selectedPageId
                        ? "The selected Page still needs webhook subscription or a recovery sync to finalize automatic lead delivery."
                        : "Select a Facebook Page in Meta integrations to finish automatic lead sync."}
                  </p>
                </div>
                {inbox.syncHealth.requiredScopesMissing.length ? (
                  <Button asChild variant="outline" className="shrink-0 bg-white/80">
                    <Link href={inbox.reconnectUrl}>Reconnect Meta</Link>
                  </Button>
                ) : null}
              </div>
            </Card>
          )
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { label: "New", value: leadCounts.new, tone: "bg-[#eef4ff] text-[#3559a7]" },
            { label: "Contacted", value: leadCounts.contacted, tone: "bg-[#fff4e8] text-[#9c6328]" },
            { label: "Qualified", value: leadCounts.qualified, tone: "bg-[#ebf8ef] text-[#2f6a4b]" },
            { label: "Closed", value: leadCounts.closed, tone: "bg-[#f1f2f4] text-[#596273]" },
            { label: "Archived", value: leadCounts.archived, tone: "bg-[#f6f7f9] text-[#667085]" },
          ].map((card) => (
            <Card key={card.label} className="rounded-[24px] border-[var(--line)] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{card.label}</p>
              <p className="mt-3 text-[2rem] font-semibold tracking-[-0.05em] text-[var(--ink)]">{card.value}</p>
              <div className={cn("mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold", card.tone)}>
                {card.label} leads
              </div>
            </Card>
          ))}
        </section>

        <form action="/leads" className="grid gap-4 rounded-[28px] border border-[var(--line)] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.03)] lg:grid-cols-[minmax(0,1.3fr)_minmax(12rem,0.8fr)_minmax(11rem,0.8fr)_auto]">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--ink)]">Search leads</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              <Input name="q" defaultValue={q} placeholder="Search by name, email, phone, or form" className="pl-11" />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--ink)]">Campaign</label>
            <Select name="campaign" defaultValue={campaign} className="h-12 rounded-[20px] border-[var(--line)] bg-white/92">
              <option value="">All campaigns</option>
              {inbox.campaigns.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--ink)]">Date range</label>
            <Select name="range" defaultValue={range} className="h-12 rounded-[20px] border-[var(--line)] bg-white/92">
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="all">All time</option>
            </Select>
          </div>
          <div className="flex items-end gap-3">
            <Button type="submit" className="w-full lg:w-auto">Apply filters</Button>
          </div>
          {status !== "all" ? <input type="hidden" name="status" value={status} /> : null}
        </form>

        <div className="flex items-center gap-0.5 border-b border-[var(--line)]">
          {filters.map((filter) => {
            const params = new URLSearchParams();
            if (filter !== "all") params.set("status", filter);
            if (q) params.set("q", q);
            if (campaign) params.set("campaign", campaign);
            if (range && range !== "30d") params.set("range", range);
            const href = `/leads${params.toString() ? `?${params.toString()}` : ""}`;

            return (
              <Link
                key={filter}
                href={href}
                className={cn(
                  "relative px-3 py-2 text-sm font-medium capitalize transition-colors duration-150",
                  filter === status ? "text-[var(--ink)]" : "text-[var(--muted)] hover:text-[var(--ink)]",
                )}
              >
                {filter}
                {filter === status ? (
                  <span className="absolute inset-x-3 -bottom-[1px] h-[2px] rounded-full bg-[var(--brand)]" />
                ) : null}
              </Link>
            );
          })}
        </div>

        <LeadsTable
          leads={inbox.leads}
          selectedLead={inbox.selectedLead}
          campaigns={inbox.campaigns}
          currentFilters={{
            status,
            q,
            campaign,
            range,
          }}
        />
      </div>
    </AppShell>
  );
}
