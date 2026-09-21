import mongoose from "mongoose";
import { connectToDatabase } from "../src/lib/db/connect";
import { DeliveryService } from "../src/lib/services/delivery.service";
import { OrganizationModel } from "../src/lib/db/models";

async function runWorkerLoop() {
  console.log("[SMSPro Background Worker] Starting worker process...");
  await connectToDatabase();
  console.log("[SMSPro Background Worker] Connected to database.");

  while (true) {
    try {
      const activeOrgs = await OrganizationModel.find({ status: "active" }).select("_id name").lean();
      let totalProcessed = 0;

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
