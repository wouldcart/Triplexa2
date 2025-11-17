## Files & Changes
- Backend:
  - Create `server/smsServer.js` with routes:
    - `POST /api/sms/sendOtp` → 2Factor AUTOGEN
    - `POST /api/sms/verifyOtp` → 2Factor VERIFY
    - Optional `POST /api/sms/sendTemplate` → TSMS
  - Wire into main server (e.g., `server/index.js` or wherever Express app mounts routers): `app.use(require('./smsServer').default)`
  - Env: add `TWO_FACTOR_API_KEY`, `SMS_SENDER_ID`, `SMS_TEMPLATE`, `SMS_MODE` to `.env.local` and server config.
  - Rate limits: use `express-rate-limit` per IP/user; cooldown on resend.
  - Logging: insert into `otp_logs` via Supabase service role.
- Supabase:
  - Migration `supabase/migrations/20251117_add_otp_logs.sql`:
    - `otp_logs(id uuid, user_id uuid, phone text, session_id text, type text check (type in ('autogen','verify','template')), status text, response_time_ms int, created_at timestamptz default now())`
    - Indexes on `(user_id, type, created_at)`
    - RLS: users can select own rows; service role writes.
  - Optional: `user_contact_settings(user_id uuid primary key, phone text, otp_enabled boolean default false, preferred_provider text)`.
- Frontend Settings:
  - New route `/settings/sms-otp` under `ProtectedRoute` for `super_admin`, `admin`.
  - Add `src/pages/settings/sms-otp/index.tsx` (page shell) with sections:
    - API Configuration (masked API key, sender ID read-only, template name, mode, Save)
    - Test Sender (phone input → Send OTP; OTP input → Verify)
    - Logs preview (server-fetched)
  - Components:
    - `src/components/settings/SmsOtpConfigForm.tsx`
    - Client wrappers: `src/api/sms/sendOtp.ts`, `src/api/sms/verifyOtp.ts`
    - Hook: `src/hooks/useSmsService.ts` (send, verify, cooldown)
- Phone Login Flow:
  - In phone login page/component, on submit phone → call `/api/sms/sendOtp`, store `session_id` in state.
  - Prompt for OTP → call `/api/sms/verifyOtp`.
  - On success, proceed with existing role redirect (no change to auth/login).

## Endpoint Specs
- `POST /api/sms/sendOtp`
  - Body: `{ phone, name? }`
  - Validations: E.164; enforce `+91` for 2Factor; rate limit; cooldown.
  - 2Factor call: `GET https://2factor.in/API/V1/${API_KEY}/SMS/+91${phone}/AUTOGEN/${TEMPLATE}`
  - Response: `{ session_id, status, message }`; log `otp_logs` with timing.
- `POST /api/sms/verifyOtp`
  - Body: `{ session_id, otp }`
  - 2Factor call: `GET https://2factor.in/API/V1/${API_KEY}/SMS/VERIFY/${session_id}/${otp}`
  - Response: `{ verified: boolean, status, message }`; log result.
- Optional `POST /api/sms/sendTemplate`
  - Body: `{ to, template, vars }`
  - 2Factor TSMS: `POST https://2factor.in/API/V1/${API_KEY}/ADDON_SERVICES/SEND/TSMS` with `From`, `To`, `TemplateName`, `VAR1/VAR2`.

## Error Handling & Rate Limits
- Map provider `Status` and `Details` to friendly messages; include raw `Details` for admins.
- Backoff on 429; inform user to retry after cooldown.
- Log failures with codes and timings; expose recent logs to admins only.

## UI Behavior
- Settings page: masked API key input (stored server-side only), sender and template configuration; test send and verify with toasts.
- Phone login: numeric keypad OTP input; handle resend cooldown; show clear errors.
- Mobile responsive: shadcn Cards, Inputs, Buttons.

## Validation
- Unit tests for phone validation and response mapping.
- E2E: send/verify OTP; invalid numbers; multiple resends limited; 429 backoff behavior.
- Confirm role redirects unchanged for success; email/Gmail login unaffected.

## Timeline
- Day 1: Backend routes, env, migration, logging
- Day 2: Settings page & test sender; hook and client wrappers
- Day 3: Wire phone login OTP flow; E2E tests and polish

If you approve, I will implement these files and wire the endpoints, settings page, and phone login flow exactly as specified, with comprehensive validation and logging.