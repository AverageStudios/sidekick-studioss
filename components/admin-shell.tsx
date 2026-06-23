import { LayoutTemplate, LifeBuoy, Shield, UsersRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";

const adminNavItems = [
  { href: "/admin", label: "Admin", icon: Shield },
  { href: "/admin/clients", label: "Clients", icon: UsersRound },
  { href: "/admin/templates", label: "Manage templates", icon: LayoutTemplate },
  { href: "/admin/support", label: "Support tickets", icon: LifeBuoy },
];

export function AdminShell({
  currentPath,
  children,
}: {
  currentPath: string;
  children: React.ReactNode;
}) {
  return (
    <AppShell currentPath={currentPath} extraNavItems={adminNavItems}>
      {children}
    </AppShell>
  );
}
