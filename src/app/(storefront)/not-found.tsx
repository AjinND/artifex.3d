import Link from "next/link";
export default function NotFound() {
  return (
    <main className="shop-shell system-state">
      <p className="eyebrow">404 / A little off course</p>
      <h1>
        This page has
        <br />
        yet to take shape.
      </h1>
      <p className="muted">
        The page or print you are looking for could not be found.
      </p>
      <div className="shop-actions">
        <Link className="shop-primary" href="/gallery">
          Explore the collection
        </Link>
        <Link className="text-link" href="/">
          Back to the studio
        </Link>
      </div>
    </main>
  );
}
