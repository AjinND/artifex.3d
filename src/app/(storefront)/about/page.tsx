import Link from "next/link";
export default function About() {
  return (
    <main className="shop-shell">
      <header className="editorial-intro">
        <p className="eyebrow">The studio / Artifex3D</p>
        <h1>
          Ideas deserve
          <br />a place in the world.
        </h1>
        <p>
          Artifex3D is a print-to-order studio. We turn designs into tangible
          objects, one considered detail at a time.
        </p>
      </header>
      <section className="studio-note">
        <h2>
          From a collection.
          <br />
          Or your imagination.
        </h2>
        <div>
          <p>
            Explore the collection to see the material, dimensions, finish, and
            production time for each print. Choose a design that speaks to you,
            and we will make it to order.
          </p>
          <p>
            For custom work, send us a brief. The studio will review your design
            and provide a price and lead time before payment.
          </p>
        </div>
      </section>
      <section className="studio-process">
        <p className="eyebrow">Clarity at every step</p>
        <h2>The details make the difference.</h2>
        <div className="studio-steps">
          <article>
            <span className="section-number">01</span>
            <h3>Form & dimensions</h3>
            <p>
              Know the size of your object and explore available photos and 3D
              previews.
            </p>
          </article>
          <article>
            <span className="section-number">02</span>
            <h3>Material & finish</h3>
            <p>
              Each listing describes what the print is made from and how it is
              finished.
            </p>
          </article>
          <article>
            <span className="section-number">03</span>
            <h3>Production & progress</h3>
            <p>
              Review production time before ordering. Follow progress through
              your account.
            </p>
          </article>
        </div>
      </section>
      <div className="shop-actions">
        <Link className="shop-primary" href="/gallery">
          Explore the collection →
        </Link>
        <Link className="text-link" href="/order">
          Request a custom quote
        </Link>
      </div>
    </main>
  );
}
