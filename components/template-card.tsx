import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TemplateSeed } from "@/types";

export function TemplateCard({ template }: { template: TemplateSeed }) {
  return (
    <Card className="group flex h-full flex-col overflow-hidden transition duration-200 hover:-translate-y-1 hover:shadow-[0_22px_44px_rgba(16,24,40,0.08)]">
      <div className="aspect-[4/3] bg-[radial-gradient(circle_at_top_left,rgba(109,94,248,0.2),transparent_35%),linear-gradient(135deg,#fafbff_0%,#f0efff_45%,#f5f3ee_100%)] p-5">
        <div className="flex h-full flex-col rounded-[24px] border border-white/70 bg-white/78 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.74)]">
          <div className="flex items-start justify-between">
            <Badge>{template.category}</Badge>
            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-strong)]">
              Plug-and-play
            </span>
          </div>
          <div className="mt-8 rounded-[20px] bg-white/88 p-4 shadow-[0_10px_18px_rgba(17,24,39,0.05)]">
            <div className="h-3 w-2/3 rounded-full bg-[#cfd4ff]" />
            <div className="mt-3 grid gap-2">
              <div className="h-2.5 w-full rounded-full bg-[#e9ebfa]" />
              <div className="h-2.5 w-5/6 rounded-full bg-[#ececf5]" />
              <div className="h-2.5 w-3/4 rounded-full bg-[#ececf5]" />
            </div>
          </div>
          <div className="mt-auto flex items-center gap-2 pt-4 text-xs text-[var(--muted-strong)]">
            <span className="rounded-full bg-[var(--soft-brand)] px-3 py-1">Fast setup</span>
            <span className="rounded-full bg-white px-3 py-1">Paid traffic ready</span>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col space-y-4 p-6">
        <div className="space-y-3">
          <h3 className="text-xl font-semibold tracking-[-0.03em] text-[var(--ink)]">{template.name}</h3>
          <p className="text-sm leading-6 text-[var(--muted-strong)]">{template.description}</p>
        </div>
        <p className="min-h-[72px] text-sm leading-6 text-[var(--muted)]">{template.positioning}</p>
        <Button asChild className="mt-auto w-full justify-between">
          <Link href={`/templates/${template.slug}`}>
            Use this template
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
