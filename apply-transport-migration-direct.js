import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔗 Direct Transport Tables Migration');
console.log('===================================');
console.log(`📍 URL: ${supabaseUrl}`);

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Transport tables SQL - Direct creation
const transportTablesSQL = `
-- Create transport_routes table
CREATE TABLE IF NOT EXISTS public.transport_routes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    route_name VARCHAR(255) NOT NULL,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    distance_km DECIMAL(10,2),
    estimated_duration_hours DECIMAL(5,2),
    route_description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create transport_types table
CREATE TABLE IF NOT EXISTS public.transport_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    route_id UUID REFERENCES public.transport_routes(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    vehicle_name VARCHAR(255),
    capacity INTEGER,
    price DECIMAL(10,2),
    duration VARCHAR(100),
    amenities TEXT[],
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create intermediate_stops table
CREATE TABLE IF NOT EXISTS public.intermediate_stops (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    route_id UUID REFERENCES public.transport_routes(id) ON DELETE CASCADE,
    stop_name VARCHAR(255) NOT NULL,
    stop_order INTEGER NOT NULL,
    arrival_time TIME,
    departure_time TIME,
    stop_duration_minutes INTEGER,
    is_mandatory BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create sightseeing_options table
CREATE TABLE IF NOT EXISTS public.sightseeing_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    route_id UUID REFERENCES public.transport_routes(id) ON DELETE CASCADE,
    attraction_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    visit_duration_hours DECIMAL(4,2),
    entry_fee DECIMAL(10,2),
    description TEXT,
    is_included BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_transport_routes_origin ON public.transport_routes(origin);
CREATE INDEX IF NOT EXISTS idx_transport_routes_destination ON public.transport_routes(destination);
CREATE INDEX IF NOT EXISTS idx_transport_routes_active ON public.transport_routes(is_active);
CREATE INDEX IF NOT EXISTS idx_transport_types_route_id ON public.transport_types(route_id);
CREATE INDEX IF NOT EXISTS idx_transport_types_type ON public.transport_types(type);
CREATE INDEX IF NOT EXISTS idx_intermediate_stops_route_id ON public.intermediate_stops(route_id);
CREATE INDEX IF NOT EXISTS idx_intermediate_stops_order ON public.intermediate_stops(route_id, stop_order);
CREATE INDEX IF NOT EXISTS idx_sightseeing_options_route_id ON public.sightseeing_options(route_id);

-- Create view
CREATE OR REPLACE VIEW public.transport_routes_view AS
SELECT 
    tr.id,
    tr.route_name,
    tr.origin,
    tr.destination,
    tr.distance_km,
    tr.estimated_duration_hours,
    tr.route_description,
    tr.is_active,
    COUNT(DISTINCT tt.id) as transport_options_count,
    COUNT(DISTINCT istop.id) as intermediate_stops_count,
    COUNT(DISTINCT so.id) as sightseeing_options_count,
    tr.created_at,
    tr.updated_at
FROM public.transport_routes tr
LEFT JOIN public.transport_types tt ON tr.id = tt.route_id
LEFT JOIN public.intermediate_stops istop ON tr.id = istop.route_id
LEFT JOIN public.sightseeing_options so ON tr.id = so.route_id
GROUP BY tr.id, tr.route_name, tr.origin, tr.destination, tr.distance_km, 
         tr.estimated_duration_hours, tr.route_description, tr.is_active, 
         tr.created_at, tr.updated_at;

-- Enable RLS
ALTER TABLE public.transport_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intermediate_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sightseeing_options ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON public.transport_routes FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users only" ON public.transport_routes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Enable update for authenticated users only" ON public.transport_routes FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Enable delete for authenticated users only" ON public.transport_routes FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON public.transport_types FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users only" ON public.transport_types FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Enable update for authenticated users only" ON public.transport_types FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Enable delete for authenticated users only" ON public.transport_types FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON public.intermediate_stops FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users only" ON public.intermediate_stops FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Enable update for authenticated users only" ON public.intermediate_stops FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Enable delete for authenticated users only" ON public.intermediate_stops FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON public.sightseeing_options FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users only" ON public.sightseeing_options FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Enable update for authenticated users only" ON public.sightseeing_options FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Enable delete for authenticated users only" ON public.sightseeing_options FOR DELETE USING (auth.role() = 'authenticated');

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS handle_updated_at BEFORE UPDATE ON public.transport_routes FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER IF NOT EXISTS handle_updated_at BEFORE UPDATE ON public.transport_types FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER IF NOT EXISTS handle_updated_at BEFORE UPDATE ON public.intermediate_stops FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER IF NOT EXISTS handle_updated_at BEFORE UPDATE ON public.sightseeing_options FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
`;

async function testConnection() {
  try {
    console.log('\n🧪 Testing connection...');
    
    // Simple test query
    const { data, error } = await supabase
      .from('pg_stat_database')
      .select('datname')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection test failed:', error.message);
      return false;
    }
    
    console.log('✅ Connection successful!');
    return true;
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    return false;
  }
}

async function executeSQL(sql, description) {
  try {
    console.log(`⚡ ${description}...`);
    
    // Use the SQL editor endpoint directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql_query: sql })
    });
    
    if (!response.ok) {
      // Try alternative method using supabase client
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        console.error(`❌ ${description} failed:`, error.message);
        return false;
      }
    }
    
    console.log(`✅ ${description} completed successfully`);
    return true;
  } catch (err) {
    console.error(`❌ ${description} error:`, err.message);
    return false;
  }
}

async function checkTables() {
  try {
    console.log('\n🔍 Checking transport tables...');
    
    const tables = ['transport_routes', 'transport_types', 'intermediate_stops', 'sightseeing_options'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`  ❌ ${table}: ${error.message}`);
        } else {
          console.log(`  ✅ ${table}: EXISTS`);
        }
      } catch (err) {
        console.log(`  ❌ ${table}: ${err.message}`);
      }
    }
    
    // Check view
    try {
      const { data, error } = await supabase
        .from('transport_routes_view')
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`  ❌ transport_routes_view: ${error.message}`);
      } else {
        console.log(`  ✅ transport_routes_view: EXISTS`);
      }
    } catch (err) {
      console.log(`  ❌ transport_routes_view: ${err.message}`);
    }
    
  } catch (err) {
    console.error('❌ Error checking tables:', err.message);
  }
}

async function main() {
  // Test connection
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Cannot proceed without database connection');
    process.exit(1);
  }
  
  // Check current state
  await checkTables();
  
  // Apply migration using direct SQL execution
  console.log('\n🚀 Applying transport tables migration...');
  
  // Split SQL into smaller chunks for better execution
  const sqlStatements = transportTablesSQL
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
  
  console.log(`📝 Executing ${sqlStatements.length} SQL statements...`);
  
  for (let i = 0; i < sqlStatements.length; i++) {
    const statement = sqlStatements[i];
    if (statement.trim()) {
      await executeSQL(statement + ';', `Statement ${i + 1}/${sqlStatements.length}`);
      // Small delay between statements
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Final verification
  console.log('\n🔍 Final verification...');
  await checkTables();
  
  console.log('\n🎉 Transport tables migration completed!');
}

// Run the script
main().catch(console.error);