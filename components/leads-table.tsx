import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { updateLeadStatusAction } from "@/app/actions";
import { formatDate } from "@/lib/utils";
import { LeadRecord } from "@/types";

const statuses = ["new", "contacted", "booked", "closed"] as const;

export function LeadsTable({ leads }: { leads: LeadRecord[] }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-[var(--soft-panel)] text-sm text-[var(--muted)]">
            <tr>
              <th className="px-5 py-4 font-medium">Lead</th>
              <th className="px-5 py-4 font-medium">Service</th>
              <th className="px-5 py-4 font-medium">Date</th>
              <th className="px-5 py-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-t border-[var(--line)] text-sm">
                <td className="px-5 py-4 align-top">
                  <div className="font-medium text-[var(--ink)]">{lead.name}</div>
                  <div className="mt-1 text-[var(--muted)]">{lead.phone}</div>
                  <div className="text-[var(--muted)]">{lead.email}</div>
                </td>
                <td className="px-5 py-4 align-top text-[var(--muted-strong)]">{lead.service_interest}</td>
                <td className="px-5 py-4 align-top text-[var(--muted-strong)]">{formatDate(lead.created_at)}</td>
                <td className="px-5 py-4 align-top">
                  <form action={updateLeadStatusAction} className="flex items-center gap-3">
                    <input type="hidden" name="leadId" value={lead.id} />
                    <select
                      name="status"
                      defaultValue={lead.status}
                      className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-sm"
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <button type="submit">
                      <Badge className="cursor-pointer bg-[var(--ink)] text-white">Save</Badge>
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

