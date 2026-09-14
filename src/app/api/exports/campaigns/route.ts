import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ExportService } from "@/lib/services/report.service";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    const orgId = session?.organizationId || "670000000000000000000001";

    const csvContent = await ExportService.exportAllCampaignsReportCsv(orgId);

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
}
