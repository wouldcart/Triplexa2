## Environment Setup
- Set `VITE_EMAIL_SERVER_URL=http://localhost:3001` (or your chosen port); set `VITE_AI_SERVER_URL=http://localhost:3004`.
- Ensure service-role envs: `VITE_SUPABASE_URL`, `VITE_SUPABASE_SERVICE_ROLE_KEY` available to servers.

## Start Services
- Email server: start with `EMAIL_SERVER_PORT=3001` (or desired) and verify `GET /status`.
- AI server: start on `3004` and verify `GET /health`.

## Apply Migrations
- Core tables: campaigns, recipients, threads, messages, inbox logs, unsubscribes, daily usage, blacklist, saved filters, SMTP pool usage, settings.
- FTS indexes: tsvector + GIN for threads, inbox logs, campaigns, outbox.
- Add `config_id` to `email_campaigns`.

## Wire Frontend
- Use single base resolver for all API calls and SSE.
- Inbox: account selector (by config id) + pagination; “Refresh Inbox” button.
- Outbox/Dashboard: load logs and queue; show badges and toasts via SSE.
- Create Campaign: From selector (Auto or specific), CSV/manual merge, variables, Send Now/Schedule.
- Templates: AI Generate with fallback (Paste/Import HTML); mobile/desktop preview.

## Validation Checklist
- Inbox ingestion: `POST /email/inbox/ingest` → thread visible; pagination changes page.
- Send Now: create + enqueue → recipients move to `sent`; outbox logs record.
- Schedule: set `scheduled_at` → cron enqueues and sends.
- SSE: notifications connect (no aborted/refused) and update inbox/outbox/queue.
- Templates: AI Generate returns HTML; fallback works when AI down.

## Troubleshooting
- If `ERR_CONNECTION_REFUSED`, align ports and env URLs.
- If campaign creation fails, check migrations and RLS; confirm service-role envs.
- If inbox empty, ingest test messages or enable provider webhooks.

If approved, I will align envs, start services, apply migrations, and run the validation checklist end-to-end to ensure the module works reliably.