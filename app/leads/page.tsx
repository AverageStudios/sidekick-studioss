import { AppShell } from "@/components/app-shell";
import { LeadsTable } from "@/components/leads-table";
import { PageHeader } from "@/components/page-header";
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
      <PageHeader
        badge="Leads"
        title="Simple lead tracking"
        description="No inbox. No complicated pipeline. Just the leads, their status, and the next action."
        actions={
          <div className="flex flex-wrap gap-2.5">
            {filters.map((filter) => (
              <a
                key={filter}
                href={`/leads?status=${filter}`}
                className={`rounded-full px-4 py-2.5 text-sm font-medium capitalize transition ${
                  filter === status
                    ? "bg-[var(--ink)] text-white shadow-[0_10px_20px_rgba(17,24,39,0.12)]"
                    : "border border-[var(--line)] bg-white/85 text-[var(--muted-strong)] shadow-[var(--shadow-soft)]"
                }`}
              >
                {filter}
              </a>
            ))}
          </div>
        }
      />
      <LeadsTable leads={leads} />
    </AppShell>
  );
}
