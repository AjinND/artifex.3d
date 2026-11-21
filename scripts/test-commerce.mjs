import { staffPages } from "./test-atelier.mjs";
import { sampleGLB } from "./test-model.mjs";
import { readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { expect } from "@playwright/test";
import otplib from "otplib";
export async function commerce({
  base,
  api,
  send,
  products,
  insertedId,
  user,
  db,
  context,
  screenshots,
}) {
  const initialOrderCount = await db
    .collection("printorders")
    .countDocuments({});
  const items = [{ id: String(insertedId), pricePaise: 49000, quantity: 2 }];
  const payload = {
    attempt: crypto.randomUUID(),
    address: "Test delivery address",
    pin: "560001",
    items,
  };
  assert.equal(
    (
      await send("/api/checkout", {
        ...payload,
        items: [{ ...items[0], pricePaise: 1 }],
      })
    ).status(),
    409,
  );
  assert.equal(
    (await send("/api/checkout", { ...payload, pin: "110001" })).status(),
    422,
  );
  const create = await send("/api/checkout", payload);
  assert.ok(create.ok(), await create.text());
  const order = (await create.json()).data;
  assert.equal(order.amount, 112800);
  assert.equal(
    (await (await send("/api/checkout", payload)).json()).data.order_id,
    order.order_id,
  );
  const payment = "pay_" + order.id;
  const signature = createHmac("sha256", "fixture_secret")
    .update(order.order_id + "|" + payment)
    .digest("hex");
  const confirm = {
    razorpay_order_id: order.order_id,
    razorpay_payment_id: payment,
    razorpay_signature: signature,
  };
  assert.equal(
    (
      await send("/api/payments/verify", {
        ...confirm,
        razorpay_signature: "0".repeat(64),
      })
    ).status(),
    400,
  );
  assert.equal(
    (await (await send("/api/payments/verify", confirm)).json()).data.payment,
    "paid",
  );
  const raw = JSON.stringify({
    event: "payment.captured",
    payload: { payment: { entity: { id: payment } } },
  });
  const hook = () =>
    api.post(base + "/api/payments/webhook", {
      data: raw,
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": createHmac("sha256", "fixture_webhook")
          .update(raw)
          .digest("hex"),
      },
    });
  assert.ok((await hook()).ok());
  assert.ok((await hook()).ok());
  const staff = {
    name: "Fixture staff",
    email: "staff@example.invalid",
    password: "StudioFixture42",
  };
  assert.ok((await send("/api/auth/signup", staff)).ok());
  await db
    .collection("users")
    .updateOne({ email: staff.email }, { $set: { role: "admin" } });
  const customerCookies = await api.storageState();
  const mediaResponse = await api.post(base + "/api/staff/media?ext=png", {
    headers: { Origin: base, "Content-Type": "image/png" },
    data: Buffer.from("unauthorized upload"),
  });
  assert.equal(mediaResponse.status(), 403);
  const invalid = await send("/api/auth/login", {
    email: staff.email,
    password: "incorrect-password",
  });
  assert.equal(invalid.status(), 401);
  assert.equal((await invalid.json()).code, undefined);
  const loginPage = await context.newPage();
  try {
    await loginPage.goto(base + "/login");
    const code = loginPage.getByLabel("Authenticator code");
    await expect(code).toHaveCount(0);
    await loginPage.getByLabel("Email address").fill(staff.email);
    await loginPage.locator("#password").fill(staff.password);
    await loginPage
      .getByRole("button", { name: "Sign in", exact: true })
      .click();
    await expect(code).toBeFocused();
    assert.equal((await api.get(base + "/api/staff")).status(), 403);
    await code.fill(otplib.authenticator.generate("JBSWY3DPEHPK3PXP"));
    await loginPage.getByRole("button", { name: "Verify and sign in" }).click();
    await expect(loginPage).toHaveURL(base + "/staff");
    await expect(
      loginPage.getByRole("link", { name: /Artifex3D Studio workspace/ }),
    ).toBeVisible();
    await expect(
      loginPage.getByRole("button", { name: "Quotes", pressed: true }),
    ).toBeVisible();
    await expect(
      loginPage.getByRole("heading", { name: "Fixture quote", exact: true }),
    ).toBeVisible();
    await expect(
      loginPage.getByText("A private studio request", { exact: true }),
    ).toBeVisible();
  } finally {
    await loginPage.close();
  }
  const queues = (await (await api.get(base + "/api/staff")).json()).data;
  const studioPage = await context.newPage();
  await studioPage.goto(base + "/staff/sample");
  await studioPage.waitForFunction(
    () => document.querySelector("model-viewer")?.loaded,
  );
  const preview = await studioPage
    .locator("model-viewer")
    .evaluate(async (viewer) => {
      viewer.cameraOrbit = "-18deg 78deg auto";
      viewer.jumpCameraToGoal();
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      );
      return viewer.toDataURL("image/png");
    });
  await writeFile(
    screenshots + "/balancing-form.png",
    Buffer.from(preview.split(",")[1], "base64"),
  );
  await studioPage.close();
  await staffPages({ context, base, screenshots });
  await verifyListingLifecycle({ base, context });
  const quote = queues.quotes[0];
  for (const status of ["in production", "dispatched", "completed"]) {
    assert.ok(
      (
        await send(
          "/api/staff",
          {
            action: "fulfill",
            id: order.id,
            status,
            carrier: "Fixture carrier",
            tracking: "TEST-001",
          },
          "PATCH",
        )
      ).ok(),
    );
  }
  assert.ok(
    (
      await send(
        "/api/staff",
        {
          action: "quote",
          id: quote._id,
          version: 0,
          scope: "One test print with delivery",
          amount: 12300,
          leadDays: 3,
          expires: new Date(Date.now() + 86400000).toISOString(),
        },
        "PATCH",
      )
    ).ok(),
  );
  assert.ok(
    (
      await send(
        "/api/staff",
        {
          action: "reply",
          id: queues.enquiries[0]._id,
          reply: "The studio has received your request.",
        },
        "PATCH",
      )
    ).ok(),
  );
  const customerCookie = customerCookies.cookies
    .map((c) => c.name + "=" + c.value)
    .join("; ");
  const buyer = (p, d) =>
    api.post(base + p, {
      data: d,
      headers: { Cookie: customerCookie, Origin: base },
    });
  const quotePayload = {
    attempt: crypto.randomUUID(),
    quote: quote._id,
    version: 1,
    address: payload.address,
    pin: payload.pin,
  };
  assert.equal(
    (await buyer("/api/checkout", { ...quotePayload, version: 0 })).status(),
    409,
  );
  const quoteContext = await context
    .browser()
    .newContext({ storageState: customerCookies });
  try {
    const quotePage = await quoteContext.newPage();
    await quotePage.goto(base + "/profile");
    await quotePage.getByRole("tab", { name: "Quotes" }).click();
    await quotePage
      .getByRole("link", { name: "Accept quote and check out" })
      .click();
    await expect(quotePage).toHaveURL(/checkout\?quote=/);
    await quotePage
      .getByLabel("Delivery address in India")
      .fill(payload.address);
    await quotePage.getByLabel("PIN code").fill(payload.pin);
    await quotePage
      .getByRole("button", { name: "Review payable total" })
      .click();
    await expect(
      quotePage.getByRole("heading", { name: "Your confirmed total" }),
    ).toBeVisible();
    await quotePage.screenshot({
      path: screenshots + "/quote-checkout.png",
      fullPage: true,
    });
  } finally {
    await quoteContext.close();
  }
  const accepted = await buyer("/api/checkout", quotePayload);
  assert.ok(accepted.ok(), await accepted.text());
  const options = (await accepted.json()).data;
  assert.equal(options.amount, 12300);
  assert.equal(
    (
      await (
        await buyer("/api/checkout", {
          ...quotePayload,
          attempt: crypto.randomUUID(),
        })
      ).json()
    ).data.id,
    options.id,
  );

  assert.equal(
    await db.collection("printorders").countDocuments({}),
    initialOrderCount + 2,
  );
  assert.equal(
    (
      await db
        .collection("printorders")
        .findOne({ providerOrder: order.order_id })
    ).fulfillment,
    "completed",
  );
  const qp = "pay_" + options.id;
  assert.ok(
    (
      await buyer("/api/payments/verify", {
        razorpay_order_id: options.order_id,
        razorpay_payment_id: qp,
        razorpay_signature: createHmac("sha256", "fixture_secret")
          .update(options.order_id + "|" + qp)
          .digest("hex"),
      })
    ).ok(),
  );
  for (const status of ["in production", "dispatched", "completed"])
    assert.ok(
      (
        await send(
          "/api/staff",
          {
            action: "fulfill",
            id: options.id,
            status,
            carrier: "Fixture carrier",
            tracking: "QUOTE-001",
          },
          "PATCH",
        )
      ).ok(),
    );
  console.log(
    "Provider-contract fixture passed pricing, signatures, repeated events, staff MFA, quote acceptance and fulfillment.",
  );
}

