"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Tabs from "@/components/ui/Tabs";
import PasswordField from "@/components/ui/PasswordField";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { request, pay, type PaymentOptions } from "@/lib/shop/client";
import { money } from "@/lib/shop/catalog";
import type { OrderView, QuoteView } from "@/lib/shop/orders";
import { useCart } from "@/components/features/cart/CartContext";
import { OrderSummary } from "@/components/shop/OrderSummary";
export default function Profile() {
  const { ready, settle } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const tab =
    requestedTab === "quotes" || requestedTab === "settings"
      ? requestedTab
      : "orders";
  function selectTab(next: string) {
    const params = new URLSearchParams(searchParams);
    if (next === "orders") params.delete("tab");
    else params.set("tab", next);
    const query = params.toString();
    router.replace(query ? `/profile?${query}` : "/profile", { scroll: false });
  }
  const [fetching, setFetching] = useState(true);
  const { user, isLoading, logout } = useAuth(),
    [orders, setOrders] = useState<OrderView[]>([]),
    [quotes, setQuotes] = useState<QuoteView[]>([]),
    [msg, set] = useState("");
  async function refresh() {
    setFetching(true);
    try {
      const [o, q] = await Promise.all([
        request<OrderView[]>("/api/orders"),
        request<QuoteView[]>("/api/quotes"),
      ]);
      setOrders(o);
      setQuotes(q);
    } catch (e) {
      set((e as Error).message);
    } finally {
      setFetching(false);
    }
  }
  useEffect(() => {
    if (user) void Promise.resolve().then(refresh);
  }, [user]);
  useEffect(() => {
    if (ready) for (const o of orders) if (o.payment === "paid") settle(o._id);
  }, [ready, orders, settle]);
  async function submit(e: React.FormEvent<HTMLFormElement>, pw = false) {
    e.preventDefault();
    try {
      await request(
        pw ? "/api/auth/password" : "/api/users/" + user?._id,
        Object.fromEntries(new FormData(e.currentTarget)),
        pw ? "POST" : "PATCH",
      );
      if (pw) await logout();
      else location.reload();
    } catch (e) {
      set((e as Error).message);
    }
  }
  async function resume(id: string) {
    try {
      await pay(
        await request<PaymentOptions>("/api/orders", { id }),
        () => void refresh(),
      );
    } catch (e) {
      set((e as Error).message);
    }
  }
  if (!user)
    return (
      <main className="shop-shell account-page">
        <div className="account-layout">
          <section className="account-panel">
            <p className="eyebrow">Your corner of the studio</p>
            <h1>Your account</h1>
            {isLoading ? (
              <p role="status">Loading account…</p>
            ) : (
              <>
                <p className="account-intro">
                  Your orders, quotes, and ideas. All in one place.
                </p>
                <div className="shop-actions">
                  <Link className="shop-primary" href="/login">
                    Sign in to view your account
                  </Link>
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    );
  return (
    <main className="shop-shell">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Your corner of the studio</p>
          <h1>Your account</h1>
          <p className="muted">Welcome back, {user.name}.</p>
        </div>
        <div className="shop-actions">
          {user.role === "admin" && (
            <Link className="shop-secondary" href="/staff">
              Open studio workspace
            </Link>
          )}
          <button className="shop-secondary" onClick={() => void logout()}>
            Sign out
          </button>
        </div>
      </div>
      <p role="status">{msg}</p>
      <Tabs
        label="Account sections"
        prefix="account"
        value={tab}
        onChange={selectTab}
        tabs={[
          { id: "orders", label: "Orders" },
          { id: "quotes", label: "Quotes" },
          { id: "settings", label: "Settings" },
        ]}
      />
      <section
        role="tabpanel"
        id="account-orders-panel"
        aria-labelledby="account-orders"
        hidden={tab !== "orders"}
        tabIndex={0}
      >
        <h2>Orders</h2>
        {fetching ? (
          <p role="status">Loading orders…</p>
        ) : (
          !orders.length && (
            <div className="empty-state">
              <h3>Your next object is waiting.</h3>
              <p>No orders yet.</p>
              <Link className="text-link" href="/gallery">
                Explore the collection →
              </Link>
            </div>
          )
        )}
        {orders.map((o) => (
          <div key={o._id}>
            <OrderSummary order={o} />
            {o.payment === "pending" && (
              <div className="shop-actions">
                <button className="shop-primary" onClick={() => resume(o._id)}>
                  Resume payment
                </button>
              </div>
            )}
          </div>
        ))}
      </section>
      <section
        role="tabpanel"
        id="account-quotes-panel"
        aria-labelledby="account-quotes"
        hidden={tab !== "quotes"}
        tabIndex={0}
      >
        <h2>Quotes</h2>
        {fetching ? (
          <p role="status">Loading quotes…</p>
        ) : (
          !quotes.length && (
            <div className="empty-state">
              <h3>Every object starts somewhere.</h3>
              <p>No quote requests yet.</p>
              <Link className="text-link" href="/order">
                Tell us about your idea →
              </Link>
            </div>
          )
        )}
        {quotes.map((q) => (
          <section className="record" key={q._id}>
            <div className="staff-quote-heading">
              <h3>{q.title}</h3>
              <span className="status-badge" data-state={q.state}>
                {q.state}
              </span>
            </div>
            <p className="muted">{q.quantity} requested</p>
            <details>
              <summary>View project details</summary>
              <p>{q.brief}</p>
              {q.scope && (
                <>
                  <p>{q.scope}</p>
                  <strong>
                    {money(q.amount || 0)} including shipping and tax
                  </strong>
                  <p>
                    Production {q.leadDays} days · Valid through{" "}
                    {new Date(q.expires!).toLocaleDateString("en-IN")}
                  </p>
                </>
              )}
            </details>
            {q.state === "offered" && (
              <Link
                className="shop-primary"
                href={"/checkout?quote=" + q._id + "&version=" + q.version}
              >
                Accept quote and check out
              </Link>
            )}
          </section>
        ))}
      </section>
      <section
        role="tabpanel"
        id="account-settings-panel"
        aria-labelledby="account-settings"
        hidden={tab !== "settings"}
        tabIndex={0}
        className="settings-panel account-panel"
      >
        <h2>Account settings</h2>
        <form onSubmit={submit}>
          <label>
            Name
            <input
              required
              name="name"
              minLength={2}
              maxLength={50}
              defaultValue={user.name}
              autoComplete="name"
            />
          </label>
          <button>Save name</button>
        </form>
        <form onSubmit={(e) => submit(e, true)}>
          <h3>Change your password</h3>
          <PasswordField
            label="Current password"
            name="current"
            autoComplete="current-password"
          />
          <PasswordField
            label="New password"
            name="password"
            minLength={8}
            autoComplete="new-password"
          />
          <p className="muted">
            You will be signed out after changing your password.
          </p>
          <button>Change password</button>
        </form>
      </section>
    </main>
  );
}
