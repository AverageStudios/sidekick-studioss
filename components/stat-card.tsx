import { Card } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-[var(--muted)]">{label}</p>
        <span className="rounded-full bg-[var(--soft-panel)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-strong)]">
          Live
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--ink)] sm:mt-5 sm:text-[2rem]">{value}</p>
      <p className="mt-2.5 max-w-[18rem] text-sm leading-6 text-[var(--muted-strong)]">{helper}</p>
    </Card>
  );
}
