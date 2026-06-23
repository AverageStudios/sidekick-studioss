import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

export default async function AdminClientsPage() {
  await requireAdmin();
  redirect("/admin");
}
