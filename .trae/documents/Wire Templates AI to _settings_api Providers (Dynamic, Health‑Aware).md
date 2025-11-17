## Objectives
- Use existing /settings/api integrations to drive AI template generation reliably, without hardcoded ports.
- Provide dynamic provider selection, health checks, smart fallback, and secure routing that doesn’t expose API keys.

## Data & Routing
- Source providers: read active providers from `api_integrations` (already used by /settings/api).
- Relay server: prefer the existing AI relay (`server/aiServer.js`) for smart routing and security; avoid client-side direct provider calls.
- Dynamic base: read AI relay base URL from App Settings (e.g., `app_settings.ai_server_base_url`); fallback to env `VITE_AI_SERVER_URL` if the setting is missing.
- Health: before generation, call `GET <ai_base>/health`; if down, show fallback UI (Paste/Import HTML).

## UI Changes (Templates Tab)
- Provider selector:
  - “Smart (Relay)” — use relay to auto-pick provider by priority (Gemini/OpenAI/Groq) based on /settings/api.
  - “Specific Provider” — list active providers from /settings/api; relay receives the chosen provider name and routes accordingly.
- Status indicator:
  - Show relay health and chosen provider health; grey badge when offline.
- Actions:
  - Generate (via relay) → returns HTML to builder.
  - If relay/provider fails → show banner and enable Paste/Import HTML.

## Client Services
- `aiIntegrationService` (frontend):
  - `getActiveProviders()` reads `/settings/api` data (from Supabase via existing services).
  - `getAiBase()` resolves AI base from App Settings, fallback env.
  - `healthCheck(base)` calls `<base>/health`.
  - `generateTemplate({ subject, category, provider? })` posts to `<base>/api/test-ai` with a structured prompt and optional provider hint.

## Relay Updates (if needed)
- `/api/test-ai` already implements smart routing:
  - Accept a `provider_hint` param to force a specific provider when UI selects one.
  - Continue logging to `api_usage_logs`.

## Error Handling & Fallbacks
- Replace raw network errors with clear banner:
  - “AI service unreachable at <base>. Paste or Import HTML to continue.”
- Keep Paste from clipboard and textarea import always available.

## Security
- Do not expose provider API keys to the browser.
- Use relay server exclusively for provider calls.

## Validation
1) Confirm /settings/api lists active providers.
2) Relay health returns JSON via `<base>/health`.
3) Smart generation returns HTML; specific provider generation works when selected.
4) Banner shows when relay is down; Paste/Import continues to function.

## Rollout Steps
- Add client service to read /settings/api and AI base (App Settings).
- Add provider selector, health indicators, and error banners to Templates tab.
- Optional relay enhancement to accept `provider_hint`.
- Verify end-to-end with one provider active and with relay stopped (fallback visible).

## Outcome
- Templates AI uses providers configured in /settings/api, with dynamic selection, robust health checks, and graceful user fallback — no hardcoded ports or client-side credentials.