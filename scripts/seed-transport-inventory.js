#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Helpers
const readTransportDataFile = () => {
  const dataPath = path.join(__dirname, '..', 'src/pages/inventory/transport/data/transportData.ts');
  if (!fs.existsSync(dataPath)) {
    console.error('❌ Could not find transportData.ts at', dataPath);
    process.exit(1);
  }
  return fs.readFileSync(dataPath, 'utf-8');
};

const extractArrayText = (source, exportConstName) => {
  // Supports optional TypeScript type annotation: export const name: Type[] = [ ... ];
  const regex = new RegExp(
    `export\\s+const\\s+${exportConstName}(?:\\s*:\\s*[^=]+)?\\s*=\\s*\\[([\\s\\S]*?)\\];`,
    'm'
  );
  const match = source.match(regex);
  if (!match) {
    return null;
  }
  return `[${match[1]}]`;
};

const evalArrayFromText = (arrayText) => {
  if (!arrayText) return [];
  const cleaned = arrayText
    .replace(/as const/g, '')
    .replace(/\b(category|status)\s*:\s*(["'])([A-Za-z -]+)\2\s*,/g, (m, k, q, v) => `${k}: ${q}${v}${q},`);
  const code = `const data = ${cleaned}; data;`;
  try {
    const result = vm.runInNewContext(code, {}, { timeout: 1000 });
    if (Array.isArray(result)) return result;
    return [];
  } catch (e) {
    console.error('❌ Failed to evaluate array from text:', e.message);
    return [];
  }
};

const chunk = (arr, size = 100) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

const parseLatitude = (val) => {
  if (val == null) return null;
  if (typeof val === 'number') return val;
  const num = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(num) ? num : null;
};

const parseLongitude = (val) => parseLatitude(val);

async function seedLocationCodes(locationCodes) {
  console.log(`\n📍 Seeding location_codes (${locationCodes.length} records)`);
  const { data: existing, error: existingErr } = await supabase
    .from('location_codes')
    .select('id, code');
  if (existingErr) throw existingErr;
  const existingCodes = new Set((existing || []).map(r => r.code));

  const payload = locationCodes.map(loc => ({
    code: loc.code,
    full_name: loc.fullName,
    category: loc.category,
    country: loc.country,
    city: loc.city,
    status: loc.status || 'active',
    notes: loc.notes || null,
    latitude: parseLatitude(loc.latitude),
    longitude: parseLongitude(loc.longitude),
  })).filter(r => r.code && !existingCodes.has(r.code));

  console.log(`➡️  New location codes to insert: ${payload.length}`);
  for (const part of chunk(payload, 500)) {
    const { error } = await supabase.from('location_codes').insert(part);
    if (error) throw error;
    console.log(`   Inserted ${part.length} location codes`);
  }
  console.log('✅ location_codes seeding complete');
}

async function seedTransportTypesFromRoutes(transportRoutes) {
  console.log(`\n🚐 Deriving transport_types from routes (types by first occurrence)`);
  const typeMap = new Map();
  for (const route of transportRoutes) {
    const list = route.transportTypes || [];
    for (const t of list) {
      const name = t.type || t.name;
      if (!name) continue;
      if (!typeMap.has(name)) {
        typeMap.set(name, {
          name,
          category: 'Standard',
          seating_capacity: t.seatingCapacity ?? 0,
          luggage_capacity: t.luggageCapacity ?? 0,
          active: true,
        });
      }
    }
  }

  const derived = Array.from(typeMap.values());
  console.log(`➡️  Derived ${derived.length} transport types`);

  const { data: existing, error: existingErr } = await supabase
    .from('transport_types')
    .select('id, name');
  if (existingErr) throw existingErr;
  const existingNames = new Set((existing || []).map(r => r.name));

  const payload = derived.filter(t => t.name && !existingNames.has(t.name));
  console.log(`➡️  New transport types to insert: ${payload.length}`);
  for (const part of chunk(payload, 500)) {
    const { error } = await supabase.from('transport_types').insert(part);
    if (error) throw error;
    console.log(`   Inserted ${part.length} transport types`);
  }
  console.log('✅ transport_types seeding complete');
}

async function seedTransportRoutes(transportRoutes) {
  console.log(`\n🛣️  Seeding transport_routes (${transportRoutes.length} records)`);
  // Skip schema-dependent deduplication to maximize compatibility
  const existingKeySet = new Set();

  const payload = transportRoutes.map(route => {
    const transportEntries = (route.transportTypes || []).map(t => ({
      type: t.type,
      duration: t.duration,
      price: t.price,
      seatingCapacity: t.seatingCapacity,
      luggageCapacity: t.luggageCapacity,
    }));
    const intermediateStops = (route.intermediateStops || []).map(s => ({
      id: s.id,
      locationCode: s.locationCode,
      fullName: s.fullName,
      transferMethod: s.transferMethod,
    }));
    return {
      // Snake_case schema
      country: route.country,
      route_name: route.name || `${route.startLocation} to ${route.endLocation}`,
      route_code: route.code || `${route.startLocation}-${route.endLocation}`,
      transfer_type: route.transferType || 'One-Way',
      start_location_code: route.startLocation,
      end_location_code: route.endLocation,
      // Common alt snake_case used in some schemas
      start_location: route.startLocation,
      end_location: route.endLocation,
      intermediate_stops: intermediateStops.length ? intermediateStops : null,
      transfer_method_notes: route.description || null,
      transport_entries: transportEntries.length ? transportEntries : null,
      sightseeing_options: route.sightseeingOptions || null,
      status: route.status || 'active',
      // CamelCase schema (proposal-like)
      name: route.name || `${route.startLocation} to ${route.endLocation}`,
      code: route.code || `${route.startLocation}-${route.endLocation}`,
      transferType: route.transferType || 'One-Way',
      startLocation: route.startLocation,
      startLocationFullName: route.startLocationFullName || route.startLocation,
      endLocation: route.endLocation,
      endLocationFullName: route.endLocationFullName || route.endLocation,
      duration: route.duration || (transportEntries[0]?.duration ?? ''),
      price: route.price ?? (transportEntries[0]?.price ?? 0),
    };
  }).filter(r => {
    const key = `${r.route_name}||${r.start_location_code}||${r.end_location_code}`;
    return !existingKeySet.has(key);
  });

  console.log(`➡️  New transport routes to insert: ${payload.length}`);
  for (const part of chunk(payload, 250)) {
    // Progressive insertion removing unknown columns if necessary
    let attempt = 0;
    let batch = part.map(r => ({ ...r }));
    while (attempt < 20) {
      const { error } = await supabase.from('transport_routes').insert(batch);
      if (!error) {
        console.log(`   Inserted ${batch.length} transport routes`);
        break;
      }
      if (error && typeof error.message === 'string') {
        // Pattern 1: Postgres undefined column
        let colMatch = error.message.match(/column\s+transport_routes\.(\w+)\s+does\s+not\s+exist/i);
        // Pattern 2: PostgREST schema cache missing column
        if (!colMatch) {
          colMatch = error.message.match(/Could not find the '(\w+)' column/i);
        }
        if (colMatch && colMatch[1]) {
          const missing = colMatch[1];
          console.warn(`   ⚠️  Column '${missing}' missing; retrying without it...`);
          batch = batch.map(obj => {
            const copy = { ...obj };
            delete copy[missing];
            return copy;
          });
          attempt++;
          continue;
        }
      }
      // For other errors, throw immediately
      throw error;
    }
  }
  console.log('✅ transport_routes seeding complete');
}

async function main() {
  console.log('🚀 Transport Inventory Seeding');
  console.log('==============================');

  const source = readTransportDataFile();
  const locationCodesText = extractArrayText(source, 'locationCodes');
  const transportRoutesText = extractArrayText(source, 'transportRoutes');

  const locationCodes = evalArrayFromText(locationCodesText);
  const transportRoutes = evalArrayFromText(transportRoutesText);

  if (!locationCodes.length && !transportRoutes.length) {
    console.error('❌ Failed to extract data arrays from transportData.ts');
    process.exit(1);
  }

  try {
    if (locationCodes.length) {
      await seedLocationCodes(locationCodes);
    } else {
      console.warn('⚠️ No location codes found in source');
    }

    if (transportRoutes.length) {
      // Seed derived transport types first (if table exists)
      try {
        await seedTransportTypesFromRoutes(transportRoutes);
      } catch (e) {
        console.warn('⚠️ Skipping transport_types seeding (table may not exist):', e.message);
      }
      await seedTransportRoutes(transportRoutes);
    } else {
      console.warn('⚠️ No transport routes found in source');
    }

    console.log('\n🎉 Seeding completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

main();