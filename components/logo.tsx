import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  href = "/",
  className,
  markOnly = false,
}: {
  href?: string;
  className?: string;
  markOnly?: boolean;
}) {
  const content = (
    <>
      <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-[#1f1337] shadow-[0_14px_30px_rgba(91,94,214,0.2)]">
        <Image src="/sidekick-logo.png" alt="SideKick Studioss logo" fill className="object-cover" />
      </span>
      {!markOnly ? (
        <span className="flex flex-col leading-none">
          <span className="font-semibold tracking-[-0.03em] text-[var(--ink)]">SideKick Studioss</span>
          <span className="text-xs text-[var(--muted)]">Campaign launcher for car detailers</span>
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

