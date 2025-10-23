-- Create transport_types table if it doesn't exist
CREATE TABLE IF NOT EXISTS transport_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transport_routes table
CREATE TABLE IF NOT EXISTS transport_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_code TEXT NOT NULL,
    route_name TEXT NOT NULL,
    country TEXT NOT NULL,
    transfer_type TEXT NOT NULL,
    start_location TEXT NOT NULL,
    start_location_full_name TEXT NOT NULL,
    end_location TEXT NOT NULL,
    end_location_full_name TEXT NOT NULL,
    transport_type_id UUID REFERENCES transport_types(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create intermediate_stops table
CREATE TABLE IF NOT EXISTS intermediate_stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID REFERENCES transport_routes(id) ON DELETE CASCADE,
    stop_order INTEGER NOT NULL,
    location_code TEXT NOT NULL,
    full_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sightseeing_options table
CREATE TABLE IF NOT EXISTS sightseeing_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID REFERENCES transport_routes(id) ON DELETE CASCADE,
    location TEXT NOT NULL,
    adult_price DECIMAL(10,2) NOT NULL,
    child_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);