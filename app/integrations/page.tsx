import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Plug, RefreshCcw, Route, Send, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { getWorkspaceMetaIntegrationForUser } from "@/lib/data";

function statusTone(connected: boolean) {
  return connected
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-amber-200 bg-amber-50 text-amber-700";
}

export default async function IntegrationsPage() {
  const user = await requireUser();
  const metaIntegration = await getWorkspaceMetaIntegrationForUser(user.id);
  const metaConnected = Boolean(
    metaIntegration?.connection &&
      metaIntegration.tokenAvailable &&
      metaIntegration.connection.status === "connected",
  );

  return (
    <AppShell currentPath="/integrations">
      <div className="space-y-8">
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
              Keep lead capture connected at the source. This is infrastructure for campaign intake, not the main place leads are managed.
            </p>
          </Card>

          <Card className="rounded-[24px] border-[var(--line)] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--soft-panel)] text-[var(--brand)]">
                <Route className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--ink)]">Routing model</p>
                <p className="text-sm text-[var(--muted)]">Workspace and campaign destinations</p>
              </div>
            </div>
            <Badge className="mt-4">Next build phase</Badge>
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
              Lead delivery will route by workspace default first, with campaign-specific CRM overrides layered on top.
            </p>
          </Card>

          <Card className="rounded-[24px] border-[var(--line)] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--soft-panel)] text-[var(--brand)]">
                <Send className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--ink)]">Delivery operations</p>
                <p className="text-sm text-[var(--muted)]">Logs, failures, retries</p>
              </div>
            </div>
            <Badge className="mt-4">Planned</Badge>
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
              This area will become the main destination for delivery logs, retry controls, and sync health instead of a SideKick inbox.
            </p>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-[28px] border-[var(--line)] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-7">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Priority CRM targets</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">External CRMs become the lead destination</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                SideKick is being reshaped into a campaign platform. CRM records, sales workflow, and pipeline updates should live in the tools businesses already use.
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                { name: "GoHighLevel", state: "Priority", detail: "Primary destination for local-business lead delivery." },
                { name: "HubSpot", state: "Priority", detail: "Secondary launch target for structured CRM handoff." },
                { name: "Pipedrive", state: "Future", detail: "Planned once the provider adapter contract is stable." },
                { name: "Salesforce", state: "Future", detail: "Designed for later support, not part of the first integration pass." },
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Current posture</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">What this workspace has today</h2>

            <div className="mt-5 space-y-3">
              <div className="flex items-start gap-3 rounded-[22px] border border-[var(--line)] bg-[var(--surface)] px-4 py-4">
                {metaConnected ? (
                  <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-4.5 w-4.5 text-amber-600" />
                )}
                <div>
                  <p className="text-sm font-semibold text-[var(--ink)]">Meta source capture</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                    {metaConnected
                      ? "Connected and ready to support campaign lead capture."
                      : "Not connected yet. Connect Meta before relying on SideKick for lead intake."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-[22px] border border-[var(--line)] bg-[var(--surface)] px-4 py-4">
                <RefreshCcw className="mt-0.5 h-4.5 w-4.5 text-[var(--brand)]" />
                <div>
                  <p className="text-sm font-semibold text-[var(--ink)]">CRM routing and retries</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                    The UI is now centered around CRM handoff direction. Routing rules, delivery logs, and retries are the next implementation layer.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-[22px] border border-[var(--line)] bg-[var(--surface)] px-4 py-4">
                <ShieldCheck className="mt-0.5 h-4.5 w-4.5 text-[var(--brand)]" />
                <div>
                  <p className="text-sm font-semibold text-[var(--ink)]">Lead management boundary</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                    SideKick should not become the CRM. This area exists to hand leads off cleanly, show delivery health, and keep campaign reporting intact.
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
