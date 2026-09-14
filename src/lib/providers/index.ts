import { ISmsProvider } from "./sms-provider.interface";
import { ZendSmsProvider } from "./zendsms.provider";
import { BulkSmsBdProvider } from "./bulksmsbd.provider";
import { MockSmsProvider } from "./mock.provider";
import { ApiCredentialModel } from "@/lib/db/models";

export * from "./sms-provider.interface";
export * from "./zendsms.provider";
export * from "./bulksmsbd.provider";
export * from "./mock.provider";

export async function getSmsProviderForOrg(organizationId?: string): Promise<ISmsProvider> {
  const providerType = process.env.SMS_PROVIDER || "zendsms";

  if (organizationId) {
    try {
      const cred = await ApiCredentialModel.findOne({
        organizationId,
        status: "active",
        isDefault: true,
      });

      if (cred) {
        if (cred.provider === "zendsms") {
          return new ZendSmsProvider({
            apiKey: cred.apiKey,
            senderId: cred.senderId,
            apiUrl: cred.apiUrl,
          });
        }
        if (cred.provider === "bulksmsbd") {
          return new BulkSmsBdProvider({
            apiKey: cred.apiKey,
            senderId: cred.senderId,
            apiUrl: cred.apiUrl,
          });
        }
        if (cred.provider === "mock") {
          return new MockSmsProvider();
        }
      }
    } catch {
      // Fallback to default
    }
  }

  if (providerType === "mock") {
    return new MockSmsProvider();
  }

  if (providerType === "bulksmsbd") {
    return new BulkSmsBdProvider();
  }

  return new ZendSmsProvider();
}
