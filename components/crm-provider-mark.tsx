import { cn } from "@/lib/utils";
import { getCrmProviderMetadata } from "@/lib/crm-providers";
import { CrmProvider } from "@/types";

export function CrmProviderMark({
  provider,
  size = "md",
}: {
  provider: CrmProvider;
  size?: "sm" | "md" | "lg";
}) {
  const metadata = getCrmProviderMetadata(provider);
  if (!metadata) return null;

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-2xl font-semibold tracking-[0.08em]",
        metadata.surfaceClassName,
        metadata.accentClassName,
        size === "sm" && "h-10 min-w-10 px-3 text-xs",
        size === "md" && "h-12 min-w-12 px-3.5 text-sm",
        size === "lg" && "h-14 min-w-14 px-4 text-base",
      )}
      aria-hidden="true"
    >
      {metadata.shortCode}
    </div>
  );
}
