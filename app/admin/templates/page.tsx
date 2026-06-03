import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  Copy,
  FileText,
  FolderClosed,
  FolderTree,
  Library,
  Plus,
  Settings2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { resolveTemplateCtaLabel } from "@/data/template-taxonomy";
import {
  createTemplateCategoryAction,
  createTemplateFromCategoryAction,
  createTemplateIndustryAction,
  deleteTemplateCategoryAction,
  deleteTemplateIndustryAction,
  deleteTemplateLibraryTemplateAction,
  duplicateAdminTemplateAction,
  updateTemplateCategoryAction,
  updateTemplateIndustryAction,
  updateTemplateLibraryTemplateAction,
} from "@/app/actions";
import { AdminShell } from "@/components/admin-shell";
import { AdminTemplateStatusBadge } from "@/components/admin-template-status-badge";
import { FacebookAdPreview } from "@/components/facebook-ad-preview";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { requireAdmin } from "@/lib/auth";
import { flattenTemplateLibrary, listAdminTemplateLibrary } from "@/lib/template-library";
import { cn, formatDate } from "@/lib/utils";
import { TemplateRecord } from "@/types";

function buildSelectionHref({
  industryId,
  categoryId,
  templateId,
}: {
  industryId?: string | null;
  categoryId?: string | null;
  templateId?: string | null;
}) {
  const params = new URLSearchParams();
  if (industryId) params.set("industryId", industryId);
  if (categoryId) params.set("categoryId", categoryId);
  if (templateId) params.set("templateId", templateId);
  const query = params.toString();
  return query ? `/admin/templates?${query}` : "/admin/templates";
}

function getTemplateSubtitle(template: TemplateRecord) {
  const adType = template.config_json?.defaultAdType || template.config_json?.supportedAdTypes?.[0] || "lead_form";
  return String(adType).replaceAll("_", " ");
}

function EmptyState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="flex min-h-[15rem] flex-col items-center justify-center rounded-[24px] border border-dashed border-[var(--line)] bg-[var(--soft-panel)] px-6 py-10 text-center">
      <Sparkles className="h-8 w-8 text-[var(--brand)]" />
      <p className="mt-4 text-base font-semibold text-[var(--ink)]">{title}</p>
      <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">{body}</p>
    </div>
  );
}

function TreeLink({
  href,
  active,
  icon,
  label,
  detail,
  depth = 0,
}: {
  href: string;
  active?: boolean;
  icon: React.ReactNode;
  label: string;
  detail?: string;
  depth?: number;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-[16px] px-3 py-2.5 text-sm transition",
        active
          ? "bg-[var(--ink)] text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)]"
          : "text-[var(--muted-strong)] hover:bg-white hover:text-[var(--ink)]",
        depth === 1 && "ml-4",
        depth === 2 && "ml-8",
      )}
    >
      <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-transparent", active ? "bg-white/14 text-white" : "bg-[var(--soft-panel)] text-[var(--brand)]")}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{label}</span>
        {detail ? (
          <span className={cn("block truncate text-[11px]", active ? "text-white/72" : "text-[var(--muted)]")}>
            {detail}
          </span>
        ) : null}
      </span>
      <ChevronRight className={cn("h-4 w-4 shrink-0 transition-transform", active ? "text-white/70" : "text-[var(--muted)] group-hover:translate-x-0.5")} />
    </Link>
  );
}

function ContentRow({
  href,
  icon,
  title,
  meta,
  badge,
  description,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  meta?: string;
  badge?: React.ReactNode;
  description?: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-[20px] border border-[var(--line)] bg-white px-4 py-3.5 transition",
        active
          ? "border-[color-mix(in_oklab,var(--brand)_30%,white)] bg-[linear-gradient(135deg,#fbfaff_0%,#f6f2ff_100%)] shadow-[0_16px_36px_rgba(109,94,248,0.10)]"
          : "hover:border-[color-mix(in_oklab,var(--brand)_18%,white)] hover:shadow-[0_14px_34px_rgba(15,23,42,0.06)]",
      )}
    >
      <span className={cn("flex h-10 w-10 items-center justify-center rounded-2xl", active ? "bg-[var(--soft-brand)] text-[var(--brand-ink)]" : "bg-[var(--soft-panel)] text-[var(--brand)]")}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-[var(--ink)]">{title}</span>
          {badge}
        </span>
        {meta ? <span className="mt-1 block text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]">{meta}</span> : null}
        {description ? <span className="mt-1 block truncate text-sm text-[var(--muted-strong)]">{description}</span> : null}
      </span>
      <ChevronRight className="h-4 w-4 text-[var(--muted)]" />
    </Link>
  );
}

function TemplateCard({
  href,
  template,
  subtitle,
  active,
}: {
  href: string;
  template: TemplateRecord;
  subtitle: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-[22px] border border-[var(--line)] bg-white transition",
        active
          ? "border-[color-mix(in_oklab,var(--brand)_30%,white)] bg-[linear-gradient(135deg,#fbfaff_0%,#f6f2ff_100%)] shadow-[0_16px_36px_rgba(109,94,248,0.10)]"
          : "hover:border-[color-mix(in_oklab,var(--brand)_18%,white)] hover:shadow-[0_14px_34px_rgba(15,23,42,0.06)]",
      )}
    >
      <div className="border-b border-[var(--line)] bg-[var(--soft-panel)] px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--ink)]">{template.name}</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]">{subtitle}</p>
          </div>
          <AdminTemplateStatusBadge status={template.status} />
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-3">
        <div className="overflow-hidden rounded-[18px] border border-[var(--line)] bg-white">
          <FacebookAdPreview
            pageName={template.name}
            primaryText={template.config_json?.adCopy?.primary || template.description}
            headline={template.config_json?.funnel?.heroHeadline || template.name}
            description={template.config_json?.adCopy?.descriptions?.[0] || template.description}
            ctaLabel={resolveTemplateCtaLabel(template.config_json as any, template.offer_type || "Learn more")}
            imageUrl={template.preview_image_url}
            compact
            showMetaBar={false}
            className="rounded-none border-0 shadow-none"
          />
        </div>
        <div className="mt-auto px-1 pb-1 pt-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {template.is_featured ? <Badge>Featured</Badge> : null}
              <Badge>{template.offer_type || "Template"}</Badge>
            </div>
            <ChevronRight className="h-4 w-4 text-[var(--muted)] transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}

function EditorCard({
  title,
  hint,
  children,
  className,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-[24px] border border-[var(--line)] bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]", className)}>
      <div className="border-b border-[var(--line)] pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{title}</p>
        {hint ? <p className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">{hint}</p> : null}
      </div>
      <div className="pt-4">
        {children}
      </div>
    </div>
  );
}

export default async function AdminTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{
    industryId?: string;
    categoryId?: string;
    templateId?: string;
    success?: string;
    error?: string;
  }>;
}) {
  await requireAdmin();
  const { industryId, categoryId, templateId, success, error } = await searchParams;
  const library = await listAdminTemplateLibrary();
  const industries = library.industries;
  const categories = industries.flatMap((industry) => industry.categories);
  const templateEntries = flattenTemplateLibrary(industries);

  const selectedTemplateEntry = templateEntries.find((entry) => entry.template.id === templateId) || null;
  const selectedTemplate = selectedTemplateEntry?.template || null;
  const selectedCategory =
    categories.find((category) => category.id === categoryId) ||
    selectedTemplateEntry?.category ||
    null;
  const selectedIndustry =
    industries.find((industry) => industry.id === industryId) ||
    (selectedCategory ? industries.find((industry) => industry.id === selectedCategory.industry_id) || null : null) ||
    selectedTemplateEntry?.industry ||
    industries[0] ||
    null;

  const currentNodeType = selectedTemplate
    ? "template"
    : selectedCategory
      ? "category"
      : selectedIndustry
        ? "industry"
        : "root";

  const centerTemplates =
    currentNodeType === "template"
      ? selectedCategory?.templates || []
      : currentNodeType === "category"
        ? selectedCategory?.templates || []
        : currentNodeType === "industry"
          ? selectedIndustry?.categories.flatMap((category) => category.templates) || []
          : [];

  const centerCategories =
    currentNodeType === "industry"
      ? selectedIndustry?.categories || []
      : [];

  const categoryOptions = categories.map((category) => ({
    id: category.id,
    name: `${category.industry_name} / ${category.name}`,
  }));

  return (
    <AdminShell currentPath="/admin/templates">
      {success ? (
        <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      {!library.supportsHierarchyTables ? (
        <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          The hierarchy manager is in compatibility mode. Apply <code>018_template_library_hierarchy.sql</code> for full folder-style industry/category persistence.
        </div>
      ) : null}

      <PageHeader
        badge="Template library"
        title="Template content manager"
        description="Browse the hierarchy on the left and edit templates in the main panel."
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/templates/new">
              Open full builder
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <div className="grid min-h-[calc(100vh-13rem)] gap-5 xl:grid-cols-[18.5rem_minmax(0,1fr)]">
        <section className="rounded-[28px] border border-[var(--line)] bg-[linear-gradient(180deg,#f8f8fd_0%,#f4f3fb_100%)] p-3 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-3 pb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Explorer</p>
              <p className="mt-1 text-sm font-semibold text-[var(--ink)]">Industries / Categories / Templates</p>
            </div>
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-[var(--muted-strong)] shadow-[var(--shadow-soft)]">
              {industries.length} industries
            </span>
          </div>

          <div className="mt-3 max-h-[calc(100vh-18rem)] space-y-1 overflow-auto pr-1">
            <TreeLink
              href="/admin/templates"
              active={currentNodeType === "root"}
              icon={<FolderTree className="h-4 w-4" />}
              label="All industries"
              detail={`${industries.length} top-level folders`}
            />
            {industries.map((industry) => (
              <div key={industry.id} className="space-y-1">
                <TreeLink
                  href={buildSelectionHref({ industryId: industry.id })}
                  active={currentNodeType === "industry" && selectedIndustry?.id === industry.id}
                  icon={<Library className="h-4 w-4" />}
                  label={industry.name}
                  detail={`${industry.categories.length} categories`}
                />
                {industry.categories.map((category) => (
                  <div key={category.id} className="space-y-1">
                    <TreeLink
                      href={buildSelectionHref({ industryId: industry.id, categoryId: category.id })}
                      active={currentNodeType === "category" && selectedCategory?.id === category.id}
                      icon={<FolderClosed className="h-4 w-4" />}
                      label={category.name}
                      detail={`${category.template_count} templates`}
                      depth={1}
                    />
                    {category.templates.map((template) => (
                      <TreeLink
                        key={template.id}
                        href={buildSelectionHref({ industryId: industry.id, categoryId: category.id, templateId: template.id })}
                        active={currentNodeType === "template" && selectedTemplate?.id === template.id}
                        icon={<FileText className="h-4 w-4" />}
                        label={template.name}
                        detail={template.status}
                        depth={2}
                      />
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-[var(--line)] bg-white shadow-[var(--shadow-soft)]">
          <div className="border-b border-[var(--line)] px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  {currentNodeType === "template"
                    ? "Template contents"
                    : currentNodeType === "category"
                      ? "Category contents"
                      : currentNodeType === "industry"
                        ? "Industry contents"
                        : "Library contents"}
                </p>
                <h2 className="mt-1 text-[1.7rem] font-semibold tracking-[-0.05em] text-[var(--ink)]">
                  {currentNodeType === "template"
                    ? selectedTemplate?.name
                    : currentNodeType === "category"
                      ? selectedCategory?.name
                      : currentNodeType === "industry"
                        ? selectedIndustry?.name
                        : "Template library"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">
                  {currentNodeType === "template"
                    ? "This template sits inside its category. Use this center panel to compare it against sibling templates quickly."
                    : currentNodeType === "category"
                      ? "Browse every template inside this category and jump straight into the builder."
                      : currentNodeType === "industry"
                        ? "This folder view shows the categories first, then the templates inside the selected industry."
                        : "Select an industry from the tree to browse the library like a structured content system."}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedIndustry && currentNodeType !== "template" ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href={buildSelectionHref({ industryId: selectedIndustry.id })}>
                      <Settings2 className="h-4 w-4" />
                      Focus industry
                    </Link>
                  </Button>
                ) : null}
                {selectedTemplate ? (
                  <Button asChild size="sm">
                    <Link href={`/admin/templates/${selectedTemplate.id}/edit`}>
                      Open builder
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-6 p-5">
            {currentNodeType === "root" ? (
              <EmptyState
                title="Pick an industry to start browsing"
                body="The left tree is the source of truth. Select an industry, category, or template to open its contents and actions."
              />
            ) : null}

            {currentNodeType === "industry" && selectedIndustry ? (
              <div className="space-y-5">
                <div className="grid gap-3 lg:grid-cols-3">
                  <div className="rounded-[22px] border border-[var(--line)] bg-[var(--soft-panel)] px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Categories</p>
                    <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[var(--ink)]">{selectedIndustry.categories.length}</p>
                  </div>
                  <div className="rounded-[22px] border border-[var(--line)] bg-[var(--soft-panel)] px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Templates</p>
                    <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[var(--ink)]">{selectedIndustry.template_count}</p>
                  </div>
                  <div className="rounded-[22px] border border-[var(--line)] bg-[var(--soft-panel)] px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Published</p>
                    <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[var(--ink)]">{selectedIndustry.published_count}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[var(--ink)]">Categories in this industry</p>
                    <span className="text-xs text-[var(--muted)]">Click a category to browse its templates</span>
                  </div>
                  {centerCategories.length ? (
                    centerCategories.map((category) => (
                      <ContentRow
                        key={category.id}
                        href={buildSelectionHref({ industryId: selectedIndustry.id, categoryId: category.id })}
                        icon={<FolderClosed className="h-4 w-4" />}
                        title={category.name}
                        meta={`${category.template_count} templates`}
                        badge={<Badge>{category.status}</Badge>}
                        description={category.description || "No description yet"}
                        active={selectedCategory?.id === category.id}
                      />
                    ))
                  ) : (
                    <EmptyState
                      title="No categories yet"
                      body="Use the management controls below to create the first category inside this industry."
                    />
                  )}
                </div>

                {centerTemplates.length ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-[var(--ink)]">Templates across this industry</p>
                      <span className="text-xs text-[var(--muted)]">All templates nested under the categories above</span>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {centerTemplates.map((template) => {
                        const entry = templateEntries.find((item) => item.template.id === template.id);
                        return (
                          <TemplateCard
                            key={template.id}
                            href={buildSelectionHref({
                              industryId: entry?.industry.id,
                              categoryId: entry?.category.id,
                              templateId: template.id,
                            })}
                            template={template}
                            subtitle={getTemplateSubtitle(template)}
                            active={selectedTemplate?.id === template.id}
                          />
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {currentNodeType === "category" && selectedIndustry && selectedCategory ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                  <span>{selectedIndustry.name}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span>{selectedCategory.name}</span>
                </div>
                {centerTemplates.length ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {centerTemplates.map((template) => (
                      <TemplateCard
                        key={template.id}
                        href={buildSelectionHref({
                          industryId: selectedIndustry.id,
                          categoryId: selectedCategory.id,
                          templateId: template.id,
                        })}
                        template={template}
                        subtitle={getTemplateSubtitle(template)}
                        active={selectedTemplate?.id === template.id}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No templates in this category yet"
                    body="Use the management controls below to create the first template in this category. It will open directly in the full builder after creation."
                  />
                )}
              </div>
            ) : null}

            {currentNodeType === "template" && selectedTemplate && selectedCategory && selectedIndustry ? (
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
                <div className="space-y-5">
                  <div className="rounded-[26px] border border-[var(--line)] bg-[linear-gradient(180deg,#fff_0%,#faf9ff_100%)] shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                    <div className="border-b border-[var(--line)] px-5 py-4">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                        <span>{selectedIndustry.name}</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                        <span>{selectedCategory.name}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <AdminTemplateStatusBadge status={selectedTemplate.status} />
                        <Badge>{getTemplateSubtitle(selectedTemplate)}</Badge>
                        {selectedTemplate.is_featured ? <Badge>Featured</Badge> : null}
                      </div>
                    </div>
                    <div className="px-5 py-4">
                      <p className="text-sm leading-6 text-[var(--muted-strong)]">
                        {selectedTemplate.description}
                      </p>
                    </div>
                    <div className="border-t border-[var(--line)] p-4">
                      <div className="overflow-hidden rounded-[20px] border border-[var(--line)]">
                        <FacebookAdPreview
                          pageName={selectedTemplate.name}
                          primaryText={selectedTemplate.config_json?.adCopy?.primary || selectedTemplate.description}
                          headline={selectedTemplate.config_json?.funnel?.heroHeadline || selectedTemplate.name}
                          description={selectedTemplate.config_json?.adCopy?.descriptions?.[0] || selectedTemplate.description}
                          ctaLabel={resolveTemplateCtaLabel(selectedTemplate.config_json as any, selectedTemplate.offer_type || "Learn more")}
                          imageUrl={selectedTemplate.preview_image_url}
                          compact
                          showMetaBar={false}
                          className="rounded-none border-0 shadow-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-[var(--ink)]">Sibling templates</p>
                      <span className="text-xs text-[var(--muted)]">{selectedCategory.templates.length} in this category</span>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {selectedCategory.templates.map((template) => (
                        <TemplateCard
                          key={template.id}
                          href={buildSelectionHref({
                            industryId: selectedIndustry.id,
                            categoryId: selectedCategory.id,
                            templateId: template.id,
                          })}
                          template={template}
                          subtitle={`Updated ${formatDate(template.updated_at || template.created_at)}`}
                          active={selectedTemplate.id === template.id}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <EditorCard title="Template basics" hint="Quick edits and safe metadata changes.">
                    <form action={updateTemplateLibraryTemplateAction} className="space-y-3">
                      <input type="hidden" name="templateId" value={selectedTemplate.id} />
                      <Input name="name" defaultValue={selectedTemplate.name} />
                      <Select name="categoryId" defaultValue={selectedCategory.id}>
                        {categoryOptions.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </Select>
                      <Select name="status" defaultValue={selectedTemplate.status}>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </Select>
                      <label className="inline-flex items-center gap-3 rounded-[16px] border border-[var(--line)] bg-[var(--soft-panel)] px-3 py-3 text-sm text-[var(--muted-strong)]">
                        <input
                          type="checkbox"
                          name="isFeatured"
                          value="1"
                          defaultChecked={selectedTemplate.is_featured}
                          className="h-4 w-4 rounded border-[var(--line)] text-[var(--brand)]"
                        />
                        Featured in live library
                      </label>
                      <Button type="submit" className="w-full">Save template details</Button>
                    </form>
                  </EditorCard>

                  <EditorCard
                    title="Open full builder"
                    hint="Use the full template editor for deeper content changes and launch wiring."
                  >
                    <Button asChild className="w-full">
                      <Link href={`/admin/templates/${selectedTemplate.id}/edit`}>
                        Open template builder
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </EditorCard>

                  <EditorCard title="Actions" hint="Duplicate or retire this template safely." className="pb-4">
                    <div className="space-y-3">
                      <form action={duplicateAdminTemplateAction}>
                        <input type="hidden" name="templateId" value={selectedTemplate.id} />
                        <Button type="submit" variant="outline" className="w-full">
                          <Copy className="h-4 w-4" />
                          Duplicate template
                        </Button>
                      </form>
                      <form action={deleteTemplateLibraryTemplateAction}>
                        <input type="hidden" name="templateId" value={selectedTemplate.id} />
                        <input type="hidden" name="industryId" value={selectedIndustry.id} />
                        <input type="hidden" name="categoryId" value={selectedCategory.id} />
                        <Button type="submit" variant="outline" className="w-full">
                          <Trash2 className="h-4 w-4" />
                          Delete / archive template
                        </Button>
                      </form>
                    </div>
                  </EditorCard>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {currentNodeType !== "template" ? (
          <div className="space-y-4 xl:col-span-2">
            {currentNodeType === "root" ? (
              <EditorCard title="Create industry" hint="Top-level folders start here.">
                <form action={createTemplateIndustryAction} className="space-y-3">
                  <Input name="name" placeholder="Industry name" />
                  <Textarea name="description" placeholder="Optional description" className="min-h-[84px]" />
                  <Button type="submit" className="w-full">
                    <Plus className="h-4 w-4" />
                    Create industry
                  </Button>
                </form>
              </EditorCard>
            ) : null}

            {currentNodeType === "industry" && selectedIndustry ? (
              <div className="grid gap-4 xl:grid-cols-2">
                <EditorCard title="Edit industry" hint="Rename or update the selected top-level folder.">
                  <form action={updateTemplateIndustryAction} className="space-y-3">
                    <input type="hidden" name="industryId" value={selectedIndustry.id} />
                    <Input name="name" defaultValue={selectedIndustry.name} />
                    <Textarea name="description" defaultValue={selectedIndustry.description || ""} className="min-h-[84px]" />
                    <Button type="submit" className="w-full">Save industry</Button>
                  </form>
                </EditorCard>

                <EditorCard title="Create category" hint="New categories are created inside the selected industry.">
                  <form action={createTemplateCategoryAction} className="space-y-3">
                    <input type="hidden" name="industryId" value={selectedIndustry.id} />
                    <Input name="name" placeholder="Category name" />
                    <Textarea name="description" placeholder="Optional description" className="min-h-[84px]" />
                    <Button type="submit" className="w-full">
                      <Plus className="h-4 w-4" />
                      Create category
                    </Button>
                  </form>
                </EditorCard>

                <EditorCard title="Safe delete" hint="If the industry still has child items, they are archived instead of recklessly removed." className="xl:col-span-2">
                  <form action={deleteTemplateIndustryAction}>
                    <input type="hidden" name="industryId" value={selectedIndustry.id} />
                    <Button type="submit" variant="outline" className="w-full">
                      <Trash2 className="h-4 w-4" />
                      Delete / archive industry
                    </Button>
                  </form>
                </EditorCard>
              </div>
            ) : null}

            {currentNodeType === "category" && selectedIndustry && selectedCategory ? (
              <div className="grid gap-4 xl:grid-cols-2">
                <EditorCard title="Edit category" hint="Move the category or rename it without leaving the manager.">
                  <form action={updateTemplateCategoryAction} className="space-y-3">
                    <input type="hidden" name="categoryId" value={selectedCategory.id} />
                    <Input name="name" defaultValue={selectedCategory.name} />
                    <Select name="industryId" defaultValue={selectedIndustry.id}>
                      {industries.map((industry) => (
                        <option key={industry.id} value={industry.id}>
                          {industry.name}
                        </option>
                      ))}
                    </Select>
                    <Textarea name="description" defaultValue={selectedCategory.description || ""} className="min-h-[84px]" />
                    <Button type="submit" className="w-full">Save category</Button>
                  </form>
                </EditorCard>

                <EditorCard title="Create template" hint="This template will open in the full builder as a new draft.">
                  <form action={createTemplateFromCategoryAction} className="space-y-3">
                    <input type="hidden" name="categoryId" value={selectedCategory.id} />
                    <Input name="name" placeholder="Template name" />
                    <Textarea name="description" placeholder="Optional short description" className="min-h-[84px]" />
                    <Button type="submit" className="w-full">
                      <Plus className="h-4 w-4" />
                      Create template
                    </Button>
                  </form>
                </EditorCard>

                <EditorCard title="Safe delete" hint="If templates already live here, they are archived with the category." className="xl:col-span-2">
                  <form action={deleteTemplateCategoryAction}>
                    <input type="hidden" name="categoryId" value={selectedCategory.id} />
                    <input type="hidden" name="industryId" value={selectedIndustry.id} />
                    <Button type="submit" variant="outline" className="w-full">
                      <Trash2 className="h-4 w-4" />
                      Delete / archive category
                    </Button>
                  </form>
                </EditorCard>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}
