import Link from "next/link";
import {
  ArrowLeft,
  Image as ImageIcon,
  LayoutTemplate,
  Plug,
  Settings2,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { InitialsAvatar } from "@/components/initials-avatar";
import {
  inviteWorkspaceMemberAction,
  removeWorkspaceMemberAction,
  revokeWorkspaceInvitationAction,
  disconnectMetaIntegrationAction,
  refreshMetaIntegrationAssetsAction,
  saveMetaIntegrationSelectionsAction,
  updateWorkspaceMemberRoleAction,
  updateWorkspaceGeneralAction,
  updateWorkspaceIconAction,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth";
import { getDashboardSnapshot } from "@/lib/data";
import { cn } from "@/lib/utils";
import { getCurrentWorkspaceContext, getCurrentWorkspaceMembers } from "@/lib/workspaces";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isMetaConfigured } from "@/lib/meta";
import { getWorkspaceMetaIntegrationState } from "@/lib/meta-integration";
import { env, isSupabaseServerConfigured } from "@/lib/env";

const workspaceSections = [
  { id: "general", label: "General", icon: Settings2 },
  { id: "icon", label: "Icon", icon: ImageIcon },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "campaigns", label: "Campaigns", icon: LayoutTemplate },
  { id: "members", label: "Members", icon: Users },
] as const;

type WorkspaceSection = (typeof workspaceSections)[number]["id"];

function getSection(section: string | undefined): WorkspaceSection {
  return workspaceSections.some((item) => item.id === section) ? (section as WorkspaceSection) : "general";
}

