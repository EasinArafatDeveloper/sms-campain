import { NextRequest, NextResponse } from "next/server";
import { withTenant, TenantContext } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db/connect";
import { NotificationModel, DeliveryJobModel, OrganizationModel, UserModel } from "@/lib/db/models";
import mongoose from "mongoose";

export const GET = withTenant(async (req: NextRequest, ctx: TenantContext) => {
  try {
    await connectToDatabase();
    const orgObjId = new mongoose.Types.ObjectId(ctx.organizationId);
    const userObjId = new mongoose.Types.ObjectId(ctx.userId);

    // 1. Fetch system-generated or recorded notifications from DB
    const dbNotifications = await NotificationModel.find({
      organizationId: orgObjId,
      $or: [{ userId: userObjId }, { userId: { $exists: false } }, { userId: null }],
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // 2. Compute dynamic operational notifications/alerts
    const [org, user, failedCount] = await Promise.all([
      OrganizationModel.findById(orgObjId).select("smsCredits name").lean(),
      UserModel.findById(userObjId).select("isPhoneVerified phone").lean(),
      DeliveryJobModel.countDocuments({ organizationId: orgObjId, status: "failed" }),
    ]);

    const systemAlerts: any[] = [];

    // Credit alert
    if (org) {
      if (org.smsCredits <= 0) {
        systemAlerts.push({
          id: "alert-zero-credit",
          title: "Zero SMS Credits",
          message: "Your SMS balance is 0. Campaigns cannot be dispatched until credits are added.",
          type: "error",
          link: "/admin",
          createdAt: new Date().toISOString(),
        });
      } else if (org.smsCredits < 10) {
        systemAlerts.push({
          id: "alert-low-credit",
          title: "Low SMS Credit Warning",
          message: `Only ${org.smsCredits} SMS credits remaining. Top up to ensure uninterrupted broadcasts.`,
          type: "warning",
          link: "/admin",
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Phone verification alert
    if (user && !user.isPhoneVerified) {
      systemAlerts.push({
        id: "alert-unverified-phone",
        title: "Phone Unverified",
        message: "Verify your mobile phone via OTP to claim +50 free SMS credits.",
        type: "warning",
        link: "/profile",
        createdAt: new Date().toISOString(),
      });
    }

    // Delivery failure alert
    if (failedCount > 0) {
      systemAlerts.push({
        id: "alert-failed-deliveries",
        title: "SMS Delivery Issues",
        message: `${failedCount} SMS delivery jobs failed. Review your delivery queue for details.`,
        type: "info",
        link: "/delivery-queue",
        createdAt: new Date().toISOString(),
      });
    }

    const allNotifications = [
      ...systemAlerts,
      ...dbNotifications.map((n) => ({
        id: n._id.toString(),
        title: n.title,
        message: n.message,
        type: n.type,
        link: n.link,
        read: n.read,
        createdAt: n.createdAt,
      })),
    ];

    return NextResponse.json({
      notifications: allNotifications,
      unreadCount: allNotifications.length,
    });
  } catch (err: any) {
    console.error("[Notifications API] Error:", err);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
});
