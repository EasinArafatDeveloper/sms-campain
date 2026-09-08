import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, signSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { LoginSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = LoginSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.format() },
        { status: 400 }
      );
    }

    const sessionPayload = await authenticateUser(validated.data.email, validated.data.password);

    if (!sessionPayload) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = await signSessionToken(sessionPayload);

    const response = NextResponse.json({
      success: true,
      user: {
        id: sessionPayload.userId,
        name: sessionPayload.name,
        email: sessionPayload.email,
        role: sessionPayload.role,
        organizationName: sessionPayload.organizationName,
        organizationSlug: sessionPayload.organizationSlug,
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("[Auth API] Login error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
