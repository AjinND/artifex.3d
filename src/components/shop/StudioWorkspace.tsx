"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Boxes,
  ClipboardList,
  Download,
  Mail,
  Package,
  RefreshCw,
} from "lucide-react";
import { request } from "@/lib/shop/client";
import { money, type Print } from "@/lib/shop/catalog";
import type { OrderView, QuoteView, EnquiryView } from "@/lib/shop/orders";
import { OrderSummary } from "@/components/shop/OrderSummary";
import ListingEditor from "@/components/shop/ListingEditor";
import styles from "./studio.module.css";
type Queues = {
  products: Print[];
  orders: OrderView[];
  quotes: QuoteView[];
  enquiries: EnquiryView[];
};
const sections = [
  {
    id: "quotes",
    label: "Quotes",
    icon: ClipboardList,
    empty: "No quote requests yet. Submitted customer briefs will appear here.",
  },
  { id: "orders", label: "Orders", icon: Package, empty: "No orders yet." },
  { id: "products", label: "Products", icon: Boxes, empty: "" },
  {
    id: "enquiries",
    label: "Enquiries",
    icon: Mail,
    empty: "No enquiries yet.",
  },
] as const;
const quoteStates: Record<string, string> = {
  submitted: "New request",
  offered: "Quote sent",
  accepted: "Accepted",
};

