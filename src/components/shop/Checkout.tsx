"use client";
import { OrderItems, OrderTotals } from "./OrderItems";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useCart } from "@/components/features/cart/CartContext";
import { CartLines } from "@/components/features/cart/Cart";
import { request, pay, type PaymentOptions } from "@/lib/shop/client";
import { rememberPurchase } from "@/lib/shop/cartReceipt";
import { money } from "@/lib/shop/catalog";
export default function Checkout({
  quote,
  version,
}: {
  quote: string;
  version: number;
}) {
  const router = useRouter();
  const { user, isLoading } = useAuth(),
    cart = useCart();
  const [error, fail] = useState(""),
    [busy, setBusy] = useState(false),
    [order, setOrder] = useState<PaymentOptions | null>(null);
  const reviewHeading = useRef<HTMLHeadingElement>(null);
  const cartEmpty = !quote && cart.ready && !cart.items.length;
  useEffect(() => {
    if (order) reviewHeading.current?.focus();
  }, [order]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    fail("");
    try {
      const form = Object.fromEntries(new FormData(e.currentTarget));
      const lines = cart.items.map(({ item, quantity }) => ({
        id: item.id,
        quantity,
        pricePaise: item.pricePaise,
      }));
      const payload = {
        ...form,
        ...(quote ? { quote, version } : { items: lines }),
      };
      const fingerprint = Array.from(
        new Uint8Array(
          await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(JSON.stringify(payload)),
          ),
        ),
        (b) => b.toString(16).padStart(2, "0"),
      ).join("");
      const last = JSON.parse(
        sessionStorage.getItem("checkoutAttempt") || "null",
      );
      const attempt =
        last?.fingerprint === fingerprint ? last.attempt : crypto.randomUUID();
      sessionStorage.setItem(
        "checkoutAttempt",
        JSON.stringify({ fingerprint, attempt }),
      );
      const created = await request<PaymentOptions>("/api/checkout", {
        ...payload,
        attempt,
      });
      if (!quote) rememberPurchase(created.id, lines);
      setOrder(created);
    } catch (e) {
      fail((e as Error).message);
      cart.refresh();
    } finally {
      setBusy(false);
    }
  }
  async function open() {
    if (!order) return;
    setBusy(true);
    try {
      await pay(order, () => {
        router.push("/profile");
      });
    } catch (e) {
      fail((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <main className="shop-shell">
      <p className="eyebrow">A few details, then it is yours</p>
      <h1>Checkout</h1>
      <ol className="checkout-progress" aria-label="Checkout progress">
        <li aria-current={!order ? "step" : undefined}>01 Delivery</li>
        <li aria-current={order ? "step" : undefined}>02 Review & pay</li>
      </ol>
      <div className="checkout-layout">
        <section>
          {error && <p role="alert">{error}</p>}
          {isLoading ? (
            <p role="status">Loading your account…</p>
          ) : cartEmpty && !order ? (
            <div className="empty-state">
              <h2>Your cart is empty.</h2>
              <p>Choose a print from the collection to get started.</p>
              <Link className="shop-primary" href="/gallery">
                Shop prints
              </Link>
            </div>
          ) : !user ? (
            <div className="empty-state">
              <h2>Make yourself at home.</h2>
              <p>Sign in to save your order and follow its progress.</p>
              <Link
                className="shop-primary"
                href={
                  "/login?next=" +
                  encodeURIComponent(
                    "/checkout" +
                      (quote ? "?quote=" + quote + "&version=" + version : ""),
                  )
                }
              >
                Sign in to check out
              </Link>
            </div>
          ) : order ? (
            <section>
              <h2 ref={reviewHeading} tabIndex={-1}>
                Review your order
              </h2>
              <p className="muted">
                Your confirmed total is ready. Review the details before
                continuing to payment.
              </p>
              <OrderItems lines={order.lines} />
            </section>
          ) : (
            <>
              <h2>Where should we send it?</h2>
              <p className="muted">
                Enter your delivery details to confirm shipping, tax, and the
                payable total.
              </p>
              <form onSubmit={submit} aria-busy={busy}>
                <label>
                  Delivery address in India
                  <textarea
                    name="address"
                    required
                    minLength={10}
                    maxLength={600}
                    autoComplete="street-address"
                  />
                </label>
                <label>
                  PIN code
                  <input
                    name="pin"
                    required
                    pattern="[1-9][0-9]{5}"
                    inputMode="numeric"
                    autoComplete="postal-code"
                  />
                </label>
                <button
                  className="shop-primary"
                  disabled={
                    busy ||
                    (!quote &&
                      (!cart.ready || !cart.items.length || !!cart.notice))
                  }
                >
                  {busy ? "Confirming total…" : "Review payable total"}
                </button>
              </form>
            </>
          )}
        </section>
        <aside className="checkout-summary" aria-label="Order summary">
          <h2>
            {order
              ? "Your confirmed total"
              : quote
                ? "Your custom order"
                : "In your bag"}
          </h2>
          {order ? (
            <>
              <OrderTotals
                subtotal={order.subtotal}
                tax={order.tax}
                shipping={order.shipping}
                total={order.amount}
                payable
              />
              <p>Including shipping and applicable tax.</p>
            </>
          ) : quote ? (
            <p>
              Your accepted quote will be checked and the confirmed order
              details shown before payment.
            </p>
          ) : (
            <>
              {(!cartEmpty || cart.notice) && <CartLines />}
              {!!cart.items.length && (
                <div className="cart-totals">
                  <div className="totals-row">
                    <span>Estimated subtotal</span>
                    <strong>
                      {money(
                        cart.items.reduce(
                          (sum, line) =>
                            sum + line.item.pricePaise * line.quantity,
                          0,
                        ),
                      )}
                    </strong>
                  </div>
                  <p>
                    Shipping and tax are confirmed after you enter your delivery
                    details.
                  </p>
                </div>
              )}
            </>
          )}
          {order && (
            <div className="shop-actions">
              <button disabled={busy} className="shop-primary" onClick={open}>
                {busy ? "Opening payment…" : "Pay with Razorpay"}
              </button>
            </div>
          )}
          <Link className="text-link" href="/policies">
            Shipping & studio policies
          </Link>
        </aside>
      </div>
    </main>
  );
}
