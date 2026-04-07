import Link from "next/link";
import { BarChart3, FolderKanban, LayoutTemplate, Settings2, Users } from "lucide-react";
import { Logo } from "@/components/logo";
import { SignOutButton } from "@/components/sign-out-button";
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
  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <header className="border-b border-[var(--line)] bg-[rgba(248,246,240,0.88)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Logo href="/dashboard" />
          <nav className="hidden items-center gap-2 rounded-full border border-[var(--line)] bg-white/80 p-1 md:flex">
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
                      ? "bg-[var(--ink)] text-white"
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
              className="hidden rounded-full border border-[var(--line)] bg-white/80 px-4 py-2 text-sm font-medium text-[var(--muted-strong)] transition hover:border-[var(--brand)] hover:text-[var(--brand)] sm:inline-flex"
            >
              <FolderKanban className="mr-2 h-4 w-4" />
              New campaign
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">{children}</main>
      <nav className="fixed inset-x-4 bottom-4 z-20 flex items-center justify-around rounded-full border border-[var(--line)] bg-white/95 p-2 shadow-[0_18px_40px_rgba(17,24,39,0.12)] md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = currentPath.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-full px-3 py-2 text-[11px] font-medium",
                active ? "text-[var(--brand)]" : "text-[var(--muted)]",
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

