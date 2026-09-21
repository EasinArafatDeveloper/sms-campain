import { NextRequest, NextResponse } from "next/server";
import { withTenant, TenantContext } from "@/lib/auth";
import { ReportService } from "@/lib/services/report.service";

export const GET = withTenant(async (req: NextRequest, ctx: TenantContext) => {
  try {
    const reports = await ReportService.getReportsSummary(ctx.organizationId);
    return NextResponse.json(reports);
  } catch (err: any) {
    console.error("[Reports API] Error:", err);
    return NextResponse.json({ error: "Failed to generate reports" }, { status: 500 });
  }
});
