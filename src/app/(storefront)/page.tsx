import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { catalog } from "@/lib/server/catalog";
import PrintCard from "@/components/shop/PrintCard";
import ProductImage from "@/components/shop/ProductImage";
export const dynamic = "force-dynamic";
export default async function Home() {
  const prints = await catalog().catch(() => []);
  const featured = prints.filter((print) => print.featured);
  const selection = (featured.length ? featured : prints).slice(0, 6);
  const hero = selection[0];
  return (
    <main className="shop-shell">
      <section className="shop-hero">
        <div>
          <p className="eyebrow">Artifex3D / The print studio</p>
          <h1>
            A little idea.
            <br />A <em>tangible</em> thing.
          </h1>
          <p>
            Thoughtful 3D prints, made to order. Find an object that feels like
            you, or bring an idea of your own.
          </p>
          <div className="shop-actions">
            <Link className="shop-primary" href="/gallery">
              Shop prints <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link className="text-link" href="/order">
              Request a custom quote
            </Link>
          </div>
        </div>
        {hero ? (
          <Link className="hero-print" href={"/products/" + hero.slug}>
            <ProductImage
              src={hero.photos[0].url}
              alt={hero.photos[0].alt}
              width={900}
              height={900}
              sizes="(max-width: 800px) 90vw, 560px"
              preload
            />
            <span>
              {hero.name}
              <ArrowUpRight size={18} aria-hidden="true" />
            </span>
          </Link>
        ) : (
          <div className="hero-empty">
            <span className="eyebrow">From possibility to something real</span>
            <span className="display-title">Made for your everyday.</span>
            <span className="atelier-mark" aria-hidden="true">
              a.
            </span>
          </div>
        )}
      </section>
      <section className="home-collection">
        <div className="section-heading">
          <div>
            <p className="eyebrow">The collection</p>
            <h2>Objects with a point of view.</h2>
          </div>
          <Link href="/gallery" className="text-link">
            Explore all prints <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
        {selection.length ? (
          <div className="print-grid">
            {selection.map((item) => (
              <PrintCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <p className="muted">
            Our next collection is taking shape. In the meantime, the studio is
            open for custom requests.
          </p>
        )}
      </section>
      <section className="studio-process" aria-labelledby="process-title">
        <p className="eyebrow">Something uniquely yours</p>
        <h2 id="process-title">Your idea, in three dimensions.</h2>
        <div className="studio-steps">
          <article>
            <span className="section-number">01 / SHARE</span>
            <h3>Send your design</h3>
            <p>
              Upload an STL or reference photos. Tell us the size, material,
              finish, and quantity you have in mind.
            </p>
          </article>
          <article>
            <span className="section-number">02 / REFINE</span>
            <h3>Review your quote</h3>
            <p>
              Review the proposed scope, cost, and production time before you
              pay.
            </p>
          </article>
          <article>
            <span className="section-number">03 / MAKE</span>
            <h3>Follow it into form</h3>
            <p>
              Track your order from production to dispatch, all from your
              account.
            </p>
          </article>
        </div>
        <Link className="text-link" href="/order">
          Tell us about your project <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </section>
      <section className="studio-note">
        <div>
          <p className="eyebrow">Behind the objects</p>
          <h2>A print studio for personal ideas.</h2>
        </div>
        <div>
          <p>
            From the collection to a custom brief, every order starts with the
            details: form, material, finish, and how it will be made.
          </p>
          <Link className="text-link" href="/about">
            Get to know the studio <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
