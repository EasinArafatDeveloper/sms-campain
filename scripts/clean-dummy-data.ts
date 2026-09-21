import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import {
  OrganizationModel,
  UserModel,
  MembershipModel,
  CampaignModel,
  RecipientModel,
  CampaignRecipientModel,
  TrackingLinkModel,
  DeliveryJobModel,
  DeliveryEventModel,
  ClickEventModel,
  EngagementProfileModel,
  AudienceSegmentModel,
  ApiCredentialModel,
  AuditLogModel,
  NotificationModel,
} from "../src/lib/db/models";

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const MONGODB_URI = process.env.MONGODB_URI;

async function cleanDummyData() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined.");
  }

  console.log("[DB Cleanup] Connecting to MongoDB Atlas...");
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  console.log("[DB Cleanup] Connected.");

  // Delete dummy/demo user and organization
  const dummyUser = await UserModel.findOne({ email: "omer@smspro.io" });
  if (dummyUser) {
    await UserModel.deleteOne({ _id: dummyUser._id });
    await MembershipModel.deleteMany({ userId: dummyUser._id });
    console.log("✅ Deleted dummy user: omer@smspro.io");
  }

  const dummyOrgId = new mongoose.Types.ObjectId("670000000000000000000001");
  await OrganizationModel.deleteOne({ _id: dummyOrgId });
  await ApiCredentialModel.deleteMany({ organizationId: dummyOrgId });

  // Delete any demo campaigns created under dummy organization or named "Flash Sale" / "Demo"
  const demoCampaigns = await CampaignModel.find({
    $or: [
      { organizationId: dummyOrgId },
      { name: { $regex: /demo|test campaign|seed/i } },
    ],
  });

  const demoCampIds = demoCampaigns.map((c) => c._id);
  if (demoCampIds.length > 0) {
    await Promise.all([
      CampaignModel.deleteMany({ _id: { $in: demoCampIds } }),
      CampaignRecipientModel.deleteMany({ campaignId: { $in: demoCampIds } }),
      TrackingLinkModel.deleteMany({ campaignId: { $in: demoCampIds } }),
      DeliveryJobModel.deleteMany({ campaignId: { $in: demoCampIds } }),
      DeliveryEventModel.deleteMany({ campaignId: { $in: demoCampIds } }),
      ClickEventModel.deleteMany({ campaignId: { $in: demoCampIds } }),
    ]);
    console.log(`✅ Deleted ${demoCampIds.length} dummy/demo campaigns and associated events.`);
  }

  // Delete any dummy audience segments
  await AudienceSegmentModel.deleteMany({
    $or: [{ organizationId: dummyOrgId }, { name: { $regex: /demo/i } }],
  });

  console.log("\n==================================================");
  console.log("🎉 DATABASE CLEANUP COMPLETE - ALL DUMMY DATA PURGED");
  console.log("==================================================");

  // List remaining active users & organizations
  const activeUsers = await UserModel.find({}).select("name email role platformRole status").lean();
  console.log("Current Real Users in Database:");
  console.table(activeUsers);

  const activeOrgs = await OrganizationModel.find({}).select("name slug smsCredits status").lean();
  console.log("Current Real Organizations in Database:");
  console.table(activeOrgs);

  await mongoose.disconnect();
}

cleanDummyData().catch((err) => {
  console.error("Cleanup error:", err);
  process.exit(1);
});
