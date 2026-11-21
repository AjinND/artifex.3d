import { z } from "zod";
export function validateDeployment() {
  const env = process.env;
  const settings = z
    .object({
      MONGODB_URI: z.string().regex(/^mongodb(?:\+srv)?:\/\//),
      APP_ORIGIN: z.url().optional(),
      CATALOG_MEDIA_BUCKET: z.string().optional(),
      PRIVATE_UPLOAD_BUCKET: z.string().optional(),
    })
    .parse({
      MONGODB_URI: env.MONGODB_URI,
      APP_ORIGIN: env.APP_ORIGIN || undefined,
      CATALOG_MEDIA_BUCKET: env.CATALOG_MEDIA_BUCKET,
      PRIVATE_UPLOAD_BUCKET: env.PRIVATE_UPLOAD_BUCKET,
    });
  if (
    settings.APP_ORIGIN &&
    new URL(settings.APP_ORIGIN).origin !== settings.APP_ORIGIN
  )
    throw new Error("APP_ORIGIN must be an origin");
  if (
    settings.PRIVATE_UPLOAD_BUCKET &&
    settings.PRIVATE_UPLOAD_BUCKET === settings.CATALOG_MEDIA_BUCKET
  )
    throw new Error("Separate private and public asset storage is required");
}
