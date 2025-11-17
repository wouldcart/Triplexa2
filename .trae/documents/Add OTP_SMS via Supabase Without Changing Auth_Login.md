## Approach
- Keep existing Supabase auth/login exactly as‑is; add a post‑login “step‑up verification” layer using new Supabase tables, RLS policies, RPCs, and server endpoints.
- Providers come from `/settings/api` (api_integrations). Route via server (relay) so no credentials touch the client.

## Supabase Schema
- `sms_otp_sessions`: `id`, `user_id`, `phone`, `provider_name`, `provider_session_id`, `status ENUM(pending,verified,expired,failed)`, `attempts`, `expires_at`, `created_at`.
- `sms_messages_log`: `id`, `user_id`, `to`, `type ENUM(otp, transactional, promo)`, `text`, `provider_name`, `status_code`, `response_time_ms`, `created_at`.
- Optional `user_contact_settings`: `user_id`, `phone`, `otp_enabled BOOLEAN`, `preferred_provider`.
- RLS: users can read their own rows; service role inserts/updates. Indexes on `user_id`, `status`, `expires_at`.

## RPCs / Edge Functions
- `start_otp(user_id, phone, provider_hint NULL)`: creates `sms_otp_sessions` row and returns a token/session_id; server sends OTP via provider.
- `verify_otp(session_id, code)`: marks row `verified` on match; increments `attempts`; handles expiry.
- Keep logic in server (service role) to avoid client credentials; RPCs only read status.

## Server Endpoints (Relay)
- `POST /otp/send`: `{ phone, provider_hint? }` → reads active providers, calls preferred or fallback, logs to `sms_messages_log`, creates session in `sms_otp_sessions`.
- `POST /otp/verify`: `{ session_id, otp }` → verifies with provider (if required) or local session store; updates status.
- Rate limits: enforce per IP/user (e.g., 5/minute, 10/day) and backoff on provider `429`.

## Frontend Integration (No Auth/Login Change)
- After existing login succeeds, check `otp_enabled` (from `user_contact_settings` or org setting):
  - If enabled → show OTP dialog overlay before granting full app access.
  - Calls `/otp/send` with the stored phone; on code entry calls `/otp/verify`.
- For users without OTP → proceed normally; nothing changes in login.
- Reuse ProtectedRoute to gate routes until `status==='verified'` (held in app state, not in auth).

## Provider Routing & Security
- Read active providers from `/settings/api`; keep priority order (e.g., Gemini/OpenAI/Groq style, but for SMS providers).
- Credentials live in server env; never exposed client‑side.
- If preferred provider is busy, step to next; surface friendly UI status.

## Transactional & Promo Messaging (Optional)
- Transactional: `POST /sms/send-transactional` logs to `sms_messages_log`.
- Promo/bulk: use campaign queue; dedupe and opt‑out filters; throttle per provider throughput.

## Compliance & Retention
- Respect provider throughput defaults (e.g., ~200 req/sec; HA clusters higher). Keep app‑level rate limiter.
- Store minimal PII; add retention job to archive `sms_messages_log` after N months.

## Validation
- OTP: send/verify/resend with attempt caps; test expiry and fallback provider.
- Login: confirm users without `otp_enabled` are unaffected.
- Logs: verify `sms_messages_log` entries and response times.

## Rollout
- Phase 1: schema + RLS + endpoints; wire OTP overlay post‑login.
- Phase 2: transactional messaging hooks; provider fallback.
- Phase 3: bulk/promo via campaign queue; dashboards.

This integrates OTP/SMS into Supabase cleanly, adding a step‑up verification layer without altering the existing authentication or login implementation.