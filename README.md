# SMSPro — Trackable SMS Marketing & Customer Engagement Platform

SMSPro is a production-grade, multi-tenant enterprise SaaS platform engineered for trackable SMS marketing, per-recipient link click attribution, real-time engagement intelligence, and algorithmic high-intent lead retargeting.

---

## 🚀 Core Value Proposition & Business Loop

```mermaid
graph TD
    A[1. SMS Sent via BulkSMSBD] --> B[2. Real-Time Delivery Webhooks]
    B --> C[3. Recipient Clicks Tracking URL]
    C --> D[4. Click Attributed & Engagement Profile Updated]
    D --> E[5. Repeated Engagement Classified as High-Intent Lead]
    E --> F[6. Smart Audience Segment Generated]
    F --> G[7. 77.5% SMS Volume Reduction / Budget Optimization]
    G --> H[8. 1-Click Retargeting Campaign Dispatched]
```

---

## 🛠 Tech Stack

- **Framework**: Next.js 15+ (App Router, Server & Client Components)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Vanilla Tailwind CSS, Radix UI Primitives, Lucide Icons
- **Data & Persistence**: MongoDB Atlas via Mongoose (with tenant compound indexes)
- **Queue Architecture**: BullMQ + Redis (with resilient in-memory/MongoDB fallback)
- **SMS Gateway**: BulkSMSBD Provider Adapter (API Key: `xkp2EbUxxu2vRtC6ycRE`, Sender ID: `8809648910379`)
- **Authentication**: JWT Sessions (`jose` HS256) with HTTP-only cookies and RBAC
- **Validation**: Zod (100% schema coverage)
- **Testing**: Vitest automated unit & integration test suites

---

## 📦 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Environment Setup
Create a `.env.local` file:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
MONGODB_URI=your_mongodb_atlas_connection_string
AUTH_SECRET=your_jwt_secret_key_at_least_32_chars_long
TRACKING_BASE_URL=http://localhost:3000/t

# SMS Provider
SMS_PROVIDER=bulksmsbd
BULKSMSBD_API_URL=http://bulksmsbd.net/api/smsapi
BULKSMSBD_BALANCE_URL=http://bulksmsbd.net/api/getBalanceApi
BULKSMSBD_API_KEY=your_bulksmsbd_api_key
BULKSMSBD_SENDER_ID=your_approved_sender_id
```

### 3. Seed Database
Populate MongoDB Atlas with 128 campaigns, 5,000 recipients, tracking mappings, and smart leads:
```bash
npm run seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the application.

### 5. Automated Tests
```bash
npm test
```

### 6. Production Build
```bash
npm run build
npm run start
```

---

## 📱 Core Application Screens

1. **Dashboard (`/dashboard`)**: 6 KPI cards, Click Engagement Over Time chart, Engagement Intelligence card, Campaign Performance table, and 5-stage conversion funnel.
2. **Campaigns (`/campaigns`)**: Filterable and searchable campaign list with status badges and CTR analytics.
3. **Create Campaign Wizard (`/campaigns/new`)**: 4-step wizard with SMS segment counter, `{TRACKABLE_LINK}` merge tag, and mobile preview.
4. **Unique Link Generator (`/link-generator`)**: Cryptographic short ID generator with collision retry and recipient-campaign mapping.
5. **Delivery Queue (`/delivery-queue`)**: 6 KPI cards, live queue telemetry, and BulkSMSBD Gateway Health monitor.
6. **Click Analytics (`/click-analytics`)**: User-level click attribution table and conversion funnel.
7. **Active Leads (`/active-leads`)**: Smart audience rules (>=3 campaigns, >=2 clicks, within 30 days), 77.5% volume reduction calculation, and 1-click retargeting.
8. **Audience Segments (`/audiences`)**: Composable rule builder with audience count preview.
9. **Reports (`/reports`)**: Aggregated delivery and click performance metrics with CSV export.
10. **Settings (`/settings`)**: BulkSMSBD Gateway credentials, live credit balance check, and Test SMS dispatcher.