async function verifyListingLifecycle({ base, context }) {
  const staffPage = await context.newPage();
  const visitor = await context.browser().newPage();
  const slug = "catalog-release-fixture";
  const name = "Catalog release fixture";
  try {
    await staffPage.goto(base + "/staff");
    await staffPage
      .getByRole("button", { name: "Products", exact: true })
      .click();
    const selector = staffPage.getByRole("combobox", { name: /^Listing/ });
    const status = staffPage.locator('form select[name="status"]');
    await expect(selector).toBeVisible();
    await staffPage
      .getByText("Upload approved public media", { exact: true })
      .click();
    const input = staffPage.getByLabel("Approved catalog asset");
    const photo = await readFile(
      "studio-assets/balancing-form/review/balancing-form.png",
    );
    await input.setInputFiles({
      name: "invalid.png",
      mimeType: "image/png",
      buffer: Buffer.from("invalid"),
    });
    await expect(
      staffPage.getByText("Photo format does not match the file"),
    ).toBeVisible();
    await input.setInputFiles({
      name: "approved.png",
      mimeType: "image/png",
      buffer: photo,
    });
    const uploadedPath = staffPage
      .getByRole("list", { name: "Uploaded asset paths" })
      .locator("code");
    await expect(uploadedPath).toHaveText(/^\/catalog\/[a-f0-9]{64}\.png$/);
    const photoPath = await uploadedPath.textContent();
    const uploaded = await visitor.request.get(base + photoPath);
    assert.ok(uploaded.ok());
    assert.equal(uploaded.headers()["content-type"], "image/png");
    assert.deepEqual(await uploaded.body(), photo);
    await staffPage
      .getByRole("button", { name: "Add to approved photos" })
      .click();
    await expect(staffPage.locator('textarea[name="photos"]')).toHaveValue(
      photoPath + " | ",
    );
    const fields = {
      slug: "Desk Organizer",
      name,
      category: "Studio",
      description: "Temporary listing in the isolated rehearsal database.",
      material: "PLA",
      finish: "Matte",
      dimensions: "60 × 35 × 40 mm",
      pricePaise: "425",
      leadDays: "4",
      photos: photoPath + " | Test cover image",
    };
    for (const [field, value] of Object.entries(fields))
      await staffPage.locator(`form [name="${field}"]`).fill(value);
    const slugInput = staffPage.locator('input[name="slug"]');
    await staffPage.getByRole("button", { name: "Preview listing" }).click();
    await expect(slugInput).toHaveAttribute("aria-invalid", "true");
    await expect(
      staffPage.getByText(/Use up to 100 lowercase letters/),
    ).toBeVisible();
    await slugInput.fill(slug);

    async function saveReviewedListing(beforeSave) {
      await staffPage.getByRole("button", { name: "Preview listing" }).click();
      await expect(
        staffPage.getByRole("heading", { name, level: 1 }),
      ).toBeVisible();
      await beforeSave?.();
      await staffPage
        .getByRole("button", { name: "Save reviewed listing" })
        .click();
      await expect(
        staffPage.getByText("Listing saved", { exact: true }),
      ).toBeVisible();
    }

    await saveReviewedListing();
    await expect(selector.locator(`option[value="${slug}"]`)).toHaveText(
      name + " · draft",
    );
    await visitor.goto(base + "/gallery");
    await expect(visitor.getByRole("heading", { name })).toHaveCount(0);
    await selector.selectOption(slug);
    await status.selectOption("published");
    const model = staffPage.locator('input[name="preview"]');
    await model.fill(photoPath.replace(/\.png$/, ".glb"));
    await staffPage.getByRole("button", { name: "Preview listing" }).click();
    await expect(
      staffPage.getByRole("alert").filter({ hasText: /^3D preview\b/ }),
    ).toBeVisible();
    await expect(
      staffPage.getByRole("button", { name: "Save reviewed listing" }),
    ).toHaveCount(0);
    await staffPage
      .getByText("Upload approved public media", { exact: true })
      .click();
    await input.setInputFiles({
      name: "approved.glb",
      mimeType: "model/gltf-binary",
      buffer: sampleGLB(),
    });
    await staffPage.getByRole("button", { name: "Use as 3D preview" }).click();
    await expect(model).toHaveValue(/^\/catalog\/[a-f0-9]{64}\.glb$/);
    await saveReviewedListing(async () => {
      await visitor.reload();
      await expect(visitor.getByRole("heading", { name })).toHaveCount(0);
    });
    await expect(selector.locator(`option[value="${slug}"]`)).toHaveText(
      name + " · published",
    );
    await visitor.reload();
    await visitor.getByRole("link", { name: /Test cover image/ }).click();
    await expect(
      visitor.getByRole("heading", { name, level: 1 }),
    ).toBeVisible();
    await expect(
      visitor.getByRole("button", { name: "View in 3D" }),
    ).toBeVisible();
    await status.selectOption("archived");
    await saveReviewedListing();
    await expect(selector.locator(`option[value="${slug}"]`)).toHaveText(
      name + " · archived",
    );
    await visitor.reload();
    await expect(
      visitor.getByRole("button", { name: "Add to cart" }),
    ).toHaveCount(0);
    console.log(
      "Staff catalog upload, listing preview, draft, publication and archive passed.",
    );
  } finally {
    await staffPage.close();
    await visitor.close();
  }
}
