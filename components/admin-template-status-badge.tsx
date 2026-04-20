import { cn } from "@/lib/utils";
import { TemplateStatus } from "@/types";

const statusClasses: Record<TemplateStatus, string> = {
  draft: "bg-[#fff4e8] text-[#9c6328]",
  published: "bg-[#ebf8ef] text-[#2f6a4b]",
  archived: "bg-[#f1f2f4] text-[#596273]",
};

export function AdminTemplateStatusBadge({
  status,
  className,
}: {
  status: TemplateStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize",
        statusClasses[status],
        className,
      )}
    >
      {status}
    </span>
  );
}
