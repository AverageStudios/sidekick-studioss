import Link from "next/link";
import { ArrowUpRight, FileText, Phone, UserCircle2 } from "lucide-react";
import { updateLeadNotesAction, updateLeadStatusAction } from "@/app/actions";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";
import { getLeadContactSummary, getLeadDisplayName, getLeadSubmittedAt, getLeadStatusLabel, leadStatusOptions } from "@/lib/leads";
import { getLeadFieldAnswers } from "@/lib/meta-leads";
import { CampaignRecord, LeadRecord } from "@/types";

function buildLeadHref(
  leadId: string,
  currentFilters: {
    status?: string;
    q?: string;
    campaign?: string;
    range?: string;
  },
) {
  const params = new URLSearchParams();
  if (currentFilters.status && currentFilters.status !== "all") params.set("status", currentFilters.status);
  if (currentFilters.q) params.set("q", currentFilters.q);
  if (currentFilters.campaign) params.set("campaign", currentFilters.campaign);
  if (currentFilters.range && currentFilters.range !== "30d") params.set("range", currentFilters.range);
  params.set("leadId", leadId);
  return `/leads?${params.toString()}`;
}

function getCampaignName(lead: LeadRecord, campaigns: CampaignRecord[]) {
  if (!lead.campaign_id) {
    return lead.meta_form_name || "Unmatched Meta lead";
  }
  return campaigns.find((campaign) => campaign.id === lead.campaign_id)?.name || lead.service_interest || "Campaign";
}

