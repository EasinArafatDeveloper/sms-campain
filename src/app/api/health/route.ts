import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { getSmsProviderForOrg } from "@/lib/providers";

export async function GET() {
  const start = Date.now();
  let dbStatus = "healthy";
  let smsStatus = "unknown";

  try {
    const db = await connectToDatabase();
    dbStatus = db.connection.readyState === 1 ? "connected" : "connecting";
  } catch (err: any) {
    dbStatus = `unhealthy: ${err.message}`;
  }

  try {
    const provider = await getSmsProviderForOrg();
    const pHealth = await provider.healthCheck();
    smsStatus = pHealth.healthy ? "connected" : `degraded: ${pHealth.message}`;
  } catch (err: any) {
    smsStatus = `failed: ${err.message}`;
  }

  const responseTime = Date.now() - start;

  return NextResponse.json({
    status: dbStatus === "connected" ? "healthy" : "degraded",
    service: "SMSPro SaaS Core Engine",
    timestamp: new Date().toISOString(),
    latencyMs: responseTime,
    checks: {
      database: dbStatus,
      smsGateway: smsStatus,
      redisQueue: process.env.REDIS_URL ? "configured" : "in-process-fallback",
    },
  });
}
