import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { updateLeadStatusAction } from "@/app/actions";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { LeadRecord } from "@/types";

const statuses = ["new", "contacted", "booked", "closed"] as const;

export function LeadsTable({ leads }: { leads: LeadRecord[] }) {
  if (!leads.length) {
    return (
      <Card className="border-[var(--line)] bg-white p-9 shadow-none text-center sm:p-12">
        <Badge>No leads yet</Badge>
        <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
          Your lead list starts here
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
          Once a template is live, new inquiries show up here with a clean status flow so you can manage replies and follow-up in one place.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-[var(--line)] bg-white shadow-none">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-[var(--soft-panel)]/80 text-sm text-[var(--muted)]">
            <tr>
              <th className="px-5 py-4 font-medium sm:px-6">Lead</th>
              <th className="px-5 py-4 font-medium sm:px-6">Campaign</th>
              <th className="px-5 py-4 font-medium sm:px-6">Date</th>
              <th className="px-5 py-4 font-medium sm:px-6">Status</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-t border-[var(--line)] text-sm transition hover:bg-[rgba(255,255,255,0.45)]">
                <td className="px-5 py-5 align-top sm:px-6">
                  <div className="font-medium text-[var(--ink)]">{lead.name}</div>
                  <div className="mt-2 text-[var(--muted)]">{lead.phone}</div>
                  <div className="text-[var(--muted)]">{lead.email}</div>
                </td>
                <td className="px-5 py-5 align-top text-[var(--muted-strong)] sm:px-6">{lead.service_interest}</td>
                <td className="px-5 py-5 align-top text-[var(--muted-strong)] sm:px-6">{formatDate(lead.created_at)}</td>
                <td className="px-5 py-5 align-top sm:px-6">
                  <div className="mb-3">
                    <StatusBadge status={lead.status} />
                  </div>
                  <form action={updateLeadStatusAction} className="flex items-center gap-2">
                    <input type="hidden" name="leadId" value={lead.id} />
                    <Select
                      name="status"
                      defaultValue={lead.status}
                      className="h-10 min-w-[8.75rem] rounded-full border-[var(--line)] bg-white/92 px-[0.875rem] text-sm"
                    >
                      {statuses.map((statusOption) => (
                        <option key={statusOption} value={statusOption}>
                          {statusOption}
                        </option>
                      ))}
                    </Select>
                    <Button type="submit" size="sm" variant="outline" className="h-10 bg-white/84">
                      Save
                    </Button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