export default function Studio() {
  const [result, setResult] = useState<{ page: number; data: Queues } | null>(
      null,
    ),
    [msg, set] = useState(""),
    [tab, select] = useState<keyof Queues>("quotes"),
    [slug, edit] = useState(""),
    [page, setPage] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [refreshing, setRefreshing] = useState(true);
  const [pending, setPending] = useState<string | null>(null);
  const latestFetch = useRef(0);
  const data = result?.page === page ? result.data : null;
  const activeSection = sections.find(({ id }) => id === tab)!;
  const refresh = useCallback(async () => {
    const version = ++latestFetch.current;
    setRefreshing(true);
    setLoadError("");
    try {
      const data = await request<Queues>("/api/staff?page=" + page);
      if (version === latestFetch.current) setResult({ page, data });
    } catch (e) {
      if (version === latestFetch.current) setLoadError((e as Error).message);
    } finally {
      if (version === latestFetch.current) setRefreshing(false);
    }
  }, [page]);
  useEffect(() => {
    void Promise.resolve().then(refresh);
  }, [refresh]);
  async function submit(
    e: React.FormEvent<HTMLFormElement>,
    meta: {
      action: "quote" | "reply" | "fulfill";
      id: string;
      version?: number;
    },
  ) {
    e.preventDefault();
    if (pending) return;
    const fields: Record<string, unknown> = Object.fromEntries(
      new FormData(e.currentTarget),
    );
    setPending(meta.id);
    setActionError("");
    set("");
    try {
      if (meta.action === "quote") {
        fields.amount = Math.round(Number(fields.amount) * 100);
        fields.leadDays = Number(fields.leadDays);
        fields.expires = new Date(String(fields.expires)).toISOString();
      }
      await request("/api/staff", { ...fields, ...meta }, "PATCH");
      set("Saved");
      await refresh();
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setPending(null);
    }
  }
  async function file(id: string) {
    try {
      const r = await request<{ url: string }>(
        "/api/uploads?id=" + id + "&download=1",
      );
      location.assign(r.url);
    } catch (e) {
      setActionError((e as Error).message);
    }
  }
  return (
    <main className="shop-shell staff-workspace">
      <header className="staff-workspace-header">
        <div>
          <h1>Studio workspace</h1>
          <p>Review customer requests, manage listings, and track orders.</p>
        </div>
      </header>
      {msg && <p role="status">{msg}</p>}
      {actionError && <p role="alert">{actionError}</p>}
      {loadError && (
        <div className="staff-queue-error">
          <p role="alert">Could not load the workspace. {loadError}</p>
          <button
            type="button"
            className="shop-secondary"
            onClick={() => void refresh()}
          >
            Try again
          </button>
        </div>
      )}
      {!data && !loadError && <p role="status">Loading the workspace…</p>}
      {result && (
        <>
          <nav className="staff-queue-nav" aria-label="Studio sections">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                className="staff-queue-button"
                key={id}
                aria-pressed={tab === id}
                disabled={!!pending}
                onClick={() => {
                  select(id);
                  setPage(0);
                  set("");
                  setActionError("");
                  setLoadError("");
                }}
              >
                <Icon size={19} aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
          <div className="staff-section-heading">
            <h2>{tab === "quotes" ? "Quote requests" : activeSection.label}</h2>
            <button
              type="button"
              className="shop-secondary"
              disabled={refreshing || !!pending}
              onClick={() => void refresh()}
            >
              <RefreshCw size={16} aria-hidden="true" />
              {refreshing && data ? "Refreshing…" : "Refresh"}
            </button>
          </div>
          {data && !data[tab].length && activeSection.empty && (
            <p className="staff-empty">{activeSection.empty}</p>
          )}
          {tab !== "products" &&
            (page > 0 || (data?.[tab].length ?? 0) >= 50) && (
              <nav className="shop-actions" aria-label="Queue pages">
                <button
                  className="shop-secondary"
                  disabled={!page || refreshing || !!pending}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </button>
                <span>Page {page + 1}</span>
                <button
                  className="shop-secondary"
                  disabled={
                    (data?.[tab].length ?? 0) < 50 || refreshing || !!pending
                  }
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </button>
              </nav>
            )}
          {data && tab === "products" && (
            <>
              <div className={styles.editorToolbar}>
                <label>
                  Listing
                  <select value={slug} onChange={(e) => edit(e.target.value)}>
                    <option value="">New listing</option>
                    {data.products.map((p) => (
                      <option key={p.id} value={p.slug}>
                        {p.name} · {p.status}
                      </option>
                    ))}
                  </select>
                </label>
                <Link className="shop-secondary" href="/staff/sample">
                  Review Balancing Form
                </Link>
              </div>
              <ListingEditor
                key={slug}
                item={data.products.find((p) => p.slug === slug)}
                after={refresh}
              />
            </>
          )}
          {data && tab === "orders" && (
            <div className={styles.queueList}>
              {data.orders.map((o) => (
                <article key={o._id}>
                  <OrderSummary order={o} />
                  {o.payment === "paid" && o.fulfillment !== "completed" && (
                    <details className={styles.orderAction}>
                      <summary>Update fulfillment</summary>
                      <form
                        onSubmit={(e) =>
                          submit(e, { action: "fulfill", id: o._id })
                        }
                      >
                        <label>
                          Next status
                          <select name="status">
                            <option>
                              {o.fulfillment === "awaiting production"
                                ? "in production"
                                : o.fulfillment === "in production"
                                  ? "dispatched"
                                  : "completed"}
                            </option>
                          </select>
                        </label>
                        <label>
                          Carrier
                          <input
                            name="carrier"
                            maxLength={100}
                            required={o.fulfillment === "in production"}
                          />
                        </label>
                        <label>
                          Tracking reference
                          <input
                            name="tracking"
                            maxLength={120}
                            required={o.fulfillment === "in production"}
                          />
                        </label>
                        <button disabled={!!pending}>
                          {pending === o._id ? "Saving…" : "Update fulfillment"}
                        </button>
                      </form>
                    </details>
                  )}
                </article>
              ))}
            </div>
          )}
          {data &&
            tab === "quotes" &&
            data.quotes.map((q) => (
              <section key={q._id} className="staff-quote">
                <div className="staff-quote-heading">
                  <h3>{q.title}</h3>
                  <span className="staff-quote-status" data-state={q.state}>
                    {quoteStates[q.state] || q.state}
                  </span>
                </div>
                <p className="staff-quote-meta">
                  {q.quantity} requested{q.product && " · " + q.product}
                </p>
                <p className="staff-quote-reference">Reference {q._id}</p>
                <p className="staff-quote-brief">{q.brief}</p>
                {q.amount !== undefined && (
                  <p>
                    Offer total <strong>{money(q.amount)}</strong> including
                    delivery and tax.
                  </p>
                )}
                {q.attachments.map((id, i) => (
                  <button
                    key={id}
                    type="button"
                    className="shop-secondary staff-attachment"
                    onClick={() => file(id)}
                  >
                    <Download size={16} aria-hidden="true" /> Download
                    attachment {i + 1}
                  </button>
                ))}
                {q.state !== "accepted" && (
                  <details>
                    <summary>Prepare a quote</summary>
                    <form
                      onSubmit={(e) =>
                        submit(e, {
                          action: "quote",
                          id: q._id,
                          version: q.version,
                        })
                      }
                    >
                      <label>
                        Scope
                        <textarea
                          name="scope"
                          required
                          minLength={5}
                          maxLength={3000}
                          defaultValue={q.scope}
                        />
                      </label>
                      <label>
                        Total INR including delivery and tax
                        <input
                          name="amount"
                          type="number"
                          min=".01"
                          step=".01"
                          required
                        />
                      </label>
                      <label>
                        Production days
                        <input
                          type="number"
                          name="leadDays"
                          min={1}
                          max={365}
                          required
                        />
                      </label>
                      <label>
                        Offer expiry
                        <input type="datetime-local" name="expires" required />
                      </label>
                      <button disabled={!!pending}>
                        {pending === q._id ? "Saving…" : "Issue quote"}
                      </button>
                    </form>
                  </details>
                )}
              </section>
            ))}
          {data &&
            tab === "enquiries" &&
            data.enquiries.map((q) => (
              <section key={q._id} className="record">
                <div className="staff-quote-heading">
                  <h3>{q.name}</h3>
                  <span
                    className="status-badge"
                    data-state={q.replyState || "pending"}
                  >
                    {q.replyState ? "Reply " + q.replyState : "Awaiting reply"}
                  </span>
                </div>
                <p>{q.email}</p>
                <p>{q.message}</p>
                {q.reply ? (
                  <p>
                    {q.reply} · {q.replyState}
                  </p>
                ) : (
                  <details>
                    <summary>Reply to enquiry</summary>
                    <form
                      onSubmit={(e) =>
                        submit(e, { action: "reply", id: q._id })
                      }
                    >
                      <label>
                        Email reply
                        <textarea
                          name="reply"
                          minLength={2}
                          maxLength={4000}
                          required
                        />
                      </label>
                      <button disabled={!!pending}>
                        {pending === q._id ? "Saving…" : "Queue reply"}
                      </button>
                    </form>
                  </details>
                )}
              </section>
            ))}
        </>
      )}
    </main>
  );
}
