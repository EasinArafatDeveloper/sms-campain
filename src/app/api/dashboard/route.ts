import { NextRequest, NextResponse } from "next/server";
import { withTenant, TenantContext } from "@/lib/auth";
import { DashboardService } from "@/lib/services/dashboard.service";

export const GET = withTenant(async (req: NextRequest, ctx: TenantContext) => {
  try {
    const metrics = await DashboardService.getMetrics(ctx.organizationId);
    return NextResponse.json(metrics);
  } catch (err: any) {
    console.error("[Dashboard API] Error:", err);
    return NextResponse.json({ error: "Failed to fetch dashboard metrics" }, { status: 500 });
  }
});
