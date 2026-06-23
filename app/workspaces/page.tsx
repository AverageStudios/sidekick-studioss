import { redirect } from "next/navigation";
import { getCurrentRole, requireUser } from "@/lib/auth";

export default async function WorkspacesPage() {
  await requireUser();
  const role = await getCurrentRole();

  if (role === "admin") {
    redirect("/admin/clients");
  }

  redirect("/workspace/settings");
}
