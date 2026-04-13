import { notFound } from "next/navigation";
import { PublicProductDetailPage } from "@/components/public-product-detail-page";
import { publicProductItems, publicProductMap } from "@/data/public-product-pages";

export function generateStaticParams() {
  return publicProductItems.map((item) => ({ slug: item.slug }));
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = publicProductMap[slug];

  if (!item) {
    notFound();
  }

  return <PublicProductDetailPage item={item} />;
}
