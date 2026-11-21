import QuoteForm from "@/components/shop/QuoteForm";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  return (
    <QuoteForm
      product={String((await searchParams).product || "").slice(0, 100)}
    />
  );
}
