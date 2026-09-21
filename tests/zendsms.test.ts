import { describe, it, expect, vi, beforeEach } from "vitest";
import { ZendSmsProvider } from "../src/lib/providers/zendsms.provider";

describe("ZendSMS Provider Adapter Tests", () => {
  const provider = new ZendSmsProvider({
    apiKey: "mock_test_key_12345",
    senderId: "8809612781020",
    apiUrl: "https://api.zendsms.com/api/v1/send-sms",
    balanceUrl: "https://api.zendsms.com/api/v1/balance",
  });

  it("should initialize provider with correct name and defaults", () => {
    expect(provider.name).toBe("zendsms");
  });

  it("should validate and reject invalid phone numbers", async () => {
    const result = await provider.sendSms({
      to: "invalid-number",
      message: "Hello from ZendSMS",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid destination phone number");
  });

  it("should parse incoming webhook delivery status payloads correctly", () => {
    const deliveredPayload = {
      message_id: "01a0a101-622c-7110-970e-e1079379d63d",
      recipient: "8801700000000",
      status: "DELIVERED",
    };

    const parsed = provider.parseWebhook(deliveredPayload);
    expect(parsed).not.toBeNull();
    expect(parsed?.event).toBe("delivered");
    expect(parsed?.providerMessageId).toBe("01a0a101-622c-7110-970e-e1079379d63d");
    expect(parsed?.phone).toBe("8801700000000");
  });

  it("should parse failed webhook payloads correctly", () => {
    const failedPayload = {
      message_id: "01a0a101-622c-7110-970e-e1079379d63d",
      recipient: "8801700000000",
      status: "FAILED",
    };

    const parsed = provider.parseWebhook(failedPayload);
    expect(parsed).not.toBeNull();
    expect(parsed?.event).toBe("failed");
  });
});
