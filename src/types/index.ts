export type UserRole = "owner" | "admin" | "manager" | "analyst" | "viewer";

export type CampaignStatus = "draft" | "scheduled" | "generating_links" | "queued" | "sending" | "completed" | "paused" | "failed" | "cancelled";

export type DeliveryStatus = "queued" | "processing" | "sent" | "delivered" | "failed" | "retrying" | "pending_retry";

export type ClickStatus = "clicked" | "not_clicked";

export type LeadStatus = "highly_active" | "engaged" | "low_engagement" | "inactive";

export type TrackingFormat = "numeric" | "alphanumeric";

export interface IOrganization {
  _id: string;
  name: string;
  slug: string;
  plan: "starter" | "growth" | "enterprise";
  status: "active" | "suspended";
  senderIds: string[];
  defaultSenderId: string;
  trackingDomain: string;
  settings: {
    defaultTrackingLength: number;
    defaultTrackingFormat: TrackingFormat;
    retentionDays: number;
    enableWebhooks: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  passwordHash?: string;
  avatar?: string;
  role: UserRole;
  status: "active" | "invited" | "disabled";
  defaultOrganizationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMembership {
  _id: string;
  organizationId: string;
  userId: string;
  role: UserRole;
  permissions: string[];
  createdAt: Date;
}

export interface ICampaign {
  _id: string;
  organizationId: string;
  name: string;
  senderId: string;
  message: string;
  status: CampaignStatus;
  audienceId?: string;
  audienceName?: string;
  recipientCount: number;
  trackingConfig: {
    destinationUrl: string;
    format: TrackingFormat;
    length: number;
  };
  statistics: {
    totalRecipients: number;
    linksGenerated: number;
    queued: number;
    processing: number;
    sent: number;
    delivered: number;
    failed: number;
    pendingRetry: number;
    totalClicks: number;
    uniqueClickers: number;
    repeatClickers: number;
    highIntentLeads: number;
    deliveryRate: number;
    clickRate: number;
  };
  scheduledAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRecipient {
  _id: string;
  organizationId: string;
  phone: string;
  name?: string;
  customId?: string;
  metadata?: Record<string, unknown>;
  status: "active" | "opted_out" | "invalid";
  createdAt: Date;
}

export interface ICampaignRecipient {
  _id: string;
  organizationId: string;
  campaignId: string;
  recipientId: string;
  phone: string;
  recipientName?: string;
  trackingLinkId?: string;
  trackingId?: string;
  trackingUrl?: string;
  personalizedMessage: string;
  deliveryStatus: DeliveryStatus;
  clickStatus: ClickStatus;
  clickCount: number;
  firstClickedAt?: Date;
  lastClickedAt?: Date;
  providerMessageId?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
}

export interface ITrackingLink {
  _id: string;
  organizationId: string;
  campaignId: string;
  recipientId: string;
  trackingId: string;
  destinationUrl: string;
  uniqueUrl: string;
  status: "active" | "expired" | "disabled";
  clickCount: number;
  firstClickedAt?: Date;
  lastClickedAt?: Date;
  createdAt: Date;
}

export interface IDeliveryJob {
  _id: string;
  organizationId: string;
  campaignId: string;
  recipientId: string;
  trackingId: string;
  phone: string;
  message: string;
  senderId: string;
  provider: string;
  status: DeliveryStatus;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: Date;
  nextRetryAt?: Date;
  providerMessageId?: string;
  errorCode?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDeliveryEvent {
  _id: string;
  organizationId: string;
  campaignId: string;
  recipientId: string;
  trackingId?: string;
  provider: string;
  providerMessageId: string;
  eventType: "queued" | "sent" | "delivered" | "failed" | "undelivered";
  payload: Record<string, unknown>;
  occurredAt: Date;
}

export interface IClickEvent {
  _id: string;
  organizationId: string;
  campaignId: string;
  recipientId: string;
  trackingId: string;
  destinationUrl: string;
  clickedAt: Date;
  ipHash?: string;
  userAgent?: string;
  referer?: string;
  metadata?: Record<string, unknown>;
}

export interface IEngagementProfile {
  _id: string;
  organizationId: string;
  recipientId: string;
  phone: string;
  recipientName?: string;
  campaignsReceived: number;
  campaignsClicked: number;
  campaignIdsClicked: string[];
  totalClicks: number;
  firstClickAt?: Date;
  lastClickAt?: Date;
  engagementScore: number;
  leadStatus: LeadStatus;
  updatedAt: Date;
}

export interface IAudienceRule {
  field: "campaignsClicked" | "totalClicks" | "lastClickWithinDays" | "engagementScore" | "leadStatus";
  operator: "gte" | "lte" | "eq" | "in";
  value: number | string | string[];
}

export interface IAudienceSegment {
  _id: string;
  organizationId: string;
  name: string;
  description?: string;
  rules: IAudienceRule[];
  estimatedCount: number;
  isSystem?: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuditLog {
  _id: string;
  organizationId: string;
  userId: string;
  userName?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface ISmsProviderConfig {
  _id: string;
  organizationId: string;
  provider: "bulksmsbd" | "mock" | "generic";
  name: string;
  apiKey: string;
  senderId: string;
  apiUrl?: string;
  isDefault: boolean;
  status: "active" | "inactive";
  balance?: number;
  lastCheckedAt?: Date;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardMetrics {
  totalCampaigns: number;
  smsSent: number;
  delivered: number;
  deliveryRate: number;
  totalClicks: number;
  uniqueClickers: number;
  clickRate: number;
  repeatClickers: number;
  highIntentLeads: number;
  potentialReductionPercent: number;
  recentCampaigns: Partial<ICampaign>[];
  clickTrend: { date: string; totalClicks: number; uniqueClicks: number }[];
  funnel: {
    sent: number;
    delivered: number;
    uniqueClickers: number;
    repeatClickers: number;
    highIntentLeads: number;
  };
  leadDistribution: {
    highlyActive: number;
    engaged: number;
    lowEngagement: number;
    total: number;
  };
}
