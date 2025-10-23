# Supabase Integration Documentation

## Overview
This document provides comprehensive information about the Supabase integration for the Triplexa application, including schema details, CRUD operations, and usage examples.

## Environment Setup

### Required Environment Variables
Create a `.env` file in the project root with the following variables:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Important**: Use the service role key to bypass Row-Level Security (RLS) for administrative operations.

## Database Schema

### Core Tables

#### 1. location_codes
Stores location information for transport routes.

**Columns:**
- `id` (string, UUID) - Primary key
- `code` (string) - Location code (e.g., "DXB", "JFK")
- `full_name` (string) - Full location name
- `category` (string) - Location type (airport, hotel, landmark, etc.)
- `country` (string) - Country name
- `city` (string) - City name
- `status` (string) - Status (active/inactive)
- `notes` (string, nullable) - Additional notes
- `latitude` (number, nullable) - GPS latitude
- `longitude` (number, nullable) - GPS longitude
- `created_at` (timestamp) - Creation timestamp
- `updated_at` (timestamp) - Last update timestamp

#### 2. transport_types
Defines available transport vehicle types.

**Columns:**
- `id` (string, UUID) - Primary key
- `name` (string) - Vehicle name
- `category` (string) - Vehicle category (car, bus, van, etc.)
- `seating_capacity` (number) - Number of seats
- `luggage_capacity` (number) - Luggage capacity
- `active` (boolean) - Active status
- `created_at` (timestamp) - Creation timestamp
- `updated_at` (timestamp) - Last update timestamp
- `created_by` (string, nullable) - Creator user ID
- `updated_by` (string, nullable) - Last updater user ID

#### 3. transport_routes
Defines transport routes between locations.

**Columns:**
- `id` (string, UUID) - Primary key
- `route_code` (string) - Unique route identifier
- `route_name` (string) - Route display name
- `country` (string) - Country where route operates
- `transfer_type` (string) - Transfer type (One-Way, Round-Trip, Multi-Stop)
- `start_location` (string) - Starting location code
- `start_location_full_name` (string) - Starting location full name
- `start_coordinates` (JSON, nullable) - Starting location GPS coordinates
- `end_location` (string) - Ending location code
- `end_location_full_name` (string) - Ending location full name
- `end_coordinates` (JSON, nullable) - Ending location GPS coordinates
- `distance` (number) - Distance in kilometers
- `duration` (string) - Estimated duration
- `description` (string) - Route description
- `notes` (JSON, nullable) - Additional notes
- `status` (string) - Route status (active/inactive)
- `enable_sightseeing` (boolean) - Whether sightseeing is available
- `created_at` (timestamp) - Creation timestamp
- `updated_at` (timestamp) - Last update timestamp
- `created_by` (JSON, nullable) - Creator information
- `updated_by` (JSON, nullable) - Last updater information
- `name` (string) - Route name

## CRUD Operations

### Basic Setup
```javascript
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);
```

### Location Codes CRUD

#### Create
```javascript
const { data, error } = await supabase
  .from('location_codes')
  .insert({
    code: 'DXB',
    full_name: 'Dubai International Airport',
    category: 'airport',
    country: 'UAE',
    city: 'Dubai',
    status: 'active'
  })
  .select()
  .single();
```

#### Read
```javascript
// Get all location codes
const { data, error } = await supabase
  .from('location_codes')
  .select('*');

// Get specific location code
const { data, error } = await supabase
  .from('location_codes')
  .select('*')
  .eq('code', 'DXB')
  .single();
```

#### Update
```javascript
const { error } = await supabase
  .from('location_codes')
  .update({ status: 'inactive' })
  .eq('code', 'DXB');
```

#### Delete
```javascript
const { error } = await supabase
  .from('location_codes')
  .delete()
  .eq('code', 'DXB');
```

### Transport Types CRUD

#### Create
```javascript
const { data, error } = await supabase
  .from('transport_types')
  .insert({
    name: 'Luxury Sedan',
    category: 'car',
    seating_capacity: 4,
    luggage_capacity: 2,
    active: true
  })
  .select()
  .single();
```

