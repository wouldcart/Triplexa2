## Overview
- Add a complete OTP Management module using 2Factor API (Autogen OTP, Verification, Template SMS) without altering existing auth/login or role redirects.
- Create secure server endpoints that use the API key server‑side and wire admin settings and test flows under Settings → SMS & OTP Configuration.

## API Integration (2Factor)
- Authentication: API key in server env; never exposed client‑side.
- Endpoints used:
  - Autogen OTP: `https://2factor.in/API/V1/{API_KEY}/SMS/+91{phone}/AUTOGEN/{TEMPLATE}`
  - Verify OTP: `https://2factor.in/API/V1/{API_KEY}/SMS/VERIFY/{session_id}/{otp}`
  - Template SMS (optional): `https://2factor.in/API/V1/{API_KEY}/ADDON_SERVICES/SEND/TSMS` (supports VAR1/VAR2)
- Error handling: map provider codes to human messages; include `status`, `message`, and raw provider `Details` when available.
- Throughput awareness: default ~200 req/sec; add app‑level rate limiter, backoff on 429; plan for HA (~2000 TPS) by configuring queue capacity.

## Backend
- New routes under `/api/sms/`:
  - `POST /api/sms/sendOtp` { phone, name } → calls Autogen; returns `{ session_id, status, message }`; logs to `otp_logs`.
  - `POST /api/sms/verifyOtp` { session_id, otp } → calls Verify; returns `{ verified: boolean, status }`; logs result.
  - `POST /api/sms/sendTemplate` (optional) { to, template, vars } → TSMS; logs.
- Environment vars:
  - `TWO_FACTOR_API_KEY`, `SMS_SENDER_ID=TFCTOR`, `SMS_TEMPLATE=SMSTemplate1`, `SMS_MODE=autogen|template`.
- Validation & security:
  - Validate E.164 phone; enforce country code `+91` when required by provider.
  - Rate limit per IP/user (e.g., 5/min, 10/day); cooldown on resend.
  - Optional IP allowlist support via provider account; add server whitelist config.
- Logging:
  - `otp_logs` table: `id, phone, session_id, type, status, created_at`.
  - Include response time ms and error code where present.

## Supabase Schema & Policies
- `otp_logs`: basic log table (service role writes; admins read via server only; no client writes).
- Optional: `user_contact_settings(user_id, phone, otp_enabled, preferred_provider)` to control OTP enablement.
- Keep existing auth tables and RLS intact; no changes to login/auth tables.

## Frontend (Settings → SMS & OTP)
- Route: `/settings/sms-otp` (ProtectedRoute: `super_admin`, `admin`).
- Sections:
  - API Configuration: masked API key, sender ID (read‑only), template name, mode selector, Save.
  - Test OTP Sender: input phone → Send OTP; input OTP → Verify; show status and raw provider message.
  - Status & Logs: recent entries preview (server‑fetched).
- Components to add/update:
  - `src/pages/settings/sms-otp/index.tsx` (page shell)
  - `src/components/settings/SmsOtpConfigForm.tsx` (config form)
  - `src/api/sms/sendOtp.ts`, `src/api/sms/verifyOtp.ts` (client wrappers to server endpoints)
  - `src/hooks/useSmsService.ts` (reusable hook: send, verify, resend cooldown)
- UI style: shadcn Cards, Inputs, Select; consistent toasts; mobile responsive.

## OTP Login Flow
- Phone login path:
  - Step 1: user enters phone → call `/api/sms/sendOtp`; store `session_id` client‑side.
  - Step 2: user enters OTP → call `/api/sms/verifyOtp`; if success, proceed to existing login/role redirect without changing core auth.
- Existing email/Gmail login remains intact; OTP only for phone login or specific roles where `otp_enabled=true`.
- Role redirects unchanged: `super_admin → /admin/dashboard`, `admin → /dashboard`, `staff → /staff/home`, `agent → /agent/home`.

## Client–Server Contract
- `sendOtp` response: `{ session_id, status, message }` and `created_at` timestamp.
- `verifyOtp` response: `{ verified: boolean, status, message }`.
- Errors: `{ error: code, message }` with provider context; client displays friendly messages.

## Security & Compliance
- API key only in server env; client never sees it.
- TLS for all calls; enforce WAF/IP restrictions at provider account when possible.
- Retention: keep `otp_logs` for N months (configurable), then archive to cold storage.
- Multi‑factor access to logs for admins only through server.

## Validation & QA
- Test OTP send/verify for valid and invalid phones; resend cooldown; 429 backoff.
- Confirm logs populate; ensure rate limiter blocks floods.
- Verify role redirects unchanged; phone login OTP does not impact email/Gmail login.
- Mobile UX: inputs large, keypad numeric, error states clear.

## Rollout Steps
1) Implement `/api/sms/sendOtp` and `/api/sms/verifyOtp` with validation, rate limits, logging.
2) Add env variables; wire provider selection.
3) Build `/settings/sms-otp` page and form; connect Test Sender;
4) Wire phone login OTP flow to endpoints; keep existing auth unchanged.
5) Run E2E tests and performance checks; document ops notes for throughput and HA options.

This plan delivers a production‑ready 2Factor SMS OTP integration with a dedicated settings page, complete send/verify flows, robust logging, and zero changes to the existing auth/login and role routing.