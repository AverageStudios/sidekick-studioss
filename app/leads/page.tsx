import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { LeadsTable } from "@/components/leads-table";
import { requireUser } from "@/lib/auth";
import { getLeads } from "@/lib/data";
import { cn } from "@/lib/utils";

const filters = ["all", "new", "contacted", "booked", "closed"] as const;

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireUser();
  const { status = "all" } = await searchParams;
  const [leads, allLeads] = await Promise.all([getLeads(user.id, status), getLeads(user.id, "all")]);

  const leadCounts = {
    new: allLeads.filter((l) => l.status === "new").length,
    contacted: allLeads.filter((l) => l.status === "contacted").length,
    booked: allLeads.filter((l) => l.status === "booked").length,
  };

  return (
    <AppShell currentPath="/leads">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--ink)]">Leads</h1>
        <div className="hidden items-center gap-4 text-sm text-[var(--muted)] sm:flex">
          <span><span className="font-semibold text-[var(--ink)]">{leadCounts.new}</span> new</span>
          <span><span className="font-semibold text-[var(--ink)]">{leadCounts.contacted}</span> contacted</span>
          <span><span className="font-semibold text-[var(--ink)]">{leadCounts.booked}</span> booked</span>
        </div>
      </div>

      <div className="flex items-center gap-0.5 border-b border-[var(--line)]">
        {filters.map((filter) => (
          <Link
            key={filter}
            href={`/leads?status=${filter}`}
            className={cn(
              "relative px-3 py-2 text-sm font-medium capitalize transition-colors duration-150",
              filter === status
                ? "text-[var(--ink)]"
                : "text-[var(--muted)] hover:text-[var(--ink)]",
            )}
          >
            {filter}
            {filter === status ? (
              <span className="absolute inset-x-3 -bottom-[1px] h-[2px] rounded-full bg-[var(--brand)]" />
            ) : null}
          </Link>
        ))}
      </div>

      <LeadsTable leads={leads} />
    </AppShell>
  );
}
