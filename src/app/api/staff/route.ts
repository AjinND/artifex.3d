import { notification } from "@/lib/server/notify";
import { z } from "zod";
import { currentUser } from "@/lib/server/session";
import { endpoint, HttpError, json } from "@/lib/server/http";
import { catalog } from "@/lib/server/catalog";
import { Enquiry, Order, Quote, Audit } from "@/lib/server/records";
export const GET = endpoint(async (req) => {
  await currentUser(true);
  const page = z.coerce
    .number()
    .int()
    .min(0)
    .max(10000)
    .parse(new URL(req.url).searchParams.get("page") || 0);
  const [products, orders, quotes, enquiries] = await Promise.all([
    catalog({}, true),
    Order.find()
      .sort({ createdAt: -1, _id: -1 })
      .skip(page * 50)
      .limit(50),
    Quote.find()
      .sort({ createdAt: -1, _id: -1 })
      .skip(page * 50)
      .limit(50),
    Enquiry.find()
      .sort({ createdAt: -1, _id: -1 })
      .skip(page * 50)
      .limit(50),
  ]);
  return { products, orders, quotes, enquiries };
});
const id = z.string().regex(/^[a-f\d]{24}$/);
const update = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("quote"),
    id,
    version: z.number().int().nonnegative(),
    scope: z.string().trim().min(5).max(3000),
    amount: z.number().int().positive().max(100000000),
    leadDays: z.number().int().min(1).max(365),
    expires: z.iso.datetime(),
  }),
  z.object({
    action: z.literal("reply"),
    id,
    reply: z.string().trim().min(2).max(4000),
  }),
  z.object({
    action: z.literal("fulfill"),
    id,
    status: z.enum(["in production", "dispatched", "completed"]),
    carrier: z.string().max(100),
    tracking: z.string().max(120),
  }),
]);
export const PATCH = endpoint(async (req) => {
  const u = await currentUser(true),
    a = update.parse(await json(req));
  const session = await Audit.startSession();
  try {
    await session.withTransaction(async () => {
      let saved;
      if (a.action === "quote") {
        if (Date.parse(a.expires) <= Date.now())
          throw new HttpError(400, "Choose a future expiry");
        saved = await Quote.findOneAndUpdate(
          {
            _id: a.id,
            version: a.version,
            state: { $in: ["submitted", "offered"] },
          },
          {
            $push: {
              offers: {
                version: a.version + 1,
                scope: a.scope,
                amount: a.amount,
                leadDays: a.leadDays,
                expires: a.expires,
                issuedBy: u._id,
              },
            },
            $inc: { version: 1 },
            $set: {
              state: "offered",
              amount: a.amount,
              expires: a.expires,
              scope: a.scope,
              leadDays: a.leadDays,
              issuedBy: u._id,
              ...notification(
                "Your Artifex3D quote is ready. Open your account to review the scope, price and expiry.",
              ),
            },
          },
          { session },
        );
      }
      if (a.action === "reply") {
        saved = await Enquiry.findOneAndUpdate(
          { _id: a.id, replyState: null },
          { $set: { reply: a.reply, repliedBy: u._id, replyState: "pending" } },
          { session },
        );
      }
      if (a.action === "fulfill") {
        const prior = {
          "in production": "awaiting production",
          dispatched: "in production",
          completed: "dispatched",
        }[a.status];
        if (a.status === "dispatched" && (!a.carrier || !a.tracking))
          throw new HttpError(400, "Carrier and tracking reference required");
        saved = await Order.findOneAndUpdate(
          { _id: a.id, payment: "paid", fulfillment: prior },
          {
            $set: {
              fulfillment: a.status,
              ...notification(
                "Your Artifex3D order is now " +
                  a.status +
                  ". Open your account for details.",
              ),
              ...(a.status === "dispatched"
                ? { carrier: a.carrier, tracking: a.tracking }
                : {}),
            },
          },
          { session },
        );
      }
      if (!saved)
        throw new HttpError(409, "Record changed. Refresh the queue.");
      await Audit.create([{ actor: u._id, resource: a.id, action: a.action }], {
        session,
      });
    });
  } finally {
    await session.endSession();
  }
  return { saved: true };
});
