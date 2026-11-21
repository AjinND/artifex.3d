import { createHash, randomBytes } from "node:crypto";
import { Schema, models, model } from "mongoose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import { User } from "@/lib/db/models/User";
import { HttpError } from "./http";
export const digest = (s: string) =>
  createHash("sha256").update(s).digest("hex");
const schema = new Schema({
  _id: String,
  owner: { type: Schema.Types.ObjectId, required: true, index: true },
  mfa: Boolean,
  expiresAt: { type: Date, expires: 0 },
});
export const Session = models.ShopSession || model("ShopSession", schema);
const cookie = "artifex_session";
export async function currentUser(staff = false) {
  const token = (await cookies()).get(cookie)?.value;
  if (!token) throw new HttpError(401, "Sign in to continue");
  await connectDB();
  const session = await Session.findOne({
    _id: digest(token),
    expiresAt: { $gt: new Date() },
  });
  const user =
    session &&
    (await User.findById(session.owner).select("_id name role email"));
  if (!user || (user.role === "admin" && !session.mfa))
    throw new HttpError(401, "Sign in again");
  if (staff && user.role !== "admin")
    throw new HttpError(403, "Staff access required");
  return user;
}
export async function signIn(
  user: { _id: unknown; name: string; email: string; role: string },
  mfa: boolean,
) {
  const token = randomBytes(32).toString("hex");
  const maxAge = mfa ? 28800 : 86400;
  await Session.create({
    _id: digest(token),
    owner: user._id,
    mfa,
    expiresAt: new Date(Date.now() + maxAge * 1000),
  });
  const res = NextResponse.json({
    success: true,
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
  });
  res.cookies.set(cookie, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
  return res;
}
export async function signOut() {
  const token = (await cookies()).get(cookie)?.value;
  if (token) {
    await connectDB();
    await Session.deleteOne({ _id: digest(token) });
  }
  const res = NextResponse.json({ success: true });
  res.cookies.delete(cookie);
  return res;
}
