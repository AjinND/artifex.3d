import Link from "next/link";
export default function Footer() {
  return (
    <footer className="shop-footer">
      <div className="footer-top">
        <div>
          <Link href="/">
            <strong>Artifex3D</strong>
          </Link>
          <p>Considered objects. Made to order.</p>
        </div>
        <nav aria-label="Footer">
          <Link href="/gallery">Shop prints</Link>
          <Link href="/order">Custom quotes</Link>
          <Link href="/about">The studio</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/policies">Policies</Link>
        </nav>
      </div>
      <div className="footer-bottom">
        <span>A small idea. A tangible object.</span>
        {process.env.BUSINESS_EMAIL && (
          <a href={"mailto:" + process.env.BUSINESS_EMAIL}>
            {process.env.BUSINESS_EMAIL}
          </a>
        )}
        <span>Artifex3D · Print-to-order studio</span>
      </div>
    </footer>
  );
}
