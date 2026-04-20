import { redirect } from "next/navigation";

export default function WorkspaceMembersPage() {
  redirect("/workspace/settings?section=members");
}