export default async function WorkspaceSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string; saved?: string; error?: string }>;
}) {
  const user = await requireUser();
  const [{ section: rawSection, saved, error }, workspaceContext, members, dashboardSnapshot] = await Promise.all([
    searchParams,
    getCurrentWorkspaceContext(),
    getCurrentWorkspaceMembers(),
    getDashboardSnapshot(user.id),
  ]);

  const section = getSection(rawSection);
  const workspaceName = workspaceContext?.activeWorkspace.name || "My Workspace";
  const businessProfile = workspaceContext?.businessProfile;
  const workspaceId = workspaceContext?.activeWorkspace.id || null;
  const workspaceContextMissing = !workspaceContext && isSupabaseServerConfigured();
  const admin = createSupabaseAdminClient();
  let integrationError: string | null = null;
  const integrationState =
    admin && workspaceId
      ? await getWorkspaceMetaIntegrationState({ admin, workspaceId }).catch((err) => {
          integrationError = err instanceof Error ? err.message : "Meta integration data could not be loaded.";
          return null;
        })
      : null;
  const connection = integrationState?.connection || null;
  const adAccounts = integrationState?.assets.adAccounts || [];
  const pages = integrationState?.assets.pages || [];
  const instagramActors = integrationState?.assets.instagramActors || [];
  const metaConnected =
    Boolean(connection && integrationState?.tokenAvailable && connection.status === "connected");
  const hasSelectedAdAccount = Boolean(integrationState?.selected.adAccountId);
  const hasSelectedPage = Boolean(integrationState?.selected.pageId);
  const metaConnectNext = encodeURIComponent("/workspace/settings?section=integrations");
  const selectedPageLeadFormAccess =
    connection?.metadata_json &&
    typeof connection.metadata_json === "object" &&
    connection.metadata_json.selected_page_lead_form_access &&
    typeof connection.metadata_json.selected_page_lead_form_access === "object"
      ? (connection.metadata_json.selected_page_lead_form_access as Record<string, unknown>)
      : null;
  const selectedPageLeadFormMissingPermissions = Array.isArray(selectedPageLeadFormAccess?.missingPermissions)
    ? selectedPageLeadFormAccess?.missingPermissions.filter(
        (permission): permission is string => typeof permission === "string",
      )
    : [];
  const needsLeadFormReconnect = selectedPageLeadFormMissingPermissions.includes("pages_manage_ads");
  const metaConnectHref = `/api/meta/connect?next=${metaConnectNext}${needsLeadFormReconnect ? "&scopeSet=lead_forms" : ""}${metaConnected || needsLeadFormReconnect ? "&reconnect=1" : ""}`;
  const campaigns = dashboardSnapshot.campaigns || [];
  const publishedCampaigns = campaigns.filter((campaign) => campaign.status === "published");
  const draftCampaigns = campaigns.filter((campaign) => campaign.status === "draft");
  const { data: membershipRaw } =
    admin && workspaceId
      ? await admin
          .from("workspace_memberships")
          .select("role")
          .eq("workspace_id", workspaceId)
          .eq("user_id", user.id)
          .maybeSingle()
      : { data: null };
  const actorRole =
    (membershipRaw?.role as "owner" | "admin" | "member" | undefined) ||
    (workspaceContext?.activeWorkspace.owner_user_id === user.id ? "owner" : "member");
  const isWorkspaceOwner = workspaceContext?.activeWorkspace.owner_user_id === user.id;
  const canManageMembers = isWorkspaceOwner || actorRole === "owner" || actorRole === "admin";
  const { data: invitesRaw } =
    admin && workspaceId
      ? await admin
          .from("workspace_invitations")
          .select("id, invited_email, invited_role, status, token, expires_at, created_at")
          .eq("workspace_id", workspaceId)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
      : { data: [] };
  const pendingInvites = (invitesRaw || []) as Array<{
    id: string;
    invited_email: string;
    invited_role: "admin" | "member";
    status: "pending";
    token: string;
    expires_at: string;
    created_at: string;
  }>;

  return (
    <AppShell currentPath="/settings">
      <div className="overflow-hidden rounded-[2rem] border border-[var(--line)] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
        <div className="grid min-h-[42rem] lg:grid-cols-[18rem_minmax(0,1fr)]">
          <aside className="border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--surface)_78%,white)] px-6 py-7 lg:border-b-0 lg:border-r">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted-strong)] transition-colors hover:text-[var(--ink)]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>

            <div className="mt-8">
              <h1 className="text-[1.7rem] font-semibold tracking-[-0.04em] text-[var(--ink)]">
                {workspaceName}
              </h1>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Real workspace settings for the business account behind your SideKick setup.
              </p>
            </div>

            <nav className="mt-8 space-y-1.5">
              {workspaceSections.map((item) => {
                const Icon = item.icon;
                const active = item.id === section;

                return (
                  <Link
                    key={item.id}
                    href={`/workspace/settings?section=${item.id}`}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                      active
                        ? "bg-[var(--soft-panel)] text-[var(--brand-ink)]"
                        : "text-[var(--muted)] hover:bg-[var(--soft-panel)] hover:text-[var(--ink)]",
                    )}
                  >
                    <Icon className={cn("h-4 w-4", active ? "text-[var(--brand)]" : "text-[var(--muted)]")} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-8 rounded-2xl border border-[var(--line)] bg-white p-4">
              <p className="text-sm font-semibold text-[var(--ink)]">Visibility</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                These settings affect the active workspace. Member invites and access controls can come next.
              </p>
            </div>
          </aside>

          <div className="px-6 py-8 sm:px-8 sm:py-10 lg:px-12">
            {saved ? (
              <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Workspace settings saved.
              </div>
            ) : null}
            {error ? (
              <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            {section === "general" ? (
              <section className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">General</p>
                <h2 className="mt-3 text-[2.2rem] font-semibold tracking-[-0.05em] text-[var(--ink)]">General</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  Basic settings for your workspace and business identity.
                </p>

                <form action={updateWorkspaceGeneralAction} className="mt-8 space-y-6">
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label className="text-sm font-medium text-[var(--ink)]" htmlFor="workspaceName">
                        Workspace name
                      </label>
                      <span className="text-xs text-[var(--muted)]">{workspaceName.length}/40 characters</span>
                    </div>
                    <Input
                      id="workspaceName"
                      name="workspaceName"
                      maxLength={40}
                      defaultValue={workspaceName}
                      placeholder="Workspace name"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--ink)]" htmlFor="businessName">
                      Business name
                    </label>
                    <Input
                      id="businessName"
                      name="businessName"
                      defaultValue={businessProfile?.business_name || workspaceName}
                      placeholder="Business name"
                      required
                    />
                  </div>

                  <Button type="submit">Save general settings</Button>
                </form>
              </section>
            ) : null}

            {section === "icon" ? (
              <section className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Icon</p>
                <h2 className="mt-3 text-[2.2rem] font-semibold tracking-[-0.05em] text-[var(--ink)]">Icon</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  Update the workspace logo and accent color used across your campaign setup.
                </p>

                <form action={updateWorkspaceIconAction} className="mt-8 space-y-6">
                  <div className="rounded-2xl border border-[var(--line)] bg-[var(--soft-panel)] p-5">
                    <p className="text-sm font-medium text-[var(--ink)]">Current logo</p>
                    <div className="mt-4 flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
                        {businessProfile?.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={businessProfile.logo_url} alt={`${workspaceName} logo`} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-lg font-semibold text-[var(--muted)]">
                            {workspaceName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-[var(--muted)]">
                        Upload a logo for this workspace, or remove the current one.
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--ink)]" htmlFor="logo">
                      Upload logo
                    </label>
                    <Input id="logo" name="logo" type="file" accept="image/*" />
                  </div>

                  <div className="flex items-center gap-3">
                    <input id="removeLogo" name="removeLogo" type="checkbox" value="1" className="h-4 w-4 rounded border-[var(--line)]" />
                    <label htmlFor="removeLogo" className="text-sm text-[var(--muted-strong)]">
                      Remove current logo
                    </label>
                  </div>

                  <div className="max-w-[12rem]">
                    <label className="mb-2 block text-sm font-medium text-[var(--ink)]" htmlFor="brandColor">
                      Brand color
                    </label>
                    <Input
                      id="brandColor"
                      name="brandColor"
                      type="color"
                      defaultValue={businessProfile?.brand_color || "#6D5EF8"}
                      className="h-11 p-1.5"
                    />
                  </div>

                  <Button type="submit">Save icon settings</Button>
                </form>
              </section>
            ) : null}

            {section === "campaigns" ? (
              <section className="max-w-5xl">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Campaigns</p>
                <h2 className="mt-3 text-[2.2rem] font-semibold tracking-[-0.05em] text-[var(--ink)]">Campaigns</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  See every draft and published ad running inside this workspace.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Total campaigns</p>
                    <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">{campaigns.length}</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Published</p>
                    <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">{publishedCampaigns.length}</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Drafts</p>
                    <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)]">{draftCampaigns.length}</p>
                  </div>
                </div>

                <div className="mt-8 space-y-8">
                  <div>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold text-[var(--ink)]">Published ads</h3>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          Live campaigns that are already running from this workspace.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {publishedCampaigns.length ? (
                        publishedCampaigns.map((campaign) => (
                          <div
                            key={campaign.id}
                            className="flex flex-col gap-4 rounded-2xl border border-[var(--line)] bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-sm font-semibold text-[var(--ink)]">{campaign.name}</p>
                                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                                  Published
                                </span>
                              </div>
                              <p className="mt-2 line-clamp-1 text-sm text-[var(--muted)]">
                                {campaign.headline || campaign.subheadline || "This campaign is live in your workspace."}
                              </p>
                              <p className="mt-2 text-xs text-[var(--muted)]">
                                Updated {new Date(campaign.updated_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Button asChild variant="outline">
                              <Link href={`/campaigns/${campaign.id}`}>Open campaign</Link>
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-[var(--line)] bg-[var(--soft-panel)] p-5 text-sm text-[var(--muted)]">
                          No published ads in this workspace yet.
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold text-[var(--ink)]">Draft ads</h3>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          Campaigns still being prepared before they go live.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {draftCampaigns.length ? (
                        draftCampaigns.map((campaign) => (
                          <div
                            key={campaign.id}
                            className="flex flex-col gap-4 rounded-2xl border border-[var(--line)] bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-sm font-semibold text-[var(--ink)]">{campaign.name}</p>
                                <span className="rounded-full bg-[var(--soft-panel)] px-2.5 py-1 text-[11px] font-medium text-[var(--ink)]">
                                  Draft
                                </span>
                              </div>
                              <p className="mt-2 line-clamp-1 text-sm text-[var(--muted)]">
                                {campaign.headline || campaign.subheadline || "This draft is still being customized."}
                              </p>
                              <p className="mt-2 text-xs text-[var(--muted)]">
                                Updated {new Date(campaign.updated_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Button asChild variant="outline">
                              <Link href={`/campaigns/${campaign.id}`}>Continue editing</Link>
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-[var(--line)] bg-[var(--soft-panel)] p-5 text-sm text-[var(--muted)]">
                          No draft ads in this workspace right now.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            {section === "integrations" ? (
              <section className="max-w-5xl">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Integrations</p>
                <h2 className="mt-3 text-[2.2rem] font-semibold tracking-[-0.05em] text-[var(--ink)]">Meta / Facebook</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  This connection is scoped to this workspace. New workspaces need their own Meta connection.
                </p>

                <div className="mt-8">
                  <div className="rounded-[1.5rem] border border-[var(--line)] bg-white px-6 py-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                    {workspaceContextMissing ? (
                      <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        <strong>Workspace could not be loaded.</strong> This usually means the required database migrations have not been applied to your Supabase project. Run migrations 004 and 011 from <code>supabase/migrations/</code> against your project.
                      </div>
                    ) : null}
                    {!isMetaConfigured() ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        Meta env vars are missing. Set <code>META_APP_ID</code>, <code>META_APP_SECRET</code>, and <code>META_REDIRECT_URI</code> in your environment.
                      </div>
                    ) : null}
                    {integrationError ? (
                      <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {integrationError}
                      </div>
                    ) : null}

                    <div className="flex flex-col gap-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#f3f7ff] text-[#1877f2] shadow-[inset_0_0_0_1px_rgba(24,119,242,0.08)]">
                            <span className="text-2xl font-black leading-none">∞</span>
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="text-[1.35rem] font-semibold tracking-[-0.04em] text-[var(--ink)]">Facebook</h3>
                              <span
                                className={cn(
                                  "rounded-full border px-3 py-1 text-xs font-semibold",
                                  metaConnected
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-amber-300 bg-amber-50 text-amber-700",
                                )}
                              >
                                {metaConnected ? "Connected" : "Needs Attention"}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-[var(--muted)]">Meta Ads Manager</p>
                            {connection?.provider_user_name ? (
                              <p className="mt-1 text-xs text-[var(--muted)]">Connected as {connection.provider_user_name}</p>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 sm:justify-end">
                          {connection ? (
                            <form action={disconnectMetaIntegrationAction}>
                              <Button type="submit" variant="outline">Disconnect</Button>
                            </form>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button asChild disabled={!isMetaConfigured() || !workspaceId}>
                          <Link href={metaConnectHref}>
                            {metaConnected ? "Reconnect" : "Connect Facebook"}
                          </Link>
                        </Button>

                        {metaConnected ? (
                          <form action={refreshMetaIntegrationAssetsAction}>
                            <Button type="submit" variant="outline">Refresh assets</Button>
                          </form>
                        ) : null}
                      </div>
                    </div>

                    {connection ? (
                      <form action={saveMetaIntegrationSelectionsAction} className="mt-6 border-t border-[var(--line)] pt-6">
                        <div className="space-y-5">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                              <label className="block text-sm font-medium text-[var(--ink)]">
                                Ad Account
                              </label>
                              <span className="text-sm font-medium text-[var(--brand)]">
                                create new
                              </span>
                            </div>
                            <select
                              name="adAccountId"
                              defaultValue={integrationState?.selected.adAccountId || ""}
                              className="h-12 w-full rounded-[14px] border border-[var(--line)] bg-white px-4 text-sm text-[var(--ink)] shadow-sm outline-none transition-colors focus:border-[var(--brand)]"
                            >
                              <option value="">Select ad account</option>
                              {adAccounts.map((account) => (
                                <option key={account.asset_id} value={account.asset_id}>
                                  {account.name || account.asset_id}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                              <label className="block text-sm font-medium text-[var(--ink)]">
                                Facebook Page
                              </label>
                              <span className="text-sm font-medium text-[var(--brand)]">
                                create page
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <select
                                name="pageId"
                                defaultValue={integrationState?.selected.pageId || ""}
                                className="h-12 min-w-0 flex-1 rounded-[14px] border border-[var(--line)] bg-white px-4 text-sm text-[var(--ink)] shadow-sm outline-none transition-colors focus:border-[var(--brand)]"
                              >
                                <option value="">Select page</option>
                                {pages.map((page) => (
                                  <option key={page.asset_id} value={page.asset_id}>
                                    {page.name || page.asset_id}
                                  </option>
                                ))}
                              </select>
                              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-[var(--line)] bg-white text-[var(--muted)] shadow-sm">
                                ↻
                              </div>
                            </div>
                          </div>

                          {instagramActors.length ? (
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-[var(--ink)]">
                                Instagram (optional)
                              </label>
                              <select
                                name="instagramActorId"
                                defaultValue={integrationState?.selected.instagramActorId || ""}
                                className="h-12 w-full rounded-[14px] border border-[var(--line)] bg-white px-4 text-sm text-[var(--ink)] shadow-sm outline-none transition-colors focus:border-[var(--brand)]"
                              >
                                <option value="">No Instagram actor selected</option>
                                {instagramActors.map((actor) => (
                                  <option key={actor.asset_id} value={actor.asset_id}>
                                    {actor.name || actor.asset_id}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : null}
                        </div>

                        <div className="mt-7 flex flex-col items-center gap-4 border-t border-[var(--line)] pt-6">
                          <Button type="submit" className="min-w-[13rem]">
                            Save
                          </Button>
                          <div className="text-center">
                            {metaConnected ? (
                              <Link
                                href={metaConnectHref}
                                className="text-sm font-medium text-[var(--brand)] transition-colors hover:text-[var(--brand-ink)]"
                              >
                                Reconnect
                              </Link>
                            ) : null}
                            <p className="mt-1 text-xs text-[var(--muted)]">
                              {needsLeadFormReconnect
                                ? "Reconnect will request lead-form permissions for the selected Facebook Page."
                                : "Update permissions or switch accounts"}
                            </p>
                          </div>
                        </div>
                      </form>
                    ) : null}
                  </div>
                </div>
              </section>
            ) : null}

            {section === "members" ? (
              <section className="max-w-4xl">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Members</p>
                <h2 className="mt-3 text-[2.2rem] font-semibold tracking-[-0.05em] text-[var(--ink)]">Members</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  Invite teammates into this workspace, manage roles, and collaborate across devices.
                </p>

                <form action={inviteWorkspaceMemberAction} className="mt-8 rounded-2xl border border-[var(--line)] bg-white p-5">
                  <p className="text-sm font-semibold text-[var(--ink)]">Invite member</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_auto]">
                    <Input name="email" type="email" placeholder="name@company.com" required />
                    <select
                      name="role"
                      defaultValue="member"
                      className="h-11 rounded-[14px] border border-[var(--line)] bg-white px-3 text-sm text-[var(--ink)]"
                    >
                      {isWorkspaceOwner || actorRole === "owner" ? <option value="admin">Admin</option> : null}
                      <option value="member">Member</option>
                    </select>
                    <Button type="submit">Send invite</Button>
                  </div>
                  {!canManageMembers ? (
                    <p className="mt-3 text-xs text-[var(--muted)]">
                      If this is your workspace and this still appears, refresh once and try again.
                    </p>
                  ) : null}
                </form>

                <div className="mt-8">
                  <h3 className="text-base font-semibold text-[var(--ink)]">Pending invites</h3>
                  <div className="mt-3 space-y-3">
                    {pendingInvites.length ? (
                      pendingInvites.map((invite) => {
                        const inviteLink = `${env.appUrl}/workspaces/invite?token=${invite.token}`;
                        return (
                          <div
                            key={invite.id}
                            className="flex flex-col gap-4 rounded-2xl border border-[var(--line)] bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[var(--ink)]">{invite.invited_email}</p>
                              <p className="mt-1 text-xs text-[var(--muted)]">
                                Role: <span className="capitalize">{invite.invited_role}</span> • Expires{" "}
                                {new Date(invite.expires_at).toLocaleDateString()}
                              </p>
                              <p className="mt-2 truncate text-xs text-[var(--muted)]">{inviteLink}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button asChild variant="outline">
                                <Link href={inviteLink}>Open</Link>
                              </Button>
                              {canManageMembers ? (
                                <form action={revokeWorkspaceInvitationAction}>
                                  <input type="hidden" name="invitationId" value={invite.id} />
                                  <Button type="submit" variant="outline">Revoke</Button>
                                </form>
                              ) : null}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-2xl border border-[var(--line)] bg-[var(--soft-panel)] p-5 text-sm text-[var(--muted)]">
                        No pending invites.
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  {members.map((member) => (
                    <div
                      key={member.membershipId}
                      className="flex flex-col gap-4 rounded-2xl border border-[var(--line)] bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <InitialsAvatar
                          initials={member.initials}
                          label={member.displayName}
                          size="lg"
                          tone={member.isCurrentUser ? "brand" : "subtle"}
                        />
                        <div>
                          <p className="text-sm font-semibold text-[var(--ink)]">
                            {member.displayName} {member.isCurrentUser ? <span className="text-[var(--muted)]">(You)</span> : null}
                          </p>
                          <p className="mt-1 text-sm text-[var(--muted)]">{member.email || "Email unavailable"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {canManageMembers && member.role !== "owner" ? (
                          <form action={updateWorkspaceMemberRoleAction} className="flex items-center gap-2">
                            <input type="hidden" name="membershipId" value={member.membershipId} />
                            <select
                              name="role"
                              defaultValue={member.role}
                              className="h-9 rounded-[12px] border border-[var(--line)] bg-white px-2 text-xs font-medium text-[var(--ink)]"
                            >
                              {isWorkspaceOwner || actorRole === "owner" ? <option value="admin">Admin</option> : null}
                              <option value="member">Member</option>
                            </select>
                            <Button type="submit" variant="outline">Save</Button>
                          </form>
                        ) : (
                          <span className="rounded-full bg-[var(--soft-panel)] px-3 py-1 text-xs font-medium capitalize text-[var(--ink)]">
                            {member.role}
                          </span>
                        )}
                        {canManageMembers && !member.isCurrentUser && member.role !== "owner" ? (
                          <form action={removeWorkspaceMemberAction}>
                            <input type="hidden" name="membershipId" value={member.membershipId} />
                            <Button type="submit" variant="outline">Remove</Button>
                          </form>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--soft-panel)] p-5">
                  <p className="text-sm font-medium text-[var(--ink)]">Workspace permissions</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    Owner can manage admins and members. Admins can invite and manage members.
                  </p>
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
