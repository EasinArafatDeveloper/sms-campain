import { ISmsProvider, SmsSendOptions, SmsSendResult, BulkSmsSendResult, SmsBalanceResult, ProviderHealthResult } from "./sms-provider.interface";
import { normalizePhoneNumber } from "../utils";

export interface BulkSmsBdConfig {
  apiUrl?: string;
  balanceUrl?: string;
  apiKey: string;
  senderId: string;
}

export class BulkSmsBdProvider implements ISmsProvider {
  name = "bulksmsbd";
  private apiUrl: string;
  private balanceUrl: string;
  private apiKey: string;
  private senderId: string;

  constructor(config?: Partial<BulkSmsBdConfig>) {
    this.apiUrl = config?.apiUrl || process.env.BULKSMSBD_API_URL || "http://bulksmsbd.net/api/smsapi";
    this.balanceUrl = config?.balanceUrl || process.env.BULKSMSBD_BALANCE_URL || "http://bulksmsbd.net/api/getBalanceApi";
    this.apiKey = config?.apiKey || process.env.BULKSMSBD_API_KEY || "xkp2EbUxxu2vRtC6ycRE";
    this.senderId = config?.senderId || process.env.BULKSMSBD_SENDER_ID || "8809648910379";
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
      const params = new URLSearchParams({
        api_key: this.apiKey,
        type: "text",
        number: normalized,
        senderid: sender,
        message: options.message,
      });

      const endpoint = `${this.apiUrl}?${params.toString()}`;
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });

      const responseText = await response.text();
      let responseData: any;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw: responseText };
      }

      // BulkSMSBD returns JSON like { response_code: 202, message_id: "...", success_message: "..." } or status codes
      const isSuccess =
        response.ok &&
        (responseData.response_code === 202 ||
          responseData.response_code === 200 ||
          responseData.status === "success" ||
          (typeof responseText === "string" && responseText.includes("success")));

      const messageId =
        responseData.message_id ||
        responseData.msg_id ||
        `BD-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

      return {
        success: isSuccess,
        provider: this.name,
        providerMessageId: messageId,
        statusCode: responseData.response_code || response.status,
        rawResponse: responseData,
        error: isSuccess ? undefined : responseData.error_message || responseData.message || responseText,
      };
    } catch (err: any) {
      return {
        success: false,
        provider: this.name,
        error: err.message || "Network request failed",
      };
    }
  }

  async sendBulkSms(messages: SmsSendOptions[]): Promise<BulkSmsSendResult> {
    const results: SmsSendResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    // Process with controlled rate/concurrency
    for (const msg of messages) {
      const result = await this.sendSms(msg);
      results.push(result);
      if (result.success) {
        successCount++;
      } else {
        failureCount++;
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
      const endpoint = `${this.balanceUrl}?api_key=${this.apiKey}`;
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        data = { balance: parseFloat(text) || 0 };
      }

      const balance =
        typeof data.balance !== "undefined"
          ? parseFloat(data.balance)
          : typeof data.response_code !== "undefined"
          ? parseFloat(data.balance || data.credits || 0)
          : 0;

      return {
        success: response.ok,
        balance: isNaN(balance) ? 0 : balance,
        currency: "BDT",
      };
    } catch (err: any) {
      return {
        success: false,
        balance: 0,
        error: err.message || "Failed to fetch balance",
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
        message: balanceRes.success ? `Active. Available Balance: ${balanceRes.balance} BDT` : balanceRes.error,
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
    const status = (payload.status || payload.event || "").toLowerCase();
    let event: "queued" | "sent" | "delivered" | "failed" = "delivered";

    if (status.includes("deliver")) {
      event = "delivered";
    } else if (status.includes("fail") || status.includes("reject")) {
      event = "failed";
    } else if (status.includes("sent")) {
      event = "sent";
    }

    return {
      event,
      providerMessageId: payload.message_id || payload.msg_id || payload.id,
      phone: payload.number || payload.phone,
      occurredAt: new Date(),
      raw: payload,
    };
  }
}
