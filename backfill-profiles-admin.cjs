const { createClient } = require('@supabase/supabase-js');
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

async function countProfiles() {
  const { count, error } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true });
  if (error) {
    console.log('❌ Count profiles failed:', error.message);
    return null;
  }
  return count ?? 0;
}

async function listUsersPage(page = 1, perPage = 500) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
  if (error) {
    console.log('❌ List users failed:', error.message);
    return null;
  }
  return data?.users ?? [];
}

async function backfillBatch(users) {
  if (!users.length) return { inserted: 0 };
  const rows = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: (u.user_metadata && (u.user_metadata.full_name || u.user_metadata.name)) || null,
    role: 'basic',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
  const { data, error } = await supabase
    .from('profiles')
    .upsert(rows, { onConflict: 'id' })
    .select();
  if (error) {
    console.log('❌ Upsert batch failed:', error.message);
    return { inserted: 0 };
  }
  return { inserted: Array.isArray(data) ? data.length : 0 };
}

async function main() {
  console.log('🔥 Backfill profiles using Admin API');
  const before = await countProfiles();
  if (before !== null) console.log(`Profiles before: ${before}`);

  let page = 1;
  let totalInserted = 0;
  while (true) {
    const users = await listUsersPage(page, 500);
    if (!users || users.length === 0) break;
    console.log(`Processing users page ${page}, count=${users.length}`);
    const { inserted } = await backfillBatch(users);
    totalInserted += inserted;
    console.log(`Inserted/updated ${inserted} rows on page ${page}`);
    page++;
  }

  const after = await countProfiles();
  if (after !== null) console.log(`Profiles after: ${after}`);
  console.log(`✅ Backfill complete. Total inserted/updated: ${totalInserted}`);
}

main().catch((e) => {
  console.error('Unexpected error:', e);
});