"use client";
import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import PasswordField from "@/components/ui/PasswordField";
import { request } from "@/lib/shop/client";
const subscribe = (fn: () => void) => {
  window.addEventListener("hashchange", fn);
  return () => window.removeEventListener("hashchange", fn);
};
export default function Recovery() {
  const link = useSyncExternalStore(
    subscribe,
    () => location.hash.slice(1),
    () => "",
  );
  const [msg, set] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    try {
      if (link) {
        const [id, token] = link.split(".");
        await request("/api/auth/recovery", { ...f, id, token }, "PATCH");
        location.replace("/login?message=Password%20updated");
      } else {
        await request("/api/auth/recovery", f);
        set("If the account exists, a recovery email will arrive.");
      }
    } catch (e) {
      set((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="shop-shell account-page">
      <div className="account-layout">
        <section className="account-panel">
          <p className="eyebrow">A fresh start</p>
          <h1>Account recovery</h1>
          <p className="account-intro">
            {link
              ? "Choose a new password for your account."
              : "Enter your email and we will send you a recovery link."}
          </p>
          <form onSubmit={submit} aria-busy={busy}>
            {link ? (
              <PasswordField
                label="New password"
                name="password"
                minLength={8}
                autoComplete="new-password"
              />
            ) : (
              <label>
                Email
                <input
                  type="email"
                  required
                  name="email"
                  autoComplete="email"
                />
              </label>
            )}
            <button disabled={busy}>
              {busy
                ? "Please wait…"
                : link
                  ? "Reset password"
                  : "Send recovery link"}
            </button>
          </form>
          <p role="status">{msg}</p>
          <p className="account-signup">
            <Link href="/login">Back to sign in</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
