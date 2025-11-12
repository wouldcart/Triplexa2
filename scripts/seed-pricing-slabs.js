// @ts-check
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

/**
 * This script seeds three Thailand markup slabs into `public.markup_slabs` and
 * ensures a default pricing configuration exists in `public.pricing_configurations`.
 * It uses SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_* fallbacks).
 */

/**
 * @typedef {'fixed'|'percentage'} SlabType
 */

/**
 * @typedef {Object} UpsertSlabInput
 * @property {string} name
 * @property {number} min
 * @property {number} max
 * @property {SlabType} type
 * @property {number} value
 * @property {string} [updatedAt]
 * @property {number} [priority]
 */

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing Supabase env vars: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_* equivalents).');
  process.exit(1);
}

const supabase = createClient(url, key);

const CONFIG_TABLE = 'pricing_configurations';
const SLABS_TABLE = 'markup_slabs';
const DEFAULT_CONFIG_NAME = 'Default Pricing Configuration';

async function getOrCreateDefaultConfig() {
  // Try by config_name first
  let { data: config, error } = await supabase
    .from(CONFIG_TABLE)
    .select('*')
    .eq('config_name', DEFAULT_CONFIG_NAME)
    .limit(1)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  if (config) return config;

  // Fall back to latest active
  const { data: latestActive, error: latestErr } = await supabase
    .from(CONFIG_TABLE)
    .select('*')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();
  if (!latestErr && latestActive) return latestActive;

  // Create default for Thailand if nothing exists
  const payload = {
    config_name: DEFAULT_CONFIG_NAME,
    is_active: true,
    default_country: 'TH',
    country_name: 'Thailand',
    base_currency: 'THB',
    currency: 'THB',
    currency_symbol: '฿',
    default_markup_percentage: 10,
    use_slab_pricing: true,
  };

  const { data: created, error: upErr } = await supabase
    .from(CONFIG_TABLE)
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();
  if (upErr) throw upErr;
  return created;
}
/**
 * Upsert or insert a markup slab for a given configuration.
 * @param {string} configId
 * @param {UpsertSlabInput} input
 */
async function upsertSlab(configId, input) {
  const { name, min, max, type, value, updatedAt, priority } = input;
  // Check if a slab with same name exists for this config
  const { data: existing, error: selErr } = await supabase
    .from(SLABS_TABLE)
    .select('*')
    .eq('config_id', configId)
    .eq('slab_name', name)
    .limit(1)
    .single();

  if (selErr && selErr.code !== 'PGRST116') throw selErr;

  const row = {
    config_id: configId,
    slab_name: name,
    description: null,
    min_amount: min,
    max_amount: max,
    markup_type: type, // 'fixed' | 'percentage'
    additional_percentage: type === 'percentage' ? value : 0,
    fixed_amount: type === 'fixed' ? value : 0,
    is_active: true,
    priority: priority ?? 1,
    application_mode_override: null,
    updated_at: updatedAt ?? new Date().toISOString(),
  };

  if (existing) {
    const { error: updErr } = await supabase
      .from(SLABS_TABLE)
      .update(row)
      .eq('id', existing.id);
    if (updErr) throw updErr;
    console.log(`Updated slab: ${name}`);
  } else {
    const { error: insErr } = await supabase
      .from(SLABS_TABLE)
      .insert(row);
    if (insErr) throw insErr;
    console.log(`Inserted slab: ${name}`);
  }
}

async function main() {
  try {
    const config = await getOrCreateDefaultConfig();
    const configId = config.id;
    console.log('Using configuration:', config.config_name, configId);

    // Seed the three TH slabs
    await upsertSlab(configId, {
      name: 'Thailand Basic Slab',
      min: 1000,
      max: 5000,
      type: 'fixed',
      value: 100,
      updatedAt: '2025-11-04T00:00:00.000Z',
      priority: 1,
    });
    await upsertSlab(configId, {
      name: 'Thailand Standard Slab',
      min: 5001,
      max: 15000,
      type: 'percentage',
      value: 8,
      updatedAt: '2025-11-04T00:00:00.000Z',
      priority: 2,
    });
    await upsertSlab(configId, {
      name: 'Thailand Luxury Slab',
      min: 15001,
      max: 999999,
      type: 'percentage',
      value: 10,
      updatedAt: '2025-11-04T00:00:00.000Z',
      priority: 3,
    });

    console.log('Pricing slabs seeding complete.');
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

main();