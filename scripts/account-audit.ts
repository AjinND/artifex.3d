import mongoose from "mongoose";
import { User } from "../src/lib/db/models/User";
import { connectDB } from "../src/lib/db/connection";
async function main() {
  await connectDB();
  try {
    const admins = await User.find({ role: "admin" }).select("_id");
    const invalid = await User.find({
      password: { $not: /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/ },
    }).select("_id");
    console.log(
      "Review privileged account IDs",
      admins.map((v) => v.id),
    );
    console.log(
      "Accounts requiring reset",
      invalid.map((v) => v.id),
    );
    if (process.argv.includes("--provision-staff")) {
      if (!process.env.STAFF_EMAIL || !process.env.STAFF_TOTP_SECRET)
        throw new Error("Staff settings required");
      const u = await User.findOne({ email: process.env.STAFF_EMAIL });
      if (!u) throw new Error("Create the staff account first");
      u.role = "admin";
      await u.save();
      console.log("Provisioned", u.id);
    }
  } finally {
    await mongoose.disconnect();
  }
}
void main().catch(() => {
  console.error("Account review failed");
  process.exitCode = 1;
});
