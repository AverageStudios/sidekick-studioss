import { AppShell } from "@/components/app-shell";
import { LeadsTable } from "@/components/leads-table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getLeads } from "@/lib/data";

const filters = ["all", "new", "contacted", "booked", "closed"] as const;

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireUser();
  const { status = "all" } = await searchParams;
  const leads = await getLeads(user.id, status);

  return (
    <AppShell currentPath="/leads">
      <Card className="p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <Badge>Leads</Badge>
            <h1 className="text-4xl font-semibold tracking-[-0.06em] text-[var(--ink)]">Simple lead tracking</h1>
            <p className="max-w-2xl text-base leading-7 text-[var(--muted-strong)]">
              No inbox. No complicated pipeline. Just the leads, their status, and the next action.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <a
                key={filter}
                href={`/leads?status=${filter}`}
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  filter === status
                    ? "bg-[var(--ink)] text-white"
                    : "border border-[var(--line)] bg-white text-[var(--muted-strong)]"
                }`}
              >
                {filter}
              </a>
            ))}
          </div>
        </div>
      </Card>
      <LeadsTable leads={leads} />
    </AppShell>
  );
}

