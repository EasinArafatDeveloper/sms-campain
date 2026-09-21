import { NextRequest, NextResponse } from "next/server";
import { withTenant, TenantContext } from "@/lib/auth";
import { DashboardService } from "@/lib/services/dashboard.service";

export const GET = withTenant(async (req: NextRequest, ctx: TenantContext) => {
  try {
    const { searchParams } = new URL(req.url);
    const rawRange = searchParams.get("range") || "30d";
    const range = (["7d", "30d", "90d", "all"].includes(rawRange) ? rawRange : "30d") as
      | "7d"
      | "30d"
      | "90d"
      | "all";

    const metrics = await DashboardService.getMetrics(ctx.organizationId, range);
    return NextResponse.json(metrics);
  } catch (err: any) {
    console.error("[Dashboard API] Error:", err);
    return NextResponse.json({ error: "Failed to fetch dashboard metrics" }, { status: 500 });
  }
});
