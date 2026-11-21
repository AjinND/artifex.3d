import { connectDB } from "@/lib/db/connection";
import { Product } from "@/lib/db/models/Product";
import { listing, type Print } from "@/lib/shop/catalog";
export async function catalog(
  query: Record<string, unknown> = {},
  staff = false,
): Promise<Print[]> {
  await connectDB();
  const rows = await Product.find({
    ...query,
    ...(staff ? {} : { status: "published" }),
  })
    .sort({ publishedAt: -1, _id: -1 })
    .lean();
  return rows.flatMap((row) => {
    const data = listing.safeParse(
      Object.fromEntries(Object.keys(listing.shape).map((k) => [k, row[k]])),
    );
    return data.success
      ? [
          {
            ...data.data,
            id: String(row._id),
            legacyId: row.id,
            publishedAt: row.publishedAt?.toISOString() || "",
          },
        ]
      : [];
  });
}
