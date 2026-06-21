import { AppShell } from "@/components/app-shell";
import { TemplateLaunchWizard } from "@/components/template-launch-wizard";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireProductAccessUser } from "@/lib/auth";
import {
  getBusinessProfile,
  getCampaignBundle,
  getTemplates,
  getWorkspaceMetaIntegrationForUser,
} from "@/lib/data";

export default async function NewTemplateCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string; template?: string }>;
}) {
  const user = await requireProductAccessUser("/templates/new");
  const [{ draft, template }, templates, businessProfile, metaIntegration] =
    await Promise.all([
    searchParams,
    getTemplates(),
    getBusinessProfile(user.id),
    getWorkspaceMetaIntegrationForUser(user.id),
  ]);

  const initialDraftBundle = draft ? await getCampaignBundle(user.id, draft) : null;
  const connectNextUrl = (() => {
    const params = new URLSearchParams();
    if (draft) params.set("draft", draft);
    if (template) params.set("template", template);
    const query = params.toString();
    return query ? `/templates/new?${query}` : "/templates/new";
  })();

  if (!templates.length) {
    return (
      <AppShell currentPath="/templates">
        <Card className="mx-auto mt-10 max-w-[34rem] rounded-[28px] border-[var(--line)] bg-white p-8 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <h1 className="text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">No launch-ready templates yet</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Campaign launch is unavailable until at least one published template is live in the library.
          </p>
          <div className="mt-6">
            <Button asChild className="rounded-[18px] px-5">
              <Link href="/templates">Back to templates</Link>
            </Button>
          </div>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell currentPath="/templates" fullBleed>
      <TemplateLaunchWizard
        templates={templates}
        businessProfile={businessProfile}
        initialDraftBundle={initialDraftBundle}
        initialTemplateSlug={template || null}
        metaIntegration={metaIntegration}
        connectNextUrl={connectNextUrl}
        immersive
      />
    </AppShell>
  );
}
