import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Prefer service role key to bypass RLS for seeding; fallback to anon
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabaseKey = supabaseServiceKey || supabaseAnonKey;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars: SUPABASE_URL/VITE_SUPABASE_URL and Service/Anon key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sampleVisas = [
  // Core examples
  {
    country: 'India',
    visa_type: 'Tourist',
    processing_time: '5-7 business days',
    price: 80,
    is_rush_available: true,
    requirements: 'Passport valid 6+ months, recent photo, itinerary, hotel booking, funds proof',
    status: 'active',
    documents: [
      { name: 'Passport (6+ months validity)', required: true },
      { name: 'Recent Passport Photo', required: true },
      { name: 'Flight Itinerary', required: true },
      { name: 'Hotel Booking', required: true },
      { name: 'Bank Statements (3-6 months)', required: false },
      { name: 'Travel Insurance', required: false },
    ],
  },

  // Thailand (Tourist)
  {
    country: 'Thailand',
    visa_type: 'Tourist',
    processing_time: '2-5 business days',
    price: 60,
    is_rush_available: true,
    requirements: 'Return ticket, hotel booking, funds proof; e-VOA available for Indian citizens',
    status: 'active',
    documents: [
      { name: 'Passport (6+ months validity)', required: true },
      { name: 'Recent Passport Photo', required: true },
      { name: 'Return Ticket', required: true },
      { name: 'Hotel Booking', required: true },
      { name: 'Bank Statements (last 3 months)', required: false },
    ],
  },

  // United Arab Emirates (Tourist)
  {
    country: 'United Arab Emirates',
    visa_type: 'Tourist',
    processing_time: '3-5 business days',
    price: 120,
    is_rush_available: true,
    requirements: 'Sponsor/agency may be required, return ticket, hotel booking, funds proof',
    status: 'active',
    documents: [
      { name: 'Passport (6+ months validity)', required: true },
      { name: 'Recent Passport Photo', required: true },
      { name: 'Return Ticket', required: true },
      { name: 'Hotel Booking', required: true },
      { name: 'Bank Statements (last 6 months)', required: false },
    ],
  },
  // United Arab Emirates (Business)
  {
    country: 'United Arab Emirates',
    visa_type: 'Business',
    processing_time: '3-7 business days',
    price: 150,
    is_rush_available: true,
    requirements: 'Invitation letter, company documents, itinerary; sponsor may be needed',
    status: 'active',
    documents: [
      { name: 'Passport (6+ months validity)', required: true },
      { name: 'Invitation Letter', required: true },
      { name: 'Company Registration/Business Card', required: true },
      { name: 'Flight Itinerary', required: true },
      { name: 'Hotel Booking', required: true },
    ],
  },

  // Oman (eVisa Tourist)
  {
    country: 'Oman',
    visa_type: 'Tourist',
    processing_time: '1-3 business days',
    price: 50,
    is_rush_available: true,
    requirements: 'eVisa available; passport, photo, hotel booking, return ticket',
    status: 'active',
    documents: [
      { name: 'Passport (6+ months validity)', required: true },
      { name: 'Recent Passport Photo', required: true },
      { name: 'Return Ticket', required: true },
      { name: 'Hotel Booking', required: true },
    ],
  },

  // Singapore (Tourist)
  {
    country: 'Singapore',
    visa_type: 'Tourist',
    processing_time: '3-5 business days',
    price: 50,
    is_rush_available: false,
    requirements: 'Applications via authorized agents; passport, photo, booking, funds proof',
    status: 'active',
    documents: [
      { name: 'Passport (6+ months validity)', required: true },
      { name: 'Recent Passport Photo', required: true },
      { name: 'Flight Itinerary', required: true },
      { name: 'Hotel Booking', required: true },
      { name: 'Bank Statements (last 3-6 months)', required: false },
    ],
  },
  // Singapore (Business)
  {
    country: 'Singapore',
    visa_type: 'Business',
    processing_time: '5-7 business days',
    price: 80,
    is_rush_available: false,
    requirements: 'Invitation letter and company documents required; authorized agent submission',
    status: 'active',
    documents: [
      { name: 'Passport (6+ months validity)', required: true },
      { name: 'Invitation Letter', required: true },
      { name: 'Company Registration/Business Card', required: true },
      { name: 'Flight Itinerary', required: true },
      { name: 'Hotel Booking', required: true },
    ],
  },

  // Malaysia (eVisa Tourist)
  {
    country: 'Malaysia',
    visa_type: 'Tourist',
    processing_time: '2-3 business days',
    price: 45,
    is_rush_available: true,
    requirements: 'eVisa available; passport, photo, itinerary, hotel booking',
    status: 'active',
    documents: [
      { name: 'Passport (6+ months validity)', required: true },
      { name: 'Recent Passport Photo', required: true },
      { name: 'Flight Itinerary', required: true },
      { name: 'Hotel Booking', required: true },
    ],
  },

  // Indonesia (e-VOA Tourist)
  {
    country: 'Indonesia',
    visa_type: 'Tourist',
    processing_time: 'Instant to 1 day',
    price: 35,
    is_rush_available: true,
    requirements: 'e-VOA available; passport, return ticket, hotel booking',
    status: 'active',
    documents: [
      { name: 'Passport (6+ months validity)', required: true },
      { name: 'Return Ticket', required: true },
      { name: 'Hotel Booking', required: true },
    ],
  },

  // Sri Lanka (ETA Tourist)
  {
    country: 'Sri Lanka',
    visa_type: 'Tourist',
    processing_time: '1-2 business days',
    price: 35,
    is_rush_available: true,
    requirements: 'ETA available; passport, return ticket, accommodation',
    status: 'active',
    documents: [
      { name: 'Passport (6+ months validity)', required: true },
      { name: 'Return Ticket', required: true },
      { name: 'Accommodation Details', required: true },
    ],
  },

  // Nepal (Visa on Arrival Tourist)
  {
    country: 'Nepal',
    visa_type: 'Tourist',
    processing_time: 'On Arrival',
    price: 30,
    is_rush_available: false,
    requirements: 'Visa on arrival; passport, photo; cash/card for fees',
    status: 'active',
    documents: [
      { name: 'Passport (6+ months validity)', required: true },
      { name: 'Passport Photo (may be required)', required: false },
      { name: 'Return Ticket', required: false },
    ],
  },

  // Vietnam (eVisa Tourist)
  {
    country: 'Vietnam',
    visa_type: 'Tourist',
    processing_time: '3 business days',
    price: 25,
    is_rush_available: false,
    requirements: 'eVisa available; passport, photo, intended entry port',
    status: 'active',
    documents: [
      { name: 'Passport (6+ months validity)', required: true },
      { name: 'Recent Passport Photo', required: true },
      { name: 'Flight Itinerary', required: false },
    ],
  },

  // Philippines (Tourist)
  {
    country: 'Philippines',
    visa_type: 'Tourist',
    processing_time: '7-10 business days',
    price: 50,
    is_rush_available: false,
    requirements: 'Single-entry tourist visa; itinerary, hotel booking, funds proof',
    status: 'active',
    documents: [
      { name: 'Passport (6+ months validity)', required: true },
      { name: 'Recent Passport Photo', required: true },
      { name: 'Flight Itinerary', required: true },
      { name: 'Hotel Booking', required: true },
      { name: 'Bank Statements (last 3-6 months)', required: false },
    ],
  },
];

async function upsertVisa(visa) {
  // Check duplicate by country + visa_type
  const { data: existing, error: checkErr } = await supabase
    .from('visa')
    .select('id')
    .eq('country', visa.country)
    .eq('visa_type', visa.visa_type)
    .limit(1);

  if (checkErr) {
    console.error('Error checking existing visa:', checkErr.message);
    return false;
  }

  if (existing && existing.length > 0) {
    console.log(`Skipped existing visa: ${visa.country} - ${visa.visa_type}`);
    return true;
  }

  const payload = { ...visa, documents: visa.documents || null };
  const { error: insertErr } = await supabase.from('visa').insert(payload);
  if (insertErr) {
    console.error('Insert error:', insertErr.message);
    return false;
  }
  console.log(`Inserted visa: ${visa.country} - ${visa.visa_type}`);
  return true;
}

async function main() {
  let success = true;
  for (const visa of sampleVisas) {
    const ok = await upsertVisa(visa);
    if (!ok) success = false;
  }
  if (success) {
    console.log('Visa seeding completed.');
    process.exit(0);
  } else {
    console.error('Visa seeding encountered errors.');
    process.exit(1);
  }
}

main();