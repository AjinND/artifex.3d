import { cleanUpload } from "./clean-uploads";
import { matchesUpload, maxUploadBytes } from "../src/lib/server/upload-format";
import { Order, Quote } from "../src/lib/server/records";
import { User } from "../src/lib/db/models/User";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import nodemailer from "nodemailer";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { connectDB } from "../src/lib/db/connection";
import { Enquiry, Upload, Recovery } from "../src/lib/server/records";
import { s3, locationFor } from "../src/lib/server/storage";
import { recoveryToken } from "../src/lib/server/recover";
import mongoose from "mongoose";
const run = promisify(execFile);
const lease = () => new Date(Date.now() + 5 * 60000);
const available = () => ({
  $or: [{ lease: null }, { lease: { $lte: new Date() } }],
});
async function scan() {
  const row = await Upload.findOneAndUpdate(
    { state: "processing", storage: { $ne: "local" }, ...available() },
    { $set: { lease: lease() } },
    { new: true },
  );
  if (!row) return false;
  const dir = await mkdtemp(join(tmpdir(), "artifex-scan-"));
  try {
    const reply = await s3.send(
      new GetObjectCommand({
        ...locationFor(row.key),
        VersionId: row.versionId,
      }),
    );
    if (
      reply.ContentLength !== row.bytes ||
      row.bytes > maxUploadBytes ||
      !reply.Body
    )
      throw new Error("Stored upload mismatch");
    const bytes = Buffer.from(await reply.Body.transformToByteArray());
    let clear = matchesUpload(row.name, bytes);
    if (clear) {
      const file = join(dir, "upload");
      await writeFile(file, bytes);
      try {
        await run("clamscan", ["--no-summary", file], { timeout: 120000 });
      } catch (e) {
        if ((e as { code?: number }).code !== 1) throw e;
        clear = false;
      }
    }
    await Upload.updateOne(
      { _id: row._id, versionId: row.versionId },
      { $set: { state: clear ? "cleared" : "rejected", lease: null } },
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
  return true;
}
async function send(
  kind: "enquiry" | "reply" | "recovery" | "order" | "quote",
) {
  const model =
    kind === "recovery"
      ? Recovery
      : kind === "order"
        ? Order
        : kind === "quote"
          ? Quote
          : Enquiry;
  const field = kind === "reply" ? "replyState" : "mailState";
  const row = await model.findOneAndUpdate(
    {
      [field]: "pending",
      ...available(),
      ...(kind === "recovery" ? { expiresAt: { $gt: new Date() } } : {}),
    },
    { $set: { lease: lease() } },
    { new: true },
  );
  if (!row) return false;
  if (
    !process.env.SMTP_URL ||
    !process.env.MAIL_FROM ||
    !process.env.APP_ORIGIN ||
    !process.env.STUDIO_INBOX
  )
    throw new Error("Mail configuration missing");
  const transactional = kind === "order" || kind === "quote";
  const to = transactional
    ? (await User.findById(row.owner).select("email"))?.email
    : kind === "enquiry"
      ? process.env.STUDIO_INBOX
      : row.email;
  if (!to) throw new Error("Recipient unavailable");
  const text = transactional
    ? row.mailText + " " + process.env.APP_ORIGIN + "/profile"
    : kind === "recovery"
      ? "Reset your Artifex3D password: " +
        process.env.APP_ORIGIN +
        "/recovery#" +
        row.id +
        "." +
        recoveryToken(row.id)
      : kind === "reply"
        ? row.reply
        : "A new enquiry is available in the Artifex3D staff workspace.";
  await nodemailer.createTransport(process.env.SMTP_URL).sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject:
      kind === "recovery"
        ? "Artifex3D account recovery"
        : transactional
          ? "Artifex3D account update"
          : "Artifex3D enquiry",
    text,
    messageId:
      "<" +
      kind +
      "." +
      (row.mailId || row.id) +
      "@" +
      new URL(process.env.APP_ORIGIN).hostname +
      ">",
  });
  await model.updateOne(
    { _id: row._id, ...(transactional ? { mailId: row.mailId } : {}) },
    { $set: { [field]: "sent", lease: null } },
  );
  return true;
}
async function main() {
  await connectDB();
  try {
    for (const job of [
      cleanUpload,
      scan,
      () => send("order"),
      () => send("quote"),
      () => send("enquiry"),
      () => send("reply"),
      () => send("recovery"),
    ]) {
      for (let i = 0; i < 50; i++) {
        try {
          if (!(await job())) break;
        } catch (e) {
          console.error("Studio job requires retry", (e as Error).name);
          process.exitCode = 1;
          break;
        }
      }
    }
  } finally {
    await mongoose.disconnect();
  }
}
void main().catch(() => {
  process.exitCode = 1;
});
