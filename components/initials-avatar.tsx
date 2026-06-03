"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function InitialsAvatar({
  initials,
  label,
  src,
  size = "md",
  tone = "subtle",
  className,
}: {
  initials: string;
  label?: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  tone?: "subtle" | "brand";
  className?: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(src && !imageFailed);

  return (
    <span
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold transition-colors",
        size === "sm" && "h-8 w-8 text-[11px]",
        size === "md" && "h-9 w-9 text-[12px]",
        size === "lg" && "h-11 w-11 text-sm",
        tone === "subtle" && "bg-[var(--soft-panel)] text-[var(--ink)]",
        tone === "brand" && "bg-[var(--brand)] text-white",
        className,
      )}
    >
      {showImage ? (
        <span className="relative block h-full w-full">
          <Image
            src={src || ""}
            alt={label || "Profile picture"}
            fill
            sizes={size === "lg" ? "44px" : size === "md" ? "36px" : "32px"}
            className="object-cover"
            onError={() => setImageFailed(true)}
          />
        </span>
      ) : (
        initials
      )}
    </span>
  );
}
