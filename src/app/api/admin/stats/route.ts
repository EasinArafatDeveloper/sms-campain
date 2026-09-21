import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/auth";
import { OrganizationModel, UserModel, CampaignModel, DeliveryJobModel, ClickEventModel } from "@/lib/db/models";
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

      const [
        totalTenants,
        totalUsers,
        totalCampaigns,
        totalSmsSent,
        totalSmsDelivered,
        totalSmsFailed,
        totalClicks,
        recentSignups,
      ] = await Promise.all([
        OrganizationModel.countDocuments(),
        UserModel.countDocuments(),
        CampaignModel.countDocuments(),
        DeliveryJobModel.countDocuments({ status: "sent" }),
        DeliveryJobModel.countDocuments({ status: "delivered" }),
        DeliveryJobModel.countDocuments({ status: "failed" }),
        ClickEventModel.countDocuments({ isHumanVerified: true }),
        UserModel.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
      ]);

      const deliverySuccessRate =
        totalSmsSent + totalSmsDelivered > 0
          ? Number(
              (((totalSmsDelivered + totalSmsSent) / (totalSmsDelivered + totalSmsSent + totalSmsFailed)) * 100).toFixed(1)
            )
          : 100;

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
        gatewayBalance,
        gatewayCurrency,
        gatewayHealthy,
      });
    } catch (err: any) {
      console.error("[Admin Stats API] Error:", err);
      return NextResponse.json({ error: "Failed to fetch platform stats" }, { status: 500 });
    }
  },
  { requireSuperAdmin: true }
);
