import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { DeliveryService } from "@/lib/services/delivery.service";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const orgId = session?.organizationId || "670000000000000000000001";

    const body = await req.json().catch(() => ({}));
    const limit = body.limit || 50;

    const result = await DeliveryService.processBatch(orgId, limit);
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error("[Delivery Process API] Error:", err);
    return NextResponse.json({ error: "Batch processing failed" }, { status: 500 });
  }
}
