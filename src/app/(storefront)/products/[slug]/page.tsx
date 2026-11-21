import { notFound } from "next/navigation";
import { catalog } from "@/lib/server/catalog";
import ProductDetail from "@/components/shop/ProductDetail";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [item] = await catalog({ slug });
  if (!item) notFound();
  return <ProductDetail item={item} />;
}
