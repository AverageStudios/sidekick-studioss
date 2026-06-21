import { notFound } from "next/navigation";
import { PublicProductDetailPage } from "@/components/public-product-detail-page";
import { publicProductItems, publicProductMap } from "@/data/public-product-pages";

export function generateStaticParams() {
  // "templates" has a dedicated static route (app/product/templates/page.tsx)
  // that renders the live template library. Excluding it here avoids generating
  // a duplicate, shadowed page for the same /product/templates URL.
  return publicProductItems
    .filter((item) => item.slug !== "templates")
    .map((item) => ({ slug: item.slug }));
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
