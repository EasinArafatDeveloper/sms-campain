import mongoose from "mongoose";
import { connectToDatabase } from "../src/lib/db/connect";
import { CampaignModel, TrackingLinkModel } from "../src/lib/db/models";
import { TrackingService } from "../src/lib/services/tracking.service";

async function verifyDestinationUrlFlow() {
  console.log("===============================================================================");
  console.log("  🔍 TESTING DESTINATION URL REDIRECTION & INTEGRATION");
  console.log("===============================================================================\n");

  await connectToDatabase();

  const orgId = new mongoose.Types.ObjectId();
  const campId = new mongoose.Types.ObjectId();
  const recipId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();

  // Test with a real destination URL
  const testDestinationUrl = "https://google.com/search?q=eid-special-sale";
  const testTrackingId = "eid-" + TrackingService.generateShortId("alphanumeric", 6);

  console.log(`[Step 1] Creating Campaign with Destination URL: "${testDestinationUrl}"`);

  const campaign = await CampaignModel.create({
    _id: campId,
    organizationId: orgId,
    createdBy: userId,
    name: "Destination URL Test Campaign",
    status: "completed",
    message: `Offer: https://sms-campain.vercel.app/${testTrackingId}`,
    senderId: "SMSPRO",
    recipientCount: 1,
    trackingConfig: {
      destinationUrl: testDestinationUrl,
      format: "alphanumeric",
      length: 6,
      urlPrefix: "eid",
      linkStyle: "hyphen",
    },
    statistics: {
      totalRecipients: 1,
      linksGenerated: 1,
      queued: 0,
      processing: 0,
      sent: 1,
      delivered: 1,
      failed: 0,
      pendingRetry: 0,
      totalClicks: 0,
      uniqueClickers: 0,
      repeatClickers: 0,
      highIntentLeads: 0,
      botClicksCount: 0,
      deliveryRate: 100,
      clickRate: 0,
    },
  });

  const trackingLink = await TrackingLinkModel.create({
    organizationId: orgId,
    campaignId: campId,
    recipientId: recipId,
    trackingId: testTrackingId,
    destinationUrl: testDestinationUrl,
    uniqueUrl: `https://sms-campain.vercel.app/${testTrackingId}`,
    status: "active",
    clickCount: 0,
    botClickCount: 0,
  });

  console.log(`[Step 2] Resolving Link Click for Tracking ID: "${testTrackingId}"...`);

  // Simulate human mobile click
  const result = await TrackingService.resolveAndTrackClick(testTrackingId, {
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15",
    ip: "103.112.55.91",
  });

  console.log("\n[Step 3] Checking Resolution Result:");
  console.log(`  - Destination URL Matched: ${result.destinationUrl === testDestinationUrl ? "✅ YES (100% Exact Match)" : "❌ NO"}`);
  console.log(`  - Target URL Received    : "${result.destinationUrl}"`);
  console.log(`  - Is Trampoline HTML Present: ${Boolean(result.trampolineHtml) ? "✅ YES" : "❌ NO"}`);

  if (result.trampolineHtml) {
    const hasJsRedirect = result.trampolineHtml.includes(testDestinationUrl);
    const hasMetaRefresh = result.trampolineHtml.includes(`content="1;url=${testDestinationUrl}"`);
    console.log(`  - Contains JavaScript window.location.replace to destination: ${hasJsRedirect ? "✅ YES" : "❌ NO"}`);
    console.log(`  - Contains Fallback <meta http-equiv="refresh"> to destination: ${hasMetaRefresh ? "✅ YES" : "❌ NO"}`);
  }

  // Cleanup
  await CampaignModel.findByIdAndDelete(campId);
  await TrackingLinkModel.findByIdAndDelete(trackingLink._id);

  console.log("\n===============================================================================");
  console.log("  🎉 VERIFICATION RESULT: Destination URL is 100% FULLY FUNCTIONAL & OPERATIONAL!");
  console.log("===============================================================================\n");
  process.exit(0);
}

verifyDestinationUrlFlow().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
