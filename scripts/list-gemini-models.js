import 'dotenv/config';

async function listModels() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Missing GOOGLE_GEMINI_API_KEY in .env');
    process.exit(1);
  }
  const endpoints = [
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`,
  ];
  for (const url of endpoints) {
    try {
      console.log('Listing models from:', url.includes('/v1beta/') ? 'v1beta' : 'v1');
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        console.error('List error:', JSON.stringify(data));
        continue;
      }
      const models = data.models || [];
      console.log(`Found ${models.length} models`);
      for (const m of models) {
        console.log('-', m.name || m.id || m.model || 'unknown');
      }
    } catch (e) {
      console.error('Fetch failed:', e.message);
    }
  }
}

listModels();