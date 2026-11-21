import mongoose from "mongoose";
import { connectDB } from "../src/lib/db/connection";
async function main() {
  await connectDB();
  try {
    const collection = mongoose.connection.collection("products");
    const indexes = await collection.indexes();
    const legacy = indexes.find(
      (i) =>
        Object.keys(i.key).length === 1 &&
        i.key.id === 1 &&
        i.unique &&
        !i.sparse &&
        !i.partialFilterExpression,
    );
    console.log("Legacy numeric ID index requires migration:", !!legacy);
    if (legacy && process.argv.includes("--apply")) {
      await collection.createIndex(
        { id: 1 },
        {
          name: "numeric_legacy_ids",
          unique: true,
          partialFilterExpression: { id: { $type: "number" } },
        },
      );
      await collection.dropIndex(legacy.name!);
    }
  } finally {
    await mongoose.disconnect();
  }
}
void main().catch(() => {
  console.error("Catalog index migration failed");
  process.exitCode = 1;
});
