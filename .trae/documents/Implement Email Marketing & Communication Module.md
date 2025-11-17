## Overview
- Implement a production-grade Email Marketing & Communication module as a single page with nine tabs, integrating with existing SMTP (`/send-email`), RBAC, and UI patterns.
- Add enterprise features: threaded inbox, full‑text search, queue monitor, role‑based limits, real‑time notifications, SMTP pooling, blacklist/bounce protection, saved searches, and security hardening.
- Do not modify auth/login/RBAC or existing email sending logic.

## Navigation & Access
- Sidebar: `Email → Marketing & Communication` → route `'/email/marketing/communications'`.
- Deep linking: `#inbox`, `#outbox`, `#dashboard`, `#campaign/:id`, `#audience/:id`, `#logs`, `#settings`.
- Permissions via existing guards:
  - super_admin/admin: full
  - staff: full inbox/outbox, create campaigns, upload; no global settings
  - agent: Inbox/Outbox only; send single email; no bulk/campaign

## Permission Matrix
- Super Admin: Inbox Full, Outbox Full, Campaigns Full, Upload Full, Settings Full
- Admin: Inbox Full, Outbox Full, Campaigns Full, Upload Full, Settings Partial
- Staff: Inbox Full, Outbox Full, Campaigns Create, Upload, Settings No
- Agent: Inbox Limited, Outbox Own Only, Campaigns No, Upload No, Settings No

## Tabs (9)
### 1) Inbox (Threaded)
- Threads table: one row per conversation; expand to messages; reply in drawer.
- Filters: date range, sender email, unread only, has reply, has attachment, not opened in 3 days, AI urgent.
- Labels/tags: Important/Lead/Follow‑up; per thread.
- IMAP sync (optional) every 60s; local cache to reduce load.
- Agent scoping: only messages where agent is participant.

### 2) Outbox
- Source: `email_sending_logs`.
- Columns: to, subject, status (sent/failed/bounced), opened/clicked, sent at, campaign.
- Filters/sorts: date, SMTP account, status, campaign; sort by open/click rate, recipient domain.
- Grouping: by campaign and SMTP account.
- Actions: retry failed; view HTML payload; delivery response.

### 3) Dashboard
- KPIs: Sent/Scheduled/Drafts; incoming/outgoing today; delivered vs bounced; agent communication volume; unsubscribe analytics.
- Health: SMTP health score; average response time; response rate per agent.
- Rankings: high‑performing templates.
- Queue monitor widget: queue size, failed queue, slow queue, rate‑limit status.

### 4) Create Campaign
- Recipient sources: Agents (city/agency/status filters), Staff (role filter), Travellers (enquiries/bookings/travellers), Companies/B2B listings.
- CSV upload: PapaParse preview, email validation, field mapping (email/name/phone), dedupe.
- Manual add: comma‑separated; real‑time validation.
- Merge audiences: include/exclude lists; segmentation rules (e.g., bookings > 5; cancelled last month; destination filters).
- Editor: `react-quill` HTML; variables `{{Name}}`, `{{AgentName}}`, `{{TripName}}`, `{{TravelDate}}`, `{{CompanyName}}`; CTA builder; header/footer overrides; attachments; desktop/mobile preview; Gmail‑like snippet; inbox placement simulation.
- Actions: Send Now, Schedule, Save Draft, Send Test Email.
- Scoring: AI personalization score; spam score checker with hints (links, keywords, image weight).
- From account: active SMTP dropdown; `Auto` uses server rotation/quota switching.

### 5) Templates
- Integrate existing templates UI/service; add: import/export HTML, categorization (Marketing/Booking/Payment/Custom), mobile preview.
- Version history; A/B testing; template analytics; export/share to agents.

### 6) Audience
- Create named lists; add members manually/from sources; CSV import; dedupe across all audiences.
- Smart Segment Builder: rules (e.g., city=Dubai AND last booking ≤ 90 days).
- Auto‑sync lists: e.g., “All new enquiries” daily.
- Detail: contact table; delete; export CSV.

### 7) Upload Emails
- CSV upload with live table preview; invalid emails list; duplicate finder; column mapper.
- AI categorizer: business/agent/traveller; auto‑detect wrong mappings; normalize whitespace/phone formats.
- Destination: add to existing audience, create new list, or use directly in campaign.

### 8) Logs
- Filters: inbox, outbox, campaigns, bounces, failed.
- Visual timeline per email; group by provider failure reason.
- AI summary: “Why emails failed today?” from error logs.

### 9) Settings
- Global header/footer HTML; unsubscribe footer; tracking on/off; branding (colors, logo, button styles).
- Per‑user signatures; agent‑level signatures.
- Smart sending limits; bounce handling rules; domain warmup; DKIM/SPF/DMARC verification checker; SMTP reputation score.

## Backend APIs (New; keep existing sender)
- Keep `/send-email` unchanged and reuse everywhere.
- Inbox: `GET /email/inbox` threads, `GET /email/inbox/thread/:id` messages, `POST /email/inbox/mark-read`, `POST /email/inbox/reply`.
- Outbox: `GET /email/outbox`, `GET /email/outbox/:id`, `POST /email/outbox/retry/:id`.
- Campaigns: `POST /email/campaigns`, `GET /email/campaigns`, `GET /email/campaigns/:id`, `POST /email/campaigns/:id/schedule`, `POST /email/campaigns/:id/send-now`, `GET /email/campaigns/:id/recipients`, `POST /email/campaigns/:id/retry-failed`.
- Audience: `POST /email/audience`, `GET /email/audience`, `GET /email/audience/:id`, `POST /email/audience/:id/members`, `POST /email/audience/:id/segments`.
- Upload CSV: `POST /email/upload-csv` (multer + server validation/dedupe).
- Tracking: `GET /email/tracking/open/:id.gif`, `GET /email/tracking/click/:id?url=...`, `GET/POST /email/unsubscribe/:id`.
- Queue monitor: `GET /email/queue/status` (reads worker stats).
- Limits: `GET /email/limits/me` (role‑based caps and usage); enforcement during enqueue.
- Webhooks: `/email/webhooks/<provider>` to ingest bounces/complaints; add to blacklist and logs.

