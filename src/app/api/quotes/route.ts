import { z } from "zod";
import { endpoint, HttpError, json, limit } from "@/lib/server/http";
import { currentUser } from "@/lib/server/session";
import { Quote, Upload } from "@/lib/server/records";
const input = z.object({
  title: z.string().trim().min(2).max(120),
  brief: z.string().trim().min(10).max(6000),
  quantity: z.number().int().min(1).max(100),
  product: z.string().max(100).optional(),
  attachments: z.array(z.string().regex(/^[a-f\d]{24}$/)).max(5),
});
export const GET = endpoint(async () =>
  Quote.find({ owner: (await currentUser())._id }).sort({ createdAt: -1 }),
);
export const POST = endpoint(async (req) => {
  const user = await currentUser();
  await limit("quote-" + user.id, 20);
  const data = input.parse(await json(req));
  const count = await Upload.countDocuments({
    _id: { $in: data.attachments },
    owner: user._id,
    state: "cleared",
  });
  if (count !== data.attachments.length)
    throw new HttpError(409, "Wait for all attachments to clear inspection");
  const quote = new Quote({ ...data, owner: user._id });
  const session = await Quote.startSession();
  try {
    await session.withTransaction(async () => {
      if (data.attachments.length) {
        const claimed = await Upload.updateMany(
          {
            _id: { $in: data.attachments },
            owner: user._id,
            state: "cleared",
            quote: null,
          },
          { $set: { quote: quote._id } },
          { session },
        );
        if (claimed.modifiedCount !== data.attachments.length)
          throw new HttpError(409, "Attachment unavailable");
      }
      await quote.save({ session });
    });
  } finally {
    await session.endSession();
  }
  return { id: quote.id };
});
