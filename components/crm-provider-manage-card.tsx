import Link from "next/link";
import { AlertCircle, CheckCircle2, ChevronRight, Settings2 } from "lucide-react";
import { disconnectCrmConnectionAction, testCrmDeliveryAction } from "@/app/actions";
import { MondayBoardPicker } from "@/components/monday-board-picker";
import { CrmProviderMark } from "@/components/crm-provider-mark";
import { AsyncSubmitButton } from "@/components/ui/async-submit-button";
import { Button } from "@/components/ui/button";
import { PendingLinkButton } from "@/components/ui/pending-link-button";
import {
  buildCrmProviderConnectHref,
  buildCrmProviderManageHref,
  type CrmProviderMetadata,
} from "@/lib/crm-providers";
import { WorkspaceCrmConnectionRow, isCrmTestDeliverySupported } from "@/lib/crm-integration";
import { cn } from "@/lib/utils";

type ProviderState = "connected" | "not_connected" | "needs_setup" | "setup_required";

function formatStatusTone(state: ProviderState) {
  switch (state) {
    case "connected":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "needs_setup":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "setup_required":
      return "border-slate-200 bg-slate-100 text-slate-600";
    default:
      return "border-[var(--line)] bg-white text-[var(--muted-strong)]";
  }
}

function getProviderState({
  provider,
  connection,
  envConfigured,
}: {
  provider: CrmProviderMetadata["key"];
  connection: WorkspaceCrmConnectionRow | null;
  envConfigured: boolean;
}): ProviderState {
  if (connection) {
    if (provider === "hubspot" && connection.metadata_json?.auth_type !== "oauth") {
      return "needs_setup";
    }

    if (provider === "monday") {
      const boardId =
        (typeof connection.metadata_json.board_id === "string" && connection.metadata_json.board_id) ||
        (typeof connection.metadata_json.boardId === "string" && connection.metadata_json.boardId) ||
        "";
      if (!boardId) {
        return "needs_setup";
      }
    }

    return "connected";
  }

  if (!envConfigured) {
    return "setup_required";
  }

  return "not_connected";
}

function getStatusLabel(state: ProviderState) {
  switch (state) {
    case "connected":
      return "Connected";
    case "needs_setup":
      return "Needs setup";
    case "setup_required":
      return "Setup required";
    default:
      return "Not connected";
  }
}

