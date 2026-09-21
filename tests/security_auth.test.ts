import { describe, it, expect } from "vitest";
import { escapeRegex, sanitizeUrl, rateLimit } from "../src/lib/security";
import { signSessionToken, verifySessionToken } from "../src/lib/auth/jwt";
import { TrackingService } from "../src/lib/services/tracking.service";

describe("Security & Multi-Tenant Isolation Tests", () => {
  describe("Input Sanitization & ReDoS Prevention", () => {
    it("should escape special regex characters to prevent RegExp injection", () => {
      const maliciousInput = ".*+?^${}()|[]\\";
      const escaped = escapeRegex(maliciousInput);
      expect(escaped).toBe("\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\");
    });

    it("should handle empty or non-string inputs safely in escapeRegex", () => {
      expect(escapeRegex("")).toBe("");
      expect(escapeRegex(null as any)).toBe("");
      expect(escapeRegex(undefined as any)).toBe("");
    });
  });

  describe("URL Sanitization & Open Redirect / XSS Prevention", () => {
    it("should allow valid https and http URLs", () => {
      expect(sanitizeUrl("https://postman.asia/offer")).toBe("https://postman.asia/offer");
      expect(sanitizeUrl("http://mybrand.com")).toBe("http://mybrand.com/");
    });

    it("should block dangerous javascript: and data: URLs", () => {
      expect(sanitizeUrl("javascript:alert(1)")).toBeNull();
      expect(sanitizeUrl("JAVASCRIPT:alert(document.cookie)")).toBeNull();
      expect(sanitizeUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
      expect(sanitizeUrl("vbscript:msgbox(1)")).toBeNull();
    });

    it("should properly sanitize trampoline HTML to prevent script breakout", () => {
      const maliciousUrl = "https://example.com/test</script><script>alert('xss')</script>";
      const trampoline = TrackingService.generateTrampolineHtml(maliciousUrl, "test123", "token123");

      // Verify that unescaped </script> is not present in the variable injection
      expect(trampoline).not.toContain("var dest = \"https://example.com/test</script>");
      expect(trampoline).toContain("Opening Link...");
    });
  });

  describe("JWT Session & Authentication Security", () => {
    it("should sign and verify session token correctly", async () => {
      const payload = {
        userId: "670000000000000000000002",
        email: "owner@mybrand.com",
        name: "Workspace Owner",
        role: "owner",
        platformRole: "user",
        organizationId: "670000000000000000000001",
        organizationName: "My Workspace",
        organizationSlug: "my-workspace",
      };

      const token = await signSessionToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");

      const verified = await verifySessionToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe(payload.userId);
      expect(verified?.organizationId).toBe(payload.organizationId);
      expect(verified?.platformRole).toBe("user");
    });

    it("should reject tampered or invalid JWT tokens", async () => {
      const invalidToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature";
      const verified = await verifySessionToken(invalidToken);
      expect(verified).toBeNull();
    });
  });

  describe("Sliding Window Rate Limiter", () => {
    it("should allow requests under limit and block excess requests", async () => {
      const key = `test_limit_${Date.now()}`;
      const res1 = await rateLimit(key, 3, 5000);
      expect(res1.allowed).toBe(true);

      const res2 = await rateLimit(key, 3, 5000);
      expect(res2.allowed).toBe(true);

      const res3 = await rateLimit(key, 3, 5000);
      expect(res3.allowed).toBe(true);

      const res4 = await rateLimit(key, 3, 5000);
      expect(res4.allowed).toBe(false);
      expect(res4.remaining).toBe(0);
    });
  });
});
