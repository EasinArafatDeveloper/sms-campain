import { ISmsProvider, SmsSendOptions, SmsSendResult, BulkSmsSendResult, SmsBalanceResult, ProviderHealthResult } from "./sms-provider.interface";
import { normalizePhoneNumber } from "../utils";

export class MockSmsProvider implements ISmsProvider {
  name = "mock";

  async sendSms(options: SmsSendOptions): Promise<SmsSendResult> {
    const { normalized, isValid } = normalizePhoneNumber(options.to);
    if (!isValid) {
      return {
        success: false,
        provider: this.name,
        error: `Invalid phone number format: ${options.to}`,
      };
    }

    // Simulate 20ms network delay
    await new Promise((resolve) => setTimeout(resolve, 20));

    const messageId = `MOCK-${Date.now()}-${Math.floor(Math.random() * 900000 + 100000)}`;

    return {
      success: true,
      provider: this.name,
      providerMessageId: messageId,
      statusCode: 200,
      rawResponse: { status: "DELIVRD", id: messageId },
    };
  }

  async sendBulkSms(messages: SmsSendOptions[]): Promise<BulkSmsSendResult> {
    const results: SmsSendResult[] = [];
    for (const msg of messages) {
      results.push(await this.sendSms(msg));
    }
    return {
      totalRequested: messages.length,
      successCount: results.filter((r) => r.success).length,
      failureCount: results.filter((r) => !r.success).length,
      results,
    };
  }

  async getBalance(): Promise<SmsBalanceResult> {
    return {
      success: true,
      balance: 15420.5,
      currency: "BDT",
    };
  }

  async healthCheck(): Promise<ProviderHealthResult> {
    return {
      provider: this.name,
      healthy: true,
      responseTimeMs: 14,
      message: "Mock Provider Online & Functional",
    };
  }

  parseWebhook(payload: Record<string, any>): any {
    return {
      event: (payload.status || "delivered").toLowerCase(),
      providerMessageId: payload.message_id || `MOCK-${Date.now()}`,
      phone: payload.number,
      occurredAt: new Date(),
      raw: payload,
    };
  }
}