## Worker, Scheduling & Queue Monitor
- Scheduler: `node-cron` to start campaigns on `scheduled_at`.
- Queue: job processor that batches sends (≤100/min); auto‑throttle; categorizes failures.
- Monitor: track queue size, failed/slow queues, rate‑limit status; expose via `/email/queue/status`.
- Flow: pull `email_campaign_recipients(status='pending')` → call `/send-email` → update status/error; skip unsubscribes/blacklist; respect daily quotas and server auto‑switching.

## SMTP Pools & Role‑Based Limits
- Pools by provider/domain; round‑robin rotation; failover.
- Track pool usage in `email_smtp_pool_usage`; integrate with auto switching already in email server.
- Role caps:
  - Agent: 200/day
  - Staff: 1,000/day
  - Admin/Super Admin: unlimited
- Track usage in `email_daily_usage`; enforce on enqueue.

## Search & Saved Filters
- FTS over subject, body_html, sender, recipient; date/campaign/status filters.
- Saved searches: `email_saved_filters` with JSON predicate definitions for fast retrieval.

## Real‑Time Notifications
- WebSocket push for new inbox messages and queue events; badge counts for Inbox/Outbox.

## Security & Safety
- HTML sanitization; attachment virus scan; email hashing for privacy/dedupe.
- Encrypted inbound email storage (optional); AI auto‑tagging of inbound messages.
- Bounce/complaint ingestion via webhooks; maintain blacklist to prevent future sends.

## Database (New Tables)
- `email_threads(id, subject, last_activity_at, participants TEXT[], labels TEXT[])`.
- `email_thread_messages(id, thread_id, direction ENUM(inbound,outbound), sender, recipient, subject, body_html, timestamp, attachments JSONB, read BOOLEAN)`.
- `email_inbox_logs(id, thread_id, sender, recipient, subject, body_html, received_at, has_attachments, read, attachments JSONB, labels TEXT[])` (if IMAP not used).
- `email_campaigns(id, sender_email, subject, body_html, campaign_type, attached_files JSONB, status ENUM(draft,scheduled,sent), scheduled_at TIMESTAMPTZ, created_by UUID, created_at TIMESTAMPTZ)`.
- `email_campaign_recipients(id, campaign_id UUID, email TEXT, status ENUM(pending,sent,opened,clicked,failed), opened_at TIMESTAMPTZ, clicked_at TIMESTAMPTZ, error_message TEXT)`.
- `email_templates(id, template_name, subject, body_html, header_html, footer_html, variables_json JSONB, created_by UUID)` (optional persistent store).
- `email_unsubscribes(id, email TEXT UNIQUE, reason TEXT, created_at TIMESTAMPTZ)`.
- `user_email_settings(user_id UUID PRIMARY KEY, signature_html TEXT, created_at TIMESTAMPTZ)`.
- `email_global_settings(id SERIAL, header_html TEXT, footer_html TEXT, unsubscribe_message TEXT, tracking_enabled BOOLEAN, per_minute_cap INTEGER, domain_warmup BOOLEAN)`.
- `email_saved_filters(id, name, owner_id, definition JSONB, created_at TIMESTAMPTZ)`.
- `email_daily_usage(user_id, sent_today INTEGER, limit INTEGER, date DATE)`.
- `email_blacklist(email TEXT PRIMARY KEY, reason TEXT, first_seen TIMESTAMPTZ, last_seen TIMESTAMPTZ)`.
- `email_smtp_pool_usage(config_id UUID, provider TEXT, domain TEXT, last_used TIMESTAMPTZ, used_today INTEGER, rotations_today INTEGER)`.

## Indexing & Retention
- Indexes: b‑tree on `email`, `campaign_id`, `status`, `opened_at`; GIN on JSON (`attachments`).
- FTS indexes on `subject`, `body_html`, `sender`, `recipient` for threads/inbox/outbox.
- Retention policies: auto‑delete or archive old inbound emails; archive campaigns older than 1 year (configurable).

## Interfaces & Services
- Interfaces: `InboxThread`, `InboxMessage`, `OutboxLog`, `EmailCampaign`, `EmailRecipient`, `Audience`, `Template`, `UploadPreviewRow`, `UserEmailSettings`, `GlobalEmailSettings`, `SavedFilter`, `QueueStatus`, `DailyUsage`.
- Frontend services: `inboxService`, `outboxService`, `emailCampaignService`, `audienceService`, `uploadService`, `trackingService`, `queueService`, `limitsService`, `searchService`, `templatesService`.

## Rollout & Verification
- Phase 1: DB migrations and APIs (Inbox/Outbox/Campaigns/Audience/Upload/Tracking/Queue/Limits/Search).
- Phase 2: Single page with 9 tabs; deep links; CSV upload; audience builder; editor.
- Phase 3: Worker, scheduler, queue monitor; role caps; notifications.
- Phase 4: Templates A/B/versioning; smart segments; saved searches; security hardening.
- Phase 5: Analytics & dashboards; SMTP pool rotation; mobile polish; QA.
- Tests: unit (CSV, variables, tracking, FTS, limits); E2E (create→schedule→send→open/click→logs→queue monitor→retry); non‑regression for `/send-email` flows.

If you approve this enhanced plan, I will implement the page, endpoints, worker, migrations, and services, leveraging existing SMTP and RBAC without changing core auth or sender logic.