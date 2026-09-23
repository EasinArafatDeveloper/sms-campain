import mongoose from "mongoose";
import { connectToDatabase } from "../src/lib/db/connect";
import { DeliveryService } from "../src/lib/services/delivery.service";
import { CampaignService } from "../src/lib/services/campaign.service";
import { OrganizationModel, CampaignModel } from "../src/lib/db/models";

async function runWorkerLoop() {
  console.log("[Postman Background Worker] Starting worker process...");
  await connectToDatabase();
  console.log("[Postman Background Worker] Connected to database.");

  while (true) {
    try {
      const activeOrgs = await OrganizationModel.find({ status: "active" }).select("_id name").lean();
      const activeOrgIds = activeOrgs.map((o) => o._id);
      let totalProcessed = 0;

      // Auto-start any "scheduled" campaign whose scheduledAt has arrived — this is the
      // only place scheduledAt actually takes effect, since campaigns are never
      // dispatch-eligible on their own (see CampaignService.enqueueForDelivery).
      const dueScheduled = await CampaignModel.find({
        organizationId: { $in: activeOrgIds },
        status: "scheduled",
        scheduledAt: { $lte: new Date() },
      })
        .select("_id organizationId name")
        .lean();

      for (const c of dueScheduled) {
        try {
          const claimed = await CampaignModel.findOneAndUpdate(
            { _id: c._id, status: "scheduled" },
            { $set: { status: "sending" } }
          );
          if (!claimed) continue; // already picked up by another worker instance
          await CampaignService.enqueueForDelivery(c.organizationId.toString(), c._id.toString());
          console.log(`[Worker] Auto-started scheduled campaign "${c.name}" (${c._id})`);
        } catch (err) {
          console.error(`[Worker] Failed to auto-start scheduled campaign ${c._id}:`, err);
        }
      }

      for (const org of activeOrgs) {
        const result = await DeliveryService.processBatch(org._id.toString(), 25);
        if (result.processed > 0) {
          totalProcessed += result.processed;
          console.log(`[Worker] Org: ${org.name} | Sent: ${result.sent} | Failed: ${result.failed}`);
        }
      }

      // If no jobs processed, sleep 3 seconds to preserve CPU
      if (totalProcessed === 0) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } else {
        // Active load, sleep 500ms
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (err) {
      console.error("[Worker] Error in worker loop:", err);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

runWorkerLoop().catch((err) => {
  console.error("[Worker] Fatal error:", err);
  process.exit(1);
});
