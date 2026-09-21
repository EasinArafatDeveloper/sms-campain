import { NextRequest, NextResponse } from "next/server";
import { withTenant, TenantContext } from "@/lib/auth";
import { OrganizationModel, ApiCredentialModel, UserModel } from "@/lib/db/models";
import { connectToDatabase } from "@/lib/db/connect";
import { getSmsProviderForOrg } from "@/lib/providers";
import mongoose from "mongoose";

export const GET = withTenant(async (req: NextRequest, ctx: TenantContext) => {
  try {
    const orgId = ctx.organizationId;
    await connectToDatabase();
    const orgObjId = new mongoose.Types.ObjectId(orgId);

    const org = await OrganizationModel.findById(orgObjId).lean();
    const providerCred = await ApiCredentialModel.findOne({ organizationId: orgObjId, isDefault: true }).lean();
    const teamMembers = await UserModel.find({ defaultOrganizationId: orgObjId }).select("-passwordHash").lean();

    // Check balance from provider
    const provider = await getSmsProviderForOrg(orgId);
    const balanceRes = await provider.getBalance();

    // Mask sensitive API key for security
    let maskedApiKey = "";
    if (providerCred?.apiKey) {
      maskedApiKey = providerCred.apiKey.length > 8
        ? `${providerCred.apiKey.slice(0, 6)}...${providerCred.apiKey.slice(-4)}`
        : "********";
    }

    return NextResponse.json({
      organization: org,
      smsCredits: org?.smsCredits ?? 20,
      providerConfig: providerCred
        ? {
            ...providerCred,
            apiKey: maskedApiKey,
            hasCustomKey: !!providerCred.apiKey,
          }
        : null,
      balance: balanceRes.balance,
      teamMembers: teamMembers,
    });
  } catch (err: any) {
    console.error("[Settings API] Error:", err);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
});

export const POST = withTenant(async (req: NextRequest, ctx: TenantContext) => {
  try {
    const orgId = ctx.organizationId;
    const body = await req.json();
    await connectToDatabase();
    const orgObjId = new mongoose.Types.ObjectId(orgId);

    if (body.organization) {
      await OrganizationModel.updateOne(
        { _id: orgObjId },
        {
          $set: {
            name: body.organization.name,
            defaultSenderId: body.organization.defaultSenderId,
            trackingDomain: body.organization.trackingDomain,
            settings: body.organization.settings,
          },
        }
      );
    }

    if (body.providerConfig) {
      const updateData: any = {
        provider: body.providerConfig.provider,
        name: body.providerConfig.name,
        senderId: body.providerConfig.senderId,
        apiUrl: body.providerConfig.apiUrl,
      };

      // Only update API key if user typed a new unmasked key
      if (body.providerConfig.apiKey && !body.providerConfig.apiKey.includes("...")) {
        updateData.apiKey = body.providerConfig.apiKey.trim();
      }

      await ApiCredentialModel.updateOne(
        { organizationId: orgObjId, isDefault: true },
        { $set: updateData },
        { upsert: true }
      );
    }

    return NextResponse.json({ success: true, message: "Settings saved successfully" });
  } catch (err: any) {
    console.error("[Settings API] Update error:", err);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
});
