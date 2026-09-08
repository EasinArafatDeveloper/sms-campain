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
    expect(id).toMatch(/^[2-9A-HJ-NP-Z]{8}$/);
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
});
