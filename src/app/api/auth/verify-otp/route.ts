import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { PhoneVerificationModel, UserModel } from "@/lib/db/models";
import { getSession } from "@/lib/auth";
import { VerifyOtpSchema } from "@/lib/validations";
import { normalizePhoneNumber } from "@/lib/utils";
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

    const inputHash = crypto.createHash("sha256").update(validated.data.code.trim()).digest("hex");

    if (inputHash !== record.hashedCode) {
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

    // If active session exists, mark user phone verified
    const session = await getSession();
    if (session?.userId) {
      await UserModel.findByIdAndUpdate(session.userId, {
        phone: normalized,
        isPhoneVerified: true,
      });
    }

    return NextResponse.json({
      success: true,
      verified: true,
      message: "Phone number verified successfully!",
    });
  } catch (err: any) {
    console.error("[OTP Verify API] Error:", err);
    return NextResponse.json({ error: "Failed to verify code" }, { status: 500 });
  }
}
