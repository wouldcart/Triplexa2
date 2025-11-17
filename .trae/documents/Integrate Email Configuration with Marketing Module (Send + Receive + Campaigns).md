## Goal
Use the existing /settings/email-configuration data to drive sending, optional receiving, and campaign execution across the Email Marketing & Communication module, without changing core auth or SMTP logic.

## Sending (Use Existing Configs)
- Source SMTP accounts from the settings page service (`emailConfigurationService.getEmailConfigurations()` in src/pages/settings/EmailConfiguration.tsx:109–121).
- Present a "From Account" selector in Create Campaign that lists active/default configs with daily limits and labels.
- Dispatch behavior:
  - Auto: omit `configId` and let the server auto-rotate based on quota (server/emailServer.js:196–301, 489–537).
  - Specific: include `configId` in send/enqueue requests; server honors quotas and fails over if exceeded (server/emailServer.js:169–241).
- Test Send: use existing test dialog (EmailConfiguration.tsx:374–389, 185–241) to validate individual accounts.

## Campaigns (Run with Configs)
- Create Campaign flow sends `{ subject, body_html, recipients, created_by, optional configId }` to `/email/campaigns` then `/email/campaigns/:id/send-now`.
- Scheduling:
  - UI field `scheduled_at` → call `/email/campaigns/:id/schedule`.
  - Scheduler enqueues when due (server cron enqueue logic).
- Logs: outbox pages read `email_sending_logs` (supabase/migrations/20241115_add_email_sending_limits.sql:8–19). Status and limits reflect selected/default config.

## Receiving (Optional IMAP via Existing Configs)
- Use SMTP credentials for IMAP where provider supports (same host variant or provider-specific IMAP host); poll mailbox every 60s.
- Ingestion pipeline:
  - Read new messages → store in `email_threads` + `email_thread_messages` + `email_inbox_logs`.
  - Apply basic HTML sanitization before storage.
- Toggle per account in Email Configuration UI: add "Enable Inbox Sync" and frequency; use the same config record.
- If IMAP not available, rely on webhook ingestion from providers into `/email/webhooks/:provider`.

## Module Wiring
- Create Campaign:
  - From selector reads configs (active/default), shows `daily_send_limit` and default star.
  - When a specific account is chosen, pass `configId` to enqueue; otherwise pass Auto.
  - Audience sources (agents/profiles/enquiries/companies) combine with CSV and manual entries, then dedupe.
- Inbox/Outbox:
  - Outbox uses `email_sending_logs`. Inbox uses `email_threads` + messages; SSE notifies updates.
- Saved Searches:
  - FTS across threads/inbox/outbox/campaigns; saved filters stored in `email_saved_filters` with scope and predicate.

## Settings Interaction
- Respect `is_active`, `is_default`, `daily_send_limit` from settings in campaign dispatch.
- Country-based CC/BCC settings apply automatically during send (server/emailServer.js:311–364).
- Global header/footer and per-user signatures applied during send; available in global/user settings tables.

## Security & Limits
- Keep server-side rate limit and daily counters intact; role caps enforce in worker.
- Sanitize inbound HTML; blacklist/unsubscribe honored before enqueue.

## Verification
- Use Email Configuration test send to verify accounts.
- Run Create Campaign with Auto and specific sender; confirm logs entries and quotas.
- If IMAP enabled, verify new messages appear in Inbox threads; otherwise test webhook bounce to populate blacklist.

## Code References
- Email Configuration page: src/pages/settings/EmailConfiguration.tsx:109–121, 374–389, 185–241.
- Sender endpoint and configId support: server/emailServer.js:169–241, 196–301, 489–537.
- Outbox logs: supabase/migrations/20241115_add_email_sending_limits.sql:8–19.
- Country CC/BCC: server/emailServer.js:311–364.
- FTS search: server/emailServer.js (search endpoint) with Supabase FTS migrations.

If you approve, I will wire the From selector to the settings data, pass `configId` on sends when selected, add inbox sync toggles in settings, and verify end-to-end sends and scheduled campaigns using the selected SMTP accounts.