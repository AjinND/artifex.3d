import { currentUser } from "@/lib/server/session";
import { endpoint, HttpError, json } from "@/lib/server/http";
import { updateUserSchema } from "@/lib/validators/user";
import { User } from "@/lib/db/models/User";
async function target(req: Request) {
  const user = await currentUser();
  const id = new URL(req.url).pathname.split("/").pop();
  if (
    !id ||
    !/^[a-f\d]{24}$/i.test(id) ||
    (String(user._id) !== id && user.role !== "admin")
  )
    throw new HttpError(404, "Account unavailable");
  return id;
}
export const GET = endpoint(async (req) => {
  const user = await User.findById(await target(req)).select("name email role");
  if (!user) throw new HttpError(404, "Account unavailable");
  return user;
});
export const PATCH = endpoint(async (req) => {
  const id = await target(req);
  const { name } = updateUserSchema.parse(await json(req));
  const user = await User.findByIdAndUpdate(
    id,
    { $set: { name } },
    { new: true, runValidators: true },
  ).select("name email role");
  if (!user) throw new HttpError(404, "Account unavailable");
  return user;
});
