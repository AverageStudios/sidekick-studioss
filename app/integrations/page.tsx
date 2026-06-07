import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Plug, RefreshCcw, Route, Send, ShieldCheck } from "lucide-react";
import {
  disconnectCrmConnectionAction,
  retryCrmDeliveryAction,
  saveCrmConnectionAction,
  saveCrmRoutingAction,
} from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getWorkspaceCrmState } from "@/lib/crm-integration";
import { getWorkspaceMetaIntegrationForUser } from "@/lib/data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getActiveWorkspaceIdForUser } from "@/lib/workspaces";

function statusTone(connected: boolean) {
  return connected
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-amber-200 bg-amber-50 text-amber-700";
}

function formatDeliveryState(state: string) {
  switch (state) {
    case "delivered":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "failed":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "pending":
    case "retrying":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-[var(--line)] bg-[var(--soft-panel)] text-[var(--muted-strong)]";
  }
}

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await requireUser();
  const [{ saved, error }, metaIntegration] = await Promise.all([
    searchParams,
    getWorkspaceMetaIntegrationForUser(user.id),
  ]);
  const admin = createSupabaseAdminClient();
  const workspaceId = await getActiveWorkspaceIdForUser(user.id);
  const crmState =
    admin && workspaceId
      ? await getWorkspaceCrmState({ admin, workspaceId }).catch(() => ({
          connections: [],
          destinations: [],
          routingRules: [],
          activeRoutingRule: null,
          deliveries: [],
        }))
      : {
          connections: [],
          destinations: [],
          routingRules: [],
          activeRoutingRule: null,
          deliveries: [],
        };

  const metaConnected = Boolean(
    metaIntegration?.connection &&
      metaIntegration.tokenAvailable &&
      metaIntegration.connection.status === "connected",
  );
  const connectedProviders = new Set(crmState.connections.filter((connection) => connection.is_active).map((connection) => connection.provider));
  const providerDestinations = crmState.destinations.filter((destination) => destination.is_available);

  return (
    <AppShell currentPath="/integrations">
      <div className="space-y-8">
        {saved ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {saved}
          </div>
        ) : null}
        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <PageHeader
          variant="plain"
          badge="Integrations"
          title="CRM handoff and delivery setup"
          description="SideKick handles campaign launch and lead capture. External CRMs handle lead management, pipeline, and follow-up ownership."
          actions={
            <>
              <Button asChild variant="outline">
                <Link href="/workspace/settings?section=integrations">Source settings</Link>
              </Button>
              <Button asChild>
                <Link href="/campaigns">
                  View campaigns
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </>
          }
        />

        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="rounded-[24px] border-[var(--line)] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--soft-panel)] text-[var(--brand)]">
                <Plug className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--ink)]">Source connection</p>
                <p className="text-sm text-[var(--muted)]">Meta / Facebook</p>
              </div>
            </div>
            <span className={`mt-4 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(metaConnected)}`}>
              {metaConnected ? "Connected" : "Needs connection"}
            </span>
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
              Campaign capture still starts at the source. CRM delivery uses that intake layer instead of a SideKick inbox.
            </p>
          </Card>

          <Card className="rounded-[24px] border-[var(--line)] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--soft-panel)] text-[var(--brand)]">
                <Route className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--ink)]">Routing model</p>
                <p className="text-sm text-[var(--muted)]">Workspace-level handoff</p>
              </div>
            </div>
            <span className={`mt-4 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${crmState.activeRoutingRule ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
              {crmState.activeRoutingRule ? "Default route saved" : "No default route yet"}
            </span>
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
              The current build supports a workspace default CRM destination. Campaign overrides can layer in next.
            </p>
          </Card>

          <Card className="rounded-[24px] border-[var(--line)] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--soft-panel)] text-[var(--brand)]">
                <Send className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--ink)]">Delivery operations</p>
                <p className="text-sm text-[var(--muted)]">Attempts and failures</p>
              </div>
            </div>
            <span className="mt-4 inline-flex rounded-full border border-[var(--line)] bg-[var(--soft-panel)] px-3 py-1 text-xs font-semibold text-[var(--muted-strong)]">
              {crmState.deliveries.length} recent event{crmState.deliveries.length === 1 ? "" : "s"}
            </span>
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
              New captured leads can now be delivered into connected CRMs and logged for retry if delivery fails.
            </p>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Card className="rounded-[28px] border-[var(--line)] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Priority CRM</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">GoHighLevel</h2>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(connectedProviders.has("gohighlevel"))}`}>
                {connectedProviders.has("gohighlevel") ? "Connected" : "Not connected"}
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Connect a sub-account token and location ID. SideKick will upsert captured leads into GoHighLevel contacts for that location.
            </p>

            {connectedProviders.has("gohighlevel") ? (
              <div className="mt-5 space-y-4">
                {crmState.connections
                  .filter((connection) => connection.provider === "gohighlevel" && connection.is_active)
                  .map((connection) => (
                    <div key={connection.id} className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-4">
                      <p className="text-sm font-semibold text-[var(--ink)]">{connection.provider_user_name || "GoHighLevel workspace"}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        Location ID {String(connection.metadata_json.location_id || "unknown")}
                      </p>
                    </div>
                  ))}
                <form action={disconnectCrmConnectionAction}>
                  <input type="hidden" name="provider" value="gohighlevel" />
                  <Button type="submit" variant="outline">Disconnect GoHighLevel</Button>
                </form>
              </div>
            ) : (
              <form action={saveCrmConnectionAction} className="mt-5 space-y-4">
                <input type="hidden" name="provider" value="gohighlevel" />
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--ink)]">Private integration token</label>
                  <input
                    type="password"
                    name="accessToken"
                    required
                    className="h-11 w-full rounded-[14px] border border-[var(--line)] bg-white px-3 text-sm text-[var(--ink)]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--ink)]">Location ID</label>
                  <input
                    type="text"
                    name="locationId"
                    required
                    className="h-11 w-full rounded-[14px] border border-[var(--line)] bg-white px-3 text-sm text-[var(--ink)]"
                  />
                </div>
                <Button type="submit">Connect GoHighLevel</Button>
              </form>
            )}
          </Card>

          <Card className="rounded-[28px] border-[var(--line)] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Priority CRM</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">HubSpot</h2>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(connectedProviders.has("hubspot"))}`}>
                {connectedProviders.has("hubspot") ? "Connected" : "Not connected"}
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Connect a private app token. SideKick will upsert captured leads into HubSpot contacts using email when available.
            </p>

            {connectedProviders.has("hubspot") ? (
              <div className="mt-5 space-y-4">
                {crmState.connections
                  .filter((connection) => connection.provider === "hubspot" && connection.is_active)
                  .map((connection) => (
                    <div key={connection.id} className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-4">
                      <p className="text-sm font-semibold text-[var(--ink)]">{connection.provider_user_name || "HubSpot account"}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        Portal {String(connection.metadata_json.portal_id || "unknown")}
                      </p>
                    </div>
                  ))}
                <form action={disconnectCrmConnectionAction}>
                  <input type="hidden" name="provider" value="hubspot" />
                  <Button type="submit" variant="outline">Disconnect HubSpot</Button>
                </form>
              </div>
            ) : (
              <form action={saveCrmConnectionAction} className="mt-5 space-y-4">
                <input type="hidden" name="provider" value="hubspot" />
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--ink)]">Private app token</label>
                  <input
                    type="password"
                    name="accessToken"
                    required
                    className="h-11 w-full rounded-[14px] border border-[var(--line)] bg-white px-3 text-sm text-[var(--ink)]"
                  />
                </div>
                <Button type="submit">Connect HubSpot</Button>
              </form>
            )}
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1.15fr]">
          <Card className="rounded-[28px] border-[var(--line)] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-7">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Routing</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">Workspace default destination</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                Set where SideKick should hand captured leads off by default. This keeps campaign reporting in SideKick and lead handling in the CRM.
              </p>
            </div>

            {providerDestinations.length ? (
              <form action={saveCrmRoutingAction} className="mt-5 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--ink)]">Destination</label>
                  <select
                    name="routeTarget"
                    defaultValue={
                      crmState.activeRoutingRule
                        ? `${crmState.activeRoutingRule.provider}::${crmState.activeRoutingRule.destination_asset_id || ""}`
                        : ""
                    }
                    className="h-11 w-full rounded-[14px] border border-[var(--line)] bg-white px-3 text-sm text-[var(--ink)]"
                  >
                    <option value="">Select destination</option>
                    {providerDestinations.map((destination) => (
                      <option key={destination.id} value={`${destination.provider}::${destination.id}`}>
                        {destination.provider} · {destination.name || destination.asset_id}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs leading-5 text-[var(--muted)]">
                  If you switch destinations, save once after selecting the target. Campaign-specific routing can be layered in next.
                </p>
                <Button type="submit">Save default routing</Button>
              </form>
            ) : (
              <div className="mt-5 rounded-[22px] border border-dashed border-[var(--line)] px-5 py-8 text-sm leading-6 text-[var(--muted)]">
                Connect GoHighLevel or HubSpot first so SideKick has a valid CRM destination to route into.
              </div>
            )}
          </Card>

          <Card className="rounded-[28px] border-[var(--line)] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Delivery log</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">Recent CRM delivery attempts</h2>
              </div>
              <Badge>{crmState.deliveries.length} recent</Badge>
            </div>

            <div className="mt-5 space-y-3">
              {crmState.deliveries.length ? (
                crmState.deliveries.map((delivery) => (
                  <div key={delivery.id} className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-[var(--ink)]">{delivery.provider}</p>
                          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${formatDeliveryState(delivery.state)}`}>
                            {delivery.state}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          Lead {delivery.lead_id.slice(0, 8)} • attempts {delivery.attempts_count}
                        </p>
                        {delivery.last_error ? (
                          <p className="mt-2 text-sm leading-6 text-rose-700">{delivery.last_error}</p>
                        ) : null}
                      </div>
                      {delivery.state === "failed" ? (
                        <form action={retryCrmDeliveryAction}>
                          <input type="hidden" name="deliveryId" value={delivery.id} />
                          <Button type="submit" variant="outline">Retry</Button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[22px] border border-dashed border-[var(--line)] px-5 py-8 text-sm leading-6 text-[var(--muted)]">
                  No CRM delivery attempts have been logged yet. Once capture is connected and a routing rule exists, new leads will appear here.
                </div>
              )}
            </div>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-[28px] border-[var(--line)] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-7">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Provider roadmap</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">What is live now vs next</h2>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                { name: "GoHighLevel", state: "Live now", detail: "Token validation, default destination, contact upsert, delivery logging." },
                { name: "HubSpot", state: "Live now", detail: "Private app token validation, contact upsert, delivery logging." },
                { name: "Pipedrive", state: "Later", detail: "Reserved in the data model and provider checks for the next wave." },
                { name: "Salesforce", state: "Later", detail: "Reserved in the data model and provider checks for the next wave." },
              ].map((provider) => (
                <div key={provider.name} className="rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[var(--ink)]">{provider.name}</p>
                    <span className="rounded-full bg-[var(--soft-panel)] px-2.5 py-1 text-[11px] font-semibold text-[var(--muted-strong)]">
                      {provider.state}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{provider.detail}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-[28px] border-[var(--line)] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Boundary</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">Keep lead management outside SideKick</h2>

            <div className="mt-5 space-y-3">
              <div className="flex items-start gap-3 rounded-[22px] border border-[var(--line)] bg-[var(--surface)] px-4 py-4">
                <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-[var(--ink)]">Campaign platform first</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                    Campaigns, templates, launch, attribution, and performance stay in SideKick.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-[22px] border border-[var(--line)] bg-[var(--surface)] px-4 py-4">
                <RefreshCcw className="mt-0.5 h-4.5 w-4.5 text-[var(--brand)]" />
                <div>
                  <p className="text-sm font-semibold text-[var(--ink)]">CRM handoff infrastructure</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                    This area is for destination mapping, delivery logs, retries, and sync health, not inbox workflow.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-[22px] border border-[var(--line)] bg-[var(--surface)] px-4 py-4">
                <ShieldCheck className="mt-0.5 h-4.5 w-4.5 text-[var(--brand)]" />
                <div>
                  <p className="text-sm font-semibold text-[var(--ink)]">Useful reporting stays</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                    Lead volume can still support performance reporting without turning SideKick into the long-term system of record for lead management.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
