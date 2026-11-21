import { z } from "zod";
import { currentUser } from "@/lib/server/session";
import { endpoint, HttpError, json } from "@/lib/server/http";
import { Order } from "@/lib/server/records";
import { reconcile, verifySignature } from "@/lib/server/payment";
export const POST = endpoint(async (req) => {
  const user = await currentUser();
  const p = z
    .object({
      razorpay_order_id: z.string().max(100),
      razorpay_payment_id: z.string().max(100),
      razorpay_signature: z.string().length(64),
    })
    .parse(await json(req));
  const order = await Order.findOne({
    owner: user._id,
    providerOrder: p.razorpay_order_id,
  });
  if (
    !order ||
    !verifySignature(
      order.providerOrder + "|" + p.razorpay_payment_id,
      p.razorpay_signature,
      process.env.RAZORPAY_KEY_SECRET,
    )
  )
    throw new HttpError(400, "Payment verification failed");
  return reconcile(p.razorpay_payment_id);
});
