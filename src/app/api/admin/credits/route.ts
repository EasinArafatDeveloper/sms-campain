import { NextRequest, NextResponse } from "next/server";
import { withTenant, TenantContext } from "@/lib/auth";
import { OrganizationModel, AuditLogModel } from "@/lib/db/models";
import { connectToDatabase } from "@/lib/db/connect";
import mongoose from "mongoose";

export const POST = withTenant(
  async (req: NextRequest, ctx: TenantContext) => {
    try {
      await connectToDatabase();
      const body = await req.json();
      const { organizationId, amount, action = "add" } = body;

      if (!organizationId || typeof amount !== "number") {
        return NextResponse.json({ error: "Valid organizationId and numeric amount required" }, { status: 400 });
      }

      if (action === "set" && amount < 0) {
        return NextResponse.json({ error: "Credit balance cannot be set to a negative number" }, { status: 400 });
      }

      if ((action === "add" || action === "deduct") && amount <= 0) {
        return NextResponse.json({ error: "Amount must be a positive number for add/deduct actions" }, { status: 400 });
      }

      const orgBefore = await OrganizationModel.findById(organizationId);
      if (!orgBefore) {
        return NextResponse.json({ error: "Organization not found" }, { status: 404 });
      }

      let newCredits = orgBefore.smsCredits;
      if (action === "set") {
        newCredits = Math.max(0, amount);
      } else if (action === "deduct") {
        newCredits = Math.max(0, orgBefore.smsCredits - amount);
      } else {
        // default "add"
        newCredits = orgBefore.smsCredits + amount;
      }

      orgBefore.smsCredits = newCredits;
      await orgBefore.save();

      // Record SuperAdmin Audit Log
      await AuditLogModel.create({
        organizationId: new mongoose.Types.ObjectId(organizationId),
        userId: new mongoose.Types.ObjectId(ctx.userId),
        userName: ctx.userName,
        action: `CREDITS_${action.toUpperCase()}`,
        resourceType: "Organization",
        resourceId: organizationId,
        metadata: {
          adminEmail: ctx.userEmail,
          previousCredits: orgBefore.smsCredits,
          newCredits,
          amount,
          action,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Updated SMS credits for ${orgBefore.name}`,
        smsCredits: orgBefore.smsCredits,
      });
    } catch (err: any) {
      console.error("[Admin Credits API] Error:", err);
      return NextResponse.json({ error: "Failed to update credits" }, { status: 500 });
    }
  },
  { requireSuperAdmin: true }
);
