import Link from "next/link";
import { notFound } from "next/navigation";
import { updateAdminTemplateAction } from "@/app/actions";
import { AdminShell } from "@/components/admin-shell";
import { AdminTemplateForm } from "@/components/admin-template-form";
import { AdminTemplateStatusBadge } from "@/components/admin-template-status-badge";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { getAdminTemplateById } from "@/lib/admin-templates";
import { getAdminTemplateFormData } from "@/lib/admin-template-form";

export default async function AdminEditTemplatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  const template = await getAdminTemplateById(id);

  if (!template) {
    notFound();
  }

  return (
    <AdminShell currentPath="/admin/templates">
      {error ? (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <PageHeader
        badge="Edit template"
        title={template.name}
        description="Refine the blueprint, review the live preview, and update the publishing state without losing the master-template structure."
        actions={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <AdminTemplateStatusBadge status={template.status} />
            <Button asChild variant="outline">
              <Link href="/admin/templates">Back to templates</Link>
            </Button>
          </div>
        }
      />

      <AdminTemplateForm
        mode="edit"
        initialValues={getAdminTemplateFormData(template)}
        action={updateAdminTemplateAction}
      />
    </AdminShell>
  );
}
