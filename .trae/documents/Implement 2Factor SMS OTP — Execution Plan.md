## Backend
- Create `server/smsServer.js` and mount it in your main Express app:
  - `POST /api/sms/sendOtp` → validates phone (E.164; `+91` enforced), applies per‑IP/user rate limits, calls 2Factor AUTOGEN, maps provider response to `{ session_id, status, message, response_time_ms }`.
  - `POST /api/sms/verifyOtp` → validates `{ session_id, otp }`, calls 2Factor VERIFY, maps response to `{ verified, status, message, response_time_ms }`.
  - Optional `POST /api/sms/sendTemplate` → TSMS with `From`, `To`, `TemplateName`, `VAR1/VAR2`.
  - Error mapping: provider `Status`/`Details` → user‑friendly messages; include raw `Details` for admin logs.
  - Rate limiting: `express-rate-limit` (e.g., 5/min; resend cooldown) with 429 backoff.
- Env vars:
  - `TWO_FACTOR_API_KEY`, `SMS_SENDER_ID=TFCTOR`, `SMS_TEMPLATE=SMSTemplate1`, `SMS_MODE=autogen|template`.
- Supabase logging:
  - Migration: `otp_logs(id, user_id, phone, session_id, type ENUM('autogen','verify','template'), status, response_time_ms, created_at)`.
  - Indexes on `(user_id, type, created_at)`; service role writes; users can `SELECT` own rows (RLS).

## Frontend (Settings → SMS & OTP)
- Route: `/settings/sms-otp` behind `ProtectedRoute` for `super_admin`, `admin`.
- Page shell `src/pages/settings/sms-otp/index.tsx` with sections:
  - API Configuration: masked API key input (server‑persisted), read‑only sender ID, template name, mode; Save button.
  - Test Sender: phone input → Send OTP; OTP input → Verify; show status and provider message.
  - Logs Preview: fetch recent entries via server (admin only).
- Components/helpers:
  - `src/components/settings/SmsOtpConfigForm.tsx` (config form UI)
  - Client wrappers: `src/api/sms/sendOtp.ts`, `src/api/sms/verifyOtp.ts`
  - Hook: `src/hooks/useSmsService.ts` (send, verify, cooldown)
- UI: shadcn Cards, Inputs, Buttons; responsive layout; numeric keypad for OTP.

## Phone Login OTP Flow (No auth/login changes)
- Phone login screen:
  - On phone submit → call `/api/sms/sendOtp`; store `session_id`.
  - Prompt for OTP → call `/api/sms/verifyOtp`.
  - On success → continue existing role redirect (super_admin → `/admin/dashboard`, admin → `/dashboard`, staff → `/staff/home`, agent → `/agent/home`).
- Email/Gmail login unaffected.

## Validation & QA
- Unit tests: phone validation, response mapping, cooldown logic.
- E2E: send/verify OTP; invalid numbers; multiple resends limited; 429 backoff behavior; logs persistence.
- Performance: ensure default throughput compliance (~200 req/sec) and plan HA scaling if needed.
- Security: API key server‑side only; TLS; optional provider IP allowlist; RLS confirmed.

## Deliverables
- Backend routes mounted and env config.
- Supabase `otp_logs` (and optional `user_contact_settings`) with RLS.
- `/settings/sms-otp` page with config, test sender, log preview.
- Integrated phone login OTP flow.
- Documentation of ops notes and test results.

## Timeline
- Day 1: Backend routes, envs, Supabase migration, logging.
- Day 2: Settings page, client wrappers, hook, logs preview.
- Day 3: Phone login OTP integration, E2E tests, polish.

I will implement these files and wire everything together exactly as specified, keeping existing auth/login and role redirects intact.