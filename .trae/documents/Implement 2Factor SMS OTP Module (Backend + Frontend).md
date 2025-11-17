## Backend
- Create `/api/sms/sendOtp` and `/api/sms/verifyOtp` (and optional `/api/sms/sendTemplate`) using server-only API key.
- Validate phone (E.164), enforce `+91` when required, add per IP/user rate limits and resend cooldown.
- Map provider responses to `{ status, message, Details }`; backoff on 429; log timings.
- Env: `TWO_FACTOR_API_KEY`, `SMS_SENDER_ID`, `SMS_TEMPLATE`, `SMS_MODE`.
- Logging table `otp_logs(id, phone, session_id, type, status, created_at)`; service role writes.

## Supabase
- Create `otp_logs` and optional `user_contact_settings(user_id, phone, otp_enabled, preferred_provider)`.
- Indexes: `otp_logs(user_id, type, created_at)`; RLS: users read own rows; service role writes.

## Frontend (Settings → SMS & OTP)
- Route `/settings/sms-otp` (ProtectedRoute: `super_admin`, `admin`).
- Pages/components:
  - `SmsOtpConfigForm`: masked API key, sender ID (read-only), template name, mode, Save.
  - Test sender: phone input → Send OTP; OTP input → Verify; status and raw provider message.
  - Logs preview (server-fetched).
- Client helpers: `src/api/sms/sendOtp.ts`, `src/api/sms/verifyOtp.ts`, `useSmsService.ts` (send, verify, cooldown).

## OTP Login Flow
- Phone login only:
  - Step 1: Send OTP → store `session_id` client-side.
  - Step 2: Verify OTP → on success continue existing role redirects.
- Email/Gmail login unchanged; role redirects unchanged.

## Validation
- Test send/verify/resend; invalid numbers; 429 backoff; logs populated.
- Confirm no changes to auth/login and role routing.
- Responsive UI with clear error states.

## Rollout
1) Implement endpoints with validation, rate limits, logging.
2) Add env vars and provider selection.
3) Build `/settings/sms-otp` page and connect test sender.
4) Wire phone login OTP flow; keep existing auth unchanged.
5) Run E2E and performance checks; document ops notes.