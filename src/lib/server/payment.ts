import { notification } from "./notify";
import { createHmac, timingSafeEqual } from "node:crypto";
import { HttpError } from "./http";
import { Order } from "./records";
export function verifySignature(
  raw: string,
  signature: string,
  secret?: string,
) {
  if (!secret || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  return timingSafeEqual(
    createHmac("sha256", secret).update(raw).digest(),
    Buffer.from(signature, "hex"),
  );
}
export async function gateway(path: string, body?: Record<string, unknown>) {
  const key = process.env.RAZORPAY_KEY_ID,
    secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key || !secret)
    throw new HttpError(503, "Online payments are not configured");
  const res = await fetch("https://api.razorpay.com/v1/" + path, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization:
        "Basic " + Buffer.from(key + ":" + secret).toString("base64"),
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok)
    throw new HttpError(
      502,
      "Payment provider unavailable. Your order has been saved.",
    );
  return res.json();
}
export async function paymentOptions(
  id: string,
): Promise<import("../shop/client").PaymentOptions> {
  const key = process.env.RAZORPAY_KEY_ID;
  if (!key || !process.env.RAZORPAY_KEY_SECRET)
    throw new HttpError(503, "Online payments are unavailable");
  const order = await Order.findById(id);
  if (!order || order.payment !== "pending")
    throw new HttpError(409, "This order is no longer awaiting payment");
  if (!order.providerOrder) {
    const lock = await Order.findOneAndUpdate(
      { _id: id, creatingAt: null, providerOrder: null },
      { $set: { creatingAt: new Date() } },
    );
    if (lock) {
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        await Order.updateOne({ _id: id }, { $unset: { creatingAt: 1 } });
        throw new HttpError(503, "Payments unavailable");
      }
      const result = await gateway("orders", {
        amount: order.total,
        currency: "INR",
        receipt: id,
      });
      await Order.updateOne(
        { _id: id },
        { $set: { providerOrder: result.id } },
      );
      order.providerOrder = result.id;
    } else {
      const results = await gateway("orders?receipt=" + id);
      const match = results.items?.find(
        (o: { receipt: string; amount: number; currency: string }) =>
          o.receipt === id && o.amount === order.total && o.currency === "INR",
      );
      if (!match) {
        const released = await Order.updateOne(
          {
            _id: id,
            providerOrder: null,
            creatingAt: { $lt: new Date(Date.now() - 60000) },
          },
          { $unset: { creatingAt: 1 } },
        );
        if (released.modifiedCount) return paymentOptions(id);
        throw new HttpError(
          409,
          "Payment setup is pending. Retry from your account.",
        );
      }
      await Order.updateOne({ _id: id }, { $set: { providerOrder: match.id } });
      order.providerOrder = match.id;
    }
  }
  return {
    id,
    lines: order.lines,
    subtotal: order.subtotal,
    tax: order.tax,
    shipping: order.shipping,
    amount: order.total,
    currency: "INR",
    key,
    order_id: order.providerOrder,
  };
}
export async function reconcile(paymentId: string) {
  if (!/^pay_[a-zA-Z0-9]+$/.test(paymentId))
    throw new HttpError(400, "Invalid payment reference");
  const payment = await gateway("payments/" + paymentId);
  const order = await Order.findOne({ providerOrder: payment.order_id });
  if (!order || payment.amount !== order.total || payment.currency !== "INR")
    throw new HttpError(409, "Payment does not match the order");
  if (payment.status === "captured" || payment.status === "refunded") {
    const status =
      payment.amount_refunded >= payment.amount
        ? "refunded"
        : payment.amount_refunded > 0
          ? "partially refunded"
          : "paid";
    const prior =
      status === "paid"
        ? ["pending", "paid"]
        : status === "partially refunded"
          ? ["pending", "paid", "partially refunded"]
          : ["pending", "paid", "partially refunded", "refunded"];
    await Order.updateOne(
      {
        _id: order._id,
        payment: { $in: prior.filter((v) => v !== status) },
        $or: [{ providerPayment: null }, { providerPayment: paymentId }],
      },
      {
        $set: {
          payment: status,
          providerPayment: paymentId,
          ...notification(
            "Your Artifex3D payment status is " +
              status +
              ". Open your account to view the order.",
          ),
        },
      },
    );
  }
  return {
    id: String(order._id),
    payment: (await Order.findById(order._id)).payment,
  };
}
