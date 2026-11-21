import { createHmac } from "node:crypto";
import { HttpError } from "./http";
export function recoveryToken(id: string) {
  const secret = process.env.RECOVERY_SECRET;
  if (!secret || secret.length < 32)
    throw new HttpError(503, "Account recovery is unavailable");
  return createHmac("sha256", secret)
    .update("reset/" + id)
    .digest("hex");
}
