import { Queue, Worker, Job } from "bullmq";
import Redis from "ioredis";
import { DeliveryService } from "../services/delivery.service";

const REDIS_URL = process.env.REDIS_URL;

let deliveryQueue: Queue | null = null;
let redisConnection: Redis | null = null;

if (REDIS_URL) {
  try {
    redisConnection = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    deliveryQueue = new Queue("sms-delivery", {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });
  } catch (err) {
    console.warn("[Queue] Redis connection initialization failed, using in-memory queue processor fallback.");
  }
}

export { deliveryQueue };

/**
 * Enqueue SMS Delivery batch
 */
export async function queueSmsBatch(organizationId: string, campaignId: string): Promise<void> {
  if (deliveryQueue) {
    await deliveryQueue.add("process-campaign-batch", { organizationId, campaignId });
  } else {
    // Process in background asynchronously
    setTimeout(async () => {
      try {
        await DeliveryService.processBatch(organizationId, 100);
      } catch (err) {
        console.error("[Queue] Error in fallback queue batch processor:", err);
      }
    }, 100);
  }
}
