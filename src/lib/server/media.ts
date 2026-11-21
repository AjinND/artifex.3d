import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { HttpError } from "./http";
import { s3 } from "./storage";
import type { Listing } from "@/lib/shop/catalog";
export const mediaTypes: Record<string, string> = {
  webp: "image/webp",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  glb: "model/gltf-binary",
};
export const maxMedia = 10 * 1024 * 1024;

function localCatalogDirectory() {
  const directory = process.env.LOCAL_CATALOG_MEDIA_DIR;
  const loopback = /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/;
  if (
    directory &&
    isAbsolute(directory) &&
    loopback.test(process.env.APP_ORIGIN || "") &&
    /^mongodb:\/\/127\.0\.0\.1(?::\d+)?\//.test(process.env.MONGODB_URI || "")
  ) {
    return directory;
  }
}

export async function storeCatalogMedia(ext: string, data: Buffer) {
  const name = createHash("sha256").update(data).digest("hex") + "." + ext;
  inspectMedia(name, data);

  const directory = localCatalogDirectory();
  if (directory) {
    const temporary = resolve(directory, `.${randomUUID()}.tmp`);
    try {
      await mkdir(directory, { recursive: true });
      await writeFile(temporary, data, { flag: "wx" });
      await rename(temporary, resolve(directory, name));
    } catch {
      throw new HttpError(
        503,
        "Could not save catalog media to the local directory.",
      );
    } finally {
      await rm(temporary, { force: true }).catch(() => {});
    }
  } else {
    const bucket = process.env.CATALOG_MEDIA_BUCKET;
    if (!bucket || bucket === process.env.PRIVATE_UPLOAD_BUCKET)
      throw new HttpError(503, "Configure a separate catalog media bucket");
    try {
      await s3.config.region();
    } catch {
      throw new HttpError(503, "Set AWS_REGION for the catalog media bucket.");
    }
    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: "published-media/" + name,
          Body: data,
          ContentType: mediaTypes[ext],
        }),
      );
    } catch (error) {
      console.error("Catalog media write failed", (error as Error).name);
      throw new HttpError(
        503,
        "Could not save catalog media to S3. Check the bucket and AWS access.",
      );
    }
  }
  return "/catalog/" + name;
}

export function inspectMedia(name: string, data: Buffer) {
  const ext = name.split(".").pop() || "";
  if (data.length > maxMedia || !mediaTypes[ext])
    throw new HttpError(400, "Unsupported asset or size");
  if (ext !== "glb") {
    const valid =
      ext === "png"
        ? data.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))
        : ext === "webp"
          ? data.toString("ascii", 0, 4) === "RIFF" &&
            data.toString("ascii", 8, 12) === "WEBP"
          : data[0] === 255 && data[1] === 216 && data[2] === 255;
    if (!valid)
      throw new HttpError(400, "Photo format does not match the file");
    return;
  }
  if (
    data.length < 20 ||
    data.toString("ascii", 0, 4) !== "glTF" ||
    data.readUInt32LE(4) !== 2 ||
    data.readUInt32LE(8) !== data.length ||
    data.toString("ascii", 16, 20) !== "JSON"
  )
    throw new HttpError(400, "Invalid GLB");
  const end = 20 + data.readUInt32LE(12);
  if (end > data.length) throw new HttpError(400, "Invalid GLB chunk");
  let doc;
  try {
    doc = JSON.parse(data.toString("utf8", 20, end));
  } catch {
    throw new HttpError(400, "Invalid GLB metadata");
  }
  if (
    doc?.asset?.version !== "2.0" ||
    /"uri"\s*:/.test(JSON.stringify(doc)) ||
    doc.extensionsUsed?.length
  )
    throw new HttpError(
      400,
      "Supply a self-contained GLB without external resources or extensions",
    );
}
async function readLocalMedia(directory: string, name: string) {
  const file = resolve(directory, name);
  try {
    const info = await stat(file);
    if (!info.isFile()) return;
    if (info.size > maxMedia) throw new HttpError(400, "File exceeds 10 MB");
    return await readFile(file);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT" && code !== "ENOTDIR") throw error;
  }
}

export async function mediaBytes(name: string) {
  if (!/^[a-zA-Z0-9_-]+\.(webp|png|jpg|jpeg|glb)$/.test(name))
    throw new HttpError(404, "Asset unavailable");
  const localDirectory = localCatalogDirectory();
  const directories = [
    localDirectory,
    process.env.CATALOG_MEDIA_DIR || resolve("public", "catalog"),
  ];
  for (const directory of directories) {
    if (!directory) continue;
    const data = await readLocalMedia(directory, name);
    if (data) return data;
  }
  if (localDirectory) throw new HttpError(404, "Asset unavailable");
  const Bucket = process.env.CATALOG_MEDIA_BUCKET;
  if (!Bucket || Bucket === process.env.PRIVATE_UPLOAD_BUCKET)
    throw new HttpError(404, "Asset unavailable");
  try {
    const r = await s3.send(
      new GetObjectCommand({ Bucket, Key: "published-media/" + name }),
    );
    if (!r.Body || !r.ContentLength)
      throw new HttpError(404, "Asset unavailable");
    if (r.ContentLength > maxMedia) {
      throw new HttpError(400, "File exceeds 10 MB");
    }
    return Buffer.from(await r.Body.transformToByteArray());
  } catch (error) {
    if (
      error instanceof Error &&
      ["NoSuchKey", "NotFound"].includes(error.name)
    ) {
      throw new HttpError(404, "Asset unavailable");
    }
    throw error;
  }
}
export async function validateMedia(item: Listing) {
  const assets = item.photos.map((photo, index) => ({
    path: photo.url,
    label: `Photo ${index + 1}`,
    fix: "Upload a JPG, PNG, or WebP of 10 MB or less in Catalog media and paste its returned path into this photo field.",
  }));
  if (item.preview) {
    assets.push({
      path: item.preview,
      label: "3D preview",
      fix: "Upload a self-contained GLB of 10 MB or less in Catalog media and paste its returned path, or clear the optional preview field.",
    });
  }
  for (const { path, label, fix } of assets) {
    const name = path.slice("/catalog/".length);
    try {
      inspectMedia(name, await mediaBytes(name));
    } catch (error) {
      if (error instanceof HttpError && error.status === 404) {
        throw new HttpError(404, `${label} was not found. ${fix}`);
      }
      if (error instanceof HttpError && error.status === 400) {
        throw new HttpError(400, `${label}: ${error.message}. ${fix}`);
      }
      console.error("Catalog media read failed", (error as Error).name);
      throw new HttpError(
        503,
        `${label} could not be read from catalog storage. Retry, then check the catalog storage configuration and read permissions if the problem continues.`,
      );
    }
  }
}
