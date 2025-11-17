## Objectives
- Make the single-page Email Marketing & Communication module fully operational (Inbox, Outbox, Dashboard, Create Campaign, Templates, Audience, Upload, Logs, Settings).
- Ensure reliable sending and receiving, live updates, pagination, AI template generation, and RBAC alignment using existing infrastructure.

## Environment & Services
- Email server: start and align port
  - Default: `EMAIL_SERVER_PORT=3001`
  - If using another port (e.g., 3003), set both `EMAIL_SERVER_PORT` and frontend `VITE_EMAIL_SERVER_URL=http://localhost:<port>`
- AI server: start and configure
  - Default: `AI_SERVER_PORT=3004`
  - Required env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_SERVICE_ROLE_KEY`
  - Frontend: set `VITE_AI_SERVER_URL=http://localhost:3004`
- Frontend env
  - Set `VITE_EMAIL_SERVER_URL=http://localhost:3001` (or chosen port)
  - Set `VITE_EMAIL_SERVER_PORT=<port>` only if not using explicit URL
  - Set `VITE_AI_SERVER_URL=http://localhost:3004`

## Database & Migrations
- Apply module migrations (Supabase):
  - Core: campaigns, recipients, threads, messages, inbox logs, unsubscribes, daily usage, blacklist, saved filters, SMTP pool usage, global/user settings
  - FTS: tsvector + GIN indexes for threads, inbox logs, campaigns, outbox
  - Campaigns `config_id` column to store chosen sender account
- Verify policies and service-role permissions for worker inserts and reads

## Inbox (Receiving)
- Inbox data sources
  - Webhook ingestion: `/email/webhooks/:provider` to capture bounces/complaints and maintain blacklist
  - Thread/message ingestion: `/email/inbox/ingest` for inbound emails (optional IMAP sync later)
- Pagination & filtering
  - Server: `/email/inbox?limit=<N>&page=<P>&sender=<email>`
  - UI: “Inbox Account” selector (by configuration id → `from_email`), Prev/Next buttons, page size
- Live updates
  - SSE: `/email/notifications` for `inbox_new`, `outbox_update`, `queue_update`
  - Frontend subscribes using the same base resolver used by API calls

## Outbox (Sending)
- Uses existing `/send-email` (unaltered) with automatic account rotation and daily quotas
- Worker enqueues recipients and calls `/send-email` with `configId` when a specific account is chosen
- Dashboard queue and limits visible; retry failed actions via API

## Create Campaign
- From account selection
  - Source configs from `/settings/email-configuration` service; passing `config_id` persists on campaign
  - “Auto” uses server rotation; specific account enforces quotas and identity
- Audience sources & segmentation
  - Agents, Staff (profiles), Travellers (enquiries), Companies (companies), CSV, manual entry
  - Deduplication, include/exclude saved segments, rule builder
- Editor
  - Variables insertion via template service
  - ReactQuill lazy-loaded; desktop/mobile preview
- Actions
  - Send Now → create + enqueue
  - Schedule → set `scheduled_at` and worker cron enqueues when due
  - Save Draft, Send Test Email

## Templates
- Advanced builder
  - AI Generate via `/api/test-ai`; graceful fallback to Paste/Import HTML if unreachable
  - Import/export HTML; categorization, role; mobile/desktop preview
- Persistence
  - Currently in-memory service; optional persistent table can be added if required

## Settings Integration
- Email configurations
  - Manage active/default/daily limits; show Remaining quota badge and “Receiving” indicator
- Global header/footer and per-user signatures applied during send
- Country-based CC/BCC automatically applied (existing behavior)

## RBAC & Permissions
- Route guard: `super_admin`, `admin`, `staff`; agents limited to Inbox/Outbox & single send
- Enforce role-based daily caps in worker (agent=200/day, staff=1000/day; admin/super_admin unlimited)

## Reliability & Fallbacks
- Use a single base resolver for all API calls and SSE to avoid port mismatches
- Show toasts for enqueue/schedule and errors; graceful AI fallback when server is down

## Monitoring & Logs
- Outbox logs: `email_sending_logs`
- Queue monitor: `/email/queue/status`
- Saved Searches: FTS endpoint `/email/search` over threads/inbox/outbox/campaigns; persist saved filters

## Verification Plan
1. Start servers and confirm health endpoints:
   - Email: `GET /status`
   - AI: `GET /health`
2. Inbox ingestion test:
   - `POST /email/inbox/ingest` with sample message; confirm thread appears
3. Send Now test:
   - Create campaign (Auto and specific account) → confirm recipients transition from `pending` to `sent` and outbox logs record
4. Schedule test:
   - Set `scheduled_at` shortly in the future; confirm cron enqueues and sends
5. SSE test:
   - Confirm live updates on inbox/outbox/queue events; no aborted connections
6. Templates AI test:
   - Generate HTML with AI; verify fallback works if AI is down

## Rollout Steps
- Align env vars; start email and AI servers
- Apply migrations and verify RLS/service-role keys
- Perform verification steps; address any endpoint or policy failures
- Iterate on UI polish and saved segments, FTS results presentation, and notifications badges

If approved, I will align environment variables, verify server connectivity, apply migrations, and complete end-to-end validation so the module operates reliably across all tabs.