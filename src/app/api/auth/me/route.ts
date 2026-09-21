import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { UserModel, OrganizationModel } from "@/lib/db/models";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  let dbUser: any = null;
  let dbOrg: any = null;

  try {
    await connectToDatabase();
    if (session.userId) {
      dbUser = await UserModel.findById(session.userId).lean();
    }
    const orgId = session.organizationId || dbUser?.defaultOrganizationId;
    if (orgId) {
      dbOrg = await OrganizationModel.findById(orgId).lean();
    }
  } catch (err) {
    console.error("[Auth Me API] DB lookup error:", err);
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.userId,
      name: dbUser?.name || session.name,
      email: dbUser?.email || session.email,
      phone: dbUser?.phone || "",
      isPhoneVerified: Boolean(dbUser?.isPhoneVerified),
      role: dbUser?.role || session.role || "owner",
      platformRole: dbUser?.platformRole || session.platformRole || "user",
      organizationId: (dbOrg?._id || session.organizationId || "").toString(),
      organizationName: dbOrg?.name || session.organizationName || "My Workspace",
      organizationSlug: dbOrg?.slug || session.organizationSlug || "",
      smsCredits: typeof dbOrg?.smsCredits === "number" ? dbOrg.smsCredits : 0,
      plan: dbOrg?.plan || "growth",
    },
  });
}
