import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/server/session";
import { HttpError } from "@/lib/server/http";
import SampleViewer from "@/components/shop/SampleViewer";
import styles from "@/components/shop/studio.module.css";
export const dynamic = "force-dynamic";
export default async function Sample() {
  try {
    await currentUser(true);
  } catch (e) {
    if (e instanceof HttpError) redirect("/login");
    throw e;
  }
  return (
    <main className="shop-shell">
      <header className={styles.sampleHeader}>
        <Link className="text-link" href="/staff">
          ← Back to studio
        </Link>
        <h1>Balancing Form</h1>
        <p className="muted">
          Private model review · Colour and scale are for display.
        </p>
      </header>
      <SampleViewer />
    </main>
  );
}
