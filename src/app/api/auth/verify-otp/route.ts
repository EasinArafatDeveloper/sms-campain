import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { PhoneVerificationModel, UserModel, OrganizationModel } from "@/lib/db/models";
import { getSession } from "@/lib/auth";
import { VerifyOtpSchema } from "@/lib/validations";
import { normalizePhoneNumber } from "@/lib/utils";
import { env } from "@/lib/env";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const validated = VerifyOtpSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.format() },
        { status: 400 }
      );
    }

    const { normalized, isValid } = normalizePhoneNumber(validated.data.phone);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 });
    }

    await connectToDatabase();

    const record = await PhoneVerificationModel.findOne({
      phone: normalized,
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      return NextResponse.json(
        { error: "Verification code expired or not requested. Please request a new code." },
        { status: 400 }
      );
    }

    if (record.attempts >= 5) {
      await PhoneVerificationModel.deleteOne({ _id: record._id });
      return NextResponse.json(
        { error: "Too many incorrect attempts. Please request a new verification code." },
        { status: 429 }
      );
    }

    // Recompute salted HMAC
    const inputHash = crypto
      .createHmac("sha256", env.AUTH_SECRET)
      .update(`${record.salt}:${normalized}:${validated.data.code.trim()}`)
      .digest("hex");

    const inputHashBuffer = Buffer.from(inputHash, "utf-8");
    const storedHashBuffer = Buffer.from(record.hashedCode, "utf-8");

    const isMatch =
      inputHashBuffer.length === storedHashBuffer.length &&
      crypto.timingSafeEqual(inputHashBuffer, storedHashBuffer);

    if (!isMatch) {
      record.attempts += 1;
      await record.save();
      const remainingAttempts = 5 - record.attempts;
      return NextResponse.json(
        {
          error: "Invalid verification code",
          remainingAttempts,
        },
        { status: 400 }
      );
    }

    // Code matches successfully
    record.verified = true;
    await record.save();

    // If active session exists, mark user phone verified and award initial trial credits
    const session = await getSession();
    let creditsAwarded = false;

    if (session?.userId) {
      const user = await UserModel.findById(session.userId);
      if (user) {
        const wasVerified = user.isPhoneVerified;
        user.phone = normalized;
        user.isPhoneVerified = true;
        await user.save();

        // If user was not verified before, award 20 free trial credits to their organization
        if (!wasVerified && user.defaultOrganizationId) {
          await OrganizationModel.findByIdAndUpdate(user.defaultOrganizationId, {
            $inc: { smsCredits: 20 },
          });
          creditsAwarded = true;
        }
      }
    }

    return NextResponse.json({
      success: true,
      verified: true,
      creditsAwarded,
      message: creditsAwarded
        ? "Phone number verified! 20 free trial SMS credits have been added to your workspace."
        : "Phone number verified successfully!",
    });
  } catch (err: any) {
    console.error("[OTP Verify API] Error:", err);
    return NextResponse.json({ error: "Failed to verify code" }, { status: 500 });
  }
}
