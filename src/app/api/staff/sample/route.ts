import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { currentUser } from "@/lib/server/session";
import { endpoint } from "@/lib/server/http";
export const GET = endpoint(async () => {
  await currentUser(true);
  const preview = await readFile(
    join(
      process.cwd(),
      "studio-assets",
      "balancing-form",
      "review",
      "balancing-form.glb",
    ),
  );
  return new Response(new Uint8Array(preview), {
    headers: {
      "Content-Type": "model/gltf-binary",
      "Cache-Control": "private, no-store",
    },
  });
});
