export interface SmsSendOptions {
  to: string; // Recipient phone number
  message: string;
  senderId?: string;
  customId?: string;
}

export interface SmsSendResult {
  success: boolean;
  provider: string;
  providerMessageId?: string;
  statusCode?: number | string;
  rawResponse?: unknown;
  error?: string;
}

export interface BulkSmsSendResult {
  totalRequested: number;
  successCount: number;
  failureCount: number;
  results: SmsSendResult[];
}

export interface SmsBalanceResult {
  success: boolean;
  balance: number;
  currency?: string;
  error?: string;
}

export interface ProviderHealthResult {
  provider: string;
  healthy: boolean;
  responseTimeMs: number;
  message?: string;
}

export interface ISmsProvider {
  name: string;
  sendSms(options: SmsSendOptions): Promise<SmsSendResult>;
  sendBulkSms(messages: SmsSendOptions[]): Promise<BulkSmsSendResult>;
  getBalance(): Promise<SmsBalanceResult>;
  healthCheck(): Promise<ProviderHealthResult>;
  parseWebhook(payload: Record<string, unknown>, headers: Record<string, string>): {
    event: "queued" | "sent" | "delivered" | "failed";
    providerMessageId: string;
    phone?: string;
    occurredAt: Date;
    raw: unknown;
  } | null;
}
