import { NextRequest, NextResponse } from "next/server";
import { withTenant, TenantContext } from "@/lib/auth";
import { ExportService } from "@/lib/services/report.service";

export const GET = withTenant(
  async (req: NextRequest, ctx: TenantContext) => {
    try {
      const campaignId = ctx.params.campaignId;
      const csvContent = await ExportService.exportTrackingMappingsCsv(ctx.organizationId, campaignId);

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="tracking-mappings-${campaignId}.csv"`,
        },
      });
    } catch (err: any) {
      console.error("[Export Tracking API] Error:", err);
      return NextResponse.json({ error: "Failed to export tracking mappings" }, { status: 500 });
    }
  },
  { requiredRoles: ["owner", "admin"] }
);
