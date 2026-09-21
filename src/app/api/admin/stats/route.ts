import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/auth";
import { OrganizationModel, UserModel, CampaignModel, DeliveryJobModel, ClickEventModel } from "@/lib/db/models";
import { connectToDatabase } from "@/lib/db/connect";
import { ZendSmsProvider } from "@/lib/providers/zendsms.provider";

export const GET = withTenant(
  async () => {
    try {
      await connectToDatabase();

      const [
        totalTenants,
        totalUsers,
        totalCampaigns,
        totalSmsSent,
        totalClicks,
        gatewayBalanceRes,
      ] = await Promise.all([
        OrganizationModel.countDocuments(),
        UserModel.countDocuments(),
        CampaignModel.countDocuments(),
        DeliveryJobModel.countDocuments({ status: "sent" }),
        ClickEventModel.countDocuments({ isHumanVerified: true }),
        new ZendSmsProvider().getBalance().catch(() => ({ balance: 0, currency: "BDT" })),
      ]);

      return NextResponse.json({
        totalTenants,
        totalUsers,
        totalCampaigns,
        totalSmsSent,
        totalClicks,
        gatewayBalance: gatewayBalanceRes.balance || 0,
        gatewayCurrency: gatewayBalanceRes.currency || "BDT",
      });
    } catch (err: any) {
      console.error("[Admin Stats API] Error:", err);
      return NextResponse.json({ error: "Failed to fetch platform stats" }, { status: 500 });
    }
  },
  { requireSuperAdmin: true }
);
