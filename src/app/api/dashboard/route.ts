import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { DashboardService } from "@/lib/services/dashboard.service";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    const orgId = session?.organizationId || "670000000000000000000001";

    const metrics = await DashboardService.getMetrics(orgId);
    return NextResponse.json(metrics);
  } catch (err: any) {
    console.error("[Dashboard API] Error:", err);
    return NextResponse.json({ error: "Failed to fetch dashboard metrics" }, { status: 500 });
  }
}
