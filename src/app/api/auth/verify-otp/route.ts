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

    // Mark user phone verified and award initial trial credits
    const session = await getSession();
    let creditsAwarded = false;
    let updatedCredits = 0;
    let verifiedUser: any = null;

    if (session?.userId) {
      verifiedUser = await UserModel.findById(session.userId);
    } else {
      verifiedUser = await UserModel.findOne({ phone: normalized });
    }

    if (verifiedUser) {
      const wasVerified = verifiedUser.isPhoneVerified;
      verifiedUser.phone = normalized;
      verifiedUser.isPhoneVerified = true;
      await verifiedUser.save();

      const orgId = session?.organizationId || verifiedUser.defaultOrganizationId;
      if (!wasVerified && orgId) {
        const updatedOrg = await OrganizationModel.findByIdAndUpdate(
          orgId,
          { $inc: { smsCredits: 50 } },
          { new: true }
        );
        creditsAwarded = true;
        updatedCredits = updatedOrg?.smsCredits || 50;
      } else if (orgId) {
        const org = await OrganizationModel.findById(orgId);
        updatedCredits = org?.smsCredits || 0;
      }
    }

    return NextResponse.json({
      success: true,
      verified: true,
      creditsAwarded,
      smsCredits: updatedCredits,
      message: creditsAwarded
        ? "Phone number verified! 50 free trial SMS credits have been added to your workspace."
        : "Phone number verified successfully!",
    });
  } catch (err: any) {
    console.error("[OTP Verify API] Error:", err);
    return NextResponse.json({ error: "Failed to verify code" }, { status: 500 });
  }
}
