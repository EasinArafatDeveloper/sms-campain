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

async function seed() {
  console.log("[Seed] Connecting to MongoDB Atlas...");
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
  });
  console.log("[Seed] Connected successfully to Atlas.");

  console.log("[Seed] Clearing existing demo collections...");
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

  console.log("[Seed] Creating Organization & Owner User...");
  const org = await OrganizationModel.create({
    _id: new mongoose.Types.ObjectId("670000000000000000000001"),
    name: "SMSPro Enterprise",
    slug: "smspro-enterprise",
    plan: "enterprise",
    status: "active",
    senderIds: ["8809648910379", "MYBRAND", "SMSPRO"],
    defaultSenderId: "8809648910379",
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

  // BulkSMSBD API Credential
  await ApiCredentialModel.create({
    organizationId: org._id,
    provider: "bulksmsbd",
    name: "BulkSMSBD Primary Gateway",
    apiKey: "xkp2EbUxxu2vRtC6ycRE",
    senderId: "8809648910379",
    apiUrl: "http://bulksmsbd.net/api/smsapi",
    isDefault: true,
    status: "active",
    balance: 15420.5,
  });

  console.log("[Seed] Creating Primary & Historical Campaigns (128 total)...");
  const primaryCampaign = await CampaignModel.create({
    _id: new mongoose.Types.ObjectId("670000000000000000000010"),
    organizationId: org._id,
    name: "September Product Promotion",
    senderId: "8809648910379",
    message: "Special September offer is live. Get 20% off today. Click here: {TRACKABLE_LINK}",
    status: "completed",
    audienceName: "September Customer Database",
    recipientCount: 5000,
    trackingConfig: {
      destinationUrl: "https://mybrand.com/offer",
      format: "numeric",
      length: 6,
    },
    statistics: {
      totalRecipients: 5000,
      linksGenerated: 5000,
      queued: 0,
      processing: 0,
      sent: 5000,
      delivered: 4872,
      failed: 28,
      pendingRetry: 22,
      totalClicks: 1284,
      uniqueClickers: 742,
      repeatClickers: 186,
      highIntentLeads: 64,
      deliveryRate: 97.4,
      clickRate: 15.2,
    },
    createdBy: owner._id,
  });

  const otherCampaigns = [
    {
      name: "Flash Weekend 20% Discount",
      senderId: "8809648910379",
      message: "Weekend Flash Sale! 20% off all apparel. Shop now: {TRACKABLE_LINK}",
      status: "completed",
      recipientCount: 5000,
      statistics: {
        totalRecipients: 5000,
        linksGenerated: 5000,
        queued: 0,
        processing: 0,
        sent: 5000,
        delivered: 4890,
        failed: 15,
        pendingRetry: 0,
        totalClicks: 1410,
        uniqueClickers: 820,
        repeatClickers: 210,
        highIntentLeads: 78,
        deliveryRate: 97.8,
        clickRate: 16.8,
      },
    },
    {
      name: "New Fall Collection VIP Access",
      senderId: "8809648910379",
      message: "Exclusive VIP preview of Fall 2026. Access link: {TRACKABLE_LINK}",
      status: "completed",
      recipientCount: 5000,
      statistics: {
        totalRecipients: 5000,
        linksGenerated: 5000,
        queued: 0,
        processing: 0,
        sent: 5000,
        delivered: 4810,
        failed: 35,
        pendingRetry: 0,
        totalClicks: 980,
        uniqueClickers: 610,
        repeatClickers: 140,
        highIntentLeads: 42,
        deliveryRate: 96.2,
        clickRate: 12.7,
      },
    },
    {
      name: "Cart Abandonment Reminder",
      senderId: "8809648910379",
      message: "Your bag is waiting for you! Complete order here: {TRACKABLE_LINK}",
      status: "sending",
      recipientCount: 1200,
      statistics: {
        totalRecipients: 1200,
        linksGenerated: 1200,
        queued: 50,
        processing: 100,
        sent: 1050,
        delivered: 1020,
        failed: 10,
        pendingRetry: 10,
        totalClicks: 340,
        uniqueClickers: 220,
        repeatClickers: 45,
        highIntentLeads: 18,
        deliveryRate: 97.1,
        clickRate: 21.5,
      },
    },
  ];

  for (const c of otherCampaigns) {
    await CampaignModel.create({
      organizationId: org._id,
      name: c.name,
      senderId: c.senderId,
      message: c.message,
      status: c.status,
      recipientCount: c.recipientCount,
      trackingConfig: {
        destinationUrl: "https://mybrand.com/shop",
        format: "numeric",
        length: 6,
      },
      statistics: c.statistics,
      createdBy: owner._id,
    });
  }

  // Create 124 background historical campaigns to total 128
  const bulkCampaigns = [];
  for (let i = 5; i <= 128; i++) {
    bulkCampaigns.push({
      organizationId: org._id,
      name: `Promo Broadcast #${i}`,
      senderId: "8809648910379",
      message: `Exclusive subscriber offer #${i}: {TRACKABLE_LINK}`,
      status: "completed",
      recipientCount: 9700,
      trackingConfig: {
        destinationUrl: "https://mybrand.com/promo",
        format: "numeric",
        length: 6,
      },
      statistics: {
        totalRecipients: 9700,
        linksGenerated: 9700,
        queued: 0,
        processing: 0,
        sent: 9700,
        delivered: 9400,
        failed: 120,
        pendingRetry: 0,
        totalClicks: 310,
        uniqueClickers: 130,
        repeatClickers: 38,
        highIntentLeads: 8,
        deliveryRate: 96.9,
        clickRate: 14.8,
      },
      createdBy: owner._id,
      createdAt: new Date(Date.now() - i * 24 * 3600 * 1000),
    });
  }
  await CampaignModel.insertMany(bulkCampaigns);

  console.log("[Seed] Creating 5,000 Recipients and Tracking Links...");
  const sampleTrackingIds = ["583214", "924731", "A8K72P", "471928", "Z9X3QK", "619284", "738192", "849201"];
  const recipientBatch = [];
  const trackingBatch = [];
  const campaignRecipBatch = [];
  const deliveryJobBatch = [];
  const engagementBatch = [];

  const firstNames = ["Tanvir", "Afsana", "Mahmud", "Farhana", "Rashedul", "Nusrat", "Imran", "Sadia", "Zubair", "Tania"];
  const lastNames = ["Ahmed", "Khan", "Hasan", "Islam", "Karim", "Jahan", "Hossain", "Chowdhury", "Rahman", "Akter"];

  for (let i = 0; i < 5000; i++) {
    const recipId = new mongoose.Types.ObjectId();
    const phone = `88017${(10000000 + i).toString().slice(-8)}`;
    const name = `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`;
    const customId = `USR-${1000 + i}`;

    recipientBatch.push({
      _id: recipId,
      organizationId: org._id,
      phone,
      name,
      customId,
      status: "active",
    });

    const trackingId = i < sampleTrackingIds.length ? sampleTrackingIds[i] : `${500000 + i}`;
    const trackingLinkId = new mongoose.Types.ObjectId();
    const uniqueUrl = `https://go.mybrand.com/${trackingId}`;
    const isClicker = i < 742;
    const isRepeatClicker = i < 186;
    const isHighIntent = i < 64 || i < 1126; // 1,126 overall high-intent leads in system

    trackingBatch.push({
      _id: trackingLinkId,
      organizationId: org._id,
      campaignId: primaryCampaign._id,
      recipientId: recipId,
      trackingId,
      destinationUrl: "https://mybrand.com/offer",
      uniqueUrl,
      status: "active",
      clickCount: isRepeatClicker ? 4 : isClicker ? 1 : 0,
      firstClickedAt: isClicker ? new Date(Date.now() - 3600000 * 24) : undefined,
      lastClickedAt: isClicker ? new Date() : undefined,
    });

    const isDelivered = i < 4872;
    const isFailed = i >= 4872 && i < 4900;

    campaignRecipBatch.push({
      organizationId: org._id,
      campaignId: primaryCampaign._id,
      recipientId: recipId,
      phone,
      recipientName: name,
      trackingLinkId,
      trackingId,
      trackingUrl: uniqueUrl,
      personalizedMessage: `Special September offer is live. Get 20% off today. Click here: ${uniqueUrl}`,
      deliveryStatus: isDelivered ? "delivered" : isFailed ? "failed" : "pending_retry",
      clickStatus: isClicker ? "clicked" : "not_clicked",
      clickCount: isRepeatClicker ? 4 : isClicker ? 1 : 0,
      firstClickedAt: isClicker ? new Date(Date.now() - 3600000 * 24) : undefined,
      lastClickedAt: isClicker ? new Date() : undefined,
      providerMessageId: `BD-${1000000 + i}`,
      sentAt: new Date(Date.now() - 3600000 * 30),
      deliveredAt: isDelivered ? new Date(Date.now() - 3600000 * 29) : undefined,
    });

    deliveryJobBatch.push({
      organizationId: org._id,
      campaignId: primaryCampaign._id,
      recipientId: recipId,
      trackingId,
      phone,
      message: `Special September offer is live. Get 20% off today. Click here: ${uniqueUrl}`,
      senderId: "8809648910379",
      provider: "bulksmsbd",
      status: isDelivered ? "delivered" : isFailed ? "failed" : "pending_retry",
      attempts: isFailed ? 3 : 1,
      maxAttempts: 3,
      providerMessageId: `BD-${1000000 + i}`,
    });

    // Engagement Profile (1,126 Highly Active, 824 Engaged, 3,050 Low Engagement)
    const leadStatus =
      i < 1126 ? "highly_active" : i < 1126 + 824 ? "engaged" : "low_engagement";
    const campaignsClicked = leadStatus === "highly_active" ? 3 + (i % 3) : leadStatus === "engaged" ? 1 + (i % 2) : 0;
    const totalClicks = leadStatus === "highly_active" ? 5 + (i % 6) : leadStatus === "engaged" ? 1 + (i % 2) : 0;
    const score = leadStatus === "highly_active" ? 85 + (i % 15) : leadStatus === "engaged" ? 50 + (i % 20) : 0;

    engagementBatch.push({
      organizationId: org._id,
      recipientId: recipId,
      phone,
      recipientName: name,
      campaignsReceived: 4,
      campaignsClicked,
      campaignIdsClicked: [primaryCampaign._id],
      totalClicks,
      firstClickAt: totalClicks > 0 ? new Date(Date.now() - 86400000 * 20) : undefined,
      lastClickAt: totalClicks > 0 ? new Date(Date.now() - 86400000 * (i % 15)) : undefined,
      engagementScore: score,
      leadStatus,
    });
  }

  console.log("[Seed] Inserting batches in chunks...");
  await RecipientModel.insertMany(recipientBatch);
  await TrackingLinkModel.insertMany(trackingBatch);
  await CampaignRecipientModel.insertMany(campaignRecipBatch);
  await DeliveryJobModel.insertMany(deliveryJobBatch);
  await EngagementProfileModel.insertMany(engagementBatch);

  console.log("[Seed] Creating Audience Segments & Audit Logs...");
  await AudienceSegmentModel.create([
    {
      organizationId: org._id,
      name: "Highly Active SMS Users",
      description: "Clicked at least 3 campaigns, >=2 clicks, within 30 days",
      rules: [
        { field: "campaignsClicked", operator: "gte", value: 3 },
        { field: "totalClicks", operator: "gte", value: 2 },
        { field: "lastClickWithinDays", operator: "lte", value: 30 },
      ],
      estimatedCount: 1126,
      isSystem: true,
      createdBy: owner._id,
    },
    {
      organizationId: org._id,
      name: "Engaged Campaign Clickers",
      description: "Clicked at least 1 campaign within 60 days",
      rules: [
        { field: "campaignsClicked", operator: "gte", value: 1 },
        { field: "totalClicks", operator: "gte", value: 1 },
        { field: "lastClickWithinDays", operator: "lte", value: 60 },
      ],
      estimatedCount: 824,
      isSystem: true,
      createdBy: owner._id,
    },
  ]);

  await AuditLogModel.create({
    organizationId: org._id,
    userId: owner._id,
    userName: "Omer Sharif",
    action: "SYSTEM_INITIALIZATION",
    resourceType: "organization",
    resourceId: org._id.toString(),
    metadata: { initialCampaigns: 128, initialRecipients: 5000, highIntentLeads: 1126 },
  });

  console.log("[Seed] Seeding completed successfully! All collections ready.");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("[Seed] Error:", err);
  process.exit(1);
});
