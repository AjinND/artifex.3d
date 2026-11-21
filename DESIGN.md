# Artifex3D — Quiet Atelier

## Foundation

Ivory #FAF8F4, white surfaces, charcoal #282C29, muted text #626960, deep sage actions #354B40. Accent surfaces: sage #E4EBE2, blush #F2E5DF, powder blue #E5EDF2. Keep accent color to one family per section. Input boundaries use #8B9489; separators use #DCDED6.

Newsreader is the editorial display face; DM Sans is the interface/body face. Both are loaded by next/font in the root layout. Staff headings use DM Sans. Prices and quantities use tabular numerals.

## Layout and components

Public content: 1240px plus up to 48px gutters. Studio: 1440px plus gutters. Reading content: 680px. Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96px. Controls: 8px radius, at least 44px target. Panels: 12px radius. Status badges alone use pills. Neutral surfaces, thin boundaries, minimal shadow. No decorative gradients, blobs, glass effects, or animated card transforms.

Use shared Button, PasswordField, Tabs, ConfirmationDialog, ProductImage, PrintCard and OrderSummary components. Native dialogs provide focus containment and Escape handling; labels and live regions accompany status changes. Honor reduced motion. Transition colors over 180ms. Image failure gets a neutral text fallback.

## Layout ownership

Root layout owns fonts and auth/cart/notification providers. The storefront route group owns public navigation and footer. The staff layout owns the compact workspace header. Routes and server contracts remain unchanged. ProductDetail uses a div in embedded listing previews and main for standalone product pages.

## Responsive behavior

Storefront grid: three columns above 800px, two from 480px, one below 480px. Two-column workflows stack at 800px. Filters use a modal below 801px. Cart uses a full-height right drawer, filling mobile width. Staff queues remain usable without horizontal scrolling.

## Content

Use actual catalog photographs and optional model previews. Empty catalogs use typography. Do not fabricate studio claims, reviews, product availability or guarantees. Preserve server-confirmed totals, quote versions, file scan states, payment resumption and fulfillment rules.
