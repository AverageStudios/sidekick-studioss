import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { AdminTemplateForm } from "@/components/admin-template-form";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { createAdminTemplateAction } from "@/app/actions";
import { requireAdmin } from "@/lib/auth";
import { getEmptyAdminTemplateFormData } from "@/lib/admin-template-form";
import { listAdminTemplateLibrary } from "@/lib/template-library";

export default async function AdminNewTemplatePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { error } = await searchParams;
  const library = await listAdminTemplateLibrary();
  const industryOptions = library.industries.map((industry) => ({
    id: industry.id,
    name: industry.name,
  }));
  const categoryOptions = library.industries.flatMap((industry) =>
    industry.categories.map((category) => ({
      id: category.id,
      name: category.name,
      industryId: industry.id,
    })),
  );
  const initialValues = getEmptyAdminTemplateFormData();

  if (industryOptions[0] && categoryOptions[0]) {
    initialValues.industryId = industryOptions[0].id;
    initialValues.industry = industryOptions[0].name;
    initialValues.categoryId = categoryOptions.find((option) => option.industryId === industryOptions[0].id)?.id || categoryOptions[0].id;
    initialValues.category = categoryOptions.find((option) => option.id === initialValues.categoryId)?.name || "";
  }

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
        initialValues={initialValues}
        action={createAdminTemplateAction}
        industryOptions={industryOptions}
        categoryOptions={categoryOptions}
      />
    </AdminShell>
  );
}
