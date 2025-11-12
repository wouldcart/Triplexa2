import 'dotenv/config';

const MODEL_SEQUENCE_V1 = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
];

async function generateItineraryUsingModel(prompt, model) {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('Missing GOOGLE_GEMINI_API_KEY in environment');

  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  const data = await response.json();
  if (!response.ok) {
    const msg = data?.error?.message || `HTTP ${response.status}`;
    const status = data?.error?.status || '';
    const code = data?.error?.code || response.status;
    const err = new Error(msg);
    err.status = status;
    err.code = code;
    throw err;
  }
  return data?.candidates?.[0]?.content?.parts?.[0]?.text;
}

async function generateItinerary(prompt) {
  let lastErr;
  for (const model of MODEL_SEQUENCE_V1) {
    // Retry up to 3 times per model on transient overloads.
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await generateItineraryUsingModel(prompt, model);
      } catch (err) {
        lastErr = err;
        const msg = String(err?.message || 'Unknown error');
        const transient =
          msg.includes('overloaded') ||
          msg.includes('temporarily over capacity') ||
          err?.code === 429 || err?.code === 503 || err?.status === 'RESOURCE_EXHAUSTED';
        if (!transient) break; // move to next model
        // Exponential backoff: 0.5s, 1s, 2s
        const delayMs = 500 * Math.pow(2, attempt - 1);
        await new Promise(r => setTimeout(r, delayMs));
      }
    }
  }
  throw lastErr || new Error('Gemini request failed');
}

// Test run
(async () => {
  const prompt = 'Generate 4-day Phuket + Krabi trip plan';
  console.log('Prompt:', prompt);
  try {
    const itinerary = await generateItinerary(prompt);
    console.log('\nItinerary:\n');
    console.log(itinerary || '(No text returned)');
  } catch (err) {
    console.error('Gemini request failed:', err?.message || err);
    process.exitCode = 1;
  }
})();