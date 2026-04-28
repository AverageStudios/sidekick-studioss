import Link from "next/link";
import { ArrowRight, Copy, Sparkles } from "lucide-react";
import { duplicateAdminTemplateAction } from "@/app/actions";
import { AdminShell } from "@/components/admin-shell";
import { AdminTemplateStatusBadge } from "@/components/admin-template-status-badge";
import { PageHeader } from "@/components/page-header";
import { FacebookAdPreview } from "@/components/facebook-ad-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { listAdminTemplates, getAdminTemplateStats } from "@/lib/admin-templates";
import { formatDate } from "@/lib/utils";
import { supportedIndustries, supportedOfferTypes } from "@/data/template-taxonomy";

const statusFilters = ["all", "draft", "published", "archived"] as const;
const industryFilters = ["all", ...supportedIndustries] as const;
const offerTypeFilters = ["all", ...supportedOfferTypes] as const;

export default async function AdminTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; industry?: string; offerType?: string; success?: string; error?: string }>;
}) {
  await requireAdmin();
  const { status = "all", industry = "all", offerType = "all", success, error } = await searchParams;
  const [templates, stats] = await Promise.all([
    listAdminTemplates({ status, industry, offerType }),
    getAdminTemplateStats(),
  ]);

  return (
    <AdminShell currentPath="/admin/templates">
      {success ? (
        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <PageHeader
        badge="Admin templates"
        title="Template builder library"
        description="Manage the master templates normal users will later launch from, with clear draft, publish, archive, and featured states."
        actions={
          <Button asChild size="lg">
            <Link href="/admin/templates/new">
              Create template
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Published", value: stats.published },
          { label: "Drafts", value: stats.draft },
          { label: "Archived", value: stats.archived },
          { label: "Featured", value: stats.featured },
        ].map((item) => (
          <Card key={item.label} className="p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[var(--ink)]">{item.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6 sm:p-7">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2.5">
            {statusFilters.map((filter) => (
              <Link
                key={filter}
                href={`/admin/templates?status=${filter}&industry=${encodeURIComponent(industry)}&offerType=${encodeURIComponent(offerType)}`}
                className={`rounded-full px-4 py-2.5 text-sm font-medium capitalize transition ${
                  filter === status
                    ? "bg-[var(--soft-brand)] text-[var(--brand-ink)] shadow-[0_10px_24px_rgba(109,94,248,0.12)]"
                    : "border border-[var(--line)] bg-white/82 text-[var(--muted-strong)] shadow-[var(--shadow-soft)] hover:border-[color-mix(in_oklab,var(--brand)_18%,white)] hover:bg-white"
                }`}
              >
                {filter}
              </Link>
            ))}
        </div>
        <div className="flex flex-wrap gap-2.5">
            {industryFilters.map((filter) => (
              <Link
                key={filter}
                href={`/admin/templates?status=${status}&industry=${encodeURIComponent(filter)}&offerType=${encodeURIComponent(offerType)}`}
                className={`rounded-full px-4 py-2.5 text-sm font-medium transition ${
                  filter === industry
                    ? "bg-[var(--ink)] text-white shadow-[0_10px_24px_rgba(17,24,39,0.12)]"
                    : "border border-[var(--line)] bg-white/82 text-[var(--muted-strong)] shadow-[var(--shadow-soft)] hover:border-[color-mix(in_oklab,var(--brand)_18%,white)] hover:bg-white"
                }`}
              >
                {filter}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-2.5">
            {offerTypeFilters.map((filter) => (
              <Link
                key={filter}
                href={`/admin/templates?status=${status}&industry=${encodeURIComponent(industry)}&offerType=${encodeURIComponent(filter)}`}
                className={`rounded-full px-4 py-2.5 text-sm font-medium transition ${
                  filter === offerType
                    ? "bg-[var(--soft-brand)] text-[var(--brand-ink)] shadow-[0_10px_24px_rgba(109,94,248,0.12)]"
                    : "border border-[var(--line)] bg-white/82 text-[var(--muted-strong)] shadow-[var(--shadow-soft)] hover:border-[color-mix(in_oklab,var(--brand)_18%,white)] hover:bg-white"
                }`}
              >
                {filter}
              </Link>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
        {templates.length ? (
          templates.map((template) => (
            <Card key={template.id} className="group flex h-full flex-col overflow-hidden">
              <div className="border-b border-[var(--line)] bg-[linear-gradient(145deg,#fafbff_0%,#f2efff_48%,#fbfaf5_100%)] p-5">
                <div className="rounded-[22px] border border-white/80 bg-white/92 p-4 shadow-[0_18px_36px_rgba(17,24,39,0.06)]">
                  <FacebookAdPreview
                    pageName={template.name}
                    primaryText={template.config_json?.adCopy?.primary || template.description}
                    headline={template.config_json?.funnel?.heroHeadline || template.name}
                    description={template.config_json?.adCopy?.descriptions?.[0] || template.config_json?.positioning || template.description}
                    ctaLabel={template.config_json?.ctaDefault || template.offer_type || "Learn more"}
                    imageUrl={template.preview_image_url}
                    compact
                    showMetaBar={false}
                    className="rounded-[18px]"
                  />
                  <div className="mt-4 flex items-start justify-between gap-3">
                    <Badge>{template.industry || template.category}</Badge>
                    <div className="flex flex-wrap justify-end gap-2">
                      {template.is_featured ? (
                        <span className="rounded-full bg-[var(--soft-brand)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--brand-ink)]">
                          Featured
                        </span>
                      ) : null}
                      <AdminTemplateStatusBadge status={template.status} />
                    </div>
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-[var(--ink)]">
                    {template.name}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-strong)]">
                    {template.description}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-full border border-[var(--line)] bg-[var(--soft-panel)] px-3 py-2 text-xs font-medium text-[var(--muted-strong)]">
                      {template.industry || template.config_json?.industry || "Industry not set"}
                    </span>
                    <span className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-medium text-[var(--muted-strong)]">
                      {template.offer_type || template.config_json?.offerType || "Offer type not set"}
                    </span>
                    <span className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-medium text-[var(--muted-strong)]">
                      v{template.version || 1}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-6">
                <div className="rounded-[22px] bg-[var(--soft-panel)] p-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[var(--brand)]" />
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                      Builder summary
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted-strong)]">
                    {(template.config_json?.positioning as string | undefined) || "No positioning summary yet."}
                  </p>
                </div>

                <div className="mt-4 text-sm text-[var(--muted)]">
                  Updated {formatDate(template.updated_at || template.created_at)}
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Button asChild className="sm:flex-1">
                    <Link href={`/admin/templates/${template.id}/edit`}>Edit builder</Link>
                  </Button>
                  <form action={duplicateAdminTemplateAction} className="sm:flex-1">
                    <input type="hidden" name="templateId" value={template.id} />
                    <Button type="submit" variant="outline" className="w-full">
                      <Copy className="h-4 w-4" />
                      Duplicate
                    </Button>
                  </form>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="col-span-full p-10 text-center">
            <p className="text-base font-medium text-[var(--ink)]">No templates match this filter yet.</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
              Adjust the filters or create a new master template to keep building the library.
            </p>
          </Card>
        )}
      </div>
    </AdminShell>
  );
}
