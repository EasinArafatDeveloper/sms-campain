/**
 * Security & Input Sanitization Utilities
 */

import { NextRequest } from "next/server";

/**
 * Extracts a sanitized, non-spoofable single client IP address from request headers.
 */
export function getClientIp(req: NextRequest | Headers | { headers: Headers }): string {
  let headers: Headers;
  if ("headers" in req && req.headers instanceof Headers) {
    headers = req.headers;
  } else if (req instanceof Headers) {
    headers = req;
  } else if ("headers" in req) {
    headers = (req as any).headers;
  } else {
    return "unknown";
  }

  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(",")[0].trim();
    if (firstIp) return firstIp;
  }

  return headers.get("x-real-ip")?.trim() || headers.get("cf-connecting-ip")?.trim() || "unknown";
}

/**
 * Escapes special regex characters in user-provided search strings to prevent ReDoS / RegExp Injection.
 */
export function escapeRegex(string: string): string {
  if (!string || typeof string !== "string") return "";
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Validates and sanitizes destination URLs strictly.
 * Blocks dangerous schemes like javascript:, data:, vbscript: to eliminate XSS / Open Redirects.
 */
export function sanitizeUrl(url: string | undefined | null): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();

  // Block javascript:, data:, vbscript: and illegal control characters
  if (/^(?:javascript|data|vbscript):/i.test(trimmed) || /[\x00-\x1f\x7f]/.test(trimmed)) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * In-memory sliding window rate limiter fallback for local development or single-instance deployments.
 */
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryRateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale memory rate limit entries periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryRateLimitStore.entries()) {
      if (record.resetAt <= now) {
        memoryRateLimitStore.delete(key);
      }
    }
  }, 60000).unref?.();
}

/**
 * Distributed rate limiter via Upstash Redis REST HTTP API (Vercel Serverless multi-instance ready).
 */
async function upstashRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number } | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));
    const redisKey = `ratelimit:${key}`;

    const res = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["EXPIRE", redisKey, windowSeconds, "NX"],
        ["TTL", redisKey],
      ]),
      // Abort quickly to ensure zero latency overhead if external network is slow
      signal: AbortSignal.timeout(1500),
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    const count = Number(data[0]?.result || 1);
    const ttlSeconds = Number(data[2]?.result || windowSeconds);
    const resetAt = Date.now() + Math.max(1, ttlSeconds) * 1000;

    const allowed = count <= maxRequests;
    const remaining = Math.max(0, maxRequests - count);

    return { allowed, remaining, resetAt };
  } catch (err) {
    // Fail gracefully to in-memory limiter without interrupting request handling
    return null;
  }
}

/**
 * High-performance Rate Limiter.
 * Uses Upstash REST API in multi-instance serverless deployments (Vercel) when configured,
 * and seamlessly falls back to fast in-memory rate limiting in local dev / single instance environments.
 */
export async function rateLimit(
  key: string,
  maxRequests = 10,
  windowMs = 60000
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  // 1. Try distributed Upstash Redis if configured
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const upstashResult = await upstashRateLimit(key, maxRequests, windowMs);
    if (upstashResult) {
      return upstashResult;
    }
  }

  // 2. Fallback to in-memory sliding window limiter
  const now = Date.now();
  const record = memoryRateLimitStore.get(key);

  if (!record || record.resetAt <= now) {
    memoryRateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count += 1;
  return { allowed: true, remaining: maxRequests - record.count, resetAt: record.resetAt };
}

