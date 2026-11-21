"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function LoginPage({ message }: { message: string }) {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [staffStep, setStaffStep] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const codeRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (staffStep) codeRef.current?.focus();
  }, [staffStep]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
          ...(staffStep ? { otp: form.get("otp") } : {}),
        }),
      });
      const data = await response.json();
      if (response.status === 401 && data.code === "STAFF_MFA_REQUIRED") {
        setStaffStep(true);
        setError(data.error || "");
        if (codeRef.current) {
          codeRef.current.value = "";
          codeRef.current.focus();
        }
        return;
      }
      if (!response.ok) throw new Error(data.error || "Could not sign in.");
      if (passwordRef.current) passwordRef.current.value = "";
      login(data.data.user);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shop-shell account-page">
      <div className="account-layout">
        <section className="account-panel" aria-labelledby="account-title">
          {staffStep && (
            <ShieldCheck className="account-shield" aria-hidden="true" />
          )}
          <p className="eyebrow">Welcome to the studio</p>
          <h1 id="account-title">
            {staffStep ? "Verify staff sign-in" : "Sign in"}
          </h1>
          <p className="account-intro">
            {staffStep
              ? "Enter the six-digit code from your authenticator app."
              : "Access your orders and custom quote requests."}
          </p>
          {!staffStep && message && (
            <p className="account-message" role="status">
              {message}
            </p>
          )}
          <form onSubmit={submit} aria-busy={loading}>
            <div className="account-fields" hidden={staffStep}>
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                maxLength={254}
                required
              />
              <div className="account-password-label">
                <label htmlFor="password">Password</label>
                <Link href="/recovery">Forgot password?</Link>
              </div>
              <div className="account-password">
                <input
                  id="password"
                  ref={passwordRef}
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  maxLength={128}
                  required
                />
                <button
                  type="button"
                  className="account-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff size={19} aria-hidden="true" />
                  ) : (
                    <Eye size={19} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
            {staffStep && (
              <label htmlFor="otp">
                Authenticator code
                <input
                  ref={codeRef}
                  id="otp"
                  name="otp"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                />
              </label>
            )}
            {error && (
              <p className="account-error" role="alert">
                {error}
              </p>
            )}
            <button type="submit" disabled={loading}>
              {loading
                ? "Checking…"
                : staffStep
                  ? "Verify and sign in"
                  : "Sign in"}
              <ArrowRight size={17} aria-hidden="true" />
            </button>
            {staffStep && (
              <button
                type="button"
                className="account-back"
                disabled={loading}
                onClick={() => {
                  if (passwordRef.current) passwordRef.current.value = "";
                  setShowPassword(false);
                  setStaffStep(false);
                  setError("");
                  requestAnimationFrame(() => passwordRef.current?.focus());
                }}
              >
                <ArrowLeft size={17} aria-hidden="true" /> Back to sign-in
              </button>
            )}
          </form>
          {!staffStep && (
            <p className="account-signup">
              New to Artifex3D? <Link href="/signup">Create an account</Link>
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
