import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { OrganizationModel, ApiCredentialModel, UserModel } from "@/lib/db/models";
import { connectToDatabase } from "@/lib/db/connect";
import { getSmsProviderForOrg } from "@/lib/providers";
import mongoose from "mongoose";

export async function GET() {
  try {
    const session = await getSession();
    const orgId = session?.organizationId || "670000000000000000000001";

    await connectToDatabase();
    const org = await OrganizationModel.findById(orgObjId(orgId)).lean();
    const providerCred = await ApiCredentialModel.findOne({ organizationId: orgObjId(orgId), isDefault: true }).lean();
    const teamMembers = await UserModel.find({ defaultOrganizationId: orgObjId(orgId) }).select("-passwordHash").lean();

    // Check balance
    const provider = await getSmsProviderForOrg(orgId);
    const balanceRes = await provider.getBalance();

    return NextResponse.json({
      organization: org || {
        name: "SMSPro Enterprise",
        defaultSenderId: "8809612781020",
        trackingDomain: "https://sms-campain.vercel.app",
        settings: {
          defaultTrackingLength: 6,
          defaultTrackingFormat: "numeric",
          retentionDays: 90,
          enableWebhooks: true,
        },
      },
      providerConfig: providerCred || {
        provider: "zendsms",
        name: "ZendSMS Primary",
        apiKey: "sk_agowwwg3j8x8u8o5opcwoyqgxii2zafmikbxtfxo",
        senderId: "8809612781020",
        apiUrl: "https://api.zendsms.com/api/v1/send-sms",
        balance: balanceRes.balance || 4704,
      },
      balance: balanceRes.balance,
      teamMembers: teamMembers.length > 0 ? teamMembers : [
        { _id: "1", name: "Omer Sharif", email: "omer@smspro.io", role: "owner", status: "active" },
        { _id: "2", name: "Sarah Jenkins", email: "sarah@smspro.io", role: "manager", status: "active" },
        { _id: "3", name: "Dev Team", email: "dev@smspro.io", role: "admin", status: "active" },
      ],
    });
  } catch (err: any) {
    console.error("[Settings API] Error:", err);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const orgId = session?.organizationId || "670000000000000000000001";

    const body = await req.json();
    await connectToDatabase();

    if (body.organization) {
      await OrganizationModel.updateOne(
        { _id: orgObjId(orgId) },
        {
          $set: {
            name: body.organization.name,
            defaultSenderId: body.organization.defaultSenderId,
            trackingDomain: body.organization.trackingDomain,
            settings: body.organization.settings,
          },
        },
        { upsert: true }
      );
    }

    if (body.providerConfig) {
      await ApiCredentialModel.updateOne(
        { organizationId: orgObjId(orgId), isDefault: true },
        {
          $set: {
            provider: body.providerConfig.provider,
            name: body.providerConfig.name,
            apiKey: body.providerConfig.apiKey,
            senderId: body.providerConfig.senderId,
            apiUrl: body.providerConfig.apiUrl,
          },
        },
        { upsert: true }
      );
    }

    return NextResponse.json({ success: true, message: "Settings saved successfully" });
  } catch (err: any) {
    console.error("[Settings API] Update error:", err);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}

function orgObjId(id: string) {
  try {
    return new mongoose.Types.ObjectId(id);
  } catch {
    return new mongoose.Types.ObjectId("670000000000000000000001");
  }
}
