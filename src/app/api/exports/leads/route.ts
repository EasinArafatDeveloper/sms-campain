import { NextRequest, NextResponse } from "next/server";
import { withTenant, TenantContext } from "@/lib/auth";
import { ExportService } from "@/lib/services/report.service";

export const GET = withTenant(
  async (req: NextRequest, ctx: TenantContext) => {
    try {
      const csvContent = await ExportService.exportActiveLeadsCsv(ctx.organizationId);

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="active-leads-${Date.now()}.csv"`,
        },
      });
    } catch (err: any) {
      console.error("[Export Leads API] Error:", err);
      return NextResponse.json({ error: "Failed to export leads" }, { status: 500 });
    }
  },
  { requiredRoles: ["owner", "admin"] }
);
