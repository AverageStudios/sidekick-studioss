import { cn } from "@/lib/utils";
import { LeadStatus } from "@/types";

const statusStyles: Record<LeadStatus, string> = {
  new: "bg-[#eef4ff] text-[#3559a7]",
  contacted: "bg-[#fff4e8] text-[#9c6328]",
  booked: "bg-[#ebf8ef] text-[#2f6a4b]",
  closed: "bg-[#f1f2f4] text-[#596273]",
};

export function StatusBadge({ status, className }: { status: LeadStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize",
        statusStyles[status],
        className,
      )}
    >
      {status}
    </span>
  );
}

