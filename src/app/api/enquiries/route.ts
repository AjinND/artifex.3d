import { z } from "zod";
import { endpoint, json, limit } from "@/lib/server/http";
import { Enquiry } from "@/lib/server/records";
import { digest } from "@/lib/server/session";
export const POST = endpoint(async (req) => {
  const data = z
    .object({
      name: z.string().trim().min(1).max(100),
      email: z.string().email().max(254).toLowerCase(),
      message: z.string().trim().min(10).max(4000),
    })
    .strict()
    .parse(await json(req));
  await limit("enquiry", 200);
  await limit("enquiry-" + digest(data.email), 5);
  const row = await Enquiry.create(data);
  return { id: row.id };
});
