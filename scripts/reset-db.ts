import mongoose from "mongoose";
import bcrypt from "bcryptjs";
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

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://easinnextleaders_db_user:SXOqQezYCRdwSzVW@cluster0.qnhfjkl.mongodb.net/smspro_production?retryWrites=true&w=majority";

async function resetClean() {
  console.log("[Clean Reset] Connecting to MongoDB Atlas...");
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
  });
  console.log("[Clean Reset] Connected.");

  console.log("[Clean Reset] Wiping all test and dummy records from database...");
  await Promise.all([
    OrganizationModel.deleteMany({}),
    UserModel.deleteMany({}),
    MembershipModel.deleteMany({}),
    CampaignModel.deleteMany({}),
    RecipientModel.deleteMany({}),
    CampaignRecipientModel.deleteMany({}),
    TrackingLinkModel.deleteMany({}),
    DeliveryJobModel.deleteMany({}),
    DeliveryEventModel.deleteMany({}),
    ClickEventModel.deleteMany({}),
    EngagementProfileModel.deleteMany({}),
    AudienceSegmentModel.deleteMany({}),
    ApiCredentialModel.deleteMany({}),
    AuditLogModel.deleteMany({}),
    NotificationModel.deleteMany({}),
  ]);

  console.log("[Clean Reset] Initializing pristine workspace & ZendSMS configuration...");

  const org = await OrganizationModel.create({
    _id: new mongoose.Types.ObjectId("670000000000000000000001"),
    name: "SMSPro Enterprise",
    slug: "smspro-enterprise",
    plan: "enterprise",
    status: "active",
    senderIds: ["8809612781020", "MYBRAND", "SMSPRO"],
    defaultSenderId: "8809612781020",
    trackingDomain: "https://go.mybrand.com",
    settings: {
      defaultTrackingLength: 6,
      defaultTrackingFormat: "numeric",
      retentionDays: 90,
      enableWebhooks: true,
    },
  });

  const passwordHash = await bcrypt.hash("password123", 10);

  const owner = await UserModel.create({
    _id: new mongoose.Types.ObjectId("670000000000000000000002"),
    name: "Omer Sharif",
    email: "omer@smspro.io",
    passwordHash,
    role: "owner",
    status: "active",
    defaultOrganizationId: org._id,
  });

  await MembershipModel.create({
    organizationId: org._id,
    userId: owner._id,
    role: "owner",
    permissions: ["*"],
  });

  // ZendSMS Gateway Credential
  await ApiCredentialModel.create({
    organizationId: org._id,
    provider: "zendsms",
    name: "ZendSMS Primary Gateway",
    apiKey: process.env.ZENDSMS_API_KEY || "mock_reset_key",
    senderId: process.env.ZENDSMS_SENDER_ID || "8809612781020",
    apiUrl: process.env.ZENDSMS_API_URL || "https://api.zendsms.com/api/v1/send-sms",
    isDefault: true,
    status: "active",
    balance: 500,
  });

  console.log("[Clean Reset] Workspace reset complete! Database is 100% clean and fresh.");
  await mongoose.disconnect();
}

resetClean().catch((err) => {
  console.error("[Clean Reset] Error:", err);
  process.exit(1);
});
