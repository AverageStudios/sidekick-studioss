import { AppShell } from "@/components/app-shell";
import { createWorkspaceAction, switchWorkspaceAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { getCurrentWorkspaceContext } from "@/lib/workspaces";

export default async function WorkspacesPage() {
  await requireUser();
  const workspaceContext = await getCurrentWorkspaceContext();

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
        <form action={createWorkspaceAction}>
          <input type="hidden" name="redirectTo" value="/workspaces" />
          <Button type="submit">New workspace</Button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(workspaceContext?.workspaces || []).map((workspace) => (
          <div key={workspace.id} className="rounded-2xl border border-[var(--line)] bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-[var(--ink)]">{workspace.name}</p>
                <p className="mt-1 text-sm text-[var(--muted)] capitalize">{workspace.role}</p>
              </div>
              {workspace.id === workspaceContext?.activeWorkspace.id ? (
                <span className="rounded-full bg-[var(--soft-panel)] px-3 py-1 text-xs font-medium text-[var(--ink)]">
                  Active
                </span>
              ) : null}
            </div>

            <div className="mt-5 flex gap-3">
              {workspace.id === workspaceContext?.activeWorkspace.id ? null : (
                <form action={switchWorkspaceAction}>
                  <input type="hidden" name="workspaceId" value={workspace.id} />
                  <input type="hidden" name="redirectTo" value="/workspaces" />
                  <Button type="submit" variant="outline">
                    Switch
                  </Button>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
