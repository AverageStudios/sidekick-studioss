import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { updateLeadStatusAction } from "@/app/actions";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { LeadRecord } from "@/types";

const statuses = ["new", "contacted", "booked", "closed"] as const;

export function LeadsTable({ leads }: { leads: LeadRecord[] }) {
  if (!leads.length) {
    return (
      <Card className="p-9 text-center sm:p-12">
        <Badge>No leads yet</Badge>
        <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">
          Your lead list will stay simple
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[var(--muted-strong)]">
          Once a funnel starts collecting requests, they will show up here with a clean status flow and lightweight filters.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-[var(--soft-panel)] text-sm text-[var(--muted)]">
            <tr>
              <th className="px-5 py-4 font-medium sm:px-6">Lead</th>
              <th className="px-5 py-4 font-medium sm:px-6">Service</th>
              <th className="px-5 py-4 font-medium sm:px-6">Date</th>
              <th className="px-5 py-4 font-medium sm:px-6">Status</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-t border-[var(--line)] text-sm transition hover:bg-white/55">
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
                    <select
                      name="status"
                      defaultValue={lead.status}
                      className="h-10 rounded-full border border-[var(--line)] bg-white px-[0.875rem] text-sm shadow-[var(--shadow-soft)]"
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <button type="submit">
                      <Badge className="cursor-pointer border-transparent bg-[var(--ink)] text-white">Save</Badge>
                    </button>
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
