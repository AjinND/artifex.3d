"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PasswordField from "@/components/ui/PasswordField";
import { z } from "zod";

const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setApiError(null);
    setErrors({});

    const result = signupSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to sign up");
      }

      // Automatically redirect to login after signup
      router.push("/login?message=Account created successfully. Please login.");
    } catch (error) {
      setApiError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="shop-shell account-page">
      <div className="account-layout">
        <section className="account-panel">
          <p className="eyebrow">A place for your ideas</p>
          <h1>Create an account</h1>
          <p className="account-intro">
            Keep your orders, quotes, and projects in one place.
          </p>
          <form onSubmit={handleSubmit} aria-busy={loading}>
            {apiError && <p role="alert">{apiError}</p>}
            <label htmlFor="name">
              Full name
              <input
                id="name"
                name="name"
                required
                autoComplete="name"
                value={formData.name}
                onChange={handleChange}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
              />
            </label>
            {errors.name && (
              <p className="field-error" id="name-error">
                {errors.name}
              </p>
            )}
            <label htmlFor="email">
              Email address
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
            </label>
            {errors.email && (
              <p className="field-error" id="email-error">
                {errors.email}
              </p>
            )}
            <PasswordField
              label="Password"
              name="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              hint="At least 8 characters, one uppercase letter, and one number."
            />
            <PasswordField
              label="Confirm password"
              name="confirmPassword"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
            />
            <button type="submit" disabled={loading}>
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
          <p className="account-signup">
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
