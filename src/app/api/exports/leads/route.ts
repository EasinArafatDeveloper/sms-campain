import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ExportService } from "@/lib/services/report.service";

export async function GET() {
  try {
    const session = await getSession();
    const orgId = session?.organizationId || "670000000000000000000001";

    const csvContent = await ExportService.exportActiveLeadsCsv(orgId);

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
}
