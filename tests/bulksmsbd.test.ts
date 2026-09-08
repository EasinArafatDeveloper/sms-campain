import { describe, it, expect } from "vitest";
import { BulkSmsBdProvider } from "../src/lib/providers/bulksmsbd.provider";

describe("BulkSMSBD Provider Adapter Tests", () => {
  const provider = new BulkSmsBdProvider({
    apiKey: "xkp2EbUxxu2vRtC6ycRE",
    senderId: "8809648910379",
  });

  it("should initialize provider with correct name and credentials", () => {
    expect(provider.name).toBe("bulksmsbd");
  });

  it("should fail gracefully when given an invalid phone number", async () => {
    const res = await provider.sendSms({
      to: "invalid",
      message: "Test message",
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain("Invalid destination phone number");
  });

  it("should accurately parse webhook payload from provider", () => {
    const payload = {
      status: "DELIVRD",
      message_id: "BD-12345678",
      number: "8801711234567",
    };
    const parsed = provider.parseWebhook(payload);
    expect(parsed).not.toBeNull();
    expect(parsed?.event).toBe("delivered");
    expect(parsed?.providerMessageId).toBe("BD-12345678");
  });
});
