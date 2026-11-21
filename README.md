# Artifex3D

Artifex3D is a storefront and staff workspace for a made-to-order 3D printing studio. Customers can shop the print collection or submit a custom design for a quote, then follow their order through production and dispatch.

## What you can do

| Route                          | Workflow                                                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `/gallery`, `/products/[slug]` | Browse and filter the collection, see photos and print specifications, and rotate a 3D model where a GLB preview is available. |
| `/order`                       | Submit a custom print brief with optional private STL, JPEG, or PNG attachments.                                               |
| `/checkout`                    | Pay in INR through Razorpay for catalog prints or an accepted quote.                                                           |
| `/profile`                     | Review quotes, resume pending payments, and track orders and dispatch.                                                         |
| `/contact`                     | Send an enquiry to the studio.                                                                                                 |
| `/staff`                       | Publish listings, issue quotes, update fulfillment, and reply to enquiries. Staff sign-in requires an authenticator code.      |

## Local setup

Use Node.js 22 with npm and a reachable MongoDB replica set. The replica set supports the transactions used in order and quote flows.

1. From the repository root, install dependencies and create your local environment file.

   ```sh
   npm ci
   cp .env.example .env.local
   ```

   In PowerShell, the copy command is `Copy-Item .env.example .env.local`.

2. Set `MONGODB_URI` to your replica set connection string in `.env.local`. For a local replica set named `rs0`, use `mongodb://127.0.0.1:27017/artifex3d_dev?replicaSet=rs0`. Keep `APP_ORIGIN=http://localhost:3000` for the default development port. If you change the host or port, update `APP_ORIGIN` to match the exact browser origin.

3. Run `npm run dev`, then open [localhost:3000](http://localhost:3000). A new database has an empty catalog until staff publish a listing.

### Open the staff workspace

1. In `.env.local`, set `STAFF_EMAIL` to the operator's email and `STAFF_TOTP_SECRET` to a private base32 secret enrolled in the operator's authenticator app. Restart the development server after changing the settings.
2. Create an account with that email at `/signup`, then run `npm run accounts -- --provision-staff` against the same database. The command reads `.env.local` directly.
3. Sign in with the account password and authenticator code, then open `/staff` to create, preview, and publish a listing.

### Configure integrations

| Feature                   | Configuration                                                                                                                                                                                                               |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Checkout                  | Use Razorpay test keys for development. Set `SERVICEABLE_PINS` to the delivery PIN codes. Catalog checkout also uses `TAX_BASIS_POINTS` and `SHIPPING_PAISE`. Configure `RAZORPAY_WEBHOOK_SECRET` for webhook verification. |
| Catalog media             | Serve approved files from `public/catalog` or `CATALOG_MEDIA_DIR`. For staff uploads, configure Amazon S3 or the loopback-only `LOCAL_CATALOG_MEDIA_DIR` option.                                                            |
| Private quote attachments | Use a separate, versioned S3 bucket and the scanning worker. Local disk attachments require a loopback setup on Windows and Microsoft Defender.                                                                             |
| Email and recovery        | Set `SMTP_URL`, `MAIL_FROM`, `STUDIO_INBOX`, and `APP_ORIGIN` for worker mail. Set `RECOVERY_SECRET` for password recovery.                                                                                                 |

See the [environment template](.env.example) and [operations guide](LAUNCH.md) for the full settings, localhost storage setup, and production requirements.

## Development commands

| Command             | What it does                                                                                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`       | Start the Next.js development server.                                                                                               |
| `npm run lint`      | Run ESLint on `src/` and `scripts/`.                                                                                                |
| `npm run typecheck` | Check TypeScript after `npx next typegen` or a build has generated the route types.                                                 |
| `npm run build`     | Compile the production app with Webpack.                                                                                            |
| `npm start`         | Serve the production build.                                                                                                         |
| `npm test`          | Run the Playwright storefront and payment contract suite against an isolated MongoDB replica set and a simulated Razorpay provider. |
| `npm run worker`    | Process bounded batches of upload scans, email, and cleanup jobs.                                                                   |
| `npm run accounts`  | List privileged accounts and accounts that require password resets.                                                                 |

To run the browser suite, obtain the private `studio-assets/balancing-form/review/balancing-form.png` fixture separately. Git ignores studio assets. Run `npm run build` and `npx playwright install chromium` before `npm test`. You can set `CHROME_PATH` to use an installed Chrome executable.

## Project structure

The app uses Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, and MongoDB through Mongoose. The storefront uses `@google/model-viewer` for interactive GLB previews.

```text
src/
  app/(storefront)/  Customer-facing pages
  app/staff/         Staff workspace
  app/api/           Next.js route handlers
  app/catalog/       Catalog media delivery
  components/shop/   Storefront and staff UI
  lib/server/        Sessions, payments, storage, and other server integrations
  lib/db/            MongoDB connection and Mongoose models
scripts/             Browser tests, background worker, and maintenance scripts
```

## Deployment

Run `npm run build` and `npm start` on a Node.js host. Set `APP_ORIGIN` to the exact public HTTPS origin and inject production settings through the host environment or secret manager. When using cloud attachments or email, schedule `npm run worker` every minute. Follow the [operations guide](LAUNCH.md) for storage, scanning, Razorpay webhooks, and release checks. The [design guide](DESIGN.md) describes the storefront and staff interface conventions.
