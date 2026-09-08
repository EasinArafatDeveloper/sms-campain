import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSmsProviderForOrg } from "@/lib/providers";
import { SendTestSmsSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const orgId = session?.organizationId || "670000000000000000000001";

    const body = await req.json();
    const validated = SendTestSmsSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.format() },
        { status: 400 }
      );
    }

    const provider = await getSmsProviderForOrg(orgId);
    const result = await provider.sendSms({
      to: validated.data.phone,
      message: validated.data.message,
      senderId: validated.data.senderId,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "SMS sending failed", details: result },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Test SMS dispatched successfully",
      providerMessageId: result.providerMessageId,
      raw: result.rawResponse,
    });
  } catch (err: any) {
    console.error("[Test SMS API] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to send test SMS" }, { status: 500 });
  }
}
