import { NextRequest, NextResponse } from "next/server";
import { withTenant, TenantContext } from "@/lib/auth";
import { getSmsProviderForOrg } from "@/lib/providers";
import { SendTestSmsSchema } from "@/lib/validations";
import { rateLimit, getClientIp } from "@/lib/security";
import { OrganizationModel, ApiCredentialModel } from "@/lib/db/models";
import mongoose from "mongoose";

export const POST = withTenant(
  async (req: NextRequest, ctx: TenantContext) => {
    try {
      const orgId = ctx.organizationId;
      const ip = getClientIp(req);

      // 1. Rate limit test SMS: max 5 requests per 10 min per org and per IP
      const orgLimiter = await rateLimit(`test_sms:org:${orgId}`, 5, 10 * 60 * 1000);
      const ipLimiter = await rateLimit(`test_sms:ip:${ip}`, 10, 10 * 60 * 1000);

      if (!orgLimiter.allowed || !ipLimiter.allowed) {
        return NextResponse.json(
          { error: "Too many test SMS requests. Please wait a few minutes before sending another test message." },
          { status: 429 }
        );
      }

      const body = await req.json();
      const validated = SendTestSmsSchema.safeParse(body);

      if (!validated.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validated.error.format() },
          { status: 400 }
        );
      }

      const orgObjId = new mongoose.Types.ObjectId(orgId);

      // 2. Check if tenant has custom BYOK credentials
      const customCred = await ApiCredentialModel.findOne({
        organizationId: orgObjId,
        isDefault: true,
        apiKey: { $exists: true, $ne: "" },
      }).lean();

      let didDeductCredit = false;

      // 3. If using shared platform gateway, atomically deduct 1 credit
      if (!customCred || !customCred.apiKey) {
        const deductResult = await OrganizationModel.updateOne(
          { _id: orgObjId, smsCredits: { $gte: 1 } },
          { $inc: { smsCredits: -1 } }
        );

        if (deductResult.modifiedCount === 0) {
          return NextResponse.json(
            {
              error: "Insufficient SMS credits",
              message: "You have 0 SMS credits remaining. Please top up your wallet or configure your own ZendSMS API Key in settings.",
            },
            { status: 400 }
          );
        }

        didDeductCredit = true;
      }

      const provider = await getSmsProviderForOrg(orgId);
      const result = await provider.sendSms({
        to: validated.data.phone,
        message: validated.data.message,
        senderId: validated.data.senderId,
      });

      if (!result.success) {
        // Refund deducted credit if SMS dispatch failed
        if (didDeductCredit) {
          await OrganizationModel.updateOne({ _id: orgObjId }, { $inc: { smsCredits: 1 } });
        }

        return NextResponse.json(
          { error: result.error || "SMS sending failed", details: result },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Test SMS dispatched successfully",
        providerMessageId: result.providerMessageId,
        creditsRemaining: didDeductCredit
          ? (await OrganizationModel.findById(orgObjId).select("smsCredits").lean())?.smsCredits
          : undefined,
        raw: result.rawResponse,
      });
    } catch (err: any) {
      console.error("[Test SMS API] Error:", err);
      return NextResponse.json({ error: err.message || "Failed to send test SMS" }, { status: 500 });
    }
  },
  { requiredRoles: ["owner", "admin"] }
);
