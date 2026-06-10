import { redirect } from "next/navigation";

export default function IntegrationsPage() {
  redirect("/workspace/settings?section=integrations");
}
