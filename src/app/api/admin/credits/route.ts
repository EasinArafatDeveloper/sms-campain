import { NextRequest, NextResponse } from "next/server";
import { withTenant } from "@/lib/auth";
import { OrganizationModel } from "@/lib/db/models";
import { connectToDatabase } from "@/lib/db/connect";

export const POST = withTenant(
  async (req: NextRequest) => {
    try {
      await connectToDatabase();
      const body = await req.json();
      const { organizationId, amount, action } = body;

      if (!organizationId || typeof amount !== "number" || amount <= 0) {
        return NextResponse.json({ error: "Valid organizationId and positive amount required" }, { status: 400 });
      }

      let updateQuery: any = {};
      if (action === "set") {
        updateQuery = { $set: { smsCredits: amount } };
      } else {
        // default "add"
        updateQuery = { $inc: { smsCredits: amount } };
      }

      const org = await OrganizationModel.findByIdAndUpdate(organizationId, updateQuery, { new: true });
      if (!org) {
        return NextResponse.json({ error: "Organization not found" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: `Updated SMS credits for ${org.name}`,
        smsCredits: org.smsCredits,
      });
    } catch (err: any) {
      console.error("[Admin Credits API] Error:", err);
      return NextResponse.json({ error: "Failed to update credits" }, { status: 500 });
    }
  },
  { requireSuperAdmin: true }
);
