import { catalog } from "@/lib/server/catalog";
import Gallery from "@/components/shop/Gallery";
export const dynamic = "force-dynamic";
export default async function Page() {
  const items = await catalog().catch(() => null);
  return items ? (
    <Gallery items={items} />
  ) : (
    <main className="shop-shell">
      <h1>Print collection</h1>
      <p>The catalog is temporarily unavailable. Please try again shortly.</p>
    </main>
  );
}
