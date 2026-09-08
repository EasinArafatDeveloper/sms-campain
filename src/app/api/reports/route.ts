import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ReportService } from "@/lib/services/report.service";

export async function GET() {
  try {
    const session = await getSession();
    const orgId = session?.organizationId || "670000000000000000000001";

    const reports = await ReportService.getReportsSummary(orgId);
    return NextResponse.json(reports);
  } catch (err: any) {
    console.error("[Reports API] Error:", err);
    return NextResponse.json({ error: "Failed to generate reports" }, { status: 500 });
  }
}
