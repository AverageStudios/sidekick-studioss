import Link from "next/link";
import { BarChart3, FolderKanban, LayoutTemplate, Settings2, Users } from "lucide-react";
import { ConfigNotice } from "@/components/config-notice";
import { Logo } from "@/components/logo";
import { SignOutButton } from "@/components/sign-out-button";
import { getSupabaseFallbackMessage } from "@/lib/env";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

export function AppShell({
  currentPath,
  children,
}: {
  currentPath: string;
  children: React.ReactNode;
}) {
  const supabaseFallbackMessage = getSupabaseFallbackMessage();

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <header className="border-b border-[var(--line)] bg-[rgba(246,244,238,0.86)] backdrop-blur-xl">
        <div className="page-section flex items-center justify-between gap-4 py-3.5 sm:py-[1.125rem]">
          <Logo href="/dashboard" />
          <nav className="hidden items-center gap-2 rounded-full border border-[var(--line)] bg-white/82 p-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = currentPath.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
                    active
                      ? "bg-[var(--ink)] text-white shadow-[0_10px_20px_rgba(17,24,39,0.12)]"
                      : "text-[var(--muted-strong)] hover:bg-[var(--soft-brand)] hover:text-[var(--brand)]",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/templates"
              className="hidden rounded-full border border-[var(--line)] bg-white/82 px-4 py-2 text-sm font-medium text-[var(--muted-strong)] shadow-[var(--shadow-soft)] transition hover:border-[var(--brand)] hover:text-[var(--brand)] sm:inline-flex"
            >
              <FolderKanban className="mr-2 h-4 w-4" />
              New campaign
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="page-section flex flex-col gap-6 py-6 pb-24 sm:gap-7 sm:py-7 sm:pb-10 lg:gap-8 lg:py-8">
        {supabaseFallbackMessage ? (
          <ConfigNotice
            title="Demo mode"
            message={supabaseFallbackMessage}
          />
        ) : null}
        {children}
      </main>
      <nav className="fixed inset-x-4 bottom-4 z-20 flex items-center justify-around rounded-full border border-[var(--line)] bg-white/96 p-2 shadow-[0_18px_40px_rgba(17,24,39,0.12)] md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = currentPath.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-full px-3 py-2 text-[11px] font-medium",
                active ? "bg-[var(--soft-brand)] text-[var(--brand)]" : "text-[var(--muted)]",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
