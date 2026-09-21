import { connectToDatabase } from "../src/lib/db/connect";
import { ClickEventModel } from "../src/lib/db/models";

async function checkClientMeta() {
  await connectToDatabase();
  const events = await ClickEventModel.find({ trackingId: { $in: ["eid-zwpfv", "eid-btj6q"] } }).lean();
  console.log("ClientMeta of events:\n", JSON.stringify(events.map(e => ({
    trackingId: e.trackingId,
    isBot: e.isBot,
    isHumanVerified: e.isHumanVerified,
    clientMeta: e.clientMeta,
    metadata: e.metadata,
    userAgent: e.userAgent
  })), null, 2));
  process.exit(0);
}

checkClientMeta().catch(console.error);
