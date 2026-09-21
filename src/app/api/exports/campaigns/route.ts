import { NextRequest, NextResponse } from "next/server";
import { withTenant, TenantContext } from "@/lib/auth";
import { ExportService } from "@/lib/services/report.service";

export const GET = withTenant(
  async (req: NextRequest, ctx: TenantContext) => {
    try {
      const csvContent = await ExportService.exportAllCampaignsReportCsv(ctx.organizationId);

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="all-campaigns-summary-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    } catch (err: any) {
      console.error("[Export All Campaigns API] Error:", err);
      return NextResponse.json({ error: "Failed to export all campaigns" }, { status: 500 });
    }
  },
  { requiredRoles: ["owner", "admin"] }
);
