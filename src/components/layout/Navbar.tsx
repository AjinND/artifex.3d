"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ShoppingBag, UserRound, LayoutDashboard } from "lucide-react";
import { useCart } from "@/components/features/cart/CartContext";
import { useAuth } from "@/lib/contexts/AuthContext";
import { navLinks } from "@/data/navigation";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { toggleCart, totalItems } = useCart();
  const path = usePathname();
  const isStaff = user?.role === "admin";

  function navigationLinks() {
    return navLinks.map(({ href, label }) => (
      <Link
        key={href}
        href={href}
        aria-current={
          path === href ||
          (href === "/gallery" && path.startsWith("/products/"))
            ? "page"
            : undefined
        }
        onClick={() => setMenuOpen(false)}
      >
        {label}
      </Link>
    ));
  }

  return (
    <header className="studio-header">
      <nav
        className="studio-nav"
        aria-label="Main navigation"
        onKeyDown={(event) => {
          if (event.key === "Escape" && menuOpen) {
            setMenuOpen(false);
            document.getElementById("studio-menu-toggle")?.focus();
          }
        }}
      >
        <Link
          className="studio-brand"
          href="/"
          onClick={() => setMenuOpen(false)}
        >
          Artifex3D <small>Objects, made personal</small>
        </Link>
        <div className="studio-nav-links">{navigationLinks()}</div>
        <div className="studio-nav-actions">
          <Link
            aria-label={isStaff ? "Studio" : user ? "Account" : "Sign in"}
            href={isStaff ? "/staff" : user ? "/profile" : "/login"}
            className={
              isStaff
                ? "studio-account-link studio-staff-link"
                : "studio-account-link"
            }
            aria-current={
              isStaff && (path === "/staff" || path.startsWith("/staff/"))
                ? "page"
                : undefined
            }
            onClick={() => setMenuOpen(false)}
          >
            {isStaff ? (
              <LayoutDashboard size={18} aria-hidden="true" />
            ) : (
              <UserRound size={18} aria-hidden="true" />
            )}
            <span>{isStaff ? "Studio" : user ? "Account" : "Sign in"}</span>
          </Link>
          <button
            className="studio-icon-button"
            onClick={() => {
              setMenuOpen(false);
              toggleCart();
            }}
            aria-label={`Shopping cart, ${totalItems} items`}
          >
            <ShoppingBag size={20} aria-hidden="true" />
            {totalItems > 0 && <span aria-hidden="true">{totalItems}</span>}
          </button>
          <button
            id="studio-menu-toggle"
            className="studio-icon-button studio-menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-controls="studio-mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? (
              <X size={22} aria-hidden="true" />
            ) : (
              <Menu size={22} aria-hidden="true" />
            )}
          </button>
        </div>
        <div
          id="studio-mobile-menu"
          className="studio-mobile-menu"
          hidden={!menuOpen}
        >
          {navigationLinks()}
          {user ? (
            <button
              onClick={() => {
                setMenuOpen(false);
                void logout();
              }}
            >
              Sign out
            </button>
          ) : (
            <Link href="/signup" onClick={() => setMenuOpen(false)}>
              Create an account
            </Link>
          )}
        </div>
        {user && (
          <button className="studio-sign-out" onClick={() => void logout()}>
            Sign out
          </button>
        )}
      </nav>
    </header>
  );
}
