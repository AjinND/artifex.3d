import { z } from "zod";
import { Audit } from "@/lib/server/records";
import { catalog } from "@/lib/server/catalog";
import { endpoint, json, HttpError } from "@/lib/server/http";
import { currentUser } from "@/lib/server/session";
import { Product } from "@/lib/db/models/Product";
import { listing } from "@/lib/shop/catalog";
import { validateMedia } from "@/lib/server/media";
export const GET = endpoint(() => catalog());
export const POST = endpoint(async (req) => {
  const actor = await currentUser(true);
  const { legacyId, ...data } = listing
    .extend({ legacyId: z.number().int().positive().optional() })
    .parse(await json(req));
  if (data.status === "published") await validateMedia(data);
  if (new URL(req.url).searchParams.get("preview") === "1") {
    return { slug: data.slug };
  }
  const session = await Product.startSession();
  try {
    await session.withTransaction(async () => {
      const existing = await Product.findOne(
        legacyId ? { id: legacyId } : { slug: data.slug },
      ).session(session);
      if (
        legacyId &&
        (!existing || (existing.slug && existing.slug !== data.slug))
      )
        throw new HttpError(409, "Legacy listing unavailable");
      const product = existing || new Product();
      product.set(data);
      if (!data.preview) product.set("preview", undefined);
      if (!product.publishedAt && data.status === "published")
        product.publishedAt = new Date();
      await product.save({ session });
      await Audit.create(
        [
          {
            actor: actor._id,
            resource: data.slug,
            action: "listing " + data.status,
          },
        ],
        { session },
      );
    });
  } finally {
    await session.endSession();
  }
  return { slug: data.slug };
});
