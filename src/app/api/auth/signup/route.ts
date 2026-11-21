import { createUserSchema } from "@/lib/validators/user";
import { endpoint, json, limit } from "@/lib/server/http";
import { User } from "@/lib/db/models/User";
export const POST = endpoint(async (req) => {
  const input = createUserSchema.parse(await json(req));
  await limit("signup", 120);
  const user = await User.create({ ...input, role: "user" });
  return { _id: user._id, name: user.name };
});
