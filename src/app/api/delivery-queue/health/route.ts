import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { DeliveryService } from "@/lib/services/delivery.service";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    const orgId = session?.organizationId || "670000000000000000000001";

    const health = await DeliveryService.getApiHealth(orgId);
    return NextResponse.json(health);
  } catch (err: any) {
    console.error("[Delivery Health API] Error:", err);
    return NextResponse.json({ error: "Failed to get health metrics" }, { status: 500 });
  }
}
