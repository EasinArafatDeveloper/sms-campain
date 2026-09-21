import { connectToDatabase } from "../src/lib/db/connect";
import { ClickEventModel, TrackingLinkModel, CampaignRecipientModel, CampaignModel } from "../src/lib/db/models";

async function inspectClicks() {
  await connectToDatabase();
  console.log("=== INSPECTING RECENT CLICK EVENTS ===");
  const events = await ClickEventModel.find().sort({ clickedAt: -1 }).limit(10).lean();
  console.log("Recent 10 Click Events:\n", JSON.stringify(events, null, 2));

  console.log("\n=== INSPECTING RECENT TRACKING LINKS ===");
  const links = await TrackingLinkModel.find().sort({ updatedAt: -1 }).limit(5).lean();
  console.log("Recent 5 Tracking Links:\n", JSON.stringify(links, null, 2));

  console.log("\n=== INSPECTING RECENT CAMPAIGN RECIPIENTS ===");
  const recips = await CampaignRecipientModel.find({ clickCount: { $gt: 0 } }).sort({ lastClickedAt: -1 }).limit(5).lean();
  console.log("Recipients with clicks:\n", JSON.stringify(recips, null, 2));

  process.exit(0);
}

inspectClicks().catch(console.error);
