import Image from "next/image";
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
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[color-mix(in_oklab,var(--line)_75%,white)] bg-white p-2",
        size === "sm" && "h-10 min-w-10 px-3 text-xs",
        size === "md" && "h-12 min-w-12 px-3.5 text-sm",
        size === "lg" && "h-14 min-w-14 px-4 text-base",
      )}
      aria-hidden="true"
    >
      {metadata.logoPath ? (
        <Image
          src={metadata.logoPath}
          alt=""
          width={size === "lg" ? 32 : size === "md" ? 28 : 24}
          height={size === "lg" ? 32 : size === "md" ? 28 : 24}
          sizes={size === "lg" ? "32px" : size === "md" ? "28px" : "24px"}
          className="h-full w-full object-contain"
        />
      ) : (
        <span className={cn("font-semibold tracking-[0.08em]", metadata.accentClassName, metadata.surfaceClassName)}>
          {metadata.shortCode}
        </span>
      )}
    </div>
  );
}
