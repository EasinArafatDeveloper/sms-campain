import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { UserModel, OrganizationModel, MembershipModel, ApiCredentialModel } from "@/lib/db/models";
import { hashPassword, signSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { RegisterSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
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
    const slug = validated.data.organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-");

    const org = await OrganizationModel.create({
      name: validated.data.organizationName,
      slug: `${slug}-${Date.now().toString().slice(-4)}`,
      plan: "growth",
      senderIds: ["MYBRAND", "SMSPRO", "8809612781020"],
      defaultSenderId: "8809612781020",
    });

    const user = await UserModel.create({
      name: validated.data.name,
      email: validated.data.email.toLowerCase().trim(),
      passwordHash,
      role: "owner",
      defaultOrganizationId: org._id,
    });

    await MembershipModel.create({
      organizationId: org._id,
      userId: user._id,
      role: "owner",
      permissions: ["*"],
    });

    // Default ZendSMS Provider Credential
    await ApiCredentialModel.create({
      organizationId: org._id,
      provider: "zendsms",
      name: "ZendSMS Primary Gateway",
      apiKey: "sk_agowwwg3j8x8u8o5opcwoyqgxii2zafmikbxtfxo",
      senderId: "8809612781020",
      apiUrl: "https://api.zendsms.com/api/v1/send-sms",
      isDefault: true,
      status: "active",
      balance: 4704,
    });

    const token = await signSessionToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: "owner",
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
