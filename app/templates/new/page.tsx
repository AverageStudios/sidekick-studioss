import { AppShell } from "@/components/app-shell";
import { TemplateLaunchWizard } from "@/components/template-launch-wizard";
import { requireUser } from "@/lib/auth";
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
  const user = await requireUser();
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

  return (
    <AppShell currentPath="/templates">
      <TemplateLaunchWizard
        templates={templates}
        businessProfile={businessProfile}
        initialDraftBundle={initialDraftBundle}
        initialTemplateSlug={template || null}
        metaIntegration={metaIntegration}
        connectNextUrl={connectNextUrl}
      />
    </AppShell>
  );
}
