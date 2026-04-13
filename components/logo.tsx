import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  href = "/",
  className,
  markOnly = false,
  showTagline = false,
  tone = "dark",
}: {
  href?: string;
  className?: string;
  markOnly?: boolean;
  showTagline?: boolean;
  tone?: "dark" | "light";
}) {
  const content = (
    <>
      <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[18px] bg-[#1f1337] shadow-[0_14px_30px_rgba(91,94,214,0.14)]">
        <Image src="/sidekick-logo.png" alt="SideKick Studioss logo" fill className="object-cover" />
      </span>
      {!markOnly ? (
        <span className="flex flex-col">
          <span
            className={cn(
              "text-[15px] font-semibold leading-none tracking-[-0.03em]",
              tone === "light" ? "text-white" : "text-[var(--ink)]",
            )}
          >
            SideKick Studioss
          </span>
          {showTagline ? (
            <span className={cn("mt-1 text-xs leading-none", tone === "light" ? "text-white/56" : "text-[var(--muted)]")}>
              Templates, leads, and outreach in one system
            </span>
          ) : null}
        </span>
      ) : null}
    </>
  );

  return (
    <Link href={href} className={cn("inline-flex items-center gap-3", className)}>
      {content}
    </Link>
  );
}
