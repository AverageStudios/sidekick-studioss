import Link from "next/link";
import { BarChart3, Building2, ChevronDown, CircleHelp, LayoutDashboard, LayoutGrid, LayoutTemplate, LifeBuoy, LogOut, Plus, Shield, SlidersHorizontal, UserCircle2, Users } from "lucide-react";
import { ConfigNotice } from "@/components/config-notice";
import { InitialsAvatar } from "@/components/initials-avatar";
import { createWorkspaceAction, signOutAction, switchWorkspaceAction } from "@/app/actions";
import { getCurrentProfile, getCurrentRole, getCurrentUser } from "@/lib/auth";
import { getSupabaseFallbackMessage } from "@/lib/env";
import { cn } from "@/lib/utils";
import {
  getCurrentWorkspaceContext,
  getUserDisplayNameFromProfile,
  getUserInitialsFromProfile,
  getWorkspaceDisplayName,
} from "@/lib/workspaces";

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/templates", label: "Campaigns", icon: LayoutTemplate },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/performance", label: "Performance", icon: BarChart3 },
];

export async function AppShell({
  currentPath,
  extraNavItems = [],
  children,
}: {
  currentPath: string;
  extraNavItems?: Array<{ href: string; label: string; icon?: React.ComponentType<{ className?: string }> | undefined }>;
  children: React.ReactNode;
}) {
  const supabaseFallbackMessage = getSupabaseFallbackMessage();
  const [role, workspaceContext, user, accountProfile] = await Promise.all([
    getCurrentRole(),
    getCurrentWorkspaceContext(),
    getCurrentUser(),
    getCurrentProfile(),
  ]);
  const identityUser = user || {
    id: accountProfile?.user_id || "unknown-user",
    email: workspaceContext?.userEmail || null,
    user_metadata: {},
  };
  const identityProfile = accountProfile || workspaceContext?.profile || null;
  const workspaceName =
    workspaceContext?.activeWorkspace.name ||
    getWorkspaceDisplayName(undefined, identityProfile?.first_name || null);
  const workspaceInitial =
    workspaceContext?.workspaceInitial ||
    workspaceName.trim().slice(0, 1).toUpperCase() ||
    "W";
  const userInitials =
    getUserInitialsFromProfile(identityProfile, identityUser) ||
    workspaceContext?.userInitials ||
    "U";
  const userDisplayName =
    getUserDisplayNameFromProfile(identityProfile, identityUser) ||
    workspaceContext?.userDisplayName ||
    "Workspace member";
  const userEmail = identityUser.email || workspaceContext?.userEmail || "";

  const autoAdminItems = role === "admin" ? [{ href: "/admin", label: "Admin", icon: Shield }] : [];
  const resolvedNavItems = [...navItems, ...autoAdminItems, ...extraNavItems].filter(
    (item, index, items) => items.findIndex((entry) => entry.href === item.href) === index,
  );
  const workspaces = workspaceContext?.workspaces || [];
  const currentWorkspace = workspaceContext?.activeWorkspace || null;
  const recentWorkspaces = workspaces
    .filter((workspace) => workspace.id !== currentWorkspace?.id)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[rgba(252,251,248,0.94)] backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] w-full max-w-[76rem] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <details name="shell-dropdown" className="group relative w-[17rem] min-w-0 shrink-0">
            <summary className="flex cursor-pointer list-none items-center gap-3 rounded-2xl px-2.5 py-2 transition-colors hover:bg-[var(--soft-panel)] group-open:bg-[var(--soft-panel)]">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--brand)] text-[11px] font-bold text-white shadow-[0_10px_20px_rgba(109,94,248,0.18)]">
                {workspaceInitial}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">Workspace</p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="truncate text-sm font-semibold text-[var(--ink)]">{workspaceName}</span>
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--muted)]" />
                </div>
              </div>
            </summary>

            <div className="absolute left-0 top-[calc(100%+10px)] z-40 hidden w-[19rem] rounded-[1.35rem] border border-[var(--line)] bg-white p-2 shadow-[0_18px_50px_rgba(15,23,42,0.12)] group-open:block">
              <div className="space-y-1">
                <Link
                  href="/workspace/settings?section=members"
                  className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-[var(--muted-strong)] transition-colors hover:bg-[var(--soft-panel)] hover:text-[var(--ink)]"
                >
                  <Users className="h-4 w-4 text-[var(--muted)]" />
                  <span>Manage members</span>
                </Link>
                <Link
                  href="/workspace/settings"
                  className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-[var(--muted-strong)] transition-colors hover:bg-[var(--soft-panel)] hover:text-[var(--ink)]"
                >
                  <SlidersHorizontal className="h-4 w-4 text-[var(--muted)]" />
                  <span>Workspace settings</span>
                </Link>
              </div>

              <div className="my-2 h-px bg-[var(--line)]" />

              <div className="px-3 pb-2 pt-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Switch workspace</p>
              </div>

              <div className="space-y-1">
                <Link
                  href="/workspaces"
                  className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-[var(--muted-strong)] transition-colors hover:bg-[var(--soft-panel)] hover:text-[var(--ink)]"
                >
                  <LayoutGrid className="h-4 w-4 text-[var(--muted)]" />
                  <span>All workspaces</span>
                </Link>

                {currentWorkspace ? (
                  <div key={currentWorkspace.id} className="flex items-center gap-3 rounded-2xl bg-[var(--soft-panel)] px-3 py-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#ff6fb5] text-xs font-bold text-white">
                        {currentWorkspace.name.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[var(--ink)]">{currentWorkspace.name}</p>
                        <p className="text-xs text-[var(--muted)]">Current workspace</p>
                      </div>
                      <Building2 className="h-4 w-4 text-[var(--ink)]" />
                    </div>
                ) : null}

                {recentWorkspaces.map((workspace) => (
                    <form key={workspace.id} action={switchWorkspaceAction}>
                      <input type="hidden" name="workspaceId" value={workspace.id} />
                      <input type="hidden" name="redirectTo" value={currentPath} />
                      <button
                        type="submit"
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-[var(--muted-strong)] transition-colors hover:bg-[var(--soft-panel)] hover:text-[var(--ink)]"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[var(--soft-panel)] text-xs font-bold text-[var(--ink)]">
                          {workspace.name.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-[var(--ink)]">{workspace.name}</p>
                          <p className="text-xs text-[var(--muted)] capitalize">{workspace.role}</p>
                        </div>
                      </button>
                    </form>
                ))}

                <form action={createWorkspaceAction}>
                  <input type="hidden" name="redirectTo" value="/workspaces" />
                  <button
                    type="submit"
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm text-[var(--muted-strong)] transition-colors hover:bg-[var(--soft-panel)] hover:text-[var(--ink)]"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg border border-[var(--line)] bg-white text-[var(--muted)]">
                      <Plus className="h-3.5 w-3.5" />
                    </span>
                    <span>New workspace</span>
                  </button>
                </form>
              </div>
            </div>
          </details>

          <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
            {resolvedNavItems.map((item) => {
              const Icon = item.icon;
              const active = currentPath.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-150 active:translate-y-px",
                    active
                      ? "bg-[var(--soft-panel)] text-[var(--ink)] shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
                      : "text-[var(--muted)] hover:bg-[var(--soft-panel)] hover:text-[var(--ink)] active:bg-[color-mix(in_oklab,var(--soft-panel)_88%,black)]",
                  )}
                >
                  {Icon ? (
                    <Icon
                      className={cn(
                        "h-4.5 w-4.5 transition-colors duration-150",
                        active ? "text-[var(--ink)]" : "text-[var(--muted)]",
                      )}
                    />
                  ) : null}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <details name="shell-dropdown" className="group relative w-[17rem] shrink-0">
            <summary className="ml-auto flex cursor-pointer list-none items-center justify-end gap-3 rounded-2xl px-2 py-1.5 transition-colors hover:bg-[var(--soft-panel)] group-open:bg-[var(--soft-panel)]">
              <div className="hidden min-w-0 text-right md:block">
                <p className="truncate text-sm font-semibold text-[var(--ink)]">{userDisplayName}</p>
                <p className="truncate text-xs text-[var(--muted)]">{userEmail || "Workspace member"}</p>
              </div>
              <InitialsAvatar
                initials={userInitials}
                label={userDisplayName}
                tone={currentPath.startsWith("/settings") ? "brand" : "subtle"}
              />
            </summary>

            <div className="absolute right-0 top-[calc(100%+10px)] z-40 hidden w-[20rem] rounded-[1.35rem] border border-[var(--line)] bg-white p-2 shadow-[0_18px_50px_rgba(15,23,42,0.12)] group-open:block">
              <div className="flex items-start gap-3 rounded-2xl px-3 py-3">
                <InitialsAvatar initials={userInitials} label={userDisplayName} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-[var(--ink)]">{userDisplayName}</p>
                  <p className="mt-1 truncate text-sm text-[var(--muted)]">{userEmail || "Workspace member"}</p>
                  <p className="mt-3 text-sm font-medium text-[var(--muted-strong)]">
                    Workspace member <span className="text-[var(--muted)]">• {workspaceName}</span>
                  </p>
                </div>
              </div>

              <div className="my-2 h-px bg-[var(--line)]" />

              <div className="space-y-1">
                <Link
                  href="/settings"
                  className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-[var(--muted-strong)] transition-colors hover:bg-[var(--soft-panel)] hover:text-[var(--ink)]"
                >
                  <UserCircle2 className="h-4 w-4 text-[var(--muted)]" />
                  <span>Profile settings</span>
                </Link>
                <Link
                  href="/support"
                  className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-[var(--muted-strong)] transition-colors hover:bg-[var(--soft-panel)] hover:text-[var(--ink)]"
                >
                  <LifeBuoy className="h-4 w-4 text-[var(--muted)]" />
                  <span>Contact support</span>
                </Link>
                <Link
                  href="/help"
                  className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-[var(--muted-strong)] transition-colors hover:bg-[var(--soft-panel)] hover:text-[var(--ink)]"
                >
                  <CircleHelp className="h-4 w-4 text-[var(--muted)]" />
                  <span>Help & tips</span>
                </Link>
              </div>

              <div className="my-2 h-px bg-[var(--line)]" />

              <form action={signOutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-[#ef4444] transition-colors hover:bg-[#fef2f2]"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </form>
            </div>
          </details>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[76rem] flex-col gap-10 px-4 py-10 pb-28 sm:px-6 sm:py-12 sm:pb-12 lg:px-8 lg:py-14">
        {supabaseFallbackMessage ? <ConfigNotice title="Demo mode" message={supabaseFallbackMessage} /> : null}
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-[var(--line)] bg-white md:hidden">
        {resolvedNavItems.map((item) => {
          const Icon = item.icon;
          const active = currentPath.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                active ? "text-[var(--brand)]" : "text-[var(--muted)]",
              )}
            >
              {Icon ? <Icon className="h-5 w-5" /> : <span className="h-5" />}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
