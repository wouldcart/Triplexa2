const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv/config');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function toCSV(rows) {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (val) => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') val = JSON.stringify(val);
    const s = String(val);
    // Escape double quotes
    const esc = s.replace(/"/g, '""');
    // If contains comma, quote, or newline, wrap in quotes
    if (/[",\n]/.test(esc)) return `"${esc}"`;
    return esc;
  };
  const lines = [];
  lines.push(headers.join(','));
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(','));
  }
  return lines.join('\n');
}

async function fetchAll(table) {
  const pageSize = 1000;
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) throw new Error(`Count ${table} failed: ${error.message}`);
  const total = count ?? 0;
  const all = [];
  for (let offset = 0; offset < total; offset += pageSize) {
    const { data, error: e2 } = await supabase.from(table).select('*').range(offset, Math.min(offset + pageSize - 1, total - 1));
    if (e2) throw new Error(`Fetch ${table} failed at offset ${offset}: ${e2.message}`);
    all.push(...(data ?? []));
  }
  return all;
}

async function main() {
  console.log('📦 Export agents and profiles to CSV');
  const agents = await fetchAll('agents');
  console.log(`Agents rows: ${agents.length}`);
  const agentsCsv = toCSV(agents);
  fs.writeFileSync('agents_rows.csv', agentsCsv);
  console.log('✅ agents_rows.csv written');

  const profiles = await fetchAll('profiles');
  console.log(`Profiles rows: ${profiles.length}`);
  const profilesCsv = toCSV(profiles);
  fs.writeFileSync('profiles_rows.csv', profilesCsv);
  console.log('✅ profiles_rows.csv written');
}

main().catch((e) => {
  console.error('Export failed:', e.message);
  process.exit(1);
});