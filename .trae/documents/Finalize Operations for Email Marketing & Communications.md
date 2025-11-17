## Goals
- Ensure the module functions end-to-end (Inbox, Outbox, Dashboard, Create Campaign, Templates, Audience, Upload, Logs, Settings) using existing SMTP and RBAC.

## Environment Alignment
- Email server: set `VITE_EMAIL_SERVER_URL` to your running port (`http://localhost:3001` by default). If using `3003`, set `EMAIL_SERVER_PORT=3003` and update the frontend URL accordingly.
- AI server: set `VITE_AI_SERVER_URL=http://localhost:3004`; ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_SERVICE_ROLE_KEY` are present.

## Start Services
- Email server: start and verify `GET /status` returns JSON.
- AI server: start and verify `GET /health` returns JSON.

## Database Readiness
- Apply migrations: campaigns/recipients/threads/messages/inbox logs/unsubscribes/daily usage/blacklist/saved filters/SMTP pool/global/user settings.
- Apply FTS indexes and `config_id` on campaigns; confirm RLS and service role permissions.

## Functional Wiring
- Inbox: account selector (by config id → `from_email`), pagination, “Refresh Inbox”; SSE updates.
- Outbox: read logs, filters; retry failed.
- Create Campaign: From selector (Auto/specific), CSV/manual merge, variables; Send Now and Schedule with cron.
- Templates: AI Generate with graceful fallback (Paste/Import HTML), mobile/desktop preview.
- Settings: daily limit badges and receiving indicators; global/footer and per-user signatures respected during send.

## Validation Checklist
1) Health checks (email/AI servers running).
2) Inbox ingestion (POST `/email/inbox/ingest`) and pagination.
3) Send Now flow (create → enqueue → outbox logs).
4) Schedule flow (`scheduled_at` → cron enqueue → send).
5) SSE connectivity (no abort/refused; inbox/outbox/queue update live).
6) AI Templates generate (or fallback works).

## Troubleshooting
- If `ERR_CONNECTION_REFUSED`: align ports and frontend env URLs.
- If create campaign fails: verify migrations and RLS; confirm service-role keys.
- If inbox empty: ingest test or set provider webhooks.

If approved, I will align envs, start services, apply migrations, and execute the validation steps to make the module work reliably.