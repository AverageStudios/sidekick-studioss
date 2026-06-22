import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { TemplateCard } from "@/components/template-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireProductAccessUser } from "@/lib/auth";
import { getTemplates } from "@/lib/data";

export default async function TemplatesPage() {
  await requireProductAccessUser("/templates");
  const templates = await getTemplates();

  return (
    <AppShell currentPath="/templates">
      <div className="space-y-10">
        <PageHeader
          variant="plain"
          badge="Templates"
          title="Campaign templates"
          description="Pick a template, preview it, and launch."
          actions={
            <>
              <Button asChild variant="outline">
                <Link href="/campaigns">View campaigns</Link>
              </Button>
              <Button asChild>
                <Link href="/templates/new">Launch from template</Link>
              </Button>
            </>
          }
        />

        {templates.length ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {templates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        ) : (
          <Card className="max-w-[32rem] rounded-[28px] border-[var(--line)] bg-white p-8 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            <h2 className="text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">No templates yet</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Published templates will appear here.
            </p>
            <div className="mt-6">
              <Button asChild className="rounded-[18px] px-5">
                <Link href="/templates/new">Open launch flow</Link>
              </Button>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
