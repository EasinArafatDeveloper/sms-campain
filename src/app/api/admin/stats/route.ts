import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/auth";
import {
  OrganizationModel,
  UserModel,
  CampaignModel,
  DeliveryJobModel,
  ClickEventModel,
} from "@/lib/db/models";
import { connectToDatabase } from "@/lib/db/connect";
import { ZendSmsProvider } from "@/lib/providers/zendsms.provider";

export const GET = withTenant(
  async () => {
    try {
      await connectToDatabase();

      let gatewayBalance: number | null = null;
      let gatewayCurrency = "BDT";
      let gatewayHealthy = false;

      try {
        const provider = new ZendSmsProvider();
        const res = await provider.getBalance();
        if (typeof res.balance === "number") {
          gatewayBalance = res.balance;
          gatewayCurrency = res.currency || "BDT";
          gatewayHealthy = true;
        }
      } catch (e) {
        console.warn("[Admin Stats] ZendSMS gateway unreachable:", e);
      }

      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      fourteenDaysAgo.setHours(0, 0, 0, 0);

      const [
        totalTenants,
        totalUsers,
        totalCampaigns,
        totalSmsSent,
        totalSmsDelivered,
        totalSmsFailed,
        queueBacklog,
        totalClicks,
        recentSignups,
        zeroCreditTenants,
        lowCreditTenants,
        unverifiedUsers,
        dailySmsStats,
        dailySignups,
        dailyOrgs,
      ] = await Promise.all([
        OrganizationModel.countDocuments(),
        UserModel.countDocuments(),
        CampaignModel.countDocuments(),
        DeliveryJobModel.countDocuments({ status: "sent" }),
        DeliveryJobModel.countDocuments({ status: "delivered" }),
        DeliveryJobModel.countDocuments({ status: "failed" }),
        DeliveryJobModel.countDocuments({ status: { $in: ["queued", "processing", "pending_retry"] } }),
        ClickEventModel.countDocuments({ isHumanVerified: true }),
        UserModel.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),

        // Alerts: zero credit workspaces
        OrganizationModel.find({ smsCredits: { $lte: 0 }, status: "active" })
          .select("name smsCredits slug")
          .limit(10)
          .lean(),

        // Alerts: low credit (1-10) workspaces
        OrganizationModel.find({ smsCredits: { $gt: 0, $lte: 10 }, status: "active" })
          .select("name smsCredits slug")
          .limit(10)
          .lean(),

        // Alerts: unverified phone users
        UserModel.find({ isPhoneVerified: false, status: "active" })
          .select("name email phone createdAt")
          .limit(10)
          .lean(),

        // 14-day timeseries: SMS dispatch & delivery
        DeliveryJobModel.aggregate([
          { $match: { createdAt: { $gte: fourteenDaysAgo } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              sent: {
                $sum: { $cond: [{ $in: ["$status", ["sent", "delivered"]] }, 1, 0] },
              },
              delivered: {
                $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
              },
            },
          },
          { $sort: { _id: 1 } },
        ]),

        // 14-day timeseries: User signups
        UserModel.aggregate([
          { $match: { createdAt: { $gte: fourteenDaysAgo } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),

        // 14-day timeseries: Workspaces created
        OrganizationModel.aggregate([
          { $match: { createdAt: { $gte: fourteenDaysAgo } } },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

      // Generate continuous 14-day timeseries array
      const timeseriesMap = new Map<string, { smsSent: number; delivered: number; signups: number; newWorkspaces: number }>();

      for (let i = 13; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dateStr = d.toISOString().slice(0, 10);
        timeseriesMap.set(dateStr, { smsSent: 0, delivered: 0, signups: 0, newWorkspaces: 0 });
      }

      dailySmsStats.forEach((item) => {
        const entry = timeseriesMap.get(item._id);
        if (entry) {
          entry.smsSent = item.sent;
          entry.delivered = item.delivered;
        }
      });

      dailySignups.forEach((item) => {
        const entry = timeseriesMap.get(item._id);
        if (entry) {
          entry.signups = item.count;
        }
      });

      dailyOrgs.forEach((item) => {
        const entry = timeseriesMap.get(item._id);
        if (entry) {
          entry.newWorkspaces = item.count;
        }
      });

      const timeseries = Array.from(timeseriesMap.entries()).map(([date, data]) => ({
        date,
        ...data,
      }));

      const deliverySuccessRate =
        totalSmsSent + totalSmsDelivered > 0
          ? Number(
              (((totalSmsDelivered + totalSmsSent) / (totalSmsDelivered + totalSmsSent + totalSmsFailed)) * 100).toFixed(1)
            )
          : 100;

      const rateLimiterMode =
        process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
          ? "upstash_redis"
          : "in_memory";

      return NextResponse.json({
        totalTenants,
        totalUsers,
        totalCampaigns,
        totalSmsSent: totalSmsSent + totalSmsDelivered,
        totalSmsDelivered,
        totalSmsFailed,
        deliverySuccessRate,
        totalClicks,
        recentSignups,
        queueBacklog,
        gatewayBalance,
        gatewayCurrency,
        gatewayHealthy,
        rateLimiterMode,
        timeseries,
        alerts: {
          zeroCreditsCount: zeroCreditTenants.length,
          lowCreditsCount: lowCreditTenants.length,
          unverifiedUsersCount: unverifiedUsers.length,
          zeroCreditTenants: zeroCreditTenants.map((o: any) => ({
            _id: o._id.toString(),
            name: o.name,
            smsCredits: o.smsCredits,
          })),
          lowCreditTenants: lowCreditTenants.map((o: any) => ({
            _id: o._id.toString(),
            name: o.name,
            smsCredits: o.smsCredits,
          })),
          unverifiedUsers: unverifiedUsers.map((u: any) => ({
            _id: u._id.toString(),
            name: u.name,
            email: u.email,
            phone: u.phone || "N/A",
          })),
        },
      });
    } catch (err: any) {
      console.error("[Admin Stats API] Error:", err);
      return NextResponse.json({ error: "Failed to fetch platform stats" }, { status: 500 });
    }
  },
  { requireSuperAdmin: true }
);
