import { LayoutTemplate, Shield } from "lucide-react";
import { AppShell } from "@/components/app-shell";

const adminNavItems = [
  { href: "/admin", label: "Admin", icon: Shield },
  { href: "/admin/templates", label: "Manage templates", icon: LayoutTemplate },
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
