import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CrmProviderManageCard } from "@/components/crm-provider-manage-card";
import { PageHeader } from "@/components/page-header";
import { RequestCrmCard } from "@/components/request-crm-card";
import { Button } from "@/components/ui/button";
import { getCurrentRole, requireProductAccessUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentWorkspaceContext } from "@/lib/workspaces";
import { crmProviderMetadataList, getVisibleCrmProviderMetadataList } from "@/lib/crm-providers";
import { getWorkspaceCrmState } from "@/lib/crm-integration";
import {
  getFreshsalesEnvStatus,
  getGhlEnvStatus,
  getHubSpotEnvStatus,
  getKeapEnvStatus,
  getMondayEnvStatus,
  getPipedriveEnvStatus,
  getSalesforceEnvStatus,
  getZohoEnvStatus,
  getCloseEnvStatus,
  isSupabaseServerConfigured,
} from "@/lib/env";

export default async function WorkspaceCrmSelectionPage({
  searchParams,
}: {
  searchParams: Promise<{ provider?: string; saved?: string; error?: string }>;
}) {
  const user = await requireProductAccessUser("/workspace/settings/integrations/crm");
  const [{ provider: selectedProvider, saved, error }, workspaceContext, currentRole] = await Promise.all([
    searchParams,
    getCurrentWorkspaceContext(),
    getCurrentRole(),
  ]);

  const workspaceName = workspaceContext?.activeWorkspace.name || "My Workspace";
  const workspaceRole = workspaceContext?.activeWorkspace.role || null;
  const workspaceId = workspaceContext?.activeWorkspace.id || null;
  const admin = createSupabaseAdminClient();

  const crmState =
    admin && workspaceId
      ? await getWorkspaceCrmState({ admin, workspaceId }).catch(() => ({
          connections: [],
          destinations: [],
          deliveries: [],
          deliveryCounts: {
            pending: 0,
            delivered: 0,
            failed: 0,
            retrying: 0,
            skipped: 0,
          },
        }))
      : {
          connections: [],
          destinations: [],
          deliveries: [],
          deliveryCounts: {
            pending: 0,
            delivered: 0,
            failed: 0,
            retrying: 0,
            skipped: 0,
          },
        };

  const crmConnections = crmState.connections.filter((item) => item.is_active);
  const connectionMap = new Map(crmConnections.map((connection) => [connection.provider, connection]));
  const envStatusByProvider = {
    gohighlevel: getGhlEnvStatus(),
    pipedrive: getPipedriveEnvStatus(),
    hubspot: getHubSpotEnvStatus(),
    zoho: getZohoEnvStatus(),
    freshsales: getFreshsalesEnvStatus(),
    monday: getMondayEnvStatus(),
    keap: getKeapEnvStatus(),
    salesforce: getSalesforceEnvStatus(),
    close: getCloseEnvStatus(),
  } as const;
  const canSendCrmTests =
    currentRole === "admin" || workspaceRole === "owner" || workspaceRole === "admin";
  const connectedCount = crmConnections.length;
  const visibleProviders = getVisibleCrmProviderMetadataList();
  const selectedVisibleProvider = visibleProviders.some((provider) => provider.key === selectedProvider)
    ? selectedProvider
    : undefined;
  const selectedHiddenProviderMetadata =
    selectedProvider && !visibleProviders.some((provider) => provider.key === selectedProvider)
      ? crmProviderMetadataList.find((provider) => provider.key === selectedProvider) || null
      : null;
  const hiddenConnectedSelectedProvider =
    selectedHiddenProviderMetadata && connectionMap.get(selectedHiddenProviderMetadata.key)
      ? selectedHiddenProviderMetadata
      : null;

  return (
    <AppShell currentPath="/settings">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-10 pt-5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <Button asChild variant="ghost" className="w-fit">
              <Link href="/workspace/settings?section=integrations" prefetch>
              <ArrowLeft className="h-4 w-4" />
              Back to integrations
            </Link>
          </Button>
        </div>

        <PageHeader
          badge="CRM Connections"
          title="Connect a CRM"
          description="Choose where SideKick should send your leads."
          actions={
            workspaceId ? (
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-medium text-[var(--muted-strong)]">
                  {connectedCount} connected
                </span>
                <span className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-medium text-[var(--muted-strong)]">
                  {workspaceName}
                </span>
              </div>
            ) : undefined
          }
        />

        {saved ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {saved}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        ) : null}

        {!workspaceId || !admin || !isSupabaseServerConfigured() ? (
          <div className="rounded-[1.75rem] border border-[var(--line)] bg-white p-6 text-sm text-[var(--muted)] shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
            CRM connections are not available until the active workspace is loaded.
          </div>
        ) : (
          <>
            <div className="grid gap-5 lg:grid-cols-2">
              {visibleProviders.map((provider) => (
                <CrmProviderManageCard
                  key={provider.key}
                  provider={provider}
                  connection={connectionMap.get(provider.key) || null}
                  envConfigured={envStatusByProvider[provider.key].configured}
                  workspaceId={workspaceId}
                  canSendCrmTests={canSendCrmTests}
                  isSelected={selectedVisibleProvider === provider.key}
                />
              ))}
            </div>

            {hiddenConnectedSelectedProvider ? (
              <div className="mt-5">
                <CrmProviderManageCard
                  provider={hiddenConnectedSelectedProvider}
                  connection={connectionMap.get(hiddenConnectedSelectedProvider.key) || null}
                  envConfigured={envStatusByProvider[hiddenConnectedSelectedProvider.key].configured}
                  workspaceId={workspaceId}
                  canSendCrmTests={canSendCrmTests}
                  isSelected
                />
              </div>
            ) : null}

            <div className="mt-6">
              <RequestCrmCard
                userEmail={user.email || null}
                workspaceName={workspaceName}
              />
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
