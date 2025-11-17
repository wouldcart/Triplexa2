## Overview
- Integrate Templates AI with providers configured in /settings/api using a dynamic relay base URL, health checks, and smart routing.
- Avoid hardcoded ports and never expose provider credentials to the browser; provide graceful Paste/Import fallback.

## Client Services
- Create `aiIntegrationService` (frontend):
  - `getAiBaseUrl()` → read `ai_server_base_url` from App Settings; fallback to `VITE_AI_SERVER_URL`.
  - `getActiveProviders()` → read active providers from `api_integrations` (same source as /settings/api).
  - `checkHealth(base)` → `GET <base>/health`.
  - `generateTemplate({ subject, category, providerHint?, contentGuide? })` → `POST <base>/api/generate-email` (or `/api/test-ai` with structured prompt) and returns HTML.
- Ensure all requests use the resolved base URL; no hardcoded port.

## Relay Server (server/aiServer.js)
- Add/extend endpoint:
  - New: `POST /api/generate-email` → accepts `{ subject, category, provider_hint?, content_guide? }` and builds a robust prompt; tries specific provider first (if hint) then smart routing fallback using existing `tryProvider`.
  - Keep `/health` for status.
- CORS: keep permissive in dev; restrict origins in prod.
- Logging: continue writing to `api_usage_logs` with provider, endpoint, response time, and text.

## Templates UI (Templates Tab)
- Add AI Source selector:
  - Mode: `Smart (Relay)` or `Specific Provider`.
  - If Specific → show providers from /settings/api.
- Health indicators:
  - Display relay status (`checkHealth`) and chosen provider name.
- Generate action:
  - Calls `generateTemplate` with selected mode; fills the Quill editor with returned HTML.
- Graceful fallback:
  - If health or generation fails, show banner: “AI unavailable; Paste or Import HTML to continue.”
  - Keep “Paste from clipboard” and textarea import enabled.

## Security
- All provider calls are server-side via relay; no API keys on the client.
- Ensure the relay obtains providers from Supabase (`api_integrations`) and chooses per priority.

## Configuration
- App Settings key: `ai_server_base_url` (category: Integrations or System) used by frontend resolver.
- Frontend env fallback: `VITE_AI_SERVER_URL` only if settings missing.

## Validation
1) `/settings/api` lists active providers.
2) Relay `/health` returns JSON; status shown in UI.
3) Generate via Smart mode returns responsive HTML.
4) Generate via Specific Provider returns HTML; fallback to Smart when specific fails.
5) Relay down → banner visible; Paste/Import works.

## Rollout
- Implement `aiIntegrationService` and UI wiring.
- Add `POST /api/generate-email` on relay; keep `/health`.
- Configure `ai_server_base_url` in App Settings.
- Test end-to-end: providers present, relay running, and fallback.

## Outcome
- Templates AI uses providers from /settings/api dynamically via relay, with health-aware routing and a fallback that keeps authors productive without exposing credentials or relying on fixed ports.