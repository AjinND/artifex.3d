export async function request<T>(
  path: string,
  data?: unknown,
  method?: string,
): Promise<T> {
  const res = await fetch(path, {
    method: method || (data === undefined ? "GET" : "POST"),
    headers:
      data === undefined ? undefined : { "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
    cache: "no-store",
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || "Request failed");
  return result.data;
}
export type PaymentOptions = {
  lines: import("./orders").OrderView["lines"];
  id: string;
  subtotal: number;
  tax: number;
  shipping: number;
  order_id: string;
  amount: number;
  key: string;
  currency: string;
};
type Checkout = new (o: Record<string, unknown>) => { open: () => void };
let script: Promise<Checkout> | undefined;
export async function pay(
  options: PaymentOptions,
  onResult: (state: string) => void,
) {
  if (!script)
    script = new Promise<Checkout>((resolve, reject) => {
      const el = document.createElement("script");
      el.src = "https://checkout.razorpay.com/v1/checkout.js";
      el.onload = () =>
        resolve(
          (window as unknown as Window & { Razorpay: Checkout }).Razorpay,
        );
      el.onerror = () => {
        script = undefined;
        el.remove();
        reject(new Error("Could not load secure checkout"));
      };
      document.head.append(el);
    });
  const Gateway = await script;
  new Gateway({
    key: options.key,
    order_id: options.order_id,
    amount: options.amount,
    currency: options.currency,
    name: "Artifex3D",
    modal: { ondismiss: () => onResult("pending") },
    handler: async (data: unknown) => {
      try {
        const result = await request<{ payment: string }>(
          "/api/payments/verify",
          data,
        );
        onResult(result.payment);
      } catch {
        onResult("pending");
      }
    },
  }).open();
}
