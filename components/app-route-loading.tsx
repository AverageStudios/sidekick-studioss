import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function LoadingBar() {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[3px] overflow-hidden bg-transparent">
      <div className="route-loading-bar h-full w-40 rounded-full bg-[var(--brand)]/85" />
    </div>
  );
}

export function AppRouteLoading({
  label = "Loading…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("min-h-[10rem] bg-transparent", className)}>
      <LoadingBar />
      <div className="mx-auto flex w-full max-w-[76rem] justify-center px-4 pt-8 sm:px-6 lg:px-8">
        <div className="inline-flex items-center gap-3 rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.88)] px-4 py-2.5 text-sm font-medium text-[var(--muted-strong)] shadow-[0_8px_24px_rgba(15,23,42,0.05)] backdrop-blur-xl">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--brand)]" />
          <span>{label}</span>
        </div>
      </div>
      <style>{`
        @keyframes route-loading-slide {
          0% {
            transform: translateX(-140%);
            opacity: 0.35;
          }
          55% {
            opacity: 0.95;
          }
          100% {
            transform: translateX(calc(100vw + 8rem));
            opacity: 0.2;
          }
        }

        .route-loading-bar {
          animation: route-loading-slide 1.1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export function LaunchWizardLoading() {
  return (
    <AppRouteLoading
      label="Loading campaign setup…"
      className="min-h-[14rem]"
    />
  );
}
