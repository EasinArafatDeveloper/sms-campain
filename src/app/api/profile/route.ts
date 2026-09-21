import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { UserModel, OrganizationModel } from "@/lib/db/models";
import { getSession, comparePassword, hashPassword } from "@/lib/auth";
import { normalizePhoneNumber } from "@/lib/utils";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const user = await UserModel.findById(session.userId).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const orgId = session.organizationId || user.defaultOrganizationId;
    const org = orgId ? await OrganizationModel.findById(orgId).lean() : null;

    return NextResponse.json({
      success: true,
      profile: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        isPhoneVerified: Boolean(user.isPhoneVerified),
        role: user.role || "owner",
        platformRole: user.platformRole || "user",
        status: user.status || "active",
        createdAt: user.createdAt,
        organization: org
          ? {
              id: org._id.toString(),
              name: org.name,
              slug: org.slug,
              plan: org.plan,
              smsCredits: org.smsCredits ?? 0,
              defaultSenderId: org.defaultSenderId,
              trackingDomain: org.trackingDomain,
            }
          : null,
      },
    });
  } catch (err: any) {
    console.error("[Profile API GET Error]:", err);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    await connectToDatabase();
    const user = await UserModel.findById(session.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (action === "update_profile") {
      const { name, phone } = body;

      if (typeof name === "string" && name.trim().length >= 2) {
        user.name = name.trim();
      }

      if (typeof phone === "string") {
        const cleanPhone = phone.trim();
        if (cleanPhone === "") {
          user.phone = undefined;
          user.isPhoneVerified = false;
        } else {
          const { normalized, isValid } = normalizePhoneNumber(cleanPhone);
          if (!isValid) {
            return NextResponse.json(
              { error: "Invalid Bangladesh mobile phone number format (e.g. 017XXXXXXXX or +88017XXXXXXXX)" },
              { status: 400 }
            );
          }
          if (user.phone !== normalized) {
            user.phone = normalized;
            user.isPhoneVerified = false; // Reset verification if phone changed
          }
        }
      }

      await user.save();

      return NextResponse.json({
        success: true,
        message: "Profile information updated successfully",
        user: {
          name: user.name,
          phone: user.phone || "",
          isPhoneVerified: user.isPhoneVerified,
        },
      });
    }

    if (action === "change_password") {
      const { currentPassword, newPassword, confirmPassword } = body;

      if (!currentPassword || !newPassword) {
        return NextResponse.json({ error: "Current password and new password are required" }, { status: 400 });
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ error: "New password must be at least 6 characters long" }, { status: 400 });
      }

      if (confirmPassword && newPassword !== confirmPassword) {
        return NextResponse.json({ error: "New passwords do not match" }, { status: 400 });
      }

      if (user.passwordHash) {
        const isMatch = await comparePassword(currentPassword, user.passwordHash);
        if (!isMatch) {
          return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
        }
      }

      user.passwordHash = await hashPassword(newPassword);
      await user.save();

      return NextResponse.json({
        success: true,
        message: "Password changed successfully",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("[Profile API PATCH Error]:", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
