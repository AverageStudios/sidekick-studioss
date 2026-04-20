import { Card } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  helper,
  badge,
}: {
  label: string;
  value: string | number;
  helper: string;
  badge?: string;
}) {
  return (
    <Card className="bg-white/74 p-4 shadow-[0_10px_24px_rgba(16,24,40,0.03)] sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{label}</p>
        {badge ? (
          <span className="rounded-full bg-[var(--soft-panel)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-strong)]">
            {badge}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-[1.8rem] font-semibold tracking-[-0.05em] text-[var(--ink)] sm:text-[1.95rem]">{value}</p>
      <p className="mt-2 max-w-[18rem] text-sm leading-6 text-[var(--muted)]">{helper}</p>
    </Card>
  );
}
