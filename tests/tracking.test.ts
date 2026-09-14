import { describe, it, expect } from "vitest";
import { TrackingService } from "../src/lib/services/tracking.service";
import { normalizePhoneNumber, calculateSmsSegments } from "../src/lib/utils";

describe("Tracking & Phone Normalization Tests", () => {
  it("should generate a 6-digit numeric tracking ID", () => {
    const id = TrackingService.generateShortId("numeric", 6);
    expect(id).toMatch(/^\d{6}$/);
    expect(id.length).toBe(6);
  });

  it("should generate an 8-character alphanumeric tracking ID", () => {
    const id = TrackingService.generateShortId("alphanumeric", 8);
    expect(id.length).toBe(8);
    expect(id).toMatch(/^[2-9a-hj-np-z]{8}$/);
  });

  it("should correctly normalize local Bangladesh phone numbers (017... to 88017...)", () => {
    const res = normalizePhoneNumber("01711234567");
    expect(res.isValid).toBe(true);
    expect(res.normalized).toBe("8801711234567");
    expect(res.country).toBe("BD");
  });

  it("should correctly validate existing 880 phone numbers", () => {
    const res = normalizePhoneNumber("+8801822334455");
    expect(res.isValid).toBe(true);
    expect(res.normalized).toBe("8801822334455");
  });

  it("should reject invalid phone strings", () => {
    const res = normalizePhoneNumber("12345");
    expect(res.isValid).toBe(false);
  });

  it("should accurately compute GSM-7 single segment SMS", () => {
    const text = "Special September offer is live. Get 20% off today. Click here: https://go.mybrand.com/583214";
    const seg = calculateSmsSegments(text);
    expect(seg.isUnicode).toBe(false);
    expect(seg.segments).toBe(1);
    expect(seg.characters).toBe(text.length);
  });

  it("should accurately compute multi-segment SMS for longer messages", () => {
    const longText = "A".repeat(170);
    const seg = calculateSmsSegments(longText);
    expect(seg.segments).toBe(2);
  });

  it("should deeply detect Truecaller, SMS preview crawlers, and prefetch requests", () => {
    // Truecaller SMS scanner
    expect(TrackingService.detectBot({ userAgent: "Truecaller/12.34 (Android; Mobile)" }).isBot).toBe(true);
    expect(TrackingService.detectBot({ userAgent: "Dalvik/2.1.0 (Linux; U; Android 13; SM-G998B)" }).isBot).toBe(true);
    expect(TrackingService.detectBot({ userAgent: "okhttp/4.9.2" }).isBot).toBe(true);

    // Messaging link preview bots
    expect(TrackingService.detectBot({ userAgent: "Mozilla/5.0 (compatible; Google-Page-Preview/1.0)" }).isBot).toBe(true);
    expect(TrackingService.detectBot({ userAgent: "facebookexternalhit/1.1" }).isBot).toBe(true);
    expect(TrackingService.detectBot({ userAgent: "WhatsApp/2.21.12.21" }).isBot).toBe(true);
    expect(TrackingService.detectBot({ userAgent: "Applebot/0.1" }).isBot).toBe(true);

    // Prefetch headers
    expect(TrackingService.detectBot({ userAgent: "Mozilla/5.0", purpose: "prefetch" }).isBot).toBe(true);
    expect(TrackingService.detectBot({ userAgent: "Mozilla/5.0", secPurpose: "prefetch" }).isBot).toBe(true);

    // Real human mobile browser
    const realIphone = TrackingService.detectBot({
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      acceptLanguage: "en-US,en;q=0.9",
    });
    expect(realIphone.isBot).toBe(false);
  });

  it("should generate client-side trampoline HTML with beacon verification", () => {
    const html = TrackingService.generateTrampolineHtml("https://mybrand.com/offer", "eid-a8k7", "tok_12345");
    expect(html).toContain("https://mybrand.com/offer");
    expect(html).toContain("/api/tracking/verify");
    expect(html).toContain("tok_12345");
    expect(html).toContain("eid-a8k7");
    expect(html).toContain("navigator.sendBeacon");
  });
});

