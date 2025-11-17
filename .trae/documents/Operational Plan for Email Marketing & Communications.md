## Goals
- Make the module fully functional across Inbox, Outbox, Dashboard, Create Campaign, Templates, Audience, Upload, Logs, and Settings using existing SMTP/RBAC.

## Environment Alignment
- Email server base: set `VITE_EMAIL_SERVER_URL=http://localhost:3001` (or chosen port); ensure the email server runs at the same port (`EMAIL_SERVER_PORT`).
- AI server base: set `VITE_AI_SERVER_URL=http://localhost:3004`; provide `VITE_SUPABASE_URL` and `VITE_SUPABASE_SERVICE_ROLE_KEY` to the AI server.

## Start Services
- Email server: start and verify `GET /status`.
- AI server: start and verify `GET /health`.

## Database Readiness
- Apply migrations for: `email_campaigns`, `email_campaign_recipients`, `email_threads`, `email_thread_messages`, `email_inbox_logs`, `email_unsubscribes`, `email_daily_usage`, `email_blacklist`, `email_saved_filters`, `email_smtp_pool_usage`, `email_global_settings`, `user_email_settings`.
- Apply FTS indexes and `config_id` column on campaigns; confirm RLS and service-role permissions.

## Module Wiring & Behavior
- Inbox: account selector (by config id → `from_email`), pagination (`page`, `limit`), “Refresh Inbox” button; SSE live updates.
- Outbox: load logs, filters, retry failed.
- Create Campaign: From selector (Auto or specific), CSV/manual merge, variables; actions Send Now/Schedule; worker enqueues respecting quotas/caps.
- Templates: AI Generate (uses AI server); graceful fallback (Paste/Import HTML); mobile/desktop preview.
- Settings: show daily remaining quota and receiving indicator; apply global header/footer and per-user signatures on send.

## Validation Checklist
1) Confirm both servers are up via health endpoints.
2) Ingest inbox test (`POST /email/inbox/ingest`) and paginate.
3) Send Now (create → enqueue → recipient status → outbox logs).
4) Schedule (`scheduled_at` → cron enqueue → send).
5) SSE connectivity (no aborted/refused; inbox/outbox/queue update live).
6) Templates AI generation works; fallback usable if AI down.

## Troubleshooting
- `ERR_CONNECTION_REFUSED`: align ports and env URLs.
- Campaign creation errors: verify migrations, RLS, and service-role envs.
- Inbox empty: ingest test messages or configure provider webhooks.

## Outcome
- With env alignment, services running, migrations applied, and validation passing, the module operates reliably across all tabs using existing infrastructure.