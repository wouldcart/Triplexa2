## Migrations
- Create tables:
  - sms_otp_sessions(id, user_id, phone, provider_name, provider_session_id, status ENUM(pending,verified,expired,failed), attempts INT, expires_at TIMESTAMPTZ, created_at TIMESTAMPTZ)
  - sms_messages_log(id, user_id, to, type ENUM(otp, transactional, promo), text, provider_name, status_code, response_time_ms, created_at TIMESTAMPTZ)
  - user_contact_settings(user_id UUID PRIMARY KEY, phone TEXT, otp_enabled BOOLEAN DEFAULT false, preferred_provider TEXT)
- Indexes/RLS:
  - Index on sms_otp_sessions(user_id, status, expires_at); sms_messages_log(user_id, type, created_at)
  - RLS: users can SELECT their rows; service role can INSERT/UPDATE; policies tied to get_current_user_role()

## Server Relay Endpoints
- POST /otp/send { phone, provider_hint? }
  - Resolve active providers from /settings/api; send OTP; insert sms_otp_sessions and sms_messages_log; return { session_id, expires_at }
- POST /otp/verify { session_id, otp }
  - Verify with provider/local; update status/attempts; return { verified: true }
- Rate limits: per IP/user (e.g., 5/min, 10/day) and backoff on 429; structured errors

## Frontend (No Auth Change)
- Post-login OTP overlay component
  - If otp_enabled for current user → show overlay and block app until verified
  - Actions: Send OTP, Verify, Resend (cooldown); show attempts/expiry
- App context state: otpSession, otpVerified
  - ProtectedRoute allows full access only when otpVerified or otp_enabled=false

## Provider Routing & Security
- Providers loaded from api_integrations (same as /settings/api)
- Credentials remain server-side (service role); never exposed to client
- Smart fallback: try provider_hint; then next by priority; friendly status badges

## Optional Phase 2
- Transactional: POST /sms/send-transactional
- Bulk/promo: queue with dedupe/opt-out/throttle; dashboards and logs

## Validation
- OTP send/verify/resend with caps and expiry
- Login unaffected for users without otp_enabled
- Logs populated with timings and status; fallback provider tested

## Rollout Steps
1) Apply migrations and RLS
2) Implement relay endpoints and rate limits
3) Build OTP overlay; wire into post-login flow
4) Test success, failure, resend, expiry; confirm no auth/login changes