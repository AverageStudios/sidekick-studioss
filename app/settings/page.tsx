import { AppShell } from "@/components/app-shell";
import { InitialsAvatar } from "@/components/initials-avatar";
import Link from "next/link";
import { signOutAction, updateProfileSettingsAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentProfile, requireUser } from "@/lib/auth";
import { getCurrentWorkspaceContext, getUserDisplayNameFromProfile, getUserInitialsFromProfile } from "@/lib/workspaces";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await requireUser();
  const [{ saved, error }, workspaceContext, accountProfile] = await Promise.all([
    searchParams,
    getCurrentWorkspaceContext(),
    getCurrentProfile(),
  ]);
  const resolvedProfile = accountProfile || workspaceContext?.profile || null;
  const resolvedName =
    getUserDisplayNameFromProfile(resolvedProfile, user) ||
    workspaceContext?.userDisplayName ||
    "User";
  const resolvedInitials =
    getUserInitialsFromProfile(resolvedProfile, user) ||
    workspaceContext?.userInitials ||
    "U";
  const resolvedEmail = user.email || workspaceContext?.userEmail || "";

  return (
    <AppShell currentPath="/settings">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Account</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[var(--ink)]">Profile settings</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Personal profile details for your account inside this workspace.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/workspace/settings">Open workspace settings</Link>
        </Button>
      </div>

      {saved ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Settings saved.
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <section id="account">
        <div className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--muted)]">Account</p>
          <h2 className="mt-1 text-base font-semibold text-[var(--ink)]">Your profile</h2>
          <p className="mt-0.5 text-sm text-[var(--muted)]">
            Your personal account inside this workspace.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--panel-strong)] px-3.5 py-3">
              <InitialsAvatar initials={resolvedInitials} label={resolvedName} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--ink)]">{resolvedName}</p>
                <p className="truncate text-xs text-[var(--muted)]">{resolvedEmail || "Signed-in user"}</p>
              </div>
            </div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Profile info</p>
            <form action={updateProfileSettingsAction}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input name="firstName" defaultValue={resolvedProfile?.first_name || ""} placeholder="First name" />
                <Input name="lastName" defaultValue={resolvedProfile?.last_name || ""} placeholder="Last name" />
                <div className="sm:col-span-2">
                  <Input value={resolvedEmail} placeholder="Email" readOnly disabled />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Button type="submit">Save profile</Button>
              </div>
            </form>
            <div className="mt-3">
              <form action={signOutAction}>
                <Button type="submit" variant="outline">
                  Sign out
                </Button>
              </form>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Account notes</p>
            <div className="mt-4 space-y-2.5">
              {[
                "Your profile name appears in the account dropdown.",
                "Workspace/company settings now live in the dedicated workspace settings page.",
                "Email is controlled by your authentication account.",
              ].map((tip) => (
                <p key={tip} className="text-xs leading-5 text-[var(--muted)]">
                  — {tip}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
