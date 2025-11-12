import { supabase } from '@/lib/supabaseClient';

type AIProvider = {
  id: string;
  provider_name: string;
  api_key: string;
  base_url: string;
  status: 'active' | 'inactive' | string;
  model_name?: string;
  temperature?: number;
  max_tokens?: number;
  priority?: number;
  usage_count?: number;
  daily_limit?: number;
};

const sb = supabase as any;

function isGemini(api: AIProvider) {
  const url = String(api?.base_url || '').toLowerCase();
  const name = String(api?.provider_name || '').toLowerCase();
  return url.includes('generativelanguage.googleapis.com') || name.includes('gemini');
}

function sortByDefaultPriority(providers: AIProvider[]): AIProvider[] {
  const order = ['gemini', 'google gemini', 'openai', 'groq'];
  return providers.slice().sort((a, b) => {
    const ai = a.provider_name.toLowerCase();
    const bi = b.provider_name.toLowerCase();
    const aiIdx = order.findIndex(o => ai.includes(o));
    const biIdx = order.findIndex(o => bi.includes(o));
    const aScore = aiIdx === -1 ? Number.POSITIVE_INFINITY : aiIdx;
    const bScore = biIdx === -1 ? Number.POSITIVE_INFINITY : biIdx;
    return aScore - bScore;
  });
}

export async function getActiveProviders(): Promise<AIProvider[]> {
  const { data, error } = await sb
    .from('api_integrations')
    .select('*')
    .eq('status', 'active');
  if (error) throw error;
  const list = (data || []) as AIProvider[];
  // Sort by explicit priority if present, otherwise fallback to default order
  const byPriority = list.slice().sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
  return sortByDefaultPriority(byPriority);
}

export type SmartPromptResult = {
  provider: string;
  model: string;
  text?: string;
  response_time_ms: number;
};

// Track per-session usage to optionally enforce a session limit per provider
const sessionUsageCounts: Record<string, number> = {};

function timeoutSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort('timeout'), timeoutMs);
  return controller.signal;
}