#### Read
```javascript
const { data, error } = await supabase
  .from('transport_types')
  .select('*')
  .eq('active', true);
```

#### Update
```javascript
const { error } = await supabase
  .from('transport_types')
  .update({ seating_capacity: 6 })
  .eq('name', 'Luxury Sedan');
```

#### Delete
```javascript
const { error } = await supabase
  .from('transport_types')
  .delete()
  .eq('name', 'Luxury Sedan');
```

### Transport Routes CRUD

#### Create
```javascript
const { data, error } = await supabase
  .from('transport_routes')
  .insert({
    route_code: 'DXB-DTN-001',
    route_name: 'Dubai Airport to Downtown',
    country: 'UAE',
    transfer_type: 'One-Way',
    start_location: 'DXB',
    start_location_full_name: 'Dubai International Airport',
    end_location: 'DTN',
    end_location_full_name: 'Downtown Dubai',
    distance: 15,
    duration: '30 minutes',
    description: 'Express transfer from airport to downtown',
    name: 'Dubai Airport to Downtown'
  })
  .select()
  .single();
```

#### Read
```javascript
const { data, error } = await supabase
  .from('transport_routes')
  .select('*')
  .eq('country', 'UAE')
  .eq('status', 'active');
```

#### Update
```javascript
const { error } = await supabase
  .from('transport_routes')
  .update({ 
    description: 'Updated route description',
    duration: '25 minutes'
  })
  .eq('route_code', 'DXB-DTN-001');
```

#### Delete
```javascript
const { error } = await supabase
  .from('transport_routes')
  .delete()
  .eq('route_code', 'DXB-DTN-001');
```

## Valid Values

### Transfer Types
- `One-Way`
- `Round-Trip`
- `Multi-Stop`
- `en route`

### Location Categories
- `airport`
- `hotel`
- `landmark`
- `city_center`
- `port`

### Transport Categories
- `car`
- `bus`
- `van`
- `minibus`
- `coach`

## Testing

### Running Tests
```bash
# Run comprehensive CRUD tests
node test-crud-operations.js

# Run final integration test
node final-integration-test.cjs

# Seed sample data
node seed-working-data.js
```

### Test Coverage
- ✅ Connection validation
- ✅ Location codes CRUD operations
- ✅ Transport types CRUD operations
- ✅ Transport routes CRUD operations
- ✅ Data count verification
- ✅ Schema validation

## TypeScript Integration

The project includes TypeScript type definitions in `src/integrations/supabase/types.ts` that match the actual database schema. These types provide full IntelliSense support and type safety.

### Usage Example
```typescript
import { Database } from './src/integrations/supabase/types';

type LocationCode = Database['public']['Tables']['location_codes']['Row'];
type TransportRoute = Database['public']['Tables']['transport_routes']['Row'];
```

## Troubleshooting

### Common Issues

1. **Schema Cache Errors**: If you encounter "column not found in schema cache" errors, verify that your TypeScript types match the actual database schema.

2. **Check Constraint Violations**: Ensure you're using valid values for constrained fields like `transfer_type`.

3. **Connection Issues**: Verify your environment variables are correctly set and the service role key has appropriate permissions.

### Debugging Tools
- `check-transport-structure.cjs` - Inspect actual table structure
- `test-transport-routes-columns.js` - Test column existence
- `final-integration-test.cjs` - Comprehensive integration test

## Security Notes

- Always use the service role key for administrative operations
- The service role key bypasses RLS, so use it carefully
- Never expose service role keys in client-side code
- Consider implementing proper RLS policies for production use

## Data Seeding

Sample data can be seeded using:
```bash
node seed-working-data.js
```

This will populate:
- 4 location codes (airports and landmarks)
- 4 transport types (various vehicle categories)
- 3 transport routes (sample routes in UAE)

## Maintenance

### Schema Updates
When updating the database schema:
1. Update the actual database tables
2. Update TypeScript types in `types.ts`
3. Update documentation
4. Run integration tests to verify compatibility

### Monitoring
- Monitor CRUD operation success rates
- Track data consistency
- Verify type safety in TypeScript compilation