import { connectToDatabase } from "../src/lib/db/connect";
import { CampaignModel, TrackingLinkModel, ClickEventModel, CampaignRecipientModel } from "../src/lib/db/models";

async function cleanUnverifiedClicks() {
  await connectToDatabase();
  console.log("=== CLEANING UNVERIFIED / FAKE BOT CLICKS ===");

  // Find all click events that lack clientMeta or are unverified
  const unverifiedEvents = await ClickEventModel.find({
    $or: [
      { clientMeta: { $exists: false } },
      { "clientMeta.verifiedAt": { $exists: false } },
      { userAgent: { $regex: /linux x86_64/i } },
    ],
  }).lean();

  console.log(`Found ${unverifiedEvents.length} unverified / Linux crawler click events to fix.`);

  for (const ev of unverifiedEvents) {
    // Delete the unverified fake click event
    await ClickEventModel.deleteOne({ _id: ev._id });
  }

  // Reset tracking links
  await TrackingLinkModel.updateMany(
    { trackingId: { $in: ["eid-zwpfv", "eid-btj6q"] } },
    {
      $set: {
        clickCount: 0,
        botClickCount: 2,
        firstClickedAt: null,
        lastClickedAt: null,
      },
    }
  );

  // Reset campaign recipients
  await CampaignRecipientModel.updateMany(
    { trackingId: { $in: ["eid-zwpfv", "eid-btj6q"] } },
    {
      $set: {
        clickStatus: "pending",
        clickCount: 0,
        firstClickedAt: null,
        lastClickedAt: null,
      },
    }
  );

  // Reset Campaign statistics
  await CampaignModel.updateMany(
    { name: /test/i },
    {
      $set: {
        "statistics.totalClicks": 0,
        "statistics.uniqueClickers": 0,
        "statistics.repeatClickers": 0,
        "statistics.highIntentLeads": 0,
        "statistics.clickRate": 0,
      },
      $inc: {
        "statistics.botClicksCount": 2,
      },
    }
  );

  console.log("✅ Cleanup complete: Reset fake bot clicks to 0.");
  process.exit(0);
}

cleanUnverifiedClicks().catch(console.error);
