"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { FacebookAdPreviewProps } from "@/components/facebook-ad-preview";
import { cn } from "@/lib/utils";

const FacebookAdPreview = dynamic(
  () => import("@/components/facebook-ad-preview").then((mod) => mod.FacebookAdPreview),
  { ssr: false },
);

function LazyFacebookAdPreviewSkeleton({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden border border-[var(--line)] bg-white",
        compact ? "min-h-[18rem]" : "min-h-[24rem]",
        className,
      )}
    >
      <div className="animate-pulse">
        <div className="flex items-center gap-3 border-b border-[var(--line)] px-4 py-3">
          <div className="h-9 w-9 rounded-full bg-[var(--soft-panel)]" />
          <div className="space-y-2">
            <div className="h-3 w-28 rounded-full bg-[var(--soft-panel)]" />
            <div className="h-2.5 w-20 rounded-full bg-[var(--soft-panel)]" />
          </div>
        </div>
        <div className={cn("bg-[var(--soft-panel)]", compact ? "h-48" : "h-72")} />
        <div className="space-y-3 px-4 py-4">
          <div className="h-3 w-5/6 rounded-full bg-[var(--soft-panel)]" />
          <div className="h-3 w-2/3 rounded-full bg-[var(--soft-panel)]" />
          <div className="h-4 w-1/2 rounded-full bg-[var(--soft-panel)]" />
          <div className="h-3 w-1/3 rounded-full bg-[var(--soft-panel)]" />
        </div>
      </div>
    </div>
  );
}

export function LazyFacebookAdPreview({
  className,
  compact = false,
  ...props
}: FacebookAdPreviewProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return <LazyFacebookAdPreviewSkeleton className={className} compact={compact} />;
  }

  return (
    <FacebookAdPreview
      {...props}
      compact={compact}
      className={className}
    />
  );
}
