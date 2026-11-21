import assert from "node:assert/strict";
import { join } from "node:path";
import { expect } from "@playwright/test";

async function fits(page, label) {
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    label + " has no horizontal overflow",
  );
  await expect(page.getByRole("main")).toHaveCount(1);
}
async function capture(page, screenshots, name) {
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: join(screenshots, name + ".png"),
    fullPage: true,
  });
}
export async function publicPages({ page, base, screenshots, width }) {
  for (const [path, heading] of [
    ["/", "A little idea."],
    ["/about", "Ideas deserve"],
    ["/contact", "Contact the studio"],
    ["/policies", "Studio policies"],
    ["/order", "Request a custom quote"],
    ["/signup", "Create an account"],
    ["/recovery", "Account recovery"],
    ["/profile", null],
    ["/not-a-real-page", "This page has"],
  ]) {
    await page.goto(base + path);
    if (heading)
      await expect(
        page.getByRole("heading", { name: new RegExp(heading), level: 1 }),
      ).toBeVisible();
    await fits(page, path + " at " + width);
    await capture(
      page,
      screenshots,
      (path === "/" ? "home" : path.slice(1)) + "-" + width,
    );
  }
  await page.goto(base + "/products/not-a-real-print");
  await expect(
    page.getByRole("heading", { name: /This page has/, level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toHaveCount(1);
  await expect(page.getByRole("contentinfo")).toHaveCount(1);
  await page.goto(base + "/gallery");
  await expect(
    page.getByRole("heading", { name: "Print collection" }),
  ).toBeVisible();
  await page.keyboard.press("Tab");
  await page.getByRole("link", { name: "Skip to main content" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  if (width <= 800) {
    const trigger = page.getByRole("button", { name: "Filters", exact: true });
    await trigger.click();
    const modal = page.getByRole("dialog", { name: "Refine the collection" });
    await expect(modal).toBeVisible();
    await modal
      .getByRole("combobox", { name: /^Material/ })
      .selectOption("PLA");
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab");
      assert.ok(
        await modal.evaluate((el) => el.contains(document.activeElement)),
      );
    }
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  } else
    await page
      .getByRole("combobox", { name: /^Material/ })
      .filter({ visible: true })
      .selectOption("PLA");
  await page.getByRole("button", { name: "Remove Material filter" }).click();
  await expect(page).toHaveURL(base + "/gallery");
  await page.getByLabel("Search", { exact: true }).fill("no-such-print");
  await expect(
    page.getByText("No prints match these filters.", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .first()
    .click();
  await capture(page, screenshots, "collection-" + width);
  if (width <= 800) {
    const menu = page.getByRole("button", { name: "Open menu" });
    await menu.click();
    await expect(page.locator("#studio-mobile-menu")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeFocused();
  }
  await page.goto(base + "/recovery#fixture.token");
  await expect(page.getByLabel("New password", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Show new password" }).click();
  await expect(
    page.getByLabel("New password", { exact: true }),
  ).toHaveAttribute("type", "text");
  await page.goto(base + "/success");
  await expect(page).toHaveURL(base + "/profile");
  if (width === 390) {
    await page.goto(base + "/order?product=fixture-print");
    await page.getByRole("link", { name: "Sign in to submit a brief" }).click();
    await expect(page).toHaveURL(/\/login\?next=/);
    assert.equal(
      new URL(page.url()).searchParams.get("next"),
      "/order?product=fixture-print",
    );
    await page.goto(base + "/recovery");
    await page.route("**/api/auth/recovery", async (route) => {
      assert.equal(route.request().method(), "POST");
      assert.deepEqual(route.request().postDataJSON(), {
        email: "fixture@example.invalid",
      });
      await route.fulfill({ json: { data: {} } });
    });
    await page
      .getByLabel("Email", { exact: true })
      .fill("fixture@example.invalid");
    await page.getByRole("button", { name: "Send recovery link" }).click();
    await expect(
      page.getByText("If the account exists, a recovery email will arrive."),
    ).toBeVisible();
    await page.unroute("**/api/auth/recovery");
    await page.setViewportSize({ width: 320, height: 900 });
    for (const path of [
      "/",
      "/gallery",
      "/signup",
      "/checkout",
      "/order",
      "/products/fixture-print",
    ]) {
      await page.goto(base + path);
      await fits(page, path + " at 320");
    }
    await capture(page, screenshots, "product-320");
    await page.setViewportSize({ width: 768, height: 900 });
    for (const path of ["/", "/gallery", "/signup", "/checkout"]) {
      await page.goto(base + path);
      await page.evaluate(() => {
        document.documentElement.style.zoom = "2";
      });
      await fits(page, path + " at 200% zoom");
    }
    await page.evaluate(() => {
      document.documentElement.style.zoom = "";
    });
    await page.setViewportSize({ width, height: 900 });
  }
}
export async function customerPages({ context, base, screenshots }) {
  const page = await context.newPage();
  try {
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base + "/profile");
      await expect(page.getByRole("tab", { name: "Orders" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      await page.getByRole("tab", { name: "Orders" }).focus();
      await page.keyboard.press("ArrowRight");
      await expect(page.getByRole("tab", { name: "Quotes" })).toBeFocused();
      await expect(
        page.getByRole("heading", { name: "Fixture quote", exact: true }),
      ).toBeVisible();
      const fixtureQuote = page.locator("section.record").filter({
        has: page.getByRole("heading", { name: "Fixture quote", exact: true }),
      });
      await fixtureQuote
        .getByText("View project details", { exact: true })
        .click();
      await expect(
        fixtureQuote.getByText("A private studio request", { exact: true }),
      ).toBeVisible();
      await capture(page, screenshots, "account-quotes-" + width);
      await page.getByRole("tab", { name: "Settings" }).click();
      await expect(
        page.getByRole("button", { name: "Change password", exact: true }),
      ).toBeVisible();
      await fits(page, "Account " + width);
      await capture(page, screenshots, "account-settings-" + width);
      await page.goto(base + "/order?product=fixture-print");
      await expect(page.getByLabel("Project name")).toBeVisible();
      await fits(page, "Quote form " + width);
      await capture(page, screenshots, "quote-form-" + width);
      await page.goto(base + "/products/fixture-print");
      await page.getByRole("button", { name: "Add to cart" }).click();
      await expect(
        page.getByRole("dialog", { name: "Your cart" }),
      ).toBeVisible();
      await capture(page, screenshots, "cart-" + width);
      await page.keyboard.press("Escape");
      await expect(
        page.getByRole("button", { name: "Add to cart" }),
      ).toBeFocused();
      await page.goto(base + "/checkout");
      await page
        .getByLabel("Delivery address in India")
        .fill("Test studio delivery address");
      await page.getByLabel("PIN code").fill("560001");
      await page.getByRole("button", { name: "Review payable total" }).click();
      await expect(
        page.getByRole("heading", { name: "Your confirmed total" }),
      ).toBeVisible();
      await fits(page, "Checkout " + width);
      await capture(page, screenshots, "checkout-review-" + width);
      if (width === 1440) {
        await page.route(
          "https://checkout.razorpay.com/v1/checkout.js",
          (route) =>
            route.fulfill({
              contentType: "application/javascript",
              body: "window.Razorpay = class { constructor(options) { this.options = options; } open() { window.paymentOpenCount = (window.paymentOpenCount || 0) + 1; setTimeout(() => this.options.modal.ondismiss(), 10); } };",
            }),
        );
        await page.getByRole("button", { name: "Pay with Razorpay" }).click();
        await expect(page).toHaveURL(base + "/profile");
        await page
          .getByRole("button", { name: "Resume payment" })
          .first()
          .click();
        await page.waitForFunction(() => window.paymentOpenCount === 2);
        await expect(
          page.getByRole("heading", { name: "Your account" }),
        ).toBeVisible();
      }
    }
    // Exercise asynchronous upload states without sending files to external storage.
    await page.goto(base + "/order");
    let scanState = "rejected";
    await page.route("**/api/uploads**", async (route) => {
      const method = route.request().method();
      const data =
        method === "POST"
          ? { id: "fixture-upload", url: base + "/fixture-upload" }
          : method === "PATCH"
            ? { state: "processing" }
            : { state: scanState };
      await route.fulfill({ json: { data } });
    });
    await page.route("**/fixture-upload", (route) =>
      route.fulfill({ status: 200, body: "" }),
    );
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "rejected.stl",
      mimeType: "application/octet-stream",
      buffer: Buffer.from("fixture"),
    });
    await expect(page.getByText("Processing", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Submit quote request" }),
    ).toBeDisabled();
    await expect(
      page.getByText("File rejected. Remove it and choose another file."),
    ).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: "Remove", exact: true }).click();
    scanState = "cleared";
    await fileInput.setInputFiles({
      name: "ready.stl",
      mimeType: "application/octet-stream",
      buffer: Buffer.from("fixture"),
    });
    await expect(page.getByText("Ready", { exact: true })).toBeVisible({
      timeout: 10000,
    });
    await page.getByLabel("Project name").fill("A new object");
    await page
      .getByLabel("Design brief", { exact: false })
      .fill("A small object in matte PLA, 60 mm tall.");
    await page.route("**/api/quotes", async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      const body = route.request().postDataJSON();
      assert.deepEqual(body.attachments, ["fixture-upload"]);
      assert.equal(body.quantity, 1);
      await route.fulfill({ json: { data: { id: "ui-quote-receipt" } } });
    });
    await page.getByRole("button", { name: "Submit quote request" }).click();
    await expect(
      page.getByRole("heading", { name: "Brief received" }),
    ).toBeVisible();
    await capture(page, screenshots, "quote-receipt");
    await page.getByRole("link", { name: "Track your quote" }).click();
    await expect(page).toHaveURL(base + "/profile?tab=quotes");
    await expect(page.getByRole("tab", { name: "Quotes" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    console.log(
      "Responsive account, checkout cancellation/resume, and mocked upload-state UI checks passed.",
    );
  } finally {
    await page.close();
  }
}
export async function staffPages({ context, base, screenshots }) {
  const page = await context.newPage();
  try {
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base + "/staff");
      await expect(
        page.getByRole("heading", { name: "Studio workspace" }),
      ).toBeVisible();
      await expect(
        page.getByRole("navigation", { name: "Main navigation" }),
      ).toHaveCount(0);
      for (const name of ["Quotes", "Orders", "Products", "Enquiries"]) {
        await page.getByRole("button", { name, exact: true }).click();
        await expect(
          page.getByRole("button", { name, exact: true }),
        ).toHaveAttribute("aria-pressed", "true");
        await fits(page, "Staff " + name + " " + width);
        await capture(
          page,
          screenshots,
          "staff-" + name.toLowerCase() + "-" + width,
        );
      }
      await page.goto(base + "/staff/sample");
      await fits(page, "Sample " + width);
      await capture(page, screenshots, "sample-" + width);
    }
  } finally {
    await page.close();
  }
}
