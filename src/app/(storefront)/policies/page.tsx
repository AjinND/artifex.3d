export const dynamic = "force-dynamic";
export default function Policies() {
  const entries = [
    ["shipping", "Shipping", process.env.SHIPPING_POLICY],
    ["refunds", "Cancellations and refunds", process.env.REFUND_POLICY],
    ["privacy", "Privacy and submitted designs", process.env.PRIVACY_POLICY],
  ].filter(([, , text]) => text);
  return (
    <main className="shop-shell">
      <header className="editorial-intro">
        <p className="eyebrow">The practical details</p>
        <h1>Studio policies</h1>
        <p>Information to help you order with clarity.</p>
      </header>
      {entries.length ? (
        <div className="policy-layout">
          <nav className="policy-nav" aria-label="Policy sections">
            {entries.map(([id, label]) => (
              <a key={id} href={"#" + id}>
                {label}
              </a>
            ))}
          </nav>
          <div className="reading-body">
            {entries.map(([id, label, text]) => (
              <section id={id} key={id}>
                <h2>{label}</h2>
                <p className="whitespace-pre-line">{text}</p>
              </section>
            ))}
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <p>Contact the studio for policy information.</p>
          <a className="text-link" href="/contact">
            Contact the studio →
          </a>
        </div>
      )}
    </main>
  );
}
