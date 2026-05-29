import { AppShell } from "@/components/app-shell";
import Link from "next/link";
import { switchWorkspaceAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { WorkspaceDeleteButton } from "@/components/workspace-delete-button";
import { requireUser } from "@/lib/auth";
import { getCurrentWorkspaceContext } from "@/lib/workspaces";

export default async function WorkspacesPage() {
  await requireUser();
  const workspaceContext = await getCurrentWorkspaceContext();
  const canDeleteWorkspaces = (workspaceContext?.workspaces || []).length > 1;

  return (
    <AppShell currentPath="/settings">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Workspace</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[var(--ink)]">All workspaces</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Switch between business accounts and create a new workspace when you need a separate setup.
          </p>
        </div>
        <Button asChild>
          <Link href="/workspaces/new">New workspace</Link>
        </Button>
      </div>

      {(workspaceContext?.workspaces || []).length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {(workspaceContext?.workspaces || []).map((workspace) => (
          <div key={workspace.id} className="rounded-2xl border border-[var(--line)] bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-[var(--ink)]">{workspace.name}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {workspace.business_name || "Business setup not finished"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {workspace.industry ? (
                    <span className="rounded-full bg-[var(--soft-panel)] px-3 py-1 text-xs font-medium text-[var(--ink)]">
                      {workspace.industry}
                    </span>
                  ) : null}
                  {workspace.website ? (
                    <span className="rounded-full bg-[var(--soft-panel)] px-3 py-1 text-xs font-medium text-[var(--ink)]">
                      {workspace.website}
                    </span>
                  ) : null}
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium capitalize text-[var(--muted)] border border-[var(--line)]">
                    {workspace.role}
                  </span>
                </div>
              </div>
              {workspace.id === workspaceContext?.activeWorkspace.id ? (
                <span className="rounded-full bg-[var(--soft-panel)] px-3 py-1 text-xs font-medium text-[var(--ink)]">
                  Active
                </span>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {workspace.id === workspaceContext?.activeWorkspace.id ? null : (
                <form action={switchWorkspaceAction}>
                  <input type="hidden" name="workspaceId" value={workspace.id} />
                  <input type="hidden" name="redirectTo" value="/workspaces" />
                  <Button type="submit" variant="outline">
                    Switch
                  </Button>
                </form>
              )}
              {workspace.role === "owner" && canDeleteWorkspaces ? (
                <WorkspaceDeleteButton workspaceId={workspace.id} workspaceName={workspace.name} />
              ) : null}
            </div>
          </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[28px] border border-[var(--line)] bg-white p-8 shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
          <p className="text-base font-semibold text-[var(--ink)]">No workspaces yet</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Create a workspace to keep campaigns, leads, and Meta connections organized in one place.
          </p>
          <div className="mt-5">
            <Button asChild>
              <Link href="/workspaces/new">New workspace</Link>
            </Button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
