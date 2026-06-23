import Link from "next/link";
import { ArrowRight, Building2, CheckCircle2, Plus } from "lucide-react";
import { switchWorkspaceAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { InitialsAvatar } from "@/components/initials-avatar";
import { WorkspaceDeleteButton } from "@/components/workspace-delete-button";
import { Button } from "@/components/ui/button";
import { requireProductAccessUser } from "@/lib/auth";
import { getCurrentWorkspaceContext } from "@/lib/workspaces";

export default async function WorkspacesPage() {
  await requireProductAccessUser("/workspaces");
  const workspaceContext = await getCurrentWorkspaceContext();
  const workspaces = workspaceContext?.workspaces || [];
  const activeWorkspaceId = workspaceContext?.activeWorkspace.id || "";

  return (
    <AppShell currentPath="/workspaces">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Workspaces</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[var(--ink)]">All workspaces</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--muted-strong)]">
            Create and switch between the businesses, brands, or campaign contexts in your SideKick account.
          </p>
        </div>
        <Button asChild>
          <Link href="/workspaces/new" prefetch>
            <Plus className="h-4 w-4" />
            New workspace
          </Link>
        </Button>
      </div>

      {workspaces.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {workspaces.map((workspace) => {
            const isActive = workspace.id === activeWorkspaceId;
            const canDelete = workspace.role === "owner" && workspaces.length > 1;

            return (
              <div
                key={workspace.id}
                className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]"
              >
                <div className="flex items-start gap-3">
                  <InitialsAvatar
                    initials={(workspace.business_name || workspace.name).charAt(0).toUpperCase()}
                    label={workspace.business_name || workspace.name}
                    src={workspace.logo_url || null}
                    tone="brand"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-base font-semibold text-[var(--ink)]">{workspace.name}</h2>
                      {isActive ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : null}
                    </div>
                    <p className="mt-1 truncate text-sm text-[var(--muted)]">
                      {workspace.business_name || "Workspace"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {isActive ? (
                    <Button asChild size="sm" variant="outline">
                      <Link href="/workspace/settings" prefetch>
                        Workspace settings
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  ) : (
                    <form action={switchWorkspaceAction}>
                      <input type="hidden" name="workspaceId" value={workspace.id} />
                      <input type="hidden" name="redirectTo" value="/dashboard" />
                      <Button type="submit" size="sm">
                        Switch workspace
                      </Button>
                    </form>
                  )}

                  {canDelete ? (
                    <WorkspaceDeleteButton workspaceId={workspace.id} workspaceName={workspace.name} />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white p-8 text-center">
          <Building2 className="mx-auto h-8 w-8 text-[var(--muted)]" />
          <h2 className="mt-4 text-lg font-semibold text-[var(--ink)]">No workspaces yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted-strong)]">
            Create your first workspace to set up business details, connect accounts, and launch campaigns.
          </p>
          <Button asChild className="mt-5">
            <Link href="/workspaces/new" prefetch>
              <Plus className="h-4 w-4" />
              New workspace
            </Link>
          </Button>
        </div>
      )}
    </AppShell>
  );
}
