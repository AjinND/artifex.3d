"use client";
import { trapDialogFocus } from "@/components/ui/dialogFocus";
import Image from "@/components/shop/ProductImage";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { useCart } from "./CartContext";
import { dimensions, money } from "@/lib/shop/catalog";
export function CartLines() {
  const { items, setQuantity, remove, notice, acknowledge, ready, refresh } =
    useCart();
  return (
    <>
      {notice && (
        <div className="cart-notice">
          <p role="alert">{notice}</p>
          <button
            className="shop-secondary"
            onClick={ready ? acknowledge : refresh}
          >
            {ready ? "Acknowledge changes" : "Retry"}
          </button>
        </div>
      )}
      {!ready && !notice && <p role="status">Updating your cart…</p>}
      {items.map(({ item, quantity }) => (
        <article className="cart-line" key={item.id}>
          <Image
            width={80}
            height={80}
            sizes="80px"
            src={item.photos[0].url}
            alt={item.photos[0].alt}
          />
          <div>
            <h3>{item.name}</h3>
            <p>
              {dimensions(item)} · {item.material}
            </p>
            <p>Production {item.leadDays} days</p>
            <strong>{money(item.pricePaise * quantity)}</strong>
            <label>
              Quantity
              <input
                type="number"
                min={1}
                max={100}
                value={quantity}
                onChange={(e) => setQuantity(item.id, Number(e.target.value))}
              />
            </label>
            <button className="shop-secondary" onClick={() => remove(item.id)}>
              Remove
            </button>
          </div>
        </article>
      ))}
      {ready && !items.length && <p>Your cart is empty.</p>}
    </>
  );
}
export default function Cart() {
  const { isOpen, closeCart, items } = useCart();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (isOpen) ref.current?.showModal();
    else ref.current?.close();
  }, [isOpen]);
  return (
    <dialog
      onKeyDown={trapDialogFocus}
      ref={ref}
      className="cart-dialog"
      onCancel={closeCart}
      aria-labelledby="cart-heading"
    >
      <div className="dialog-heading">
        <h2 id="cart-heading">Your cart</h2>
        <button onClick={closeCart}>Close</button>
      </div>
      <CartLines />
      {!items.length && (
        <Link className="text-link" href="/gallery" onClick={closeCart}>
          Explore the collection →
        </Link>
      )}
      {!!items.length && (
        <div className="cart-totals">
          <div className="totals-row">
            <span>Subtotal</span>
            <strong>
              {money(
                items.reduce(
                  (sum, line) => sum + line.item.pricePaise * line.quantity,
                  0,
                ),
              )}
            </strong>
          </div>
          <p className="muted">
            Shipping and applicable tax are confirmed at checkout.
          </p>
          <Link className="shop-primary" href="/checkout" onClick={closeCart}>
            Checkout
          </Link>
        </div>
      )}
    </dialog>
  );
}
