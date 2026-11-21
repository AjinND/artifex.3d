import Checkout from "@/components/shop/Checkout";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ quote?: string; version?: string }>;
}) {
  const p = await searchParams;
  return <Checkout quote={p.quote || ""} version={Number(p.version) || 0} />;
}
