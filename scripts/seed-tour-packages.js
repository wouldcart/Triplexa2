import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabaseKey = supabaseServiceKey || supabaseAnonKey;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars: SUPABASE_URL/VITE_SUPABASE_URL and Service/Anon key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ensureTable() {
  console.log('🔎 Checking tour_packages table...');
  try {
    const { error } = await supabase.from('tour_packages').select('id').limit(1);
    if (!error) {
      console.log('✅ tour_packages table exists');
      return true;
    }
  } catch (e) {
    // ignore
  }

  console.log('⚠️ tour_packages table missing. Attempting to create via exec_sql...');
  const createSql = `
  CREATE TABLE IF NOT EXISTS public.tour_packages (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    external_id text NULL,
    name text NOT NULL,
    summary text NULL,
    description text NULL,
    min_pax integer NOT NULL,
    max_pax integer NULL,
    days integer NOT NULL,
    nights integer NOT NULL,
    is_fixed_departure boolean NULL DEFAULT false,
    departure_date date NULL,
    return_date date NULL,
    total_seats integer NULL,
    start_city text NULL,
    end_city text NULL,
    destinations jsonb NULL DEFAULT '[]'::jsonb,
    package_type text NOT NULL,
    themes jsonb NULL DEFAULT '[]'::jsonb,
    banners jsonb NULL DEFAULT '[]'::jsonb,
    itinerary jsonb NULL DEFAULT '[]'::jsonb,
    base_cost numeric(10, 2) NOT NULL DEFAULT 0,
    markup numeric(10, 2) NOT NULL DEFAULT 0,
    commission numeric(10, 2) NULL,
    final_price numeric(10, 2) NOT NULL DEFAULT 0,
    price_per_person numeric(10, 2) NOT NULL DEFAULT 0,
    currency text NOT NULL,
    inclusions text NULL,
    exclusions text NULL,
    cancellation_policy text NULL,
    payment_policy text NULL,
    status text NOT NULL DEFAULT 'draft'::text,
    created_at timestamptz NULL DEFAULT now(),
    updated_at timestamptz NULL DEFAULT now(),
    CONSTRAINT tour_packages_pkey PRIMARY KEY (id),
    CONSTRAINT tour_packages_package_type_check CHECK (
      package_type = ANY (ARRAY['domestic'::text, 'international'::text, 'custom'::text, 'inbound'::text])
    ),
    CONSTRAINT tour_packages_status_check CHECK (
      status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])
    )
  );
  CREATE INDEX IF NOT EXISTS idx_tour_packages_status ON public.tour_packages USING btree (status);
  CREATE INDEX IF NOT EXISTS idx_tour_packages_type ON public.tour_packages USING btree (package_type);
  `;

  try {
    // Use exec_sql RPC if available
    const { error } = await supabase.rpc('exec_sql', { sql_query: createSql });
    if (error) {
      console.warn('❌ exec_sql failed or not available:', error.message);
      return false;
    }
    console.log('✅ tour_packages table created');
    return true;
  } catch (err) {
    console.warn('❌ Unable to create table via RPC:', err.message);
    console.warn('👉 You can apply migration at supabase/migrations/20251030120000_create_tour_packages.sql');
    return false;
  }
}

