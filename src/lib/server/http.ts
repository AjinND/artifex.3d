import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { connectDB } from "@/lib/db/connection";
import { Schema, models, model } from "mongoose";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function bodyBytes(req: Request, max: number) {
  const reader = req.body?.getReader();
  if (!reader) throw new HttpError(400, "Request body required");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > max) {
      await reader.cancel();
      throw new HttpError(413, "Request is too large");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks, size);
}
export async function body(req: Request, max = 32768) {
  return (await bodyBytes(req, max)).toString("utf8");
}
export async function json(req: Request) {
  if (!req.headers.get("content-type")?.startsWith("application/json"))
    throw new HttpError(415, "JSON required");
  return JSON.parse(await body(req));
}
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  const configured = process.env.APP_ORIGIN;
  const local = configured?.match(
    /^http:\/\/(?:localhost|127\.0\.0\.1)(:\d+)?$/,
  );

  if (local) {
    // The preview is available under both loopback names. A request must
    // still come from the same hostname and port it was sent to.
    const host = req.headers.get("host");
    const port = local[1] ?? "";
    if (
      (host === `localhost${port}` || host === `127.0.0.1${port}`) &&
      origin === `http://${host}`
    )
      return;
  } else {
    const expected =
      configured ||
      (process.env.NODE_ENV !== "production" && new URL(req.url).origin);
    if (origin && origin === expected) return;
  }

  throw new HttpError(403, "Origin check failed");
}
export function endpoint(
  fn: (req: Request) => Promise<unknown>,
  browserMutation = true,
) {
  return async (req: Request) => {
    try {
      if (browserMutation && req.method !== "GET") sameOrigin(req);
      const data = await fn(req);
      return data instanceof Response
        ? data
        : NextResponse.json(
            { success: true, data },
            { headers: { "Cache-Control": "private, no-store" } },
          );
    } catch (err) {
      let status =
        err instanceof HttpError
          ? err.status
          : err instanceof SyntaxError || err instanceof ZodError
            ? 400
            : 500;
      if ((err as { code?: number }).code === 11000) status = 409;
      if (status === 500)
        console.error("Request failed", req.method, (err as Error).name);
      return NextResponse.json(
        {
          success: false,
          error:
            err instanceof HttpError
              ? err.message
              : status === 400
                ? "Check the submitted fields"
                : status === 409
                  ? "Record already exists"
                  : "Service temporarily unavailable",
        },
        { status },
      );
    }
  };
}
const limitSchema = new Schema({
  _id: String,
  count: Number,
  expiresAt: { type: Date, expires: 0 },
});
const Limit = models.RequestLimit || model("RequestLimit", limitSchema);
export async function limit(key: string, max: number, seconds = 900) {
  await connectDB();
  const bucket = Math.floor(Date.now() / (seconds * 1000));
  const row = await Limit.findOneAndUpdate(
    { _id: key + "-" + bucket },
    {
      $inc: { count: 1 },
      $setOnInsert: { expiresAt: new Date((bucket + 1) * seconds * 1000) },
    },
    { upsert: true, returnDocument: "after" },
  );
  if (row.count > max) throw new HttpError(429, "Please try again later");
}
