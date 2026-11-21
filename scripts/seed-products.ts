import { readFile } from "node:fs/promises";
import mongoose from "mongoose";
import { Product } from "../src/lib/db/models/Product";
import { listing } from "../src/lib/shop/catalog";
async function seed() {
  if (
    process.env.NODE_ENV !== "development" ||
    !process.env.FIXTURE_MONGODB_URI ||
    !process.argv[2]
  )
    throw new Error(
      "Set a development fixture database and supply a listing JSON file",
    );
  const input = listing.parse(
    JSON.parse(await readFile(process.argv[2], "utf8")),
  );
  await mongoose.connect(process.env.FIXTURE_MONGODB_URI);
  try {
    await Product.updateOne(
      { slug: input.slug },
      { $set: { ...input, status: "draft" } },
      { upsert: true },
    );
  } finally {
    await mongoose.disconnect();
  }
}
void seed().catch(() => {
  console.error("Fixture import failed");
  process.exitCode = 1;
});
