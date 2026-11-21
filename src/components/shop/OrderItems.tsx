import { money } from "@/lib/shop/catalog";
import type { OrderView } from "@/lib/shop/orders";
import ProductImage from "./ProductImage";

export function OrderItems({ lines }: { lines: OrderView["lines"] }) {
  return (
    <ul>
      {lines.map((line, index) => (
        <li className="cart-line" key={index}>
          {line.photo && (
            <ProductImage
              width={80}
              height={80}
              sizes="72px"
              alt={line.name}
              src={line.photo}
            />
          )}
          <div>
            <strong>{line.name}</strong>
            <p>
              {[line.material, line.dimensions].filter(Boolean).join(" · ")}
            </p>
            <p>
              {line.quantity} × {money(line.pricePaise)} · Production{" "}
              {line.leadDays} days
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function OrderTotals({
  subtotal,
  tax,
  shipping,
  total,
  payable = false,
}: Pick<OrderView, "subtotal" | "tax" | "shipping" | "total"> & {
  payable?: boolean;
}) {
  return (
    <dl className="order-totals">
      <div className="totals-row">
        <dt>Subtotal</dt>
        <dd>{money(subtotal)}</dd>
      </div>
      <div className="totals-row">
        <dt>Tax</dt>
        <dd>{money(tax)}</dd>
      </div>
      <div className="totals-row">
        <dt>Shipping</dt>
        <dd>{money(shipping)}</dd>
      </div>
      <div className="totals-row order-totals-final">
        <dt>{payable ? "Payable total" : "Total"}</dt>
        <dd>{money(total)}</dd>
      </div>
    </dl>
  );
}
