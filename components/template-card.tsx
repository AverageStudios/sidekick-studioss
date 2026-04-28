import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FacebookAdPreview } from "@/components/facebook-ad-preview";
import { TemplateSeed } from "@/types";

export function TemplateCard({ template }: { template: TemplateSeed }) {
  return (
    <div className="group flex max-w-[22rem] flex-col overflow-hidden rounded-[30px] border border-[var(--line)] bg-white transition duration-200 hover:shadow-[0_16px_40px_rgba(16,24,40,0.08)]">
      <FacebookAdPreview
        template={template}
        description={template.promoDetails}
        className="border-0 shadow-none"
        compact
      />

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full border border-[var(--line)] bg-[var(--soft-panel)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted-strong)]">
            {template.offerType || "Offer type"}
          </span>
        </div>
        <div className="space-y-1">
          <h3 className="text-[1.05rem] font-semibold tracking-[-0.02em] text-[var(--ink)]">{template.name}</h3>
          <p className="text-xs text-[var(--muted)]">{template.industry || template.category}</p>
        </div>

        <p className="line-clamp-2 flex-1 text-sm leading-6 text-[var(--muted)]">{template.description}</p>

        <Button asChild variant="outline" className="mt-1 w-full justify-between rounded-[18px]">
          <Link href={`/templates/new?template=${template.slug}`}>
            Use template
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
