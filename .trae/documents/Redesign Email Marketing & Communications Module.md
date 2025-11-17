## Goals
- Redesign `/email/marketing/communications` to focus on high‑volume, reliable email campaigns with modern UX, strong analytics, safe sending, and seamless integration with existing SMTP and RBAC.

## IA & Navigation
- Keep single page with tabs; re‑order for campaign‑first flow: Dashboard, Campaigns, Create Campaign, Audience, Templates, Inbox, Outbox, Logs, Settings.
- Deep links: `#campaigns`, `#create`, `#audience/:id`, `#templates/:id`, `#inbox`, `#outbox`.

## UX & Components
- Dashboard
  - KPIs: Sent/Scheduled/Drafts, Delivered/Bounced, Open/Click rates, Unsubscribes, Queue health.
  - Widgets: Rate limit status, SMTP pool rotation, provider health.
- Campaigns List
  - Table with filters: status, type, sender account, date, performance.
  - Bulk actions: pause, resume, retry failed, export CSV.
- Create Campaign (Wizard)
  - Steps: Details → Content → Audience → Review & Send.
  - Details: name, type, sender account (Auto or specific), schedule, tracking on/off.
  - Content: rich HTML editor, variables `{Name}`, `{CompanyName}`, header/footer toggles, attachments, preview (desktop/mobile).
  - Audience: sources (agents/profiles/enquiries/companies), CSV import, dedupe, include/exclude segments, rules (city, destination, pax, recency).
  - Review: spam score, personalization score, smart sending estimate; confirm → enqueue.
- Audience
  - Lists with member counts; segmentation builder; auto‑sync lists (daily for new enquiries).
  - Import/export CSV; dedupe across lists.
- Templates
  - Builder with AI assist (relay‑based), versioning, A/B testing, analytics.
  - Import/export HTML; categories; roles.
- Inbox/Outbox
  - Inbox threaded view; account filter with pagination; labels/tags; reply within thread.
  - Outbox: delivery results, status, provider responses; retry; payload view.
- Logs
  - Consolidated: inbox, outbox, campaigns, bounces, unsubscribes; timelines; failure reasons.
- Settings
  - Global header/footer; unsubscribe message; tracking toggle; per‑user signatures; domain warmup; DKIM/SPF/DMARC status.

## Backend & Services
- Sending
  - Keep `/send-email` unchanged; pass `configId` when specific; Auto omits `configId`.
  - Worker: batch ≤100/min, daily caps by role; unsubscribe/blacklist filters; per‑account quotas.
  - Scheduler: enqueue when `scheduled_at` due; pause/resume campaigns.
- Tracking
  - `GET /email/tracking/open/:recipientId.gif` (open) and `GET /email/tracking/click/:recipientId?url=...` (click); store events.
  - Unsubscribe: tokenized endpoint; skip on enqueue.
- AI Relay
  - `/api/generate-email` (HTML), `/api/enquiry/*` endpoints for future `/queries` AI; smart provider routing via `/settings/api`.
- Inbox
  - Ingestion endpoint; optional IMAP connector; sanitize HTML; label/tags; thread updates.
- Search
  - FTS endpoints across threads/inbox/outbox/campaigns; saved filters.
- Queue Monitor
  - `/email/queue/status`; SSE `/email/notifications` for inbox/outbox/queue events.

## Data Model (Supabase)
- `email_campaigns`, `email_campaign_recipients`, `email_inbox_logs`, `email_threads`, `email_thread_messages`.
- `email_unsubscribes`, `email_daily_usage`, `email_blacklist`, `email_saved_filters`, `email_smtp_pool_usage`, `email_global_settings`, `user_email_settings`.
- Indexes: b‑tree on status/timestamps; FTS tsvector + GIN on subject/body/sender/recipient; JSON GIN on attachments.
- RLS: `get_current_user_role()`; agents limited to own; admin/staff full; worker/service role unrestricted.

## Reliability & Safety
- Smart sending throttles; daily caps by role (agent 200/day, staff 1000/day, admin/super_admin unlimited).
- Provider failover and SMTP pool rotation; rate limit awareness.
- Security: sanitize inbound HTML; virus scan attachments; do not expose API keys; enforce CORS; content hashing.

## Performance & Responsiveness
- Lazy‑load heavy components (editors); virtualized tables; mobile‑first layouts; dropdown tabs for small screens.
- SSE reconnect/backoff and health badges for relay/email server.

## Integration
- Use `/settings/email-configuration` for sender accounts and quotas.
- Use `/settings/api` providers for AI via relay.
- Apply global footer/signatures and country CC/BCC.

## Validation Plan
1) Servers up (email `/status`, AI `/health`).
2) Create → enqueue → send (Auto & specific); verify outbox logs and tracking.
3) Scheduled sends run at `scheduled_at`; pause/resume works.
4) Inbox ingestion appears; pagination and filters work.
5) AI template generation returns HTML; fallback visible when relay down.
6) FTS search and saved filters work.

## Rollout
- Implement campaign wizard and lists; enhance worker/tracking.
- Wire AI relay to Templates; finalize audience builder and segmentation.
- Add dashboards, logs, and queue monitor; polish mobile UX.
- Test end‑to‑end and address performance/security edge cases.

## Outcome
- A production‑grade, reliable, and scalable campaign module with modern UX, analytics, safe sending, and AI‑assisted content creation integrated with existing SMTP and provider settings.