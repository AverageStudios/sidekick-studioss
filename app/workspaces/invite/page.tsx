import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { acceptWorkspaceInvitationAction } from "@/app/actions";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseServerConfigured } from "@/lib/env";

export default async function WorkspaceInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const user = await getCurrentUser();
  const { token, error } = await searchParams;
  const admin = createSupabaseAdminClient();
  const invitation =
    token && admin && isSupabaseServerConfigured()
      ? await admin
          .from("workspace_invitations")
          .select("id, invited_email, invited_role, status, expires_at, workspace:workspaces(name)")
          .eq("token", token)
          .maybeSingle()
      : { data: null };

  const inviteData = invitation.data as
    | {
        id: string;
        invited_email: string;
        invited_role: "admin" | "member";
        status: "pending" | "accepted" | "revoked" | "expired";
        expires_at: string;
        workspace: { name?: string } | { name?: string }[] | null;
      }
    | null;
  const workspace = Array.isArray(inviteData?.workspace) ? inviteData?.workspace[0] : inviteData?.workspace;
  const workspaceName = workspace?.name || "Workspace";

  return (
    <AppShell currentPath="/workspaces">
      <div className="mx-auto max-w-2xl space-y-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Invitation</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[var(--ink)]">Join workspace</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Accept the invitation to join this workspace environment.
          </p>
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="rounded-2xl border border-[var(--line)] bg-white p-6">
          {!token ? (
            <p className="text-sm text-[var(--muted)]">Invitation token is missing.</p>
          ) : !inviteData ? (
            <p className="text-sm text-[var(--muted)]">Invitation not found.</p>
          ) : (
            <div className="space-y-4">
              <p className="text-base font-semibold text-[var(--ink)]">{workspaceName}</p>
              <p className="text-sm text-[var(--muted)]">
                Invited email: <span className="font-medium text-[var(--ink)]">{inviteData.invited_email}</span>
              </p>
              <p className="text-sm text-[var(--muted)]">
                Role: <span className="font-medium capitalize text-[var(--ink)]">{inviteData.invited_role}</span>
              </p>
              <p className="text-sm text-[var(--muted)]">
                Expires: {new Date(inviteData.expires_at).toLocaleString()}
              </p>

              {inviteData.status !== "pending" ? (
                <div className="rounded-lg border border-[var(--line)] bg-[var(--soft-panel)] px-4 py-3 text-sm text-[var(--muted)]">
                  This invitation is {inviteData.status}.
                </div>
              ) : !user ? (
                <div className="space-y-3">
                  <div className="rounded-lg border border-[var(--line)] bg-[var(--soft-panel)] px-4 py-3 text-sm text-[var(--muted)]">
                    Sign in with <strong>{inviteData.invited_email}</strong> to accept this invitation.
                  </div>
                  <Button asChild>
                    <Link href="/login">Go to login</Link>
                  </Button>
                </div>
              ) : (
                <form action={acceptWorkspaceInvitationAction}>
                  <input type="hidden" name="token" value={token} />
                  <Button type="submit">Accept invitation</Button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
