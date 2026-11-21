"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/contexts/AuthContext";
import { request } from "@/lib/shop/client";
type FileState = {
  key: number;
  name: string;
  id?: string;
  state: string;
  error?: string;
};
async function put(url: string, file: File, progress: (n: number) => void) {
  return new Promise<void>((ok, fail) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    xhr.upload.onprogress = (e) =>
      progress(Math.round((100 * e.loaded) / e.total));
    xhr.onerror = () =>
      fail(
        new Error("Connection interrupted. Select the file again to retry."),
      );
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return ok();
      let message = "The server could not accept the attachment.";
      if (xhr.getResponseHeader("Content-Type")?.includes("application/json")) {
        try {
          message = JSON.parse(xhr.responseText).error || message;
        } catch {
          // A gateway can return a malformed error body.
        }
      }
      fail(new Error(message));
    };
    xhr.send(file);
  });
}
export default function QuotePage({ product }: { product: string }) {
  const { user, isLoading } = useAuth(),
    [files, setFiles] = useState<FileState[]>([]),
    [message, set] = useState(""),
    [receipt, saved] = useState(""),
    [busy, wait] = useState(false);
  const fileKey = useRef(0);

  useEffect(() => {
    const pending = files.filter((f) => f.state === "Processing" && f.id);
    if (!pending.length) return;
    const timer = setInterval(async () => {
      for (const f of pending) {
        try {
          const r = await request<{ state: string }>("/api/uploads?id=" + f.id);
          if (["cleared", "rejected"].includes(r.state))
            setFiles((old) =>
              old.map((v) => (v.id === f.id ? { ...v, state: r.state } : v)),
            );
        } catch {
          set("Could not refresh scan status. Retrying.");
        }
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [files]);
  async function upload(input: FileList | null) {
    if (!input) return;
    set("");
    const list = Array.from(input);
    if (
      files.length + list.length > 5 ||
      new Set([...files.map((f) => f.name), ...list.map((f) => f.name)])
        .size !==
        files.length + list.length
    ) {
      set("Choose up to five distinct files.");
      return;
    }
    if (list.some((f) => f.size < 1 || f.size > 50 * 1024 * 1024)) {
      set("Each attachment must be between one byte and 50 MB.");
      return;
    }
    const batch = list.map((file) => ({ file, key: fileKey.current++ }));
    setFiles((old) => [
      ...old,
      ...batch.map(({ file, key }) => ({
        key,
        name: file.name,
        state: "Selected",
      })),
    ]);
    for (const { file: f, key } of batch) {
      const update = (state: string, id?: string, error?: string) =>
        setFiles((old) =>
          old.map((v) => (v.key === key ? { ...v, state, id, error } : v)),
        );
      try {
        const r = await request<{ id: string; url: string }>("/api/uploads", {
          name: f.name,
          bytes: f.size,
        });
        await put(r.url, f, (n) =>
          update(n === 100 ? "Checking file" : "Uploading " + n + "%", r.id),
        );
        const result = await request<{ state?: string }>(
          "/api/uploads",
          { id: r.id },
          "PATCH",
        );
        const state =
          result.state === "cleared" || result.state === "rejected"
            ? result.state
            : "Processing";
        update(state, r.id);
      } catch (e) {
        update("Failed", undefined, (e as Error).message);
      }
    }
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    wait(true);
    try {
      const f = Object.fromEntries(new FormData(e.currentTarget));
      const r = await request<{ id: string }>("/api/quotes", {
        ...f,
        product,
        quantity: Number(f.quantity),
        attachments: files.map((v) => v.id),
      });
      saved(r.id);
    } catch (e) {
      set((e as Error).message);
    } finally {
      wait(false);
    }
  }
  return (
    <main className="shop-shell">
      <div className="editorial-intro">
        <p className="eyebrow">The custom studio</p>
        <h1>Request a custom quote</h1>
        <p>Start with an idea. We will help you find its form.</p>
      </div>
      <div className="quote-layout">
        <section>
          {receipt ? (
            <section className="empty-state" role="status">
              <p className="eyebrow">Your next chapter</p>
              <h2>Brief received</h2>
              <p>Reference {receipt}</p>
              <p>
                The studio will review your project. Follow your request in your
                account.
              </p>
              <Link className="shop-primary" href="/profile?tab=quotes">
                Track your quote
              </Link>
            </section>
          ) : isLoading ? (
            <p role="status">Loading your account…</p>
          ) : !user ? (
            <section className="empty-state">
              <h2>Let us get to know you.</h2>
              <p>
                Sign in to send your brief and keep your files and quote
                together.
              </p>
              <Link
                className="shop-primary"
                href={
                  "/login?next=" +
                  encodeURIComponent(
                    "/order" + (product ? "?product=" + product : ""),
                  )
                }
              >
                Sign in to submit a brief
              </Link>
            </section>
          ) : (
            <form onSubmit={submit} aria-busy={busy}>
              {product && (
                <p className="notice">
                  Variation of{" "}
                  <Link className="text-link" href={"/products/" + product}>
                    {product}
                  </Link>
                </p>
              )}
              <fieldset>
                <legend>
                  <span className="section-number">01</span>Your idea
                </legend>
                <label>
                  Project name
                  <input
                    required
                    name="title"
                    maxLength={120}
                    minLength={2}
                    placeholder="Give your project a name"
                  />
                </label>
                <label>
                  Design brief, dimensions, material and finish
                  <textarea
                    required
                    name="brief"
                    minLength={10}
                    maxLength={6000}
                    placeholder="What would you like to make? Include the size, intended use, and any details that matter to you."
                  />
                </label>
              </fieldset>
              <fieldset>
                <legend>
                  <span className="section-number">02</span>The details
                </legend>
                <label>
                  Quantity
                  <input
                    required
                    name="quantity"
                    type="number"
                    min={1}
                    max={100}
                    defaultValue={1}
                  />
                </label>
              </fieldset>
              <fieldset>
                <legend>
                  <span className="section-number">03</span>Your references
                </legend>
                <p className="muted" id="upload-help">
                  Add reference photos or STL files. Up to five distinct files,
                  50 MB each. Files must finish checking before you submit.
                </p>
                <label>
                  Reference photos or STL files (up to five, 50 MB each)
                  <input
                    type="file"
                    multiple
                    accept=".png,.jpg,.jpeg,.stl"
                    aria-describedby="upload-help"
                    onChange={(e) => {
                      void upload(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
                {files.map((f) => (
                  <div className="upload-row" key={f.key}>
                    <div>
                      <strong>{f.name}</strong>
                      <p role="status">
                        {f.state === "cleared"
                          ? "Ready"
                          : f.state === "rejected"
                            ? "File rejected. Remove it and choose another file."
                            : f.state}
                      </p>
                      {f.state.startsWith("Uploading ") && (
                        <progress
                          max={100}
                          value={Number(f.state.match(/\d+/)?.[0] || 0)}
                          aria-label={"Upload progress for " + f.name}
                        />
                      )}
                      {f.error && <p role="alert">{f.error}</p>}
                    </div>
                    <button
                      className="shop-secondary"
                      type="button"
                      onClick={() =>
                        setFiles((old) => old.filter((v) => v.key !== f.key))
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {files.some(
                  (file) =>
                    file.state === "Failed" || file.state === "rejected",
                ) && (
                  <p className="muted">
                    Remove the failed attachment before trying it again. You can
                    also submit the quote without files.
                  </p>
                )}
              </fieldset>
              <button
                className="shop-primary"
                disabled={busy || files.some((v) => v.state !== "cleared")}
              >
                {busy ? "Sending your brief…" : "Submit quote request"}
              </button>
            </form>
          )}
          <p role="status">{message}</p>
        </section>
        <aside className="quote-aside">
          <p className="eyebrow">A considered process</p>
          <h2>From brief to object.</h2>
          <p>Share your idea, even if you are still working out the details.</p>
          <hr />
          <p>
            <strong>01 / Studio review</strong>
            <br />
            We review your design, dimensions, and finish.
          </p>
          <p>
            <strong>02 / Your proposal</strong>
            <br />
            Review the scope, price, and production time before payment.
          </p>
          <p>
            <strong>03 / Made to order</strong>
            <br />
            Track progress through your account.
          </p>
          <Link className="text-link" href="/contact">
            A question before you start?
          </Link>
        </aside>
      </div>
    </main>
  );
}
