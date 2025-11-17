## Next Actions
- Implement backend endpoints `/api/sms/sendOtp`, `/api/sms/verifyOtp` (and optional `/api/sms/sendTemplate`) with validation, rate limits, error mapping, and logging to `otp_logs`.
- Add environment variables (`TWO_FACTOR_API_KEY`, `SMS_SENDER_ID`, `SMS_TEMPLATE`, `SMS_MODE`) and secure provider selection.
- Build `/settings/sms-otp` page and components (`SmsOtpConfigForm`, test sender UI, logs preview) protected for `super_admin` and `admin`.
- Wire phone login OTP flow: store `session_id` on send; verify OTP then continue existing role redirects without altering auth/login.
- Run E2E tests (send/verify/resend/429 backoff), confirm logs populate, and ensure responsive UI.

## Dependencies & Constraints
- Keep API key server-side only; client sees no credentials.
- Maintain current auth/login and role-based redirection intact.
- Respect provider throughput (~200 req/sec) and plan HA scaling if needed.

## Deliverables
- Backend routes and env config
- Supabase `otp_logs` (and optional `user_contact_settings`) with RLS
- Settings page with API config, test tools, log preview
- Phone login OTP flow integrated
- Documentation of ops notes and tests