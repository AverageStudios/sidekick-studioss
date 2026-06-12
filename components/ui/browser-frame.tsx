import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrowserFrame({
  url = "app.sidekickstudioss.com",
  className,
  children,
}: {
  url?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[18px] border border-[rgba(15,17,22,0.12)] bg-white",
        "shadow-[0_1px_2px_rgba(15,17,22,0.06),0_28px_72px_-16px_rgba(21,16,31,0.22)]",
        className,
      )}
    >
      <div className="relative flex items-center border-b border-[rgba(15,17,22,0.07)] bg-[#fbfafd] px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#f25f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#fbbc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#2bc841]" />
        </div>
        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1.5 rounded-md bg-[rgba(15,17,22,0.045)] px-3 py-1 text-[11px] font-medium text-[rgba(15,17,22,0.55)] sm:flex">
          <Lock className="h-2.5 w-2.5" />
          {url}
        </div>
      </div>
      <div className="bg-white">{children}</div>
    </div>
  );
}
