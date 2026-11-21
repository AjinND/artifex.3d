import { randomUUID } from "node:crypto";
import { z } from "zod";
import { currentUser } from "@/lib/server/session";
import { Upload } from "@/lib/server/records";
import { download, snapshot, uploadUrl } from "@/lib/server/storage";
import { bodyBytes, endpoint, HttpError, json, limit } from "@/lib/server/http";
import {
  checkLocalUploadStorage,
  localUploadsEnabled,
  readLocalUpload,
  removeLocalUpload,
  scanAndStoreUpload,
  supportsLocalUploads,
} from "@/lib/server/local-uploads";
import { matchesUpload, maxUploadBytes } from "@/lib/server/upload-format";
const id = z.string().regex(/^[a-f\d]{24}$/);
export const POST = endpoint(async (req) => {
  const u = await currentUser();
  await limit("upload-" + u.id, 25);
  const data = z
    .object({
      name: z
        .string()
        .min(1)
        .max(120)
        .regex(/^[^/\\\x00-\x1f]+\.(stl|png|jpe?g)$/i),
      bytes: z.number().int().positive().max(maxUploadBytes),
    })
    .parse(await json(req));
  const key = "quote-uploads/" + u.id + "/" + randomUUID();
  if (localUploadsEnabled()) {
    await checkLocalUploadStorage();
    const row = await Upload.create({
      ...data,
      owner: u._id,
      key,
      storage: "local",
    });
    return { id: row.id, url: "/api/uploads?id=" + row.id };
  }
  if (!process.env.PRIVATE_UPLOAD_BUCKET && supportsLocalUploads()) {
    throw new HttpError(
      503,
      "Set LOCAL_UPLOAD_DIR to enable quote attachments on localhost.",
    );
  }
  const url = await uploadUrl(key, data.bytes);
  const row = await Upload.create({ ...data, owner: u._id, key });
  return { id: row.id, url };
});
export const PUT = endpoint(async (req) => {
  const u = await currentUser();
  if (!localUploadsEnabled()) throw new HttpError(404, "File unavailable");
  const row = await Upload.findOne({
    _id: id.parse(new URL(req.url).searchParams.get("id")),
    owner: u._id,
    storage: "local",
  });
  if (!row) throw new HttpError(404, "File unavailable");
  if (row.state === "cleared") return { id: row.id, state: row.state };
  if (row.state !== "selected")
    throw new HttpError(409, "This attachment is no longer accepting uploads.");
  await limit("upload-data-" + u.id, 25);
  const bytes = await bodyBytes(req, Math.min(row.bytes, maxUploadBytes));
  if (bytes.length !== row.bytes)
    throw new HttpError(
      422,
      "The uploaded file is incomplete. Select it again.",
    );
  if (!matchesUpload(row.name, bytes))
    throw new HttpError(422, "The file contents do not match its extension.");

  const versionId = randomUUID();
  await scanAndStoreUpload(row.id, versionId, bytes);
  const saved = await Upload.updateOne(
    { _id: row._id, state: "selected" },
    { $set: { versionId, state: "cleared" } },
  );
  if (!saved.modifiedCount) await removeLocalUpload(row.id, versionId);
  return { id: row.id, state: "cleared" };
});
export const PATCH = endpoint(async (req) => {
  const u = await currentUser();
  const row = await Upload.findOne({
    _id: id.parse((await json(req)).id),
    owner: u._id,
  });
  if (!row) throw new HttpError(404, "File unavailable");
  if (row.storage === "local") return { id: row.id, state: row.state };
  if (row.state === "selected") {
    const versionId = await snapshot(row.key, row.bytes);
    await Upload.updateOne(
      { _id: row._id, state: "selected" },
      { $set: { versionId, state: "processing" } },
    );
  }
  return { id: row.id };
});
export const GET = endpoint(async (req) => {
  const u = await currentUser();
  const p = new URL(req.url).searchParams;
  const row = await Upload.findOne({
    _id: id.parse(p.get("id")),
    ...(u.role === "admin" ? {} : { owner: u._id }),
  });
  if (!row) throw new HttpError(404, "File unavailable");
  if (p.has("download") || p.has("file")) {
    if (row.state !== "cleared")
      throw new HttpError(409, "File is awaiting clearance");
    if (row.storage === "local") {
      if (!p.has("file"))
        return { url: "/api/uploads?id=" + row.id + "&file=1" };
      const bytes = await readLocalUpload(row.id, row.versionId);
      const filename = encodeURIComponent(row.name).replace(
        /['()*]/g,
        (character) => "%" + character.charCodeAt(0).toString(16),
      );
      return new Response(new Uint8Array(bytes), {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": "attachment; filename*=UTF-8''" + filename,
          "Cache-Control": "private, no-store",
        },
      });
    }
    if (p.has("file")) throw new HttpError(404, "File unavailable");
    return { url: await download(row.key, row.versionId) };
  }
  return { state: row.state, name: row.name };
});
