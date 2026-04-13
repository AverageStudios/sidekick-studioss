import { PublicTemplatesPage } from "@/components/public-templates-page";
import { getTemplates } from "@/lib/data";

export default async function TemplatesProductPage() {
  const templates = await getTemplates();

  return <PublicTemplatesPage templates={templates} />;
}
