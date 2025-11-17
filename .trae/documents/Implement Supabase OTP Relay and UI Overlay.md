## Migrations
- Create tables:
  - `sms_otp_sessions(id, user_id, phone, provider_name, provider_session_id, status, attempts, expires_at, created_at)`
  - `sms_messages_log(id, user_id, to, type, text, provider_name, status_code, response_time_ms, created_at)`
  - Optional `user_contact_settings(user_id, phone, otp_enabled, preferred_provider)`
- Indexes: `sms_otp_sessions(user_id, status, expires_at)`, `sms_messages_log(user_id, type, created_at)`
- RLS:
  - `sms_otp_sessions`: user can `SELECT` own rows; service role can insert/update
  - `sms_messages_log`: user can `SELECT` own rows; service role writes

## Server (Relay) Endpoints
- `POST /otp/send` → body `{ phone, provider_hint? }`
  - Resolve active providers from `/settings/api`
  - Send OTP via preferred provider; create `sms_otp_sessions` row; log in `sms_messages_log`
  - Return `{ session_id, expires_at }`
- `POST /otp/verify` → body `{ session_id, otp }`
  - Verify with provider or local store; update `sms_otp_sessions.status` → `verified`; increment attempts; handle expiry
  - Return `{ verified: true }` or error
- Rate limits: per IP/user (e.g., 5/min; 10/day); backoff on 429

## Frontend Integration (No Auth Change)
- Post-login overlay component:
  - If `otp_enabled` for current user, show overlay and block app until verified
  - Buttons: “Send OTP” (calls `/otp/send`), “Verify” (calls `/otp/verify`), “Resend” (uses cooldown)
  - Display attempts remaining and countdown to expiry
- State: `otpSession` in app context; set `otpVerified` once `/otp/verify` returns true; ProtectedRoute allows full access only when verified or `otp_enabled` is false

## Provider Routing & Security
- Providers loaded from `/settings/api` (`api_integrations`)
- Credentials stored server-side; client never sees keys
- Fallback: try hint first, then next provider by priority; surface friendly messages

## Transactional & Promo Hooks (Optional Phase 2)
- `POST /sms/send-transactional` with booking/payment flows
- Queue for promo/bulk sends with dedupe, opt-out, and throttle

## Validation
- OTP: send, verify, resend with cooldown and attempt caps; expiry handling
- Login: users without `otp_enabled` unaffected; those with OTP must verify to proceed
- Logs: verify entries in `sms_messages_log` and timing
- Provider fallback: simulate failure and confirm next provider used

## Rollout
- Implement migrations and RLS
- Add relay endpoints and rate limits
- Build overlay UI and wire into post-login flow
- Test end-to-end across success, failure, resend, and expiry scenarios
- Phase 2: transactional/promo hooks and dashboards