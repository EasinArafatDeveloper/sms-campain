import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ExportService } from "@/lib/services/report.service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ campaignId: string }> }) {
  try {
    const { campaignId } = await params;
    const session = await getSession();
    const orgId = session?.organizationId || "670000000000000000000001";

    const csvContent = await ExportService.exportTrackingMappingsCsv(orgId, campaignId);

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
}
