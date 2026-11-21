import { z } from "zod";
import { password } from "@/lib/validators/user";
import { currentUser, Session } from "@/lib/server/session";
import { endpoint, HttpError, json, limit } from "@/lib/server/http";
import { User } from "@/lib/db/models/User";
export const POST = endpoint(async (req) => {
  const actor = await currentUser();
  await limit("password-" + actor.id, 8);
  const input = z
    .object({ current: z.string().max(128), password })
    .parse(await json(req));
  const user = await User.findById(actor._id);
  if (!user || !(await user.comparePassword(input.current)))
    throw new HttpError(403, "Current password is incorrect");
  user.password = input.password;
  await user.save();
  await Session.deleteMany({ owner: user._id });
  return { signInRequired: true };
});
