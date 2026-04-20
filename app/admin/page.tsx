import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { AdminTemplateStatusBadge } from "@/components/admin-template-status-badge";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth";
import { getAdminTemplateStats } from "@/lib/admin-templates";
import { formatDate } from "@/lib/utils";

export default async function AdminPage() {
  await requireAdmin();
  const stats = await getAdminTemplateStats();

  return (
    <AdminShell currentPath="/admin">
      <PageHeader
        badge="Admin"
        title="Manage the master template library"
        description="Create the blueprint layer that powers what normal users can see, start from, and launch from inside SideKick."
        actions={
          <Button asChild size="lg">
            <Link href="/admin/templates/new">
              Create template
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Total templates", value: stats.total },
          { label: "Published", value: stats.published },
          { label: "Draft", value: stats.draft },
          { label: "Archived", value: stats.archived },
          { label: "Featured", value: stats.featured },
        ].map((item) => (
          <Card key={item.label} className="p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[var(--ink)]">{item.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="p-6 sm:p-7">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-ink)]">
              What this controls
            </p>
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">The admin blueprint layer</h2>
            <p className="text-sm leading-7 text-[var(--muted-strong)]">
              Master templates are created here first, then published into the library normal users can start from. Users later create campaign instances from these templates without editing the master blueprint directly.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {[
              "Create and edit the template blueprint users will start from.",
              "Control draft, published, and archived states.",
              "Mark featured templates so the live gallery stays curated.",
            ].map((item) => (
              <div key={item} className="rounded-[22px] bg-[var(--soft-panel)] px-4 py-4 text-sm leading-6 text-[var(--muted-strong)]">
                {item}
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="sm:flex-1">
              <Link href="/admin/templates">Open template manager</Link>
            </Button>
            <Button asChild variant="outline" className="sm:flex-1">
              <Link href="/admin/templates/new">Create new blueprint</Link>
            </Button>
          </div>
        </Card>

        <Card className="p-6 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-ink)]">
                Recent templates
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">Jump back into recent work</h2>
            </div>
            <Sparkles className="h-5 w-5 text-[var(--brand)]" />
          </div>

          <div className="mt-5 space-y-3">
            {stats.recent.length ? (
              stats.recent.map((template) => (
                <Link
                  key={template.id}
                  href={`/admin/templates/${template.id}/edit`}
                  className="flex items-center justify-between gap-4 rounded-[22px] border border-[var(--line)] bg-white/82 px-4 py-4 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--brand)_18%,white)] hover:bg-white"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--ink)]">{template.name}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {template.category} • Updated {formatDate(template.updated_at || template.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {template.is_featured ? (
                      <span className="rounded-full bg-[var(--soft-brand)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--brand-ink)]">
                        Featured
                      </span>
                    ) : null}
                    <AdminTemplateStatusBadge status={template.status} />
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-[22px] border border-dashed border-[var(--line)] px-5 py-10 text-center text-sm text-[var(--muted)]">
                No templates yet. Create the first master template to start the library.
              </div>
            )}
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}
