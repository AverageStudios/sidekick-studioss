export function StepBadge({ step }: { step: number }) {
  return (
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/18 bg-white/14 text-sm font-semibold text-current shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
      {step}
    </span>
  );
}

