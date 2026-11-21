// Loaded only by the disposable acceptance server. No network requests reach Razorpay.
if (
  process.env.ARTIFEX_TEST_PROVIDER !== "isolated" ||
  process.env.RAZORPAY_KEY_ID !== "fixture_key"
)
  throw new Error("Test provider requires isolated fixture settings");
const original = global.fetch;
const orders = new Map();
global.fetch = async (input, init = {}) => {
  const url = new URL(
    typeof input === "string" ? input : input.url || String(input),
  );
  if (url.origin !== "https://api.razorpay.com") return original(input, init);
  const path = url.pathname;
  if (path === "/v1/orders" && init.method === "POST") {
    const body = JSON.parse(init.body);
    const item = { ...body, id: "order_" + body.receipt };
    orders.set(item.id, item);
    return Response.json(item);
  }
  if (path === "/v1/orders") {
    return Response.json({
      items: [...orders.values()].filter(
        (o) => o.receipt === url.searchParams.get("receipt"),
      ),
    });
  }
  if (path.startsWith("/v1/payments/pay_")) {
    const id = path.split("/").pop();
    const o = orders.get(id.replace("pay_", "order_"));
    if (o)
      return Response.json({
        id,
        order_id: o.id,
        amount: o.amount,
        currency: o.currency,
        status: "captured",
        amount_refunded: 0,
      });
  }
  return Response.json({ error: "Unknown test reference" }, { status: 404 });
};
