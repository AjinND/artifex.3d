"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="shop-shell system-state">
      <p className="eyebrow">A brief interruption</p>
      <h1>Something went wrong.</h1>
      <p>We could not load this page. Please try again.</p>
      <div className="shop-actions">
        <button className="shop-primary" onClick={reset}>
          Try again
        </button>
        <a className="text-link" href="/contact">
          Contact the studio
        </a>
      </div>
    </main>
  );
}
