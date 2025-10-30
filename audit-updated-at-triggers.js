// Audit triggers that update updated_at/last_updated and verify function search_path
// - Lists triggers across public and storage schemas
// - Identifies trigger functions that mutate updated_at/last_updated
// - Checks if those functions have an explicit SET search_path

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase env vars: set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function testBasicAccess() {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(1)
    if (error) {
      console.log('ℹ️ information_schema access error:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.log('ℹ️ information_schema access failed:', err.message)
    return false
  }
}

async function tryRPC(functionName, payload) {
  try {
    const { data, error } = await supabase.rpc(functionName, payload)
    if (error) return { ok: false, error }
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: { message: err.message } }
  }
}

async function runSQL(sql) {
  // Try multiple methods to execute raw SQL, preferring standard helpers if present
  const attempts = [
    { fn: 'exec_sql', payload: { sql } },
    { fn: 'sql', payload: { query: sql } },
    { fn: 'exec', payload: { sql } }
  ]

  for (const attempt of attempts) {
    const res = await tryRPC(attempt.fn, attempt.payload)
    if (res.ok && res.data) return { ok: true, data: res.data }
  }

  // Fallback to REST call to rpc/exec_sql with different payload shapes
  try {
    const resp = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql })
    })
    if (resp.ok) {
      const data = await resp.json().catch(() => null)
      return { ok: true, data }
    }
  } catch {}

  // Alternate payload key
  try {
    const resp = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql_query: sql })
    })
    if (resp.ok) {
      const data = await resp.json().catch(() => null)
      return { ok: true, data }
    }
  } catch {}

  return { ok: false, error: { message: 'No working SQL RPC found (exec_sql/sql/exec). Create one to enable raw catalog queries.' } }
}

function parseSearchPath(proconfig) {
  if (!proconfig) return null
  // proconfig may be array (e.g., ['search_path=public']) or string
  let entries = []
  if (Array.isArray(proconfig)) entries = proconfig
  else if (typeof proconfig === 'string') entries = proconfig.split(',')
  else if (typeof proconfig === 'object' && proconfig !== null) entries = Object.values(proconfig)
  const sp = entries.find(e => typeof e === 'string' && e.trim().toLowerCase().startsWith('search_path='))
  if (!sp) return null
  const val = sp.split('=')[1]
  return val ? val.trim() : null
}

function functionUpdatesTimestamp(def) {
  const d = (def || '').toLowerCase()
  return (
    d.includes('new.updated_at :=') ||
    d.includes('new.updated_at =') ||
    d.includes('new.last_updated :=') ||
    d.includes('new.last_updated =') ||
    d.includes('update ') && d.includes(' set updated_at')
  )
}

async function getTriggerFunctionsViaSQL() {
  const sql = `
    SELECT
      ns.nspname AS table_schema,
      cls.relname AS table_name,
      trg.tgname AS trigger_name,
      fns.nspname AS function_schema,
      pr.proname AS function_name,
      pr.oid AS function_oid,
      pr.proconfig AS proconfig,
      pg_get_functiondef(pr.oid) AS function_def
    FROM pg_trigger trg
    JOIN pg_class cls ON cls.oid = trg.tgrelid
    JOIN pg_namespace ns ON ns.oid = cls.relnamespace
    JOIN pg_proc pr ON pr.oid = trg.tgfoid
    JOIN pg_namespace fns ON fns.oid = pr.pronamespace
    WHERE NOT trg.tgisinternal
      AND ns.nspname IN ('public', 'storage')
    ORDER BY ns.nspname, cls.relname, trg.tgname;`

  const res = await runSQL(sql)
  if (!res.ok) return { ok: false, error: res.error }
  const rows = Array.isArray(res.data) ? res.data : []
  return { ok: true, rows }
}

async function getHelperFunctionsViaSQL() {
  const sql = `
    SELECT
      fns.nspname AS function_schema,
      pr.proname AS function_name,
      pr.oid AS function_oid,
      pr.proconfig AS proconfig,
      pg_get_functiondef(pr.oid) AS function_def
    FROM pg_proc pr
    JOIN pg_namespace fns ON fns.oid = pr.pronamespace
    WHERE fns.nspname IN ('public','storage')
      AND (
        pr.proname ILIKE '%updated_at%' OR
        pr.proname ILIKE '%set_timestamp%' OR
        pr.proname ILIKE '%last_updated%' OR
        pg_get_functiondef(pr.oid) ILIKE '%NEW.updated_at%' OR
        pg_get_functiondef(pr.oid) ILIKE '%NEW.last_updated%'
      )
    ORDER BY fns.nspname, pr.proname;`

  const res = await runSQL(sql)
  if (!res.ok) return { ok: false, error: res.error }
  const rows = Array.isArray(res.data) ? res.data : []
  return { ok: true, rows }
}

function summarize(results) {
  const lines = []
  const missingSP = []

  for (const r of results) {
    const sp = parseSearchPath(r.proconfig)
    const updates = functionUpdatesTimestamp(r.function_def)
    const hasSP = !!sp
    const fnIdent = `${r.function_schema}.${r.function_name}`

    if (r.trigger_name) {
      lines.push(`- [${r.table_schema}.${r.table_name}] trigger '${r.trigger_name}' -> ${fnIdent} | updates_ts=${updates} | search_path=${sp || 'NONE'}`)
    } else {
      lines.push(`- function ${fnIdent} | updates_ts=${updates} | search_path=${sp || 'NONE'}`)
    }

    if (updates && !hasSP) missingSP.push(fnIdent)
  }

  const uniqueMissing = Array.from(new Set(missingSP))
  return { lines, uniqueMissing }
}

async function main() {
  console.log('🔎 Auditing updated_at/last_updated triggers and function search_path settings\n')

  const basic = await testBasicAccess()
  if (!basic) {
    console.log('⚠️ Limited information_schema access; will try raw SQL RPC methods.')
  }

  const trigRes = await getTriggerFunctionsViaSQL()
  if (!trigRes.ok) {
    console.error('❌ Unable to query trigger functions via SQL:', trigRes.error?.message)
    console.error('   Hint: Ensure a helper RPC exists (e.g., exec_sql(sql text), sql(query text)).')
  }

  const helpRes = await getHelperFunctionsViaSQL()
  if (!helpRes.ok) {
    console.error('❌ Unable to query helper functions via SQL:', helpRes.error?.message)
  }

  const combined = []
  if (trigRes.ok) combined.push(...trigRes.rows)
  if (helpRes.ok) {
    // Deduplicate helper-only rows that may already appear in trigger list
    const trigOids = new Set((trigRes.rows || []).map(r => r.function_oid))
    for (const r of helpRes.rows) {
      if (!trigOids.has(r.function_oid)) combined.push(r)
    }
  }

  if (combined.length === 0) {
    console.log('\nℹ️ No results. You may need to enable the exec_sql/sql RPC or run this script on a DB with catalog access.')
    process.exit(0)
  }

  const { lines, uniqueMissing } = summarize(combined)

  console.log('\n📋 Results:')
  for (const line of lines) console.log(line)

  console.log('\n⚠️ Functions updating timestamps without explicit search_path:')
  if (uniqueMissing.length === 0) console.log('- None')
  else uniqueMissing.forEach(fn => console.log(`- ${fn}`))

  console.log('\n✅ Audit complete.')
}

main().catch(err => {
  console.error('❌ Audit script error:', err.message)
})