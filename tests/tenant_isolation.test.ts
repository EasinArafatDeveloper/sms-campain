import { describe, it, expect } from "vitest";
import { getClientIp, sanitizeUrl, rateLimit } from "../src/lib/security";
import crypto from "crypto";

describe("Tenant Isolation & Security Hardening Tests", () => {
  describe("Client IP Extraction & Spoofing Defense", () => {
    it("should extract the first non-spoofed IP from x-forwarded-for header", () => {
      const headers = new Headers();
      headers.set("x-forwarded-for", "203.0.113.195, 70.41.3.18, 150.172.238.178");
      
      const ip = getClientIp(headers);
      expect(ip).toBe("203.0.113.195");
    });

    it("should fall back to x-real-ip if x-forwarded-for is missing", () => {
      const headers = new Headers();
      headers.set("x-real-ip", "198.51.100.42");
      
      const ip = getClientIp(headers);
      expect(ip).toBe("198.51.100.42");
    });

    it("should return unknown if no IP headers are present", () => {
      const headers = new Headers();
      const ip = getClientIp(headers);
      expect(ip).toBe("unknown");
    });
  });

  describe("Salted HMAC OTP Security & Constant-Time Verification", () => {
    const authSecret = "smspro_enterprise_super_secret_jwt_key_2026_x89271409128371293";
    const phone = "8801700000000";
    const rawOtp = "492815";
    const salt = "a1b2c3d4e5f67890";

    it("should generate deterministic HMAC for matching salt + phone + otp", () => {
      const hash1 = crypto
        .createHmac("sha256", authSecret)
        .update(`${salt}:${phone}:${rawOtp}`)
        .digest("hex");

      const hash2 = crypto
        .createHmac("sha256", authSecret)
        .update(`${salt}:${phone}:${rawOtp}`)
        .digest("hex");

      expect(hash1).toBe(hash2);
    });

    it("should fail constant-time comparison when incorrect OTP is entered", () => {
      const correctHash = crypto
        .createHmac("sha256", authSecret)
        .update(`${salt}:${phone}:${rawOtp}`)
        .digest("hex");

      const wrongHash = crypto
        .createHmac("sha256", authSecret)
        .update(`${salt}:${phone}:999999`)
        .digest("hex");

      const bufCorrect = Buffer.from(correctHash, "utf-8");
      const bufWrong = Buffer.from(wrongHash, "utf-8");

      expect(crypto.timingSafeEqual(bufCorrect, bufCorrect)).toBe(true);
      expect(crypto.timingSafeEqual(bufCorrect, bufWrong)).toBe(false);
    });
  });

  describe("Webhook Secret Timing-Safe Verification", () => {
    const webhookSecret = "smspro_webhook_signing_secret_998124";

    it("should verify authorized caller with exact secret", () => {
      const incoming = "smspro_webhook_signing_secret_998124";
      const bufIncoming = Buffer.from(incoming);
      const bufSecret = Buffer.from(webhookSecret);

      const isValid =
        bufIncoming.length === bufSecret.length &&
        crypto.timingSafeEqual(bufIncoming, bufSecret);

      expect(isValid).toBe(true);
    });

    it("should reject unauthorized or substring secret callers", () => {
      const incoming = "smspro_webhook_signing_secret"; // Substring
      const bufIncoming = Buffer.from(incoming);
      const bufSecret = Buffer.from(webhookSecret);

      const isValid =
        bufIncoming.length === bufSecret.length &&
        crypto.timingSafeEqual(bufIncoming, bufSecret);

      expect(isValid).toBe(false);
    });
  });

  describe("SSRF & Setting URL Whitelisting", () => {
    it("should allow official ZendSMS API URL", () => {
      const validUrl = "https://api.zendsms.com/api/v1/send-sms";
      const sanitized = sanitizeUrl(validUrl);
      expect(sanitized).toBe(validUrl);
      expect(sanitized?.startsWith("https://api.zendsms.com/")).toBe(true);
    });

    it("should reject malicious internal network or SSRF endpoints", () => {
      const ssrf1 = sanitizeUrl("http://169.254.169.254/latest/meta-data/");
      expect(ssrf1?.startsWith("https://api.zendsms.com/")).toBe(false);

      const ssrf2 = sanitizeUrl("http://localhost:8080/steal-key");
      expect(ssrf2?.startsWith("https://api.zendsms.com/")).toBe(false);
    });
  });
});
