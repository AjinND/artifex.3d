import { z } from "zod";
import { currentUser } from "@/lib/server/session";
import { endpoint, HttpError, json, limit } from "@/lib/server/http";
import { Order, Quote } from "@/lib/server/records";
import { paymentOptions } from "@/lib/server/payment";
import { catalog } from "@/lib/server/catalog";
import { dimensions } from "@/lib/shop/catalog";
const id = z.string().regex(/^[a-f\d]{24}$/);
const cart = z
  .array(
    z.object({
      id,
      quantity: z.number().int().min(1).max(100),
      pricePaise: z.number().int().positive(),
    }),
  )
  .min(1)
  .max(50);
const purchase = z
  .object({
    attempt: z.string().uuid(),
    address: z.string().trim().min(10).max(600),
    pin: z.string().regex(/^[1-9]\d{5}$/),
    items: cart.optional(),
    quote: id.optional(),
    version: z.number().int().optional(),
  })
  .strict();
export const POST = endpoint(async (req) => {
  const user = await currentUser();
  await limit("checkout-" + user.id, 60);
  const data = purchase.parse(await json(req));
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET)
    throw new HttpError(503, "Online payments are not configured yet");
  const allowed = (process.env.SERVICEABLE_PINS || "").split(",");
  if (!allowed.includes(data.pin))
    throw new HttpError(422, "Delivery is unavailable for this PIN code");
  const key =
    user.id +
    ":" +
    (data.quote ? "quote:" + data.quote + ":" + data.version : data.attempt);
  if (
    process.env.RAZORPAY_KEY_ID.startsWith("rzp_live_") &&
    ![
      process.env.BUSINESS_EMAIL,
      process.env.SHIPPING_POLICY,
      process.env.REFUND_POLICY,
      process.env.PRIVACY_POLICY,
    ].every(Boolean)
  )
    throw new HttpError(503, "The studio is preparing its launch information");
  const existing = await Order.findOne({ key });
  if (existing) return paymentOptions(existing.id);
  let tax = 0,
    shipping = 0;
  let lines;
  if (data.quote) {
    const quote = await Quote.findOne({
      _id: data.quote,
      owner: user._id,
      version: data.version,
      state: "offered",
      expires: { $gt: new Date() },
    });
    if (!quote)
      throw new HttpError(409, "This quote is unavailable or expired");
    lines = [
      {
        name: quote.title,
        material: quote.scope,
        quantity: 1,
        pricePaise: quote.amount,
        leadDays: quote.leadDays,
      },
    ];
  } else {
    if (
      !data.items ||
      new Set(data.items.map((i) => i.id)).size !== data.items.length
    )
      throw new HttpError(400, "Invalid cart");
    const products = await catalog({
      _id: { $in: data.items.map((i) => i.id) },
    });
    lines = data.items.map((i) => {
      const p = products.find((v) => v.id === i.id);
      if (!p || p.pricePaise !== i.pricePaise)
        throw new HttpError(
          409,
          "A print has changed. Refresh your cart before paying.",
        );
      return {
        productId: p.id,
        name: p.name,
        photo: p.photos[0].url,
        dimensions: dimensions(p),
        material: p.material,
        leadDays: p.leadDays,
        quantity: i.quantity,
        pricePaise: p.pricePaise,
      };
    });
    const rate = z.coerce
      .number()
      .int()
      .min(0)
      .max(10000)
      .safeParse(process.env.TAX_BASIS_POINTS || undefined);
    const delivery = z.coerce
      .number()
      .int()
      .min(0)
      .max(10000000)
      .safeParse(process.env.SHIPPING_PAISE || undefined);
    if (!rate.success || !delivery.success)
      throw new HttpError(503, "Delivery pricing is awaiting studio approval");
    tax = Math.round(
      (lines.reduce((s, l) => s + l.quantity * l.pricePaise, 0) * rate.data) /
        10000,
    );
    shipping = delivery.data;
  }
  const subtotal = lines.reduce((s, l) => s + l.quantity * l.pricePaise, 0);
  const record = {
    owner: user._id,
    key,
    lines,
    address: data.address,
    pin: data.pin,
    subtotal,
    tax,
    shipping,
    total: subtotal + tax + shipping,
  };
  const session = await Order.startSession();
  try {
    await session.withTransaction(async () => {
      if (await Order.exists({ key }).session(session)) return;
      if (data.quote) {
        const r = await Quote.updateOne(
          {
            _id: data.quote,
            owner: user._id,
            state: "offered",
            version: data.version,
            expires: { $gt: new Date() },
          },
          { $set: { state: "accepted" } },
          { session },
        );
        if (!r.modifiedCount) throw new HttpError(409, "Quote has changed");
      }
      await Order.create([record], { session });
    });
  } finally {
    await session.endSession();
  }
  const order = await Order.findOne({ key });
  return paymentOptions(order.id);
});
