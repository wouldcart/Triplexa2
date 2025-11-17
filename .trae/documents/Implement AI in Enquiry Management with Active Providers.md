## Objectives
- Integrate AI into the Enquiry Management module (`/queries`) using providers configured in `/settings/api`.
- Route requests through a secure relay with smart fallback (if one provider is busy), without exposing provider credentials.

## Provider Discovery & Routing
- Source active providers from `api_integrations` (used by `/settings/api`).
- Smart order: Gemini → OpenAI → Groq (respect priority field; overrideable by UI hint).
- Health checks:
  - Relay `/health` before each action.
  - Optional provider-specific ping endpoints; otherwise rely on smart fallback.
- Relay endpoint pattern:
  - `/api/enquiry/summarize`, `/api/enquiry/reply`, `/api/enquiry/classify`, `/api/enquiry/extract`, `/api/enquiry/next-steps`, `/api/enquiry/quote-draft`.
  - Accept `{ enquiry, context, provider_hint? }` and return structured JSON (text + metadata).

## UI/UX in `/queries`
- AI Assist panel (right side drawer or tab):
  - Actions: Summarize, Suggest Reply, Classify Intent, Extract Entities (names, dates, destinations, pax), Recommend Next Steps, Generate Quote Draft.
  - Provider selector:
    - Mode: Smart (Relay) or Specific Provider.
    - Show relay health badge and selected provider.
  - Result slots:
    - Render structured outputs; allow copy-to-clipboard and “Apply” (e.g., insert into reply editor or fields).
  - Offline-friendly:
    - If relay down, show banner and enable manual templates (predefined reply snippets) and field autofill based on simple heuristics.
- Inline enhancements:
  - In enquiry detail: “AI Summarize” button below description.
  - In reply composer: “AI Draft Reply” and “Improve Tone” (formal/friendly/persuasive).
  - In assignment dialog: “AI Auto-Assign” based on classification and destination.

## Backend (Relay) Endpoints
- Add to `aiServer`:
  - `/api/enquiry/summarize`: produce concise multi-bullet summary, urgency, key requirements.
  - `/api/enquiry/reply`: draft reply with tokens `{Name}`, `{CompanyName}`; tone/style options.
  - `/api/enquiry/classify`: intent (lead/booking/support/payment), urgency, sentiment.
  - `/api/enquiry/extract`: fields (destination, dates, pax, budget, contact).
  - `/api/enquiry/next-steps`: suggested actions (assign agent, request docs, propose package).
  - `/api/enquiry/quote-draft`: outline itinerary/price ranges (non-binding) to seed quoting.
- Each endpoint:
  - Input: `{ enquiry, context, provider_hint? }`.
  - Smart routing: try `provider_hint` first, then fallback list.
  - Logs: write to `api_usage_logs` with provider, model, timings.
  - Rate limits: per 15 min window; return 429 on abuse.

## Data Flow & Security
- Client never holds provider keys; all AI calls go through relay.
- Use existing Supabase service role in relay.
- Store AI outputs only when user clicks “Apply” (opt-in); otherwise ephemeral.

## Fallbacks & Busy Handling
- Step-by-step:
  1) Health check relay.
  2) Try provider hint.
  3) Fallback to next provider by priority.
  4) If all fail: show offline banner and switch to manual templates and simple extract heuristics.
- UI reflects busy state (loading → fallback → manual).

## Configuration
- App setting `ai_server_base_url` (Integrations/System) used by frontend resolver; fallback `VITE_AI_SERVER_URL`.
- Optional per-module toggles (enable/disable AI assist in `/queries`).

## Validation
- With providers active in `/settings/api`:
  - Summarize: returns structured bullets; latency within target.
  - Reply: drafts polite reply with tokens; user can apply into composer.
  - Classify: sets intent and urgency; auto-assign suggests agent/team.
  - Extract: fills destination/dates/pax/budget in form fields.
  - Quote draft: seeds itinerary outline.
  - Busy case: relay down → banner + manual tools available.

## Rollout Steps
1) Implement relay endpoints and smart router.
2) Add client `aiIntegrationService` functions for base resolve, providers, health, and actions.
3) Add AI Assist panel in `/queries` UI with actions, provider mode selector, badges, and apply buttons.
4) Wire inline buttons (summarize/reply/classify) in enquiry detail and reply composer.
5) Test: active provider; hint-specific; all-busy fallback; security checks.

## Outcome
- `/queries` gains robust AI assistance powered by `/settings/api` providers, with dynamic routing and graceful fallbacks, enhancing summarization, replies, classification, extraction, and quoting without exposing credentials or relying on fixed ports.