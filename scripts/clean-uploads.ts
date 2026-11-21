import {
  DeleteObjectsCommand,
  ListObjectVersionsCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "../src/lib/server/records";
import {
  localUploadsEnabled,
  removeLocalUpload,
} from "../src/lib/server/local-uploads";
import { locationFor, s3 } from "../src/lib/server/storage";
export async function cleanUpload() {
  const row = await Upload.findOneAndUpdate(
    {
      quote: null,
      storage: localUploadsEnabled() ? "local" : { $ne: "local" },
      createdAt: { $lt: new Date(Date.now() - 7 * 86400000) },
      $or: [{ lease: null }, { lease: { $lt: new Date() } }],
    },
    { $set: { state: "removing", lease: new Date(Date.now() + 300000) } },
    { new: true },
  );
  if (!row) return false;
  if (row.storage === "local") {
    if (row.versionId) await removeLocalUpload(row.id, row.versionId);
    await Upload.deleteOne({ _id: row._id, state: "removing", quote: null });
    return true;
  }
  if (!/^quote-uploads\/[a-f\d]{24}\/[a-f\d-]{36}$/.test(row.key))
    throw new Error("Invalid upload key");
  const { Bucket, Key } = locationFor(row.key);
  let more = true;
  while (more) {
    const page = await s3.send(
      new ListObjectVersionsCommand({ Bucket, Prefix: Key, MaxKeys: 1000 }),
    );
    const versions = [...(page.Versions || []), ...(page.DeleteMarkers || [])]
      .filter((v) => v.Key === Key)
      .map((v) => ({ Key, VersionId: v.VersionId }));
    if (!versions.length) break;
    const r = await s3.send(
      new DeleteObjectsCommand({ Bucket, Delete: { Objects: versions } }),
    );
    if (r.Errors?.length) throw new Error("Orphan cleanup failed");
    more = !!page.IsTruncated;
  }
  await Upload.deleteOne({ _id: row._id, state: "removing", quote: null });
  return true;
}
