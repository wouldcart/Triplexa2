## Implementation Steps
1) Backend Routes
- Create `/api/sms/sendOtp`:
  - Validate phone (E.164); enforce `+91` for 2Factor.
  - Build Autogen URL: `https://2factor.in/API/V1/${TWO_FACTOR_API_KEY}/SMS/+91${phone}/AUTOGEN/${SMS_TEMPLATE}`.
  - Call provider; map response to `{ session_id, status, message }`.
  - Rate limit per IP/user (5/min, 10/day) and resend cooldown.
  - Log to `otp_logs` with timings.
- Create `/api/sms/verifyOtp`:
  - Validate `{ session_id, otp }`.
  - Call Verify URL: `https://2factor.in/API/V1/${TWO_FACTOR_API_KEY}/SMS/VERIFY/${session_id}/${otp}`.
  - Map to `{ verified: boolean, status, message }`; update logs.
- Optional `/api/sms/sendTemplate`:
  - Validate `{ to, template, vars }`; call TSMS endpoint; include `VAR1/VAR2`.

2) Environment Configuration
- Add server envs: `TWO_FACTOR_API_KEY`, `SMS_SENDER_ID=TFCTOR`, `SMS_TEMPLATE=SMSTemplate1`, `SMS_MODE=autogen|template`.
- Ensure API key use is server‑side only (no client exposure).

3) Supabase Tables & RLS
- Create `otp_logs(id, user_id, phone, session_id, type, status, response_time_ms, created_at)`.
- Optional `user_contact_settings(user_id, phone, otp_enabled, preferred_provider)`.
- Indexes: `otp_logs(user_id, type, created_at)`; user can `SELECT` own rows; service role writes.

4) Settings UI (`/settings/sms-otp`)
- ProtectedRoute for `super_admin`, `admin`.
- Sections:
  - API Configuration: masked API key, sender ID (read‑only), template name, mode, Save.
  - Test Sender: phone → send OTP; OTP → verify; show status/provider message.
  - Logs Preview: recent `otp_logs` via server.
- Components:
  - `src/pages/settings/sms-otp/index.tsx` (page shell)
  - `src/components/settings/SmsOtpConfigForm.tsx` (form)
  - `src/api/sms/sendOtp.ts`, `src/api/sms/verifyOtp.ts` (client wrappers)
  - `src/hooks/useSmsService.ts` (send, verify, cooldown)

5) Phone Login OTP Flow
- Step 1: user enters phone → call `/api/sms/sendOtp`; store `session_id`.
- Step 2: user enters OTP → call `/api/sms/verifyOtp`; on success, continue existing role redirects (unchanged auth/login).
- Email/Gmail login remains unchanged; OTP only for phone or where `otp_enabled=true`.

6) Validation & QA
- Test send/verify/resend; invalid phones and 429 backoff.
- Confirm `otp_logs` populate; ensure rate limiter works.
- Verify role redirects unchanged; mobile responsive inputs and error states.

## Deliverables
- Backend endpoints with validation, rate limiting, error mapping, and logging
- Supabase `otp_logs` (and optional `user_contact_settings`) with RLS
- Settings page and tools
- Integrated phone login OTP flow
- Documentation and test results

If this breakdown is confirmed, I will proceed to implement and validate each step.