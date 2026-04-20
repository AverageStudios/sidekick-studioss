import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TemplateSeed } from "@/types";

export function TemplateCard({ template }: { template: TemplateSeed }) {
  return (
    <div className="group flex max-w-[20rem] flex-col overflow-hidden rounded-[24px] border border-[var(--line)] bg-white transition duration-200 hover:shadow-[0_8px_28px_rgba(16,24,40,0.06)]">
      <div className="aspect-[16/9] overflow-hidden border-b border-[var(--line)] bg-[var(--soft-panel)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={template.previewImage}
          alt={`${template.name} preview`}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
        />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="space-y-1">
          <h3 className="text-[1.05rem] font-semibold tracking-[-0.02em] text-[var(--ink)]">{template.name}</h3>
          <p className="text-xs text-[var(--muted)]">
            {template.industry || template.category}
          </p>
        </div>

        <p className="line-clamp-2 flex-1 text-sm leading-6 text-[var(--muted)]">{template.description}</p>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#ecfdf3] px-2.5 py-1 text-[11px] font-medium text-[#15803d]">Published</span>
          {template.category ? (
            <span className="rounded-full bg-[var(--soft-panel)] px-2.5 py-1 text-[11px] font-medium text-[var(--muted-strong)]">
              {template.category}
            </span>
          ) : null}
        </div>

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
