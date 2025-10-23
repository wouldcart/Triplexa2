-- Transport Routes Database Structure

-- Main transport_routes table
CREATE TABLE IF NOT EXISTS public.transport_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_code VARCHAR(100) NOT NULL,
    route_name VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    transfer_type VARCHAR(50) NOT NULL CHECK (transfer_type IN ('One-Way', 'Round-Trip', 'Multi-Stop', 'en route')),
    start_location VARCHAR(100) NOT NULL,
    start_location_full_name VARCHAR(255) NOT NULL,
    start_coordinates JSONB,
    end_location VARCHAR(100) NOT NULL,
    end_location_full_name VARCHAR(255) NOT NULL,
    end_coordinates JSONB,
    distance INTEGER,
    duration VARCHAR(100),
    description TEXT,
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    enable_sightseeing BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Intermediate stops table
CREATE TABLE IF NOT EXISTS public.intermediate_stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID NOT NULL REFERENCES public.transport_routes(id) ON DELETE CASCADE,
    stop_order INTEGER NOT NULL,
    location_code VARCHAR(100) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    coordinates JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transport types table for storing multiple transport options per route
CREATE TABLE IF NOT EXISTS public.transport_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID NOT NULL REFERENCES public.transport_routes(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    seating_capacity INTEGER NOT NULL,
    luggage_capacity INTEGER NOT NULL,
    duration VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sightseeing options table
CREATE TABLE IF NOT EXISTS public.sightseeing_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID NOT NULL REFERENCES public.transport_routes(id) ON DELETE CASCADE,
    location VARCHAR(255) NOT NULL,
    description TEXT,
    adult_price DECIMAL(10, 2) NOT NULL,
    child_price DECIMAL(10, 2) NOT NULL,
    additional_charges DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transport_routes_country ON public.transport_routes(country);
CREATE INDEX IF NOT EXISTS idx_transport_routes_status ON public.transport_routes(status);
CREATE INDEX IF NOT EXISTS idx_transport_routes_start_location ON public.transport_routes(start_location);
CREATE INDEX IF NOT EXISTS idx_transport_routes_end_location ON public.transport_routes(end_location);
CREATE INDEX IF NOT EXISTS idx_intermediate_stops_route_id ON public.intermediate_stops(route_id);
CREATE INDEX IF NOT EXISTS idx_transport_types_route_id ON public.transport_types(route_id);
CREATE INDEX IF NOT EXISTS idx_sightseeing_options_route_id ON public.sightseeing_options(route_id);

-- Create view for easier querying
CREATE OR REPLACE VIEW public.transport_routes_view AS
SELECT 
    tr.id,
    tr.route_code,
    tr.route_name,
    tr.country,
    tr.transfer_type,
    tr.start_location,
    tr.start_location_full_name,
    tr.start_coordinates,
    tr.end_location,
    tr.end_location_full_name,
    tr.end_coordinates,
    tr.distance,
    tr.duration,
    tr.description,
    tr.notes,
    tr.status,
    tr.enable_sightseeing,
    tr.created_at,
    tr.updated_at,
    (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', is.id,
                'stop_order', is.stop_order,
                'location_code', is.location_code,
                'full_name', is.full_name,
                'coordinates', is.coordinates
            )
        )
        FROM public.intermediate_stops is
        WHERE is.route_id = tr.id
        ORDER BY is.stop_order
    ) AS intermediate_stops,
    (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', tt.id,
                'type', tt.type,
                'seating_capacity', tt.seating_capacity,
                'luggage_capacity', tt.luggage_capacity,
                'duration', tt.duration,
                'price', tt.price,
                'notes', tt.notes
            )
        )
        FROM public.transport_types tt
        WHERE tt.route_id = tr.id
    ) AS transport_types,
    (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', so.id,
                'location', so.location,
                'description', so.description,
                'adult_price', so.adult_price,
                'child_price', so.child_price,
                'additional_charges', so.additional_charges
            )
        )
        FROM public.sightseeing_options so
        WHERE so.route_id = tr.id
    ) AS sightseeing_options
FROM public.transport_routes tr;

-- RLS policies
ALTER TABLE public.transport_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intermediate_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sightseeing_options ENABLE ROW LEVEL SECURITY;

-- Create policies for transport_routes
CREATE POLICY "Allow read access for all authenticated users" 
    ON public.transport_routes FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert for authenticated users" 
    ON public.transport_routes FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users" 
    ON public.transport_routes FOR UPDATE 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users" 
    ON public.transport_routes FOR DELETE 
    USING (auth.role() = 'authenticated');

-- Create similar policies for related tables
-- intermediate_stops
CREATE POLICY "Allow read access for all authenticated users" 
    ON public.intermediate_stops FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert for authenticated users" 
    ON public.intermediate_stops FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users" 
    ON public.intermediate_stops FOR UPDATE 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users" 
    ON public.intermediate_stops FOR DELETE 
    USING (auth.role() = 'authenticated');

-- transport_types
CREATE POLICY "Allow read access for all authenticated users" 
    ON public.transport_types FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert for authenticated users" 
    ON public.transport_types FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users" 
    ON public.transport_types FOR UPDATE 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users" 
    ON public.transport_types FOR DELETE 
    USING (auth.role() = 'authenticated');

-- sightseeing_options
CREATE POLICY "Allow read access for all authenticated users" 
    ON public.sightseeing_options FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert for authenticated users" 
    ON public.sightseeing_options FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update for authenticated users" 
    ON public.sightseeing_options FOR UPDATE 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow delete for authenticated users" 
    ON public.sightseeing_options FOR DELETE 
    USING (auth.role() = 'authenticated');