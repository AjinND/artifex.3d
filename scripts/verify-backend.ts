import mongoose from "mongoose";
import { connectDB } from "../src/lib/db/connection";
async function main() {
  await connectDB();
  try {
    await mongoose.connection.db!.command({ ping: 1 });
    console.log("MongoDB connection verified");
  } finally {
    await mongoose.disconnect();
  }
}
void main().catch(() => {
  console.error("MongoDB connection failed");
  process.exitCode = 1;
});
