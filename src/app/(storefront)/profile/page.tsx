import { Suspense } from "react";
import CustomerAccount from "@/components/shop/CustomerAccount";

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <main className="shop-shell">
          <h1>Your account</h1>
          <p role="status">Loading account…</p>
        </main>
      }
    >
      <CustomerAccount />
    </Suspense>
  );
}
