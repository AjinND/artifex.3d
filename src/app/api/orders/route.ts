import { currentUser } from "@/lib/server/session";
import { endpoint, json, HttpError } from "@/lib/server/http";
import { Order } from "@/lib/server/records";
import { paymentOptions } from "@/lib/server/payment";
import { z } from "zod";
export const GET = endpoint(async () => {
  const u = await currentUser();
  return Order.find({ owner: u._id })
    .sort({ createdAt: -1 })
    .select("-key -providerPayment -providerOrder");
});
export const POST = endpoint(async (req) => {
  const u = await currentUser();
  const id = z
    .string()
    .regex(/^[a-f\d]{24}$/)
    .parse((await json(req)).id);
  if (!(await Order.exists({ _id: id, owner: u._id })))
    throw new HttpError(404, "Order unavailable");
  return paymentOptions(id);
});
