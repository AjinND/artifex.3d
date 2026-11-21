import {
  S3Client,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { HttpError } from "./http";
export const s3 = new S3Client({ requestChecksumCalculation: "WHEN_REQUIRED" });
export function locationFor(key: string) {
  const Bucket = process.env.PRIVATE_UPLOAD_BUCKET;
  if (!Bucket) throw new HttpError(503, "Private uploads are unavailable");
  return { Bucket, Key: key };
}
export async function uploadUrl(key: string, bytes: number) {
  return getSignedUrl(
    s3,
    new PutObjectCommand({
      ...locationFor(key),
      ContentLength: bytes,
      ContentType: "application/octet-stream",
    }),
    {
      expiresIn: 180,
      signableHeaders: new Set(["content-length", "content-type"]),
    },
  );
}
export async function snapshot(key: string, bytes: number) {
  const obj = await s3.send(new HeadObjectCommand(locationFor(key)));
  if (obj.ContentLength !== bytes || !obj.VersionId || obj.VersionId === "null")
    throw new HttpError(
      422,
      "A versioned upload of the expected size is required",
    );
  return obj.VersionId;
}
export function download(key: string, version: string) {
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      ...locationFor(key),
      VersionId: version,
      ResponseContentDisposition: "attachment",
      ResponseContentType: "application/octet-stream",
    }),
    { expiresIn: 60 },
  );
}