async function tryProvider(prompt: string, api: AIProvider, timeoutMs = 8000): Promise<SmartPromptResult | null> {
  const base = String(api.base_url || '').replace(/\/$/, '');
  const model = api.model_name || (isGemini(api) ? 'gemini-1.5-flash' : 'gpt-4o-mini');
  const start = performance.now();
  try {
    let statusCode = 0;
    let text: string | undefined;
    if (isGemini(api)) {
      const url = `${base}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(api.api_key)}`;
      const res = await fetch(url, {
        method: 'POST',
        signal: timeoutSignal(timeoutMs),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
        }),
      });
      statusCode = res.status;
      const json = await res.json().catch(() => ({}));
      // Extract best-effort text from Gemini response
      text = json?.candidates?.[0]?.content?.parts?.[0]?.text || json?.candidates?.[0]?.content?.parts?.[0]?.inline_data?.data;
      const duration = Math.round(performance.now() - start);
      await sb.from('api_usage_logs').insert({
        provider_name: api.provider_name,
        endpoint: 'generateContent',
        status_code: statusCode,
        response_time: duration,
        response_time_ms: duration,
        model_name: model,
        prompt,
        answer: text || '',
      });
      if (res.ok && typeof text === 'string') {
        return { provider: api.provider_name, model, text, response_time_ms: duration };
      }
      return null;
    } else {
      const url = `${base}/v1/chat/completions`;
      const res = await fetch(url, {
        method: 'POST',
        signal: timeoutSignal(timeoutMs),
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${api.api_key}` },
        body: JSON.stringify({
          model,
          temperature: typeof api.temperature === 'number' ? api.temperature : 0.7,
          messages: [
            { role: 'system', content: 'You are an AI assistant integrated into our platform.' },
            { role: 'user', content: prompt },
          ],
        }),
      });
      statusCode = res.status;
      const json = await res.json().catch(() => ({}));
      text = json?.choices?.[0]?.message?.content || json?.choices?.[0]?.text;
      const duration = Math.round(performance.now() - start);
      await sb.from('api_usage_logs').insert({
        provider_name: api.provider_name,
        endpoint: 'chat-completions',
        status_code: statusCode,
        response_time: duration,
        response_time_ms: duration,
        model_name: model,
        prompt,
        answer: text || '',
      });
      if (res.ok && typeof text === 'string') {
        return { provider: api.provider_name, model, text, response_time_ms: duration };
      }
      return null;
    }
  } catch (err: any) {
    const duration = Math.round(performance.now() - start);
    // Log network/timeout error minimally
    try {
      await sb.from('api_usage_logs').insert({
        provider_name: api.provider_name,
        endpoint: 'smart-router',
        status_code: err?.name === 'AbortError' || err?.message === 'timeout' ? 408 : 500,
        response_time: duration,
        response_time_ms: duration,
        model_name: api.model_name || '',
        prompt,
        answer: '',
      });
    } catch {}
    return null;
  }
}

export async function runSmartPrompt(
  prompt: string,
  options?: { timeoutMs?: number; maxRetriesPerProvider?: number; sessionProviderLimit?: number }
): Promise<SmartPromptResult> {
  const timeoutMs = options?.timeoutMs ?? 8000;
  const maxRetries = Math.max(1, options?.maxRetriesPerProvider ?? 1);
  const sessionLimit = options?.sessionProviderLimit;

  const providers = await getActiveProviders();
  if (!providers.length) {
    throw new Error('No active AI providers configured.');
  }

  for (let i = 0; i < providers.length; i++) {
    const p = providers[i];

    const currentUsage = typeof p.usage_count === 'number' ? p.usage_count : 0;
    const dailyLimit = typeof p.daily_limit === 'number' ? p.daily_limit : 50;
    if (currentUsage >= dailyLimit) {
      console.warn(`⚠️ ${p.provider_name} daily limit reached, skipping...`);
      try {
        await sb.from('api_usage_logs').insert({
          provider_name: p.provider_name,
          endpoint: 'smart-router-skip',
          status_code: 0,
          response_time: 0,
          response_time_ms: 0,
          model_name: p.model_name || '',
          prompt,
          answer: '',
          fallback_reason: 'daily_limit_reached',
        });
      } catch {}
      continue;
    }

    if (typeof sessionLimit === 'number') {
      const sessCount = sessionUsageCounts[p.id] || 0;
      if (sessCount >= sessionLimit) {
        console.warn(`⚠️ ${p.provider_name} session limit reached, skipping...`);
        try {
          await sb.from('api_usage_logs').insert({
            provider_name: p.provider_name,
            endpoint: 'smart-router-skip',
            status_code: 0,
            response_time: 0,
            response_time_ms: 0,
            model_name: p.model_name || '',
            prompt,
            answer: '',
            fallback_reason: 'session_limit_reached',
          });
        } catch {}
        continue;
      }
    }

    let attempt = 0;
    while (attempt < maxRetries) {
      const result = await tryProvider(prompt, p, timeoutMs);
      if (result) {
        // Increment usage_count only after successful call
        try {
          await sb
            .from('api_integrations')
            .update({ usage_count: currentUsage + 1, last_tested: new Date().toISOString() })
            .eq('id', p.id);
        } catch {}
        if (typeof sessionLimit === 'number') {
          sessionUsageCounts[p.id] = (sessionUsageCounts[p.id] || 0) + 1;
        }
        return result;
      }
      attempt++;
      if (attempt < maxRetries) {
        console.warn(`Retry ${attempt}/${maxRetries} failed for ${p.provider_name}`);
      }
    }

    const next = providers[i + 1];
    if (next) {
      // Log fallback transition to next provider
      try {
        await sb.from('api_usage_logs').insert({
          provider_name: p.provider_name,
          endpoint: 'smart-router-fallback',
          status_code: 0,
          response_time: 0,
          response_time_ms: 0,
          model_name: p.model_name || '',
          prompt,
          answer: '',
          fallback_reason: `${p.provider_name} failure → ${next.provider_name}`,
        });
      } catch {}
    }
  }
  throw new Error('All AI providers failed. Please try again later.');
}