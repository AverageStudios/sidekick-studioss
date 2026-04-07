import { AppShell } from "@/components/app-shell";
import { SectionHeading } from "@/components/section-heading";
import { TemplateCard } from "@/components/template-card";
import { requireUser } from "@/lib/auth";
import { getTemplates } from "@/lib/data";

export default async function TemplatesPage() {
  await requireUser();
  const templates = await getTemplates();

  return (
    <AppShell currentPath="/templates">
      <SectionHeading
        eyebrow="Templates"
        title="Choose the campaign you want to launch"
        description="Each template is purpose-built for detailers. Pick the service, change a few fields, and publish."
      />
      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
    </AppShell>
  );
}