export function LeadsTable({
  leads,
  selectedLead,
  campaigns,
  currentFilters,
}: {
  leads: LeadRecord[];
  selectedLead: LeadRecord | null;
  campaigns: CampaignRecord[];
  currentFilters: {
    status?: string;
    q?: string;
    campaign?: string;
    range?: string;
  };
}) {
  if (!leads.length) {
    return (
      <Card className="border-[var(--line)] bg-white p-9 text-center shadow-none sm:p-12">
        <Badge>No leads yet</Badge>
        <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
          Your lead inbox will populate here
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          Once a Meta lead form sends leads into this workspace, they will appear here with source attribution, submission details, and a simple workflow for follow-up.
        </p>
      </Card>
    );
  }

  const resolvedSelectedLead = selectedLead || leads[0] || null;
  const selectedLeadAnswers = resolvedSelectedLead ? getLeadFieldAnswers(resolvedSelectedLead) : [];
  const selectedLeadHref = resolvedSelectedLead ? buildLeadHref(resolvedSelectedLead.id, currentFilters) : "/leads";

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(21rem,0.95fr)]">
      <Card className="overflow-hidden border-[var(--line)] bg-white shadow-none">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-[var(--soft-panel)]/80 text-sm text-[var(--muted)]">
              <tr>
                <th className="px-5 py-4 font-medium sm:px-6">Lead</th>
                <th className="px-5 py-4 font-medium sm:px-6">Campaign</th>
                <th className="px-5 py-4 font-medium sm:px-6">Submitted</th>
                <th className="px-5 py-4 font-medium sm:px-6">Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const href = buildLeadHref(lead.id, currentFilters);
                const active = resolvedSelectedLead?.id === lead.id;

                return (
                  <tr
                    key={lead.id}
                    className={`border-t border-[var(--line)] text-sm transition ${active ? "bg-[color-mix(in_oklab,var(--soft-brand)_16%,white)]" : "hover:bg-[rgba(255,255,255,0.45)]"}`}
                  >
                    <td className="px-5 py-5 align-top sm:px-6">
                      <Link href={href} className="block">
                        <div className="font-medium text-[var(--ink)]">{getLeadDisplayName(lead)}</div>
                        <div className="mt-2 text-[var(--muted)]">{getLeadContactSummary(lead) || "No contact info submitted"}</div>
                        <div className="mt-1 text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
                          {lead.meta_form_name || lead.service_interest || "Lead source pending"}
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-5 align-top text-[var(--muted-strong)] sm:px-6">
                      <div>{getCampaignName(lead, campaigns)}</div>
                      {lead.meta_campaign_id ? (
                        <div className="mt-1 text-xs text-[var(--muted)]">Meta campaign {lead.meta_campaign_id}</div>
                      ) : null}
                    </td>
                    <td className="px-5 py-5 align-top text-[var(--muted-strong)] sm:px-6">
                      {formatDate(getLeadSubmittedAt(lead))}
                    </td>
                    <td className="px-5 py-5 align-top sm:px-6">
                      <div className="mb-3">
                        <StatusBadge status={lead.status} />
                      </div>
                      <form action={updateLeadStatusAction} className="flex items-center gap-2">
                        <input type="hidden" name="leadId" value={lead.id} />
                        <input type="hidden" name="redirectTo" value={href} />
                        <Select
                          name="status"
                          defaultValue={lead.status === "booked" ? "qualified" : lead.status}
                          className="h-10 min-w-[8.75rem] rounded-full border-[var(--line)] bg-white/92 px-[0.875rem] text-sm"
                        >
                          {leadStatusOptions.map((statusOption) => (
                            <option key={statusOption.id} value={statusOption.id}>
                              {statusOption.label}
                            </option>
                          ))}
                        </Select>
                        <Button type="submit" size="sm" variant="outline" className="h-10 bg-white/84">
                          Save
                        </Button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {resolvedSelectedLead ? (
        <Card className="rounded-[28px] border-[var(--line)] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Lead details</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">{getLeadDisplayName(resolvedSelectedLead)}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Submitted {new Date(getLeadSubmittedAt(resolvedSelectedLead)).toLocaleString()}
              </p>
            </div>
            <StatusBadge status={resolvedSelectedLead.status} />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Campaign</p>
              <p className="mt-2 text-sm font-semibold text-[var(--ink)]">{getCampaignName(resolvedSelectedLead, campaigns)}</p>
            </div>
            <div className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Form source</p>
              <p className="mt-2 text-sm font-semibold text-[var(--ink)]">{resolvedSelectedLead.meta_form_name || "Meta lead form"}</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--ink)]">
              <UserCircle2 className="h-4.5 w-4.5 text-[var(--muted)]" />
              Contact
            </div>
            <div className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-4 text-sm text-[var(--muted-strong)]">
              <div>{resolvedSelectedLead.email || "No email submitted"}</div>
              <div className="mt-2">{resolvedSelectedLead.phone || "No phone submitted"}</div>
              {resolvedSelectedLead.company_name ? <div className="mt-2">{resolvedSelectedLead.company_name}</div> : null}
              {resolvedSelectedLead.job_title ? <div className="mt-2">{resolvedSelectedLead.job_title}</div> : null}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--ink)]">
              <FileText className="h-4.5 w-4.5 text-[var(--muted)]" />
              Submitted answers
            </div>
            <div className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-4">
              {selectedLeadAnswers.length ? (
                <div className="space-y-3 text-sm">
                  {selectedLeadAnswers.map((answer) => (
                    <div key={`${answer.key}-${answer.label}`} className="rounded-[18px] border border-white/70 bg-white/80 px-3 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{answer.label}</p>
                      <p className="mt-2 text-[var(--ink)]">{answer.values.join(", ") || "No value"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-6 text-[var(--muted)]">This lead does not have parsed field answers yet.</p>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--ink)]">
              <Phone className="h-4.5 w-4.5 text-[var(--muted)]" />
              Workflow
            </div>
            <form action={updateLeadStatusAction} className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-4">
              <input type="hidden" name="leadId" value={resolvedSelectedLead.id} />
              <input type="hidden" name="redirectTo" value={selectedLeadHref} />
              <label className="block text-sm font-medium text-[var(--ink)]">Status</label>
              <Select
                name="status"
                defaultValue={resolvedSelectedLead.status === "booked" ? "qualified" : resolvedSelectedLead.status}
                className="mt-3 h-11 rounded-[18px] border-[var(--line)] bg-white/92"
              >
                {leadStatusOptions.map((statusOption) => (
                  <option key={statusOption.id} value={statusOption.id}>
                    {statusOption.label}
                  </option>
                ))}
              </Select>
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-xs leading-5 text-[var(--muted)]">Current workflow state: {getLeadStatusLabel(resolvedSelectedLead.status)}</p>
                <Button type="submit" size="sm">Update status</Button>
              </div>
            </form>
          </div>

          <form action={updateLeadNotesAction} className="mt-6 rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-4">
            <input type="hidden" name="leadId" value={resolvedSelectedLead.id} />
            <input type="hidden" name="redirectTo" value={selectedLeadHref} />
            <label className="block text-sm font-medium text-[var(--ink)]">Notes</label>
            <Textarea
              name="notes"
              defaultValue={resolvedSelectedLead.notes || ""}
              placeholder="Add follow-up notes, call outcomes, or qualification details."
              className="mt-3 min-h-[150px] bg-white/92"
            />
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs leading-5 text-[var(--muted)]">
                Meta lead ID {resolvedSelectedLead.meta_lead_id || "not stored"}{resolvedSelectedLead.last_synced_at ? ` • synced ${new Date(resolvedSelectedLead.last_synced_at).toLocaleString()}` : ""}
              </p>
              <Button type="submit" size="sm" variant="outline">Save notes</Button>
            </div>
          </form>

          {resolvedSelectedLead.raw_payload_json ? (
            <div className="mt-6 rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-[var(--ink)]">Raw lead payload</p>
                {resolvedSelectedLead.meta_lead_id ? (
                  <Link
                    href={`https://developers.facebook.com/tools/explorer/`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs font-medium text-[var(--brand)]"
                  >
                    Inspect Meta
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                ) : null}
              </div>
              <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-white/80 p-3 text-xs leading-5 text-[var(--muted-strong)]">
                {JSON.stringify(resolvedSelectedLead.raw_payload_json, null, 2)}
              </pre>
            </div>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