function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function buildSamplePackages(count = 36) {
  const packageTypes = ['domestic', 'international', 'custom', 'inbound'];
  const currencies = ['INR', 'USD', 'EUR'];
  const themesPool = ['Adventure', 'Beach', 'Culture', 'Family', 'Luxury', 'Wildlife', 'Honeymoon'];
  const cities = ['Delhi', 'Mumbai', 'Jaipur', 'Agra', 'Goa', 'Bangkok', 'Phuket', 'Dubai', 'Abu Dhabi', 'Singapore'];
  const names = [
    'Golden Triangle Escape', 'Beach Bliss Getaway', 'Cultural Capitals Tour', 'Desert Dunes Adventure',
    'Island Explorer', 'Mountain Magic', 'City Lights & Sights', 'Royal Heritage Trail',
    'Tropical Treasures', 'Luxury Urban Retreat', 'Wildlife Discovery', 'Honeymoon Paradise'
  ];

  const sample = [];
  for (let i = 1; i <= count; i++) {
    const days = 3 + Math.floor(Math.random() * 7); // 3-9 days
    const nights = Math.max(days - 1, 1);
    const minPax = 2;
    const base = 20000 + Math.floor(Math.random() * 80000); // INR base cost
    const markup = Math.floor(base * 0.15);
    const commission = Math.floor(base * 0.05);
    const finalPrice = base + markup;
    const pricePerPerson = Math.round(finalPrice / minPax);
    const pkgType = randomFrom(packageTypes);
    const currency = randomFrom(currencies);
    const start = randomFrom(cities);
    const end = randomFrom(cities.filter(c => c !== start));
    const theme1 = randomFrom(themesPool);
    const theme2 = randomFrom(themesPool.filter(t => t !== theme1));

    sample.push({
      external_id: `PKG-${String(i).padStart(4, '0')}`,
      name: `${randomFrom(names)} ${i}`,
      summary: 'A perfectly balanced tour across highlights and hidden gems.',
      description: 'Explore iconic sights, savor local flavors, and enjoy curated experiences with expert guidance.',
      min_pax: minPax,
      max_pax: 20,
      days,
      nights,
      is_fixed_departure: false,
      departure_date: null,
      return_date: null,
      total_seats: null,
      start_city: start,
      end_city: end,
      destinations: [
        { country: 'India', cities: ['Delhi', 'Agra', 'Jaipur'] },
        { country: 'Thailand', cities: ['Bangkok', 'Phuket'] }
      ],
      package_type: pkgType,
      themes: [theme1, theme2],
      banners: [
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2070',
        'https://images.unsplash.com/photo-1508261302063-f6d0bb83dadc?q=80&w=2000'
      ],
      itinerary: [
        { day: 1, title: 'Arrival & City Orientation', description: 'Airport pickup and evening city walk.' },
        { day: 2, title: 'Highlights & Heritage', description: 'Guided tour of key attractions and cultural sites.' },
        { day: 3, title: 'Leisure & Local Markets', description: 'Free time with optional excursions and shopping.' }
      ],
      base_cost: base,
      markup,
      commission,
      final_price: finalPrice,
      price_per_person: pricePerPerson,
      currency,
      inclusions: 'Accommodation, daily breakfast, guided sightseeing, transfers',
      exclusions: 'International flights, personal expenses, optional tours',
      cancellation_policy: 'Free cancellation up to 7 days before departure. 50% fee within 3 days.',
      payment_policy: '50% advance at booking, balance 7 days before departure.',
      status: i % 3 === 0 ? 'published' : 'draft',
    });
  }

  return sample;
}

async function seedTourPackages() {
  console.log('🌱 Seeding tour_packages sample data...');

  const tableOk = await ensureTable();
  if (!tableOk) {
    console.warn('⚠️ Proceeding with seeding attempt; ensure table exists.');
  }

  // Check existing sample packages by external_id prefix
  let existingCount = 0;
  try {
    const { data: existing } = await supabase
      .from('tour_packages')
      .select('external_id')
      .like('external_id', 'PKG-%');
    existingCount = existing?.length || 0;
  } catch (e) {
    // ignore selection errors
  }

  if (existingCount >= 30) {
    console.log(`⏭️  Found ${existingCount} sample packages. Skipping seeding.`);
    return;
  }

  const sample = buildSamplePackages(36);
  console.log(`➡️  Inserting ${sample.length} packages...`);

  // Insert in chunks to avoid payload limits
  const chunkSize = 12;
  for (let i = 0; i < sample.length; i += chunkSize) {
    const chunk = sample.slice(i, i + chunkSize);
    const { error } = await supabase.from('tour_packages').insert(chunk);
    if (error) {
      console.error('❌ Insert error:', error.message);
      // Continue inserting next chunks
    } else {
      console.log(`✅ Inserted ${chunk.length} packages`);
    }
  }

  // Verify count
  try {
    const { data } = await supabase.from('tour_packages').select('id', { count: 'exact' });
    console.log(`📊 tour_packages rows now: ${data?.length || 'unknown'}`);
  } catch (e) {}

  console.log('🎉 Tour packages seeding completed.');
}

seedTourPackages().catch((err) => {
  console.error('💥 Seeding failed:', err);
  process.exit(1);
});