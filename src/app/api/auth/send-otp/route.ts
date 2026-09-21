import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { PhoneVerificationModel } from "@/lib/db/models";
import { ZendSmsProvider } from "@/lib/providers/zendsms.provider";
import { SendOtpSchema } from "@/lib/validations";
import { normalizePhoneNumber } from "@/lib/utils";
import { rateLimit, getClientIp } from "@/lib/security";
import { env } from "@/lib/env";
import crypto from "crypto";
import { BRAND } from "@/lib/brand";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const body = await req.json().catch(() => ({}));
    const validated = SendOtpSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.format() },
        { status: 400 }
      );
    }

    const { normalized, isValid } = normalizePhoneNumber(validated.data.phone);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid phone number format. Please provide a valid Bangladesh mobile number." },
        { status: 400 }
      );
    }

    // 1. Strict rate limit per destination phone (max 3 requests per 10 min) to prevent SMS bombing
    const phoneLimiter = await rateLimit(`otp:phone:${normalized}`, 3, 10 * 60 * 1000);
    if (!phoneLimiter.allowed) {
      return NextResponse.json(
        { error: "Too many OTP requests for this phone number. Please wait 10 minutes before requesting another code." },
        { status: 429 }
      );
    }

    // 2. Rate limit per client IP (max 10 requests per 10 min)
    const ipLimiter = await rateLimit(`otp:ip:${ip}`, 10, 10 * 60 * 1000);
    if (!ipLimiter.allowed) {
      return NextResponse.json(
        { error: "Too many OTP requests from your network. Please wait a few minutes." },
        { status: 429 }
      );
    }

    await connectToDatabase();

    // Generate secure 6-digit OTP with cryptographic random salt
    const rawOtp = (100000 + crypto.randomInt(900000)).toString();
    const salt = crypto.randomBytes(16).toString("hex");
    const hashedCode = crypto
      .createHmac("sha256", env.AUTH_SECRET)
      .update(`${salt}:${normalized}:${rawOtp}`)
      .digest("hex");
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store in PhoneVerification collection
    await PhoneVerificationModel.deleteMany({ phone: normalized });
    await PhoneVerificationModel.create({
      phone: normalized,
      hashedCode,
      salt,
      attempts: 0,
      verified: false,
      expiresAt,
    });

    // Send SMS via Central ZendSMS Gateway
    const provider = new ZendSmsProvider();
    const message = `Your ${BRAND.name} verification code is: ${rawOtp}. Valid for 5 minutes. Do not share this code.`;

    const smsRes = await provider.sendSms({
      to: normalized,
      message,
      senderId: "8809612781020",
    });

    if (!smsRes.success) {
      console.error("[OTP API] ZendSMS dispatch failed:", smsRes.error);
      return NextResponse.json(
        {
          error: "Failed to dispatch SMS code",
          message: smsRes.error || "SMS provider error",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Verification code sent to ${normalized.slice(0, 6)}****${normalized.slice(-2)}`,
      expiresInSeconds: 300,
    });
  } catch (err: any) {
    console.error("[OTP API] Error:", err);
    return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 });
  }
}
