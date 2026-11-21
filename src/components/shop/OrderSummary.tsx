import { OrderItems, OrderTotals } from "./OrderItems";
import { money } from "@/lib/shop/catalog";
import type { OrderView } from "@/lib/shop/orders";
export function OrderSummary({ order: o }: { order: OrderView }) {
  return (
    <section className="record">
      <h3>Order {o._id}</h3>
      <div className="badge-row">
        <span className="status-badge" data-state={o.payment}>
          Payment {o.payment}
        </span>
        <span className="status-badge">{o.fulfillment}</span>
      </div>
      <strong>Total {money(o.total)}</strong>
      <details>
        <summary>View order details</summary>
        <OrderItems lines={o.lines} />
        <OrderTotals
          subtotal={o.subtotal}
          tax={o.tax}
          shipping={o.shipping}
          total={o.total}
        />
        <p>
          {o.address} · {o.pin}
        </p>
        {o.tracking && (
          <p>
            {o.carrier} · Tracking {o.tracking}
          </p>
        )}
      </details>
    </section>
  );
}
