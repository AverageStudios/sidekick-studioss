import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { AdminTemplateForm } from "@/components/admin-template-form";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { createAdminTemplateAction } from "@/app/actions";
import { requireAdmin } from "@/lib/auth";
import { getEmptyAdminTemplateFormData } from "@/lib/admin-template-form";

export default async function AdminNewTemplatePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { error } = await searchParams;

  return (
    <AdminShell currentPath="/admin/templates">
      {error ? (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <PageHeader
        badge="New template"
        title="Build a new master template"
        description="Work through the builder step by step, shape the launch defaults, and publish only when the blueprint is ready for users."
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/templates">Back to templates</Link>
          </Button>
        }
      />

      <AdminTemplateForm
        mode="create"
        initialValues={getEmptyAdminTemplateFormData()}
        action={createAdminTemplateAction}
      />
    </AdminShell>
  );
}
