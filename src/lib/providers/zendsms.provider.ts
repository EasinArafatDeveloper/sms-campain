import {
  ISmsProvider,
  SmsSendOptions,
  SmsSendResult,
  BulkSmsSendResult,
  SmsBalanceResult,
  ProviderHealthResult,
} from "./sms-provider.interface";
import { normalizePhoneNumber } from "../utils";

import { env } from "../env";

export interface ZendSmsConfig {
  apiUrl?: string;
  balanceUrl?: string;
  apiKey: string;
  senderId: string;
}

export class ZendSmsProvider implements ISmsProvider {
  name = "zendsms";
  private apiUrl: string;
  private balanceUrl: string;
  private apiKey: string;
  private senderId: string;

  constructor(config?: Partial<ZendSmsConfig>) {
    this.apiUrl =
      config?.apiUrl ||
      env.ZENDSMS_API_URL ||
      "https://api.zendsms.com/api/v1/send-sms";
    this.balanceUrl =
      config?.balanceUrl ||
      env.ZENDSMS_BALANCE_URL ||
      "https://api.zendsms.com/api/v1/balance";
    this.apiKey =
      config?.apiKey ||
      env.ZENDSMS_API_KEY ||
      "";
    this.senderId =
      config?.senderId ||
      env.ZENDSMS_SENDER_ID ||
      "8809612781020";
  }

  async sendSms(options: SmsSendOptions): Promise<SmsSendResult> {
    const { normalized, isValid } = normalizePhoneNumber(options.to);
    if (!isValid) {
      return {
        success: false,
        provider: this.name,
        error: `Invalid destination phone number: ${options.to}`,
      };
    }

    try {
      const sender = options.senderId || this.senderId;

      // Primary: REST API (POST JSON with Bearer Token)
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          recipient: normalized,
          sender_id: sender,
          message: options.message,
        }),
      });

      const responseText = await response.text();
      let responseData: any;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw: responseText };
      }

      // ZendSMS returns: { success: true, code: 1000, message: "SMS accepted", data: { message_id: "...", recipient: "...", status: "QUEUED" } }
      const isSuccess =
        (response.ok || response.status === 202) &&
        (responseData.success === true ||
          responseData.code === 1000 ||
          responseData.status === "QUEUED" ||
          responseData.status === "SUCCESS");

      const messageId =
        responseData.data?.message_id ||
        responseData.message_id ||
        responseData.data?.id ||
        responseData.id ||
        `ZEND-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

      if (!isSuccess && response.status === 404) {
        // Fallback: Simple URL API if REST route is not routed
        const simpleUrl = `https://api.zendsms.com/api/simple/send?api_key=${encodeURIComponent(
          this.apiKey
        )}&to=${encodeURIComponent(normalized)}&sender_id=${encodeURIComponent(
          sender
        )}&message=${encodeURIComponent(options.message)}`;

        const fallbackRes = await fetch(simpleUrl, { method: "GET" });
        const fallbackText = await fallbackRes.text();
        let fallbackData: any;
        try {
          fallbackData = JSON.parse(fallbackText);
        } catch {
          fallbackData = { raw: fallbackText };
        }

        const fallbackSuccess =
          fallbackRes.ok &&
          (fallbackData.success === true ||
            fallbackData.code === 1000 ||
            fallbackData.status === "QUEUED");

        return {
          success: fallbackSuccess,
          provider: this.name,
          providerMessageId:
            fallbackData.data?.message_id ||
            fallbackData.message_id ||
            messageId,
          statusCode: fallbackData.code || fallbackRes.status,
          rawResponse: fallbackData,
          error: fallbackSuccess
            ? undefined
            : fallbackData.message || fallbackText,
        };
      }

      return {
        success: isSuccess,
        provider: this.name,
        providerMessageId: messageId,
        statusCode: responseData.code || response.status,
        rawResponse: responseData,
        error: isSuccess
          ? undefined
          : responseData.message || responseData.error || responseText,
      };
    } catch (err: any) {
      return {
        success: false,
        provider: this.name,
        error: err.message || "ZendSMS request failed",
      };
    }
  }

  async sendBulkSms(messages: SmsSendOptions[]): Promise<BulkSmsSendResult> {
    const results: SmsSendResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    // Process in chunks of 10 concurrent requests for performance & stability
    const chunkSize = 10;
    for (let i = 0; i < messages.length; i += chunkSize) {
      const chunk = messages.slice(i, i + chunkSize);
      const chunkPromises = chunk.map((msg) => this.sendSms(msg));
      const chunkResults = await Promise.all(chunkPromises);

      for (const res of chunkResults) {
        results.push(res);
        if (res.success) {
          successCount++;
        } else {
          failureCount++;
        }
      }
    }

    return {
      totalRequested: messages.length,
      successCount,
      failureCount,
      results,
    };
  }

  async getBalance(): Promise<SmsBalanceResult> {
    try {
      const response = await fetch(this.balanceUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: "application/json",
        },
      });

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        data = { balance: parseFloat(text) || 0 };
      }

      // ZendSMS returns: { success: true, code: 1000, data: { balance: 4704, currency: "BDT" } }
      let balance = 0;
      let currency = "BDT";

      if (data.data && typeof data.data.balance !== "undefined") {
        balance = parseFloat(data.data.balance);
        if (data.data.currency) currency = data.data.currency;
      } else if (typeof data.balance !== "undefined") {
        balance = parseFloat(data.balance);
      }

      const isSuccess = response.ok && (data.success === true || !isNaN(balance));

      return {
        success: isSuccess,
        balance: isNaN(balance) ? 0 : balance,
        currency,
        error: isSuccess ? undefined : data.message || text,
      };
    } catch (err: any) {
      return {
        success: false,
        balance: 0,
        error: err.message || "Failed to fetch ZendSMS balance",
      };
    }
  }

  async healthCheck(): Promise<ProviderHealthResult> {
    const start = Date.now();
    try {
      const balanceRes = await this.getBalance();
      const elapsed = Date.now() - start;
      return {
        provider: this.name,
        healthy: balanceRes.success,
        responseTimeMs: elapsed,
        message: balanceRes.success
          ? `Active. Available Balance: ৳${balanceRes.balance.toLocaleString()} ${balanceRes.currency}`
          : balanceRes.error,
      };
    } catch (err: any) {
      return {
        provider: this.name,
        healthy: false,
        responseTimeMs: Date.now() - start,
        message: err.message,
      };
    }
  }

  parseWebhook(payload: Record<string, any>): any {
    const status = (
      payload.status ||
      payload.event ||
      payload.delivery_status ||
      ""
    ).toLowerCase();

    let event: "queued" | "sent" | "delivered" | "failed" = "delivered";

    if (status.includes("deliver") || status === "success") {
      event = "delivered";
    } else if (
      status.includes("fail") ||
      status.includes("reject") ||
      status.includes("undeliv")
    ) {
      event = "failed";
    } else if (status.includes("sent") || status.includes("queued")) {
      event = "sent";
    }

    return {
      event,
      providerMessageId:
        payload.message_id || payload.msg_id || payload.id || payload.data?.message_id,
      phone: payload.recipient || payload.to || payload.phone || payload.number,
      occurredAt: new Date(),
      raw: payload,
    };
  }
}
