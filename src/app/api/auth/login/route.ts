import { z } from "zod";
import { NextResponse } from "next/server";
import { authenticator } from "otplib";
import { User } from "@/lib/db/models/User";
import { endpoint, HttpError, json, limit } from "@/lib/server/http";
import { digest, signIn } from "@/lib/server/session";
export const POST = endpoint(async (req) => {
  const input = z
    .object({
      email: z.string().trim().toLowerCase().email().max(254),
      password: z.string().max(128),
      otp: z
        .string()
        .regex(/^\d{6}$/)
        .optional(),
    })
    .parse(await json(req));
  await limit("login", 500);
  await limit("login-" + digest(input.email), 15);
  const user = await User.findOne({ email: input.email });
  if (!user || !(await user.comparePassword(input.password)))
    throw new HttpError(401, "Invalid credentials");
  if (user.role === "admin") {
    const secret = process.env.STAFF_TOTP_SECRET;
    if (user.email !== process.env.STAFF_EMAIL || !secret)
      throw new HttpError(401, "Invalid credentials");
    if (!input.otp || !authenticator.check(input.otp, secret))
      return NextResponse.json(
        {
          success: false,
          code: "STAFF_MFA_REQUIRED",
          error: input.otp
            ? "That code didn’t match. Try the current code."
            : undefined,
        },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    await limit("otp-" + digest(user.email + input.otp), 1, 90);
  }
  return signIn(user, user.role === "admin");
});
