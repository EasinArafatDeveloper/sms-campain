import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { UserModel, OrganizationModel, MembershipModel } from "@/lib/db/models";
import { hashPassword, signSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { RegisterSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/security";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const limiter = await rateLimit(`register:${ip}`, 5, 15 * 60 * 1000); // 5 registrations per 15 min

    if (!limiter.allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validated = RegisterSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.format() },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const existingUser = await UserModel.findOne({ email: validated.data.email.toLowerCase().trim() });
    if (existingUser) {
      return NextResponse.json({ error: "Email is already registered" }, { status: 400 });
    }

    const passwordHash = await hashPassword(validated.data.password);
    const rawSlug = validated.data.organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 30);
    const uniqueSuffix = crypto.randomBytes(3).toString("hex");
    const slug = `${rawSlug}-${uniqueSuffix}`;

    // Create Tenant Workspace with 20 Free Trial SMS Credits
    const org = await OrganizationModel.create({
      name: validated.data.organizationName,
      slug,
      plan: "growth",
      smsCredits: 20,
      senderIds: ["8809612781020", "SMSPRO", "MYBRAND"],
      defaultSenderId: "8809612781020",
      trackingDomain: "https://postman.asia",
    });

    const user = await UserModel.create({
      name: validated.data.name,
      email: validated.data.email.toLowerCase().trim(),
      phone: validated.data.phone?.trim() || undefined,
      isPhoneVerified: false,
      passwordHash,
      role: "owner",
      platformRole: "user",
      defaultOrganizationId: org._id,
    });

    await MembershipModel.create({
      organizationId: org._id,
      userId: user._id,
      role: "owner",
      permissions: ["*"],
    });

    const token = await signSessionToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: "owner",
      platformRole: "user",
      organizationId: org._id.toString(),
      organizationName: org.name,
      organizationSlug: org.slug,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        organizationName: org.name,
        smsCredits: org.smsCredits,
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("[Auth API] Registration error:", err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
