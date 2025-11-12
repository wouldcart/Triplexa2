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
  usage_count?: number;
};

const sb = supabase as any;

function isGemini(api: AIProvider) {
  const url = String(api?.base_url || '').toLowerCase();
  const name = String(api?.provider_name || '').toLowerCase();
  return url.includes('generativelanguage.googleapis.com') || name.includes('gemini');
}

export async function getActiveProvider(): Promise<AIProvider | null> {
  const { data, error } = await sb
    .from('api_integrations')
    .select('*')
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1);
  if (error) throw error;
  return (data && data[0]) || null;
}

export async function listModels(api: AIProvider): Promise<{ ok: boolean; status: number; timeMs: number }> {
  const base = String(api.base_url || '').replace(/\/$/, '');
  let url = '';
  let init: RequestInit = { method: 'GET' };
  if (isGemini(api)) {
    url = `${base}/models?key=${encodeURIComponent(api.api_key)}`;
  } else {
    url = `${base}/v1/models`;
    init.headers = { Authorization: `Bearer ${api.api_key}` } as any;
  }
  const start = performance.now();
  const res = await fetch(url, init);
  const timeMs = performance.now() - start;
  await sb.from('api_usage_logs').insert({
    provider_name: api.provider_name,
    endpoint: 'list-models',
    status_code: res.status,
    response_time: timeMs,
    model_name: api.model_name || null,
  });
  return { ok: res.ok, status: res.status, timeMs };
}

export async function generateWithProvider(api: AIProvider, prompt: string): Promise<string> {
  const base = String(api.base_url || '').replace(/\/$/, '');
  const model = api.model_name || (isGemini(api) ? 'gemini-2.5-flash' : 'gpt-4o-mini');
  const start = performance.now();
  if (isGemini(api)) {
    const url = `${base}/models/${model}:generateContent?key=${encodeURIComponent(api.api_key)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    const timeMs = performance.now() - start;
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error?.message || `HTTP ${res.status}`);
    }
    const data = await res.json();
    const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const usage = (data as any)?.usageMetadata || {};
    const promptTokens = Number(usage?.promptTokenCount ?? usage?.prompt_tokens ?? 0) || null;
    const completionTokens = Number(usage?.candidatesTokenCount ?? usage?.completion_tokens ?? 0) || null;
    const totalTokens = Number(usage?.totalTokenCount ?? (promptTokens && completionTokens ? (promptTokens + completionTokens) : undefined)) || null;
    try {
      await sb.from('api_usage_logs').insert({
        provider_name: api.provider_name,
        endpoint: 'generate-content',
        status_code: res.status,
        response_time: timeMs,
        response_time_ms: Math.round(timeMs),
        prompt,
        answer,
        timestamp: new Date().toISOString(),
        model_name: model,
        prompt_tokens: promptTokens ?? null,
        completion_tokens: completionTokens ?? null,
        total_tokens: totalTokens ?? null,
      });
    } catch (e) {
      await sb.from('api_usage_logs').insert({
        provider_name: api.provider_name,
        endpoint: 'generate-content',
        status_code: res.status,
        response_time: timeMs,
        model_name: model,
      });
    }
    return answer;
  } else {
    const url = `${base}/v1/chat/completions`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${api.api_key}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are an AI itinerary assistant.' },
          { role: 'user', content: prompt },
        ],
      }),
    });
    const timeMs = performance.now() - start;
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error?.message || `HTTP ${res.status}`);
    }
    const data = await res.json();
    const answer = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || '';
    const usage = (data as any)?.usage || {};
    const promptTokens = Number(usage?.prompt_tokens ?? 0) || null;
    const completionTokens = Number(usage?.completion_tokens ?? 0) || null;
    const totalTokens = Number(usage?.total_tokens ?? (promptTokens && completionTokens ? (promptTokens + completionTokens) : undefined)) || null;
    try {
      await sb.from('api_usage_logs').insert({
        provider_name: api.provider_name,
        endpoint: 'chat-completions',
        status_code: res.status,
        response_time: timeMs,
        response_time_ms: Math.round(timeMs),
        prompt,
        answer,
        timestamp: new Date().toISOString(),
        model_name: model,
        prompt_tokens: promptTokens ?? null,
        completion_tokens: completionTokens ?? null,
        total_tokens: totalTokens ?? null,
      });
    } catch (e) {
      await sb.from('api_usage_logs').insert({
        provider_name: api.provider_name,
        endpoint: 'chat-completions',
        status_code: res.status,
        response_time: timeMs,
        model_name: model,
      });
    }
    return answer;
  }
}

export async function generateWithActiveProvider(prompt: string): Promise<string> {
  const api = await getActiveProvider();
  if (!api) throw new Error('No active AI provider configured');
  const text = await generateWithProvider(api, prompt);
  await sb
    .from('api_integrations')
    .update({
      usage_count: (typeof api.usage_count === 'number' ? api.usage_count : 0) + 1,
      last_tested: new Date().toISOString(),
    })
    .eq('id', api.id);
  return text;
}