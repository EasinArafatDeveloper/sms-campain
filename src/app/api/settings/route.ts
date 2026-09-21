import { NextRequest, NextResponse } from "next/server";
import { withTenant, TenantContext } from "@/lib/auth";
import { OrganizationModel, ApiCredentialModel, UserModel } from "@/lib/db/models";
import { connectToDatabase } from "@/lib/db/connect";
import { getSmsProviderForOrg } from "@/lib/providers";
import { sanitizeUrl } from "@/lib/security";
import mongoose from "mongoose";
import { z } from "zod";

const SettingsUpdateBodySchema = z.object({
  organization: z
    .object({
      name: z.string().min(2).max(100).optional(),
      defaultSenderId: z.string().min(2).max(20).optional(),
      trackingDomain: z.string().url().optional().or(z.literal("")),
      settings: z
        .object({
          defaultTrackingLength: z.number().min(3).max(12).optional(),
          defaultTrackingFormat: z.enum(["numeric", "alphanumeric"]).optional(),
          retentionDays: z.number().min(7).max(365).optional(),
          enableWebhooks: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),
  providerConfig: z
    .object({
      provider: z.enum(["zendsms"]).default("zendsms"),
      name: z.string().min(1).max(100).optional(),
      senderId: z.string().min(2).max(20).optional(),
      apiUrl: z.string().optional().or(z.literal("")),
      apiKey: z.string().optional(),
    })
    .optional(),
});

export const GET = withTenant(async (req: NextRequest, ctx: TenantContext) => {
  try {
    const orgId = ctx.organizationId;
    await connectToDatabase();
    const orgObjId = new mongoose.Types.ObjectId(orgId);

    const org = await OrganizationModel.findById(orgObjId).lean();
    const providerCred = await ApiCredentialModel.findOne({ organizationId: orgObjId, isDefault: true }).lean();
    const teamMembers = await UserModel.find({ defaultOrganizationId: orgObjId }).select("-passwordHash").lean();

    // Check balance only if tenant configured their OWN custom BYOK API key (never leak central gateway balance)
    let balance: number | null = null;
    let maskedApiKey = "";

    if (providerCred?.apiKey && providerCred.apiKey.trim().length > 0) {
      maskedApiKey = providerCred.apiKey.length > 8
        ? `${providerCred.apiKey.slice(0, 6)}...${providerCred.apiKey.slice(-4)}`
        : "********";

      try {
        const provider = await getSmsProviderForOrg(orgId);
        const balanceRes = await provider.getBalance();
        balance = balanceRes.balance;
      } catch (e) {
        console.warn("[Settings API] Failed to fetch BYOK balance:", e);
      }
    }

    return NextResponse.json({
      organization: org,
      smsCredits: org?.smsCredits ?? 0,
      providerConfig: providerCred
        ? {
            ...providerCred,
            apiKey: maskedApiKey,
            hasCustomKey: !!providerCred.apiKey,
          }
        : null,
      balance,
      teamMembers,
    });
  } catch (err: any) {
    console.error("[Settings API] Error:", err);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
});

export const POST = withTenant(
  async (req: NextRequest, ctx: TenantContext) => {
    try {
      const orgId = ctx.organizationId;
      const body = await req.json();
      const validated = SettingsUpdateBodySchema.safeParse(body);

      if (!validated.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validated.error.format() },
          { status: 400 }
        );
      }

      await connectToDatabase();
      const orgObjId = new mongoose.Types.ObjectId(orgId);

      if (validated.data.organization) {
        const orgData = validated.data.organization;
        const setQuery: any = {};

        if (orgData.name) setQuery.name = orgData.name.trim();
        if (orgData.defaultSenderId) setQuery.defaultSenderId = orgData.defaultSenderId.trim();
        if (orgData.trackingDomain) {
          const cleanDomain = sanitizeUrl(orgData.trackingDomain);
          if (cleanDomain) setQuery.trackingDomain = cleanDomain;
        }

        if (orgData.settings) {
          if (orgData.settings.defaultTrackingLength !== undefined) {
            setQuery["settings.defaultTrackingLength"] = orgData.settings.defaultTrackingLength;
          }
          if (orgData.settings.defaultTrackingFormat !== undefined) {
            setQuery["settings.defaultTrackingFormat"] = orgData.settings.defaultTrackingFormat;
          }
          if (orgData.settings.retentionDays !== undefined) {
            setQuery["settings.retentionDays"] = orgData.settings.retentionDays;
          }
          if (orgData.settings.enableWebhooks !== undefined) {
            setQuery["settings.enableWebhooks"] = orgData.settings.enableWebhooks;
          }
        }

        if (Object.keys(setQuery).length > 0) {
          await OrganizationModel.updateOne({ _id: orgObjId }, { $set: setQuery });
        }
      }

      if (validated.data.providerConfig) {
        const provData = validated.data.providerConfig;

        // SSRF defense: only allow official ZendSMS API URL endpoints or empty
        let cleanApiUrl = "https://api.zendsms.com/api/v1/send-sms";
        if (provData.apiUrl && provData.apiUrl.trim().length > 0) {
          const parsedUrl = sanitizeUrl(provData.apiUrl);
          if (!parsedUrl || !parsedUrl.startsWith("https://api.zendsms.com/")) {
            return NextResponse.json(
              { error: "Invalid API URL. Only official ZendSMS HTTPS endpoints are permitted." },
              { status: 400 }
            );
          }
          cleanApiUrl = parsedUrl;
        }

        const updateData: any = {
          provider: "zendsms",
          name: provData.name || "ZendSMS Gateway",
          senderId: provData.senderId || "8809612781020",
          apiUrl: cleanApiUrl,
        };

        // Only update API key if user typed a new unmasked key
        if (provData.apiKey && !provData.apiKey.includes("...")) {
          updateData.apiKey = provData.apiKey.trim();
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
  },
  { requiredRoles: ["owner"] }
);