export function CrmProviderManageCard({
  provider,
  connection,
  envConfigured,
  workspaceId,
  canSendCrmTests,
  isSelected,
  basePath = "/workspace/settings/integrations/crm",
}: {
  provider: CrmProviderMetadata;
  connection: WorkspaceCrmConnectionRow | null;
  envConfigured: boolean;
  workspaceId: string;
  canSendCrmTests: boolean;
  isSelected: boolean;
  basePath?: string;
}) {
  const state = getProviderState({
    provider: provider.key,
    connection,
    envConfigured,
  });
  const redirectTo = `${buildCrmProviderManageHref(provider.key)}`;
  const isConnected = Boolean(connection);
  const mondayBoardId =
    (typeof connection?.metadata_json.board_id === "string" && connection.metadata_json.board_id) ||
    (typeof connection?.metadata_json.boardId === "string" && connection.metadata_json.boardId) ||
    "";
  const mondayBoardName =
    (typeof connection?.metadata_json.board_name === "string" && connection.metadata_json.board_name) ||
    (typeof connection?.metadata_json.boardName === "string" && connection.metadata_json.boardName) ||
    "";
  const mondayBoardWorkspaceName =
    (typeof connection?.metadata_json.board_workspace_name === "string" &&
      connection.metadata_json.board_workspace_name) ||
    (typeof connection?.metadata_json.boardWorkspaceName === "string" &&
      connection.metadata_json.boardWorkspaceName) ||
    "";
  const primaryHref =
    state === "not_connected"
      ? buildCrmProviderConnectHref(provider.key, redirectTo)
      : state === "needs_setup" && provider.key === "hubspot"
        ? buildCrmProviderConnectHref(provider.key, redirectTo)
        : `${basePath}?provider=${provider.key}`;
  const primaryLabel =
    state === "connected"
      ? "Manage"
      : state === "needs_setup"
        ? provider.key === "hubspot"
          ? "Reconnect"
          : "Manage"
        : state === "setup_required"
          ? "Setup required"
          : "Connect";
  const helperText =
    provider.key === "hubspot" && state === "needs_setup"
      ? "Reconnect this legacy CRM to replace the older manual token connection with OAuth."
      : provider.key === "monday" && state === "needs_setup"
        ? "Choose a monday board before sending a test lead."
        : !envConfigured
          ? "OAuth setup is not configured yet."
          : null;
  const showExpandedPanel = isSelected && isConnected;

  return (
    <div
      id={`crm-provider-${provider.key}`}
      className={cn(
        "rounded-[1.75rem] border bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)] transition-all duration-200 sm:p-6",
        isSelected
          ? "border-[color-mix(in_oklab,var(--brand)_30%,white)] shadow-[0_18px_40px_rgba(80,70,180,0.12)]"
          : "border-[var(--line)]",
      )}
    >
      <div className="flex items-start gap-4">
        <CrmProviderMark provider={provider.key} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold text-[var(--ink)]">{provider.label}</h2>
            <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", formatStatusTone(state))}>
              {getStatusLabel(state)}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{provider.shortDescription}</p>
          {connection?.provider_user_name ? (
            <p className="mt-2 text-xs text-[var(--muted)]">{connection.provider_user_name}</p>
          ) : null}
          {helperText ? (
            <p className="mt-2 text-xs text-[var(--muted)]">{helperText}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {state === "setup_required" ? (
          <Button disabled>Setup required</Button>
        ) : (
          <PendingLinkButton
            href={primaryHref}
            label={primaryLabel}
            pendingLabel={
              primaryLabel === "Connect"
                ? "Connecting..."
                : primaryLabel === "Reconnect"
                  ? "Reconnecting..."
                  : "Opening..."
            }
            icon={(state === "connected" || (state === "needs_setup" && provider.key !== "hubspot")) ? <ChevronRight className="h-4 w-4" /> : undefined}
          />
        )}
        {isConnected && state === "connected" && !isSelected ? (
          <Button asChild variant="outline">
            <Link href={`${basePath}?provider=${provider.key}`}>
              <Settings2 className="h-4 w-4" />
              Open
            </Link>
          </Button>
        ) : null}
      </div>

      {showExpandedPanel ? (
        <div className="mt-5 rounded-[1.35rem] border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5">
          <div className="flex flex-wrap gap-2">
            <PendingLinkButton
              href={buildCrmProviderConnectHref(provider.key, redirectTo)}
              label="Reconnect"
              pendingLabel="Reconnecting..."
              variant="outline"
              disabled={!envConfigured}
            />
            {isConnected && canSendCrmTests && isCrmTestDeliverySupported(provider.key) ? (
              <form action={testCrmDeliveryAction}>
                <input type="hidden" name="workspaceId" value={workspaceId} />
                <input type="hidden" name="provider" value={provider.key} />
                <input type="hidden" name="redirectTo" value={redirectTo} />
                <AsyncSubmitButton
                  label="Send Test Lead"
                  pendingLabel="Sending..."
                  variant="secondary"
                  disabled={provider.key === "monday" && !mondayBoardId}
                />
              </form>
            ) : null}
            <form action={disconnectCrmConnectionAction}>
              <input type="hidden" name="provider" value={provider.key} />
              <input type="hidden" name="redirectTo" value={basePath} />
              <AsyncSubmitButton
                label="Disconnect"
                pendingLabel="Disconnecting..."
                variant="outline"
                disabled={!isConnected}
              />
            </form>
          </div>

          {!canSendCrmTests ? (
            <p className="mt-3 text-xs text-[var(--muted)]">Only workspace owners or admins can send test leads.</p>
          ) : null}

          {provider.key === "monday" ? (
            <MondayBoardPicker
              workspaceId={workspaceId}
              selectedBoardId={mondayBoardId}
              selectedBoardName={mondayBoardName}
              selectedBoardWorkspaceName={mondayBoardWorkspaceName}
              canManage={canSendCrmTests}
            />
          ) : null}

          {provider.key === "monday" && !mondayBoardId ? (
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>Choose a monday board before sending a test lead.</p>
            </div>
          ) : null}

          {state === "connected" ? (
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <p>SideKick can deliver Meta Lead Form submissions into this CRM for the current workspace.</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
