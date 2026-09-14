import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ExportService } from "@/lib/services/report.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { campaignId } = await params;
    const session = await getSession();
    const orgId = session?.organizationId || "670000000000000000000001";

    const { csv, campaignName } = await ExportService.exportCampaignReportCsv(orgId, campaignId);

    const safeName = (campaignName || "campaign")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/gi, "_")
      .slice(0, 40);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${safeName}-detailed-report-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err: any) {
    console.error("[Export Campaign Detailed Report API] Error:", err);
    return NextResponse.json({ error: "Failed to export campaign report" }, { status: 500 });
  }
}
