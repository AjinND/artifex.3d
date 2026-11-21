import { sampleGLB } from "./test-model.mjs";
import { publicPages, customerPages } from "./test-atelier.mjs";
import { commerce } from "./test-commerce.mjs";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import { chromium, expect } from "@playwright/test";

const rs = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
const uri = rs.getUri("artifex_test");
const listener = createServer().listen(0, "127.0.0.1");
await once(listener, "listening");
const port = listener.address().port;
await new Promise((ok) => listener.close(ok));
const base = "http://localhost:" + port;
const screenshots = await mkdtemp(join(tmpdir(), "artifex-ui-"));
const media = await mkdtemp(join(tmpdir(), "artifex-test-media-"));
const uploadScanner = process.env.TEST_LOCAL_UPLOAD_SCANNER;
const uploadDirectory = uploadScanner
  ? await mkdtemp(join(tmpdir(), "artifex-test-attachments-"))
  : "";
const fixturePhoto = await readFile(
  "studio-assets/balancing-form/review/balancing-form.png",
);
await Promise.all(
  ["fixture.png", "atelier-fixture.png"].map((name) =>
    writeFile(join(media, name), fixturePhoto),
  ),
);
const app = spawn(
  process.execPath,
  [
    "--require",
    "./scripts/test-payment-provider.cjs",
    "node_modules/next/dist/bin/next",
    "start",
    "-p",
    String(port),
  ],
  {
    env: {
      ...process.env,
      APP_ORIGIN: base,
      MONGODB_URI: uri,
      NODE_ENV: "production",
      NEXT_TELEMETRY_DISABLED: "1",
      ARTIFEX_TEST_PROVIDER: "isolated",
      RAZORPAY_KEY_ID: "fixture_key",
      RAZORPAY_KEY_SECRET: "fixture_secret",
      RAZORPAY_WEBHOOK_SECRET: "fixture_webhook",
      SERVICEABLE_PINS: "560001",
      TAX_BASIS_POINTS: "1000",
      SHIPPING_PAISE: "5000",
      STAFF_EMAIL: "staff@example.invalid",
      STAFF_TOTP_SECRET: "JBSWY3DPEHPK3PXP",
      PRIVATE_UPLOAD_BUCKET: "",
      CATALOG_MEDIA_BUCKET: "",
      CATALOG_MEDIA_DIR: media,
      LOCAL_CATALOG_MEDIA_DIR: join(media, "uploaded"),
      LOCAL_UPLOAD_DIR: uploadDirectory,
      LOCAL_UPLOAD_SCANNER: uploadScanner || "",
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  },
);

console.log("Walkthrough images", screenshots);
let browser;
try {
  let ready = false;
  for (let i = 0; i < 80; i++) {
    try {
      if ((await fetch(base + "/about")).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  assert.ok(ready, "Server started");
  await mongoose.connect(uri);
  const products = mongoose.connection.collection("products");
  const item = {
    name: "Fixture print",
    slug: "fixture-print",
    category: "Studio",
    description: "Isolated test fixture",
    material: "PLA",
    finish: "Matte",
    dimensions: [60, 35, 40],
    pricePaise: 49000,
    leadDays: 4,
    photos: [
      { url: "/catalog/atelier-fixture.png", alt: "Test print front view" },
    ],
    preview: "/catalog/fixture.glb",
    status: "published",
    featured: true,
    publishedAt: new Date(),
  };
  const { insertedId } = await products.insertOne(item);
  const chrome =
    process.env.CHROME_PATH ||
    "C:/Program Files/Google/Chrome/Application/chrome.exe";
  browser = await chromium.launch({
    ...(existsSync(chrome) ? { executablePath: chrome } : {}),
    headless: true,
    args: ["--enable-unsafe-swiftshader"],
  });
  for (const width of [390, 768, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const modelRequests = [];
    page.on("request", (r) => {
      if (r.url().endsWith(".glb")) modelRequests.push(r.url());
    });
    await page.route("**/catalog/atelier-fixture.png", (route) =>
      route.fulfill({
        contentType: "image/png",
        body: fixturePhoto,
      }),
    );
    await page.goto(base);
    await expect(
      page.getByRole("link", { name: "Shop prints", exact: true }).first(),
    ).toBeVisible();
    await page.goto(base + "/login");
    await expect(
      page.getByRole("heading", { name: "Sign in", exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel("Authenticator code")).toHaveCount(0);
    await page.getByRole("button", { name: "Show password" }).click();
    await expect(page.locator("#password")).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Hide password" }).click();
    await expect(page.locator("#password")).toHaveAttribute("type", "password");
    await page.screenshot({
      path: join(screenshots, "login-" + width + ".png"),
    });
    await page.goto(base + "/gallery");
    await page.waitForFunction(() =>
      Array.from(document.querySelectorAll(".print-card img")).some(
        (img) => img.naturalWidth > 0,
      ),
    );
    if (width <= 800)
      await page.getByRole("button", { name: "Filters", exact: true }).click();
    await page
      .getByRole("combobox", { name: /^Longest side/ })
      .filter({ visible: true })
      .selectOption("50–99 mm");
    if (width <= 800)
      await page.getByRole("button", { name: "Show 1 prints" }).click();
    await expect(
      page.getByRole("heading", { name: "Fixture print" }),
    ).toBeVisible();
    assert.equal(modelRequests.length, 0);
    await page
      .locator(".print-grid")
      .getByRole("link", { name: /Test print front view/ })
      .filter({ visible: true })
      .click();
    await expect(page).toHaveURL(base + "/products/fixture-print");
    await expect(
      page.getByRole("heading", { name: "Fixture print", level: 1 }),
    ).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/\/gallery\?size=/);
    if (width <= 800)
      await page.getByRole("button", { name: "Filters", exact: true }).click();
    await expect(
      page
        .getByRole("combobox", { name: /^Longest side/ })
        .filter({ visible: true }),
    ).toHaveValue("50–99 mm");
    if (width <= 800) await page.keyboard.press("Escape");
    await page
      .getByRole("link", { name: /Test print front view/ })
      .filter({ visible: true })
      .click();
    await page
      .getByRole("button", { name: "Enlarge Test print front view" })
      .click();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "View in 3D" }).click();
    await expect(page.getByText("3D view unavailable.")).toBeVisible({
      timeout: 30000,
    });
    await page.route("**/catalog/fixture.glb*", (r) =>
      r.fulfill({ contentType: "model/gltf-binary", body: sampleGLB() }),
    );
    await page.getByRole("button", { name: "View in 3D" }).click();
    await page.waitForFunction(
      () =>
        Array.from(document.querySelectorAll("model-viewer")).some(
          (v) => v.loaded,
        ),
      {},
      { timeout: 30000 },
    );
    await page.screenshot({
      path: join(screenshots, "product-" + width + ".png"),
    });
    await page.getByRole("button", { name: "Reset view" }).click();
    await page.getByRole("button", { name: "Back to photos" }).click();
    await page.getByRole("button", { name: "Add to cart" }).click();
    await expect(page.getByRole("dialog", { name: "Your cart" })).toBeVisible();
    if (width === 390) {
      const drawer = page.getByRole("dialog", { name: "Your cart" });
      await drawer.getByRole("spinbutton", { name: "Quantity" }).fill("2");
      await expect(
        drawer.getByRole("spinbutton", { name: "Quantity" }),
      ).toHaveValue("2");
      await page.evaluate((id) => {
        localStorage.setItem(
          "artifex3d_cart",
          JSON.stringify([{ id, quantity: 2, pricePaise: 100 }]),
        );
      }, String(insertedId));
      await page.reload();
      await page
        .getByRole("button", { name: /Shopping cart, 2 items/ })
        .click();
      await expect(drawer.getByRole("alert")).toContainText(
        "Availability or pricing changed",
      );
      await drawer.getByRole("button", { name: "Acknowledge changes" }).click();
      await expect(drawer.getByRole("alert")).toHaveCount(0);
    }

    await page.getByRole("link", { name: "Checkout", exact: true }).click();
    await expect(page.getByText("Sign in to check out")).toBeVisible();
    await page.screenshot({
      path: join(screenshots, "checkout-" + width + ".png"),
    });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "No horizontal overflow",
    );
    await publicPages({ page, base, screenshots, width });
    await context.close();
    console.log("Storefront passed at width", width);
  }
  const ctx = await browser.newContext();
  const api = ctx.request;
  const send = (path, data, method = "POST") =>
    api.fetch(base + path, { method, data, headers: { Origin: base } });
  const account = {
    name: "Test customer",
    email: "test@example.invalid",
    password: "TestAccount17",
  };
  assert.equal(
    (await send("/api/auth/signup", { ...account, role: "admin" })).status(),
    400,
  );
  assert.ok((await send("/api/auth/signup", account)).ok());
  const login = await send("/api/auth/login", {
    email: account.email,
    password: account.password,
  });
  assert.ok(login.ok());
  assert.ok(login.headers()["set-cookie"].includes("HttpOnly"));
  const user = (await login.json()).data.user;
  assert.equal(user.role, "user");
  const loopback = `http://127.0.0.1:${port}`;
  const localBrowser = await browser.newContext();
  try {
    const page = await localBrowser.newPage();
    await page.goto(loopback + "/login");
    await page.getByLabel("Email address").fill(account.email);
    await page.getByLabel("Password", { exact: true }).fill(account.password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(loopback + "/profile");
    await expect(page.getByRole("tab", { name: "Orders" })).toBeVisible();
    assert.equal(
      (
        await localBrowser.request.post(loopback + "/api/auth/logout", {
          headers: { Origin: base },
        })
      ).status(),
      403,
    );
    assert.ok((await localBrowser.request.get(loopback + "/api/auth/me")).ok());
  } finally {
    await localBrowser.close();
  }
  assert.equal((await api.get(base + "/api/staff")).status(), 403);
  assert.equal((await api.get(base + "/api/staff/sample")).status(), 403);
  const customerPage = await ctx.newPage();
  try {
    await customerPage.goto(base + "/staff");
    await expect(customerPage).toHaveURL(base + "/profile");
    await expect(
      customerPage.getByRole("link", { name: "Studio", exact: true }),
    ).toHaveCount(0);
  } finally {
    await customerPage.close();
  }
  assert.equal(
    (await send("/api/uploads", { name: "invalid.txt", bytes: 4 })).status(),
    400,
  );
  const uploads = mongoose.connection.collection("privateuploads");
  if (uploadScanner) {
    const quotePage = await ctx.newPage();
    const sample =
      "studio-assets/balancing-form/source/Meshy_AI_Balancing_Form_20261110_generate.stl";
    try {
      await quotePage.goto(base + "/order");
      const fileInput = quotePage.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: "invalid.stl",
        mimeType: "application/octet-stream",
        buffer: Buffer.from("not an STL"),
      });
      await expect(
        quotePage.getByText("The file contents do not match its extension.", {
          exact: false,
        }),
      ).toBeVisible();
      await quotePage.getByRole("button", { name: "Remove" }).click();
      await fileInput.setInputFiles(sample);
      await expect(
        quotePage
          .locator(".upload-row")
          .filter({ hasText: "Meshy_AI_Balancing_Form" })
          .getByText("Ready", { exact: true }),
      ).toBeVisible({ timeout: 30000 });
      const row = await uploads.findOne({ storage: "local", state: "cleared" });
      assert.ok(row);
      const attachment = await api.get(
        base + "/api/uploads?id=" + row._id + "&file=1",
      );
      assert.ok(attachment.ok());
      assert.match(attachment.headers()["content-disposition"], /^attachment;/);
      assert.deepEqual(await attachment.body(), await readFile(sample));
      const guest = await browser.newContext();
      try {
        assert.equal(
          (
            await guest.request.get(
              base + "/api/uploads?id=" + row._id + "&file=1",
            )
          ).status(),
          401,
        );
      } finally {
        await guest.close();
      }
      await quotePage.getByLabel("Project name").fill("Upload rehearsal");
      await quotePage
        .getByLabel("Design brief", { exact: false })
        .fill("Print one test model in matte PLA.");
      await quotePage
        .getByRole("button", { name: "Submit quote request" })
        .click();
      await expect(
        quotePage.getByRole("heading", { name: "Brief received" }),
      ).toBeVisible();
      assert.ok((await uploads.findOne({ _id: row._id })).quote);
      console.log(
        "Local STL upload, scan, private download and quote submission passed.",
      );
    } finally {
      await quotePage.close();
    }
  }
  const mine = await uploads.insertOne({
    owner: new mongoose.Types.ObjectId(user._id),
    state: "processing",
    name: "part.stl",
  });
  const other = await uploads.insertOne({
    owner: new mongoose.Types.ObjectId(),
    state: "cleared",
    name: "other.stl",
  });
  assert.equal(
    (
      await api.get(base + "/api/uploads?id=" + mine.insertedId + "&download=1")
    ).status(),
    409,
  );
  assert.equal(
    (await api.get(base + "/api/uploads?id=" + other.insertedId)).status(),
    404,
  );
  assert.equal(
    (
      await send("/api/quotes", {
        title: "Pending scan",
        brief: "Fixture attachment",
        quantity: 1,
        attachments: [String(mine.insertedId)],
      })
    ).status(),
    409,
  );
  assert.equal(
    (
      await api.get(base + "/api/users/" + new mongoose.Types.ObjectId())
    ).status(),
    404,
  );
  assert.equal(
    (await send("/api/users/" + user._id, { role: "admin" }, "PATCH")).status(),
    400,
  );
  assert.equal(
    (await api.post(base + "/api/quotes", { data: {} })).status(),
    403,
  );
  assert.ok(
    (
      await send("/api/quotes", {
        title: "Fixture quote",
        brief: "A private studio request",
        quantity: 2,
        attachments: [],
      })
    ).ok(),
  );
  assert.ok(
    (
      await send("/api/enquiries", {
        name: "Test visitor",
        email: "visitor@example.invalid",
        message: "A question about a print",
      })
    ).ok(),
  );
  await customerPages({ context: ctx, base, screenshots });
  await commerce({
    base,
    api,
    send,
    products,
    insertedId,
    user,
    db: mongoose.connection.db,
    context: ctx,
    screenshots,
  });
  assert.ok(
    (
      await send("/api/auth/login", {
        email: account.email,
        password: account.password,
      })
    ).ok(),
  );
  assert.ok(
    (
      await send("/api/auth/password", {
        current: account.password,
        password: "ChangedSecret42",
      })
    ).ok(),
  );
  assert.equal((await api.get(base + "/api/auth/me")).status(), 401);
  const photoPage = await browser.newPage();
  await products.updateOne({ _id: insertedId }, { $unset: { preview: 1 } });
  await photoPage.goto(base + "/products/fixture-print");
  await expect(
    photoPage.getByRole("button", { name: "View in 3D" }),
  ).toHaveCount(0);
  await photoPage.close();
  await products.updateOne({ _id: insertedId }, { $set: { status: "paused" } });
  const hidden = await api.get(base + "/products/fixture-print");
  assert.doesNotMatch(await hidden.text(), /Enlarge Test print front view/);
  const gallery = await api.get(base + "/gallery");
  assert.match(await gallery.text(), /no published prints/);
  console.log(
    "Account isolation, CSRF, persistence, credential rotation, paused listings and verified receipts passed.",
  );
} finally {
  await browser?.close();
  await mongoose.disconnect();
  app.kill();
  await rs.stop();
}
