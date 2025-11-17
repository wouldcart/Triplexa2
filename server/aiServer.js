import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.AI_SERVER_PORT || 3004;

app.use(helmet());
// Relaxed CORS for local development to support multiple preview/dev ports
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,
  'http://localhost:3003',
  'http://localhost:5173',
].filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    // Allow same-origin or tools without origin (curl/postman)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    // Allow any localhost port in dev
    if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: false,
}));
// Handle CORS preflight requests
app.options('*', cors());
app.use(express.json({ limit: '2mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
});
app.use(limiter);

// Supabase admin client for reading API integrations and writing logs
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase URL or service role key for AI server.');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function isGemini(api) {
  const url = String(api?.base_url || '').toLowerCase();
  const name = String(api?.provider_name || '').toLowerCase();
  return url.includes('generativelanguage.googleapis.com') || name.includes('gemini');
}

function sortByDefaultPriority(providers) {
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

async function getActiveProviders() {
  const { data, error } = await supabase
    .from('api_integrations')
    .select('*')
    .eq('status', 'active');
  if (error) throw error;
  const list = data || [];
  const byPriority = list.slice().sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
  return sortByDefaultPriority(byPriority);
}

function abortSignal(timeoutMs) {
  const controller = new AbortController();
  setTimeout(() => controller.abort('timeout'), timeoutMs);
  return controller.signal;
}

async function tryProvider(prompt, api, timeoutMs = 8000) {
  const base = String(api.base_url || '').replace(/\/$/, '');
  const model = api.model_name || (isGemini(api) ? 'gemini-1.5-flash' : 'gpt-4o-mini');
  const start = Date.now();
  try {
    let statusCode = 0;
    let text;
    if (isGemini(api)) {
      const url = `${base}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(api.api_key)}`;
      const res = await fetch(url, {
        method: 'POST',
        signal: abortSignal(timeoutMs),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: prompt }] },
          ],
        }),
      });
      statusCode = res.status;
      const json = await res.json().catch(() => ({}));
      text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      const duration = Date.now() - start;
      await supabase.from('api_usage_logs').insert({
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
        signal: abortSignal(timeoutMs),
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
      const duration = Date.now() - start;
      await supabase.from('api_usage_logs').insert({
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
  } catch (err) {
    const duration = Date.now() - start;
    try {
      await supabase.from('api_usage_logs').insert({
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

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'ai-server', timestamp: new Date().toISOString() });
});

app.post('/api/test-ai', async (req, res) => {
  try {
    const { prompt } = req.body || {};
    const testPrompt =
      prompt || `You are an AI assistant integrated into our platform.\nYour job is to:\n1. Test connectivity and usage limits.\n2. Return a short JSON response in this format:\n{\n  "status": "success",\n  "model": "model_name",\n  "response_time_ms": 1234\n}\nIf the API is overloaded or limit exceeded, respond with:\n{\n  "status": "busy",\n  "error": "Rate limit reached or server overloaded."\n}`;

    const providers = await getActiveProviders();
    if (!providers.length) {
      return res.status(400).json({ error: 'No active AI providers configured.' });
    }

    for (let i = 0; i < providers.length; i++) {
      const p = providers[i];
      const result = await tryProvider(testPrompt, p, 8000);
      if (result) {
        return res.json({ provider: result.provider, model: result.model, response_time_ms: result.response_time_ms, text: result.text });
      }
      const next = providers[i + 1];
      if (next) {
        try {
          await supabase.from('api_usage_logs').insert({
            provider_name: p.provider_name,
            endpoint: 'smart-router-fallback',
            status_code: 0,
            response_time: 0,
            response_time_ms: 0,
            model_name: p.model_name || '',
            prompt: testPrompt,
            answer: '',
            fallback_reason: `${p.provider_name} failure → ${next.provider_name}`,
          });
        } catch {}
      }
    }

    return res.status(503).json({ error: 'All AI providers failed or busy.' });
  } catch (error) {
    console.error('AI test error:', error);
    res.status(500).json({ error: error?.message || 'Internal error' });
  }
});

app.post('/api/generate-email', async (req, res) => {
  try {
    const { subject = '', category = 'custom', provider_hint, content_guide = '' } = req.body || {};
    const basePrompt = `You are an email template generator. Produce responsive, email-client-friendly HTML with inline styles.
Subject: ${subject}
Category: ${category}
Guidelines: ${content_guide}
Requirements:
- Header with company placeholder
- Main content block
- Bullet list if relevant
- A clear CTA button with {CTAUrl} placeholder
- Footer with unsubscribe {UnsubscribeUrl}
- Use tokens like {Name}, {CompanyName}
- Keep HTML clean (tables or simple divs), inline styles; avoid external CSS.
Return ONLY HTML.`;

    const providers = await getActiveProviders();
    if (!providers.length) {
      return res.status(400).json({ error: 'No active AI providers configured.' });
    }

    const ordered = provider_hint
      ? providers.reduce((acc, p) => {
          if ((p.provider_name || '').toLowerCase().includes(String(provider_hint).toLowerCase())) acc.unshift(p);
          else acc.push(p);
          return acc;
        }, [])
      : providers;

    for (let i = 0; i < ordered.length; i++) {
      const p = ordered[i];
      const result = await tryProvider(basePrompt, p, 12000);
      if (result && typeof result.text === 'string') {
        return res.json({ provider: result.provider, model: result.model, response_time_ms: result.response_time_ms, html: result.text });
      }
    }
    return res.status(503).json({ error: 'All AI providers failed or are busy.' });
  } catch (error) {
    console.error('AI generate-email error:', error);
    res.status(500).json({ error: error?.message || 'Internal error' });
  }
});

app.listen(PORT, () => {
  console.log(`🤖 AI server running on http://localhost:${PORT}`);
});

export default app;
