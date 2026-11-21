import { randomBytes } from "node:crypto";
import { z } from "zod";
import { endpoint, HttpError, json, limit } from "@/lib/server/http";
import { User } from "@/lib/db/models/User";
import { digest, Session } from "@/lib/server/session";
import { Recovery } from "@/lib/server/records";
import { recoveryToken } from "@/lib/server/recover";
import { password } from "@/lib/validators/user";
export const POST = endpoint(async (req) => {
  const email = z
    .string()
    .trim()
    .email()
    .toLowerCase()
    .parse((await json(req)).email);
  await limit("recover-" + digest(email), 3);
  await limit("recovery", 100);
  const id = randomBytes(24).toString("hex");
  recoveryToken(id);
  const u = await User.findOne({ email });
  if (u)
    await Recovery.create({
      _id: id,
      owner: u._id,
      email,
      mailState: "pending",
      expiresAt: new Date(Date.now() + 1800000),
    });
  return { requested: true };
});
export const PATCH = endpoint(async (req) => {
  const data = z
    .object({
      id: z.string().length(48),
      token: z.string().length(64),
      password,
    })
    .parse(await json(req));
  await limit("reset-" + digest(data.id), 10);
  if (digest(data.token) !== digest(recoveryToken(data.id)))
    throw new HttpError(400, "Reset link unavailable");
  const session = await User.startSession();
  try {
    await session.withTransaction(async () => {
      const record = await Recovery.findOneAndDelete(
        { _id: data.id, expiresAt: { $gt: new Date() } },
        { session },
      );
      if (!record) throw new HttpError(400, "Reset link expired");
      const user = await User.findById(record.owner).session(session);
      if (!user) throw new HttpError(400, "Account unavailable");
      user.password = data.password;
      await user.save({ session });
      await Session.deleteMany({ owner: user._id }, { session });
      await Recovery.deleteMany({ owner: user._id }, { session });
    });
  } finally {
    await session.endSession();
  }
  return { done: true };
});
