import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { SectionHeading } from "@/components/section-heading";
import { TemplateCard } from "@/components/template-card";
import { requireUser } from "@/lib/auth";
import { getTemplates } from "@/lib/data";

export default async function TemplatesPage() {
  await requireUser();
  const templates = await getTemplates();

  return (
    <AppShell currentPath="/templates">
      <PageHeader
        badge="Templates"
        title="Choose the campaign you want to launch"
        description="Each template is purpose-built for detailers. Pick the service, change a few fields, and publish."
      />
      <div className="space-y-5">
        <SectionHeading
          eyebrow="Curated gallery"
          title="Five clean starting points"
          description="Every template is built for a real detailing offer, with a fixed funnel structure and a simple setup path."
        />
      </div>
      <div className="grid gap-5 lg:gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
    </AppShell>
  );
}
