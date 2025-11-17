**Overview**
- Build a separate Expo (React Native) Agent app that uses the current Supabase project and the existing AI smart‑router.
- No server changes required: reuse `server/aiServer.js` for provider routing and `supabase` tables for RLS, usage logs, and model limits.

**Scope**
- Role‑based login (Agent) and dashboard.
- Leads/Enquiries, Queries, Itineraries, Proposals/Quotes, Bookings, Packages.
- Communication (email/follow‑ups), notifications, profile & settings.

**AI Modules (Implemented Mobile‑First)**
- Copilot Everywhere: In‑app assistant backed by `src/services/aiRouter.ts` via `server/aiServer.js`; quick actions for “summarize lead”, “generate itinerary”, “draft reply”.
- Itinerary Generation: Prompt from enquiry/lead context → AI skeleton → map to `itineraryService` and editable sections; use existing transforms.
- Proposal Drafting: AI fills proposal templates and pricing notes, validates with `proposalValidation` hooks; human review and send.
- Lead Triage & Assignment: AI classifies urgency, budget fit, destination intent; suggests assignment; logs decision and confidence.
- Email/Message Assistant: AI creates drafts/replies from conversation/history; integrates with existing email server and templates.
- Vision & OCR (optional): Extract data from images (passports/quotes) using vision models where available; attach to lead.
- Voice Input (optional): Dictate notes → transcribe → AI summarization.
- AI Analytics: Show per‑provider latency/usage from `public.api_usage_logs`; enforce `public.api_model_limits` per user.

**Architecture**
- App: Expo with `expo-router` (stack + tabs), React Query for data, `@supabase/supabase-js` for auth and DB.
- Shared Logic: Factor common services (enquiries, proposals, itinerary, agent management, AI router) into a shared JS/TS module so web and mobile reuse the same calls.
- AI Calls: Mobile calls the existing smart‑router HTTP endpoints (`/api/test-ai`, `/v1/chat/completions`, Gemini) exposed by `server/aiServer.js` to avoid mobile bundling of provider SDKs.
- Data: Use Supabase RLS policies as‑is; only fetch agent‑owned records.
- Offline: Local cache for drafts (SQLite/SecureStore), queued sync.
- Notifications: Expo push; backend uses existing notification services to trigger pushes for assignments/updates.
- Theming: Mobile‑optimized components; keep semantics of web flows but fit RN UI patterns.

**Data & Security**
- Auth: Supabase email/OAuth; persist session with SecureStore; role=agent gates routes.
- RLS: Respect existing policies on `agents`, `profiles`, enquiries/queries tables; no admin endpoints in the app.
- Secrets: No provider keys stored in app; all AI requests go through our server; usage logged to `public.api_usage_logs`.
- Limits: Consult `public.api_model_limits` before AI actions; surface quota feedback.

**UX Flows**
- Dashboard: Today’s leads, tasks, upcoming trips, AI quick actions.
- Lead Detail: Timeline, chat, AI: summarize, next‑best‑action, reply draft.
- Itinerary Builder: Sections (days/hotels/activities); AI propose → user edits → save/send.
- Proposal: Template choose → AI content → price checks → PDF/share.
- Bookings: Status updates, documents, payments; AI reminders.
- Packages: Browse/select, AI suggest alternatives or upsells.

**Milestones**
- Phase 0: Bootstrap Expo app, Supabase client, routing, theme.
- Phase 1: Auth + Agent dashboard with live data.
- Phase 2: Leads/Queries list & detail; baseline CRUD.
- Phase 3: AI Copilot integration (summaries, drafts, triage) with logging/limits.
- Phase 4: Itinerary generation + editor; proposal drafting + validation.
- Phase 5: Bookings management; notifications; offline drafts.
- Phase 6: Vision/voice (optional), usage analytics.
- Phase 7: QA (RLS/security), performance, accessibility.
- Phase 8: EAS build, App Store/Play Store submission (unique bundle IDs, icons, profiles).

**Acceptance Criteria**
- All AI actions route through `server/aiServer.js`, log to `public.api_usage_logs`, and enforce `public.api_model_limits`.
- Agent sees only their data (RLS verified) and can complete end‑to‑end flows (lead → itinerary → proposal → booking).
- Works offline for drafts; push notifications delivered for assignments and updates.
- No provider secrets in app; latency and failure fallbacks surfaced clearly.

**Risks & Mitigations**
- Web‑only hooks/components: Isolate HTTP/service layer to shared module; wrap RN UI separately.
- Provider SDK differences on mobile: Use server endpoints instead of SDKs in the app.
- RLS mismatches: Validate queries against policies and fix via existing migration scripts if needed.
- App store reviews: Provide clear privacy policy, data handling, and offline storage rationale.

**Release**
- Configure EAS build profiles per environment; set bundle IDs and app names for Agent.
- Use `.env` runtime config for server base URL, Supabase keys (anon), and Sentry/analytics.
- Roll out staged internal testing → TestFlight/closed tracks → production.