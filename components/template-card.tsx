import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TemplateSeed } from "@/types";

export function TemplateCard({ template }: { template: TemplateSeed }) {
  return (
    <Card className="group overflow-hidden">
      <div className="aspect-[4/3] bg-[radial-gradient(circle_at_top_left,rgba(109,94,248,0.24),transparent_35%),linear-gradient(135deg,#f8fbff_0%,#eef1ff_45%,#f7f6f1_100%)] p-5">
        <div className="flex h-full flex-col rounded-[24px] border border-white/60 bg-white/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
          <div className="flex items-start justify-between">
            <Badge>{template.category}</Badge>
            <span className="rounded-full bg-[var(--soft-brand)] px-3 py-1 text-xs font-semibold text-[var(--brand)]">
              Plug-and-play
            </span>
          </div>
          <div className="mt-auto space-y-2">
            <div className="h-3 w-2/3 rounded-full bg-[#d8dcf8]" />
            <div className="h-3 w-full rounded-full bg-[#ebedf9]" />
            <div className="h-3 w-5/6 rounded-full bg-[#ebedf9]" />
          </div>
        </div>
      </div>
      <div className="space-y-4 p-6">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold tracking-[-0.03em] text-[var(--ink)]">{template.name}</h3>
          <p className="text-sm leading-6 text-[var(--muted-strong)]">{template.description}</p>
        </div>
        <p className="text-sm leading-6 text-[var(--muted)]">{template.positioning}</p>
        <Button asChild className="w-full justify-between">
          <Link href={`/templates/${template.slug}`}>
            Use this template
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}

