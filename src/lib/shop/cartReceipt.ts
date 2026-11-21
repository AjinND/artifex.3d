type Line = { id: string; quantity: number };
const key = (id: string) => "artifex_order_cart_" + id;
export function rememberPurchase(id: string, lines: Line[]) {
  sessionStorage.setItem(key(id), JSON.stringify(lines));
}
export function takePurchase(id: string): Line[] {
  const raw = sessionStorage.getItem(key(id));
  if (!raw) return [];
  sessionStorage.removeItem(key(id));
  sessionStorage.removeItem("checkoutAttempt");
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value)
      ? value.filter(
          (l) =>
            typeof l?.id === "string" &&
            Number.isInteger(l.quantity) &&
            l.quantity > 0,
        )
      : [];
  } catch {
    return [];
  }
}
