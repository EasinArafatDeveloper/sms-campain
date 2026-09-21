import { NextRequest, NextResponse } from "next/server";
import { withTenant, TenantContext } from "@/lib/auth";
import { OrganizationModel, UserModel, AuditLogModel } from "@/lib/db/models";
import { connectToDatabase } from "@/lib/db/connect";
import mongoose from "mongoose";

export const POST = withTenant(
  async (req: NextRequest, ctx: TenantContext) => {
    try {
      await connectToDatabase();
      const body = await req.json();
      const { target, action, ids, amount, reason, paymentRef, plan } = body;

      if (!target || !action || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json(
          { error: "Invalid payload. 'target', 'action', and non-empty 'ids' array are required." },
          { status: 400 }
        );
      }

      const validObjectIds = ids
        .filter((id: string) => mongoose.isValidObjectId(id))
        .map((id: string) => new mongoose.Types.ObjectId(id));

      if (validObjectIds.length === 0) {
        return NextResponse.json({ error: "No valid IDs provided." }, { status: 400 });
      }

      let affectedCount = 0;

      if (target === "tenants") {
        if (action === "activate" || action === "suspend") {
          const status = action === "activate" ? "active" : "suspended";
          const res = await OrganizationModel.updateMany(
            { _id: { $in: validObjectIds } },
            { $set: { status } }
          );
          affectedCount = res.modifiedCount;

          // Record audit log
          await AuditLogModel.insertMany(
            validObjectIds.map((orgId) => ({
              organizationId: orgId,
              userId: new mongoose.Types.ObjectId(ctx.userId),
              userName: ctx.userName,
              action: `BULK_ORGANIZATION_${status.toUpperCase()}`,
              resourceType: "Organization",
              resourceId: orgId.toString(),
              metadata: {
                adminEmail: ctx.userEmail,
                bulkAction: action,
                totalSelected: ids.length,
              },
            }))
          );
        } else if (action === "add_credits") {
          const addAmount = Number(amount);
          if (isNaN(addAmount) || addAmount <= 0) {
            return NextResponse.json(
              { error: "Amount must be a positive number for bulk credit addition." },
              { status: 400 }
            );
          }

          const res = await OrganizationModel.updateMany(
            { _id: { $in: validObjectIds } },
            { $inc: { smsCredits: addAmount } }
          );
          affectedCount = res.modifiedCount;

          await AuditLogModel.insertMany(
            validObjectIds.map((orgId) => ({
              organizationId: orgId,
              userId: new mongoose.Types.ObjectId(ctx.userId),
              userName: ctx.userName,
              action: "BULK_CREDITS_ADD",
              resourceType: "Organization",
              resourceId: orgId.toString(),
              metadata: {
                adminEmail: ctx.userEmail,
                amount: addAmount,
                reason: reason || "Bulk Admin Top-up",
                paymentRef: paymentRef || "",
              },
            }))
          );
        } else if (action === "change_plan") {
          if (!plan || !["starter", "growth", "enterprise"].includes(plan)) {
            return NextResponse.json({ error: "Invalid plan specified." }, { status: 400 });
          }

          const res = await OrganizationModel.updateMany(
            { _id: { $in: validObjectIds } },
            { $set: { plan } }
          );
          affectedCount = res.modifiedCount;

          await AuditLogModel.insertMany(
            validObjectIds.map((orgId) => ({
              organizationId: orgId,
              userId: new mongoose.Types.ObjectId(ctx.userId),
              userName: ctx.userName,
              action: "BULK_PLAN_CHANGE",
              resourceType: "Organization",
              resourceId: orgId.toString(),
              metadata: {
                adminEmail: ctx.userEmail,
                newPlan: plan,
              },
            }))
          );
        }
      } else if (target === "users") {
        if (action === "activate" || action === "suspend") {
          const status = action === "activate" ? "active" : "disabled";

          // Prevent disabling the current superadmin account
          const safeUserIds = validObjectIds.filter((id) => id.toString() !== ctx.userId.toString());

          const res = await UserModel.updateMany(
            { _id: { $in: safeUserIds } },
            { $set: { status } }
          );
          affectedCount = res.modifiedCount;

          await AuditLogModel.insertMany(
            safeUserIds.map((uId) => ({
              organizationId: new mongoose.Types.ObjectId(ctx.organizationId),
              userId: new mongoose.Types.ObjectId(ctx.userId),
              userName: ctx.userName,
              action: `BULK_USER_${status.toUpperCase()}`,
              resourceType: "User",
              resourceId: uId.toString(),
              metadata: {
                adminEmail: ctx.userEmail,
                bulkAction: action,
              },
            }))
          );
        }
      }

      return NextResponse.json({
        success: true,
        message: `Bulk action '${action}' completed successfully on ${affectedCount} ${target}.`,
        affectedCount,
      });
    } catch (err: any) {
      console.error("[Admin Bulk Action API] Error:", err);
      return NextResponse.json({ error: err.message || "Failed to execute bulk action" }, { status: 500 });
    }
  },
  { requireSuperAdmin: true }
);
