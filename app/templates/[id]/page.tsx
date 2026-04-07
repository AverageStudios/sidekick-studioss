import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/section-heading";
import { TemplateSetupForm } from "@/components/template-setup-form";
import { requireUser } from "@/lib/auth";
import { getBusinessProfile, getTemplate } from "@/lib/data";

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const template = await getTemplate(id);

  if (!template) {
    notFound();
  }

  const profile = await getBusinessProfile(user.id);

  return (
    <AppShell currentPath="/templates">
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <SectionHeading
            eyebrow="Setup flow"
            title={template.name}
            description={template.positioning}
          />
          <Card className="space-y-4 p-6">
            <Badge>{template.category}</Badge>
            <p className="text-sm leading-6 text-[var(--muted-strong)]">{template.description}</p>
            <div className="space-y-3">
              {template.benefits.map((benefit) => (
                <div key={benefit} className="rounded-[20px] bg-[var(--soft-panel)] px-4 py-4 text-sm text-[var(--muted-strong)]">
                  {benefit}
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">What gets generated</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted-strong)]">
              <li>A published funnel with a fixed high-converting structure</li>
              <li>Suggested ad copy, headlines, descriptions, and targeting notes</li>
              <li>A lightweight lead flow with optional confirmation email</li>
            </ul>
          </Card>
        </div>
        <TemplateSetupForm template={template} profile={profile} />
      </div>
    </AppShell>
  );
}

