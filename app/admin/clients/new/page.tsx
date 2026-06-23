import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

export default async function AdminNewClientPage() {
  await requireAdmin();
  redirect("/admin");
}
