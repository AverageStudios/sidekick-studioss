import { redirect } from "next/navigation";

export default async function TemplateRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/templates/new?template=${encodeURIComponent(id)}`);
}
