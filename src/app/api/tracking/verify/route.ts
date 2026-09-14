import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { ClickEventModel } from "@/lib/db/models";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, trackingId, screenWidth, screenHeight, hasTouch, renderTimeMs } = body;

    if (!token && !trackingId) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    await connectToDatabase();

    const query: any = {};
    if (token) {
      query["metadata.verifyToken"] = token;
    } else {
      query.trackingId = trackingId;
    }

    // Update the most recent candidate human click event
    await ClickEventModel.findOneAndUpdate(
      query,
      {
        $set: {
          isHumanVerified: true,
          isBot: false,
          clientMeta: {
            screenWidth: Number(screenWidth) || 0,
            screenHeight: Number(screenHeight) || 0,
            hasTouch: Boolean(hasTouch),
            renderTimeMs: Number(renderTimeMs) || 0,
            verifiedAt: new Date(),
          },
        },
      },
      { sort: { clickedAt: -1 } }
    );

    return NextResponse.json({ ok: true, verified: true }, { status: 200 });
  } catch (err: any) {
    console.error("[Tracking Verification] Beacon error:", err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
