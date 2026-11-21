import { mediaBytes, mediaTypes } from "@/lib/server/media";
export async function GET(req: Request) {
  const name = new URL(req.url).pathname.split("/").pop() || "";
  try {
    const data = await mediaBytes(name);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": mediaTypes[name.split(".").pop()!],
        "Cache-Control": /^[a-f0-9]{64}\./.test(name)
          ? "public,max-age=31536000,immutable"
          : "public,max-age=300",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
