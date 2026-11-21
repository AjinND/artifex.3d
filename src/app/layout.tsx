import type { Metadata } from "next";
import { Newsreader, DM_Sans } from "next/font/google";
import "./globals.css";
import "./shop.css";
import { CartProvider } from "@/components/features/cart/CartContext";
import { NotificationProvider } from "@/components/shared/NotificationContext";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import Cart from "@/components/features/cart/Cart";
import NotificationContainer from "@/components/shared/Notification";

import ScrollToTop from "@/components/layout/ScrollToTop";
import SkipToMain from "@/components/layout/SkipToMain";

import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

const display = Newsreader({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Artifex3D — Bespoke 3D Printed Creations",
  description:
    "Transform your imagination into tangible art. Custom 3D printing services for figurines, architecture, jewelry, and more.",
  keywords: [
    "3D printing",
    "custom figurines",
    "3D models",
    "bespoke creations",
    "resin printing",
  ],
  authors: [{ name: "Artifex3D" }],
  openGraph: {
    title: "Artifex3D — Bespoke 3D Printed Creations",
    description:
      "Transform your imagination into tangible art. Custom 3D printing services.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-screen antialiased">
        <ErrorBoundary>
          <SkipToMain />
          <NotificationProvider>
            <AuthProvider>
              <CartProvider>
                <Cart />
                <div id="main-content" tabIndex={-1}>
                  {children}
                </div>
                <ScrollToTop />
                <NotificationContainer />
              </CartProvider>
            </AuthProvider>
          </NotificationProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
