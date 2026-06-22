import { cn } from "@/lib/utils";

function SkeletonBlock({
  className,
}: {
  className: string;
}) {
  return <div className={cn("animate-pulse rounded-[20px] bg-[var(--soft-panel)]", className)} />;
}

export function AppRouteLoading({
  cards = 3,
  detail = false,
}: {
  cards?: number;
  detail?: boolean;
}) {
  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <div className="sticky top-0 z-30 border-b border-[var(--line)] bg-[rgba(252,251,248,0.94)] backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] w-full max-w-[76rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <SkeletonBlock className="h-11 w-64 rounded-2xl" />
          <SkeletonBlock className="hidden h-10 w-96 rounded-xl md:block" />
          <SkeletonBlock className="h-11 w-44 rounded-2xl" />
        </div>
      </div>

      <div className="mx-auto w-full max-w-[76rem] px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="space-y-3">
            <SkeletonBlock className="h-3 w-20 rounded-full" />
            <SkeletonBlock className="h-10 w-72" />
            <SkeletonBlock className="h-4 w-96 max-w-full" />
          </div>

          <div className={cn("grid gap-5", detail ? "lg:grid-cols-[1.15fr_0.85fr]" : "sm:grid-cols-2 xl:grid-cols-3")}>
            {Array.from({ length: cards }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-[28px] border border-[var(--line)] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.03)]"
              >
                <SkeletonBlock className="h-48 w-full rounded-[22px]" />
                <div className="mt-5 space-y-3">
                  <SkeletonBlock className="h-5 w-3/4" />
                  <SkeletonBlock className="h-4 w-full" />
                  <SkeletonBlock className="h-4 w-2/3" />
                  <div className="flex gap-2 pt-2">
                    <SkeletonBlock className="h-8 w-20 rounded-full" />
                    <SkeletonBlock className="h-8 w-24 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LaunchWizardLoading() {
  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.08fr)_26rem]">
        <div className="border-r border-[var(--line)] bg-[var(--surface)] px-6 py-8 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-4xl space-y-6">
            <SkeletonBlock className="h-3 w-28 rounded-full" />
            <SkeletonBlock className="h-10 w-80 max-w-full" />
            <SkeletonBlock className="h-4 w-[32rem] max-w-full" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-[24px] border border-[var(--line)] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.03)]"
                >
                  <SkeletonBlock className="h-44 w-full rounded-[18px]" />
                  <div className="mt-4 space-y-2">
                    <SkeletonBlock className="h-4 w-2/3" />
                    <SkeletonBlock className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="hidden bg-white px-6 py-8 lg:block">
          <div className="sticky top-8 mx-auto max-w-[26rem] rounded-[28px] border border-[var(--line)] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.03)]">
            <SkeletonBlock className="h-[32rem] w-full rounded-[22px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
