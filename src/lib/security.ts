/**
 * Security & Input Sanitization Utilities
 */

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
 * In-memory sliding window rate limiter for brute-force and abuse protection.
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

export async function rateLimit(
  key: string,
  maxRequests = 10,
  windowMs = 60000
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
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
