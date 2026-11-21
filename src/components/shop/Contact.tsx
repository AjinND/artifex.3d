"use client";
import { useState } from "react";
import { request } from "@/lib/shop/client";
export default function Contact({ email }: { email?: string }) {
  const [status, set] = useState(""),
    [busy, wait] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    wait(true);
    try {
      await request(
        "/api/enquiries",
        Object.fromEntries(new FormData(form)),
      );
      set("Message sent.");
      form.reset();
    } catch (e) {
      set((e as Error).message);
    } finally {
      wait(false);
    }
  }
  return (
    <main className="shop-shell">
      <header className="editorial-intro">
        <p className="eyebrow">A conversation starts here</p>
        <h1>Contact the studio</h1>
        <p>
          A question about a print, a material, or an idea? We would like to
          hear it.
        </p>
      </header>
      <div className="contact-layout">
        <section>
          <form onSubmit={submit}>
            <label>
              Your name
              <input required name="name" maxLength={100} autoComplete="name" />
            </label>
            <label>
              Email
              <input
                type="email"
                required
                name="email"
                maxLength={254}
                autoComplete="email"
              />
            </label>
            <label>
              Message
              <textarea
                required
                name="message"
                minLength={10}
                maxLength={4000}
              />
            </label>
            <button className="shop-primary" disabled={busy}>
              {busy ? "Sending enquiry…" : "Send enquiry"}
            </button>
          </form>
          <p role="status">{status}</p>
        </section>
        <aside className="quote-aside">
          <p className="eyebrow">Keep in touch</p>
          <h2>Good things start with a question.</h2>
          <p>
            For a custom printing quote, use the project brief so you can
            include your files and track the request.
          </p>
          <a className="text-link" href="/order">
            Request a custom quote →
          </a>
          {email && (
            <p>
              <a className="text-link" href={"mailto:" + email}>
                {email}
              </a>
            </p>
          )}
        </aside>
      </div>
    </main>
  );
}
