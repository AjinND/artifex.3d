import { endpoint, body, HttpError } from "@/lib/server/http";
import { reconcile, verifySignature } from "@/lib/server/payment";
import { connectDB } from "@/lib/db/connection";
export const POST = endpoint(async (req) => {
  const raw = await body(req, 131072);
  if (
    !verifySignature(
      raw,
      req.headers.get("x-razorpay-signature") || "",
      process.env.RAZORPAY_WEBHOOK_SECRET,
    )
  )
    throw new HttpError(400, "Invalid signature");
  const event = JSON.parse(raw);
  if (
    ["payment.captured", "order.paid", "refund.processed"].includes(event.event)
  ) {
    await connectDB();
    await reconcile(
      event.payload.payment?.entity?.id ||
        event.payload.refund?.entity?.payment_id,
    );
  }
  return { received: true };
}, false);
