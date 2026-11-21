import { currentUser } from "@/lib/server/session";
import { bodyBytes, endpoint, HttpError, limit } from "@/lib/server/http";
import { maxMedia, mediaTypes, storeCatalogMedia } from "@/lib/server/media";

export const POST = endpoint(async (req) => {
  const u = await currentUser(true);
  await limit("staff-media-" + u.id, 100);
  const ext = new URL(req.url).searchParams.get("ext") || "";
  if (!Object.hasOwn(mediaTypes, ext))
    throw new HttpError(400, "Unsupported media format");
  return { url: await storeCatalogMedia(ext, await bodyBytes(req, maxMedia)) };
});
