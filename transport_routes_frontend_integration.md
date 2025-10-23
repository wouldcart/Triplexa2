# Transport Routes Frontend Integration Guide

## Overview

This guide provides implementation steps for integrating the new transport routes database structure with the frontend application.

## Integration Steps

### 1. Update API Service

Create or update the transport routes service to use the new database functions:

```typescript
// src/services/transportRoutesService.ts

import { supabase } from '../lib/supabase';

export const transportRoutesService = {
  // Create a new transport route
  async createRoute(routeData: any) {
    const { data, error } = await supabase.rpc('create_transport_route', {
      route_data: routeData
    });
    
    if (error) throw error;
    return data;
  },
  
  // Get all transport routes
  async getRoutes(page = 1, limit = 10, filters = {}) {
    const { data, error, count } = await supabase
      .from('transport_routes_view')
      .select('*', { count: 'exact' })
      .match(filters)
      .range((page - 1) * limit, page * limit - 1);
      
    if (error) throw error;
    return { data, count };
  },
  
  // Get a single transport route by ID
  async getRouteById(id: string) {
    const { data, error } = await supabase
      .from('transport_routes_view')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  },
  
  // Update a transport route
  async updateRoute(id: string, routeData: any) {
    const { data, error } = await supabase.rpc('update_transport_route', {
      route_id: id,
      route_data: routeData
    });
    
    if (error) throw error;
    return data;
  },
  
  // Delete a transport route
  async deleteRoute(id: string) {
    const { data, error } = await supabase.rpc('delete_transport_route', {
      route_id: id
    });
    
    if (error) throw error;
    return data;
  }
};
```

### 2. Update Form Submission Logic

Modify the form submission handler to format data correctly:

```typescript
// src/hooks/useRouteActions.ts

import { transportRoutesService } from '../services/transportRoutesService';

export const useRouteActions = () => {
  // ... existing code
  
  const handleSaveNewRoute = async (formData: any) => {
    try {
      // Format data for the new database structure
      const routeData = {
        route_code: formData.routeCode || generateRouteCode(formData),
        route_name: formData.routeName,
        country: formData.country || 'Thailand',
        transfer_type: formData.transferType,
        start_location: formData.startLocation.code,
        start_location_full_name: formData.startLocation.name,
        start_coordinates: {
          latitude: String(formData.startLocation.coordinates.latitude),
          longitude: String(formData.startLocation.coordinates.longitude)
        },
        end_location: formData.endLocation.code,
        end_location_full_name: formData.endLocation.name,
        end_coordinates: {
          latitude: String(formData.endLocation.coordinates.latitude),
          longitude: String(formData.endLocation.coordinates.longitude)
        },
        distance: formData.distance,
        duration: formData.duration,
        description: formData.description,
        notes: formData.notes,
        status: formData.status || 'active',
        enable_sightseeing: formData.enableSightseeing || false,
        
        // Format intermediate stops
        intermediate_stops: formData.intermediateStops.map((stop: any, index: number) => ({
          location_code: stop.code,
          full_name: stop.name,
          coordinates: {
            latitude: String(stop.coordinates.latitude),
            longitude: String(stop.coordinates.longitude)
          }
        })),
        
        // Format transport types
        transport_types: formData.transportTypes.map((transport: any) => ({
          type: transport.type,
          seating_capacity: transport.seatingCapacity,
          luggage_capacity: transport.luggageCapacity,
          duration: transport.duration,
          price: transport.price,
          notes: transport.notes
        })),
        
        // Format sightseeing options
        sightseeing_options: formData.enableSightseeing ? 
          formData.sightseeingOptions.map((option: any) => ({
            location: option.location,
            description: option.description,
            adult_price: option.adultPrice,
            child_price: option.childPrice,
            additional_charges: option.additionalCharges || 0
          })) : []
      };
      
      // Save the route using the new service
      const result = await transportRoutesService.createRoute(routeData);
      
      // Handle success
      if (result && result.status === 'success') {
        // Show success notification
        // Reset form or navigate away
      }
    } catch (error) {
      // Handle error
      console.error('Error saving route:', error);
    }
  };
  
  // ... other handlers
  
  return {
    // ... existing returns
    handleSaveNewRoute
  };
};
```

### 3. Update Edit Route Logic

```typescript
// src/hooks/useRouteActions.ts

// ... existing code

const handleUpdateRoute = async (id: string, formData: any) => {
  try {
    // Format data similar to handleSaveNewRoute
    const routeData = {
      // ... same formatting as in handleSaveNewRoute
    };
    
    // Update the route using the new service
    const result = await transportRoutesService.updateRoute(id, routeData);
    
    // Handle success
    if (result && result.status === 'success') {
      // Show success notification
      // Navigate back to list
    }
  } catch (error) {
    // Handle error
    console.error('Error updating route:', error);
  }
};
```

### 4. Update Route Listing Component

```typescript
// src/components/TransportRoutesTable.tsx

import { useEffect, useState } from 'react';
import { transportRoutesService } from '../services/transportRoutesService';

export const TransportRoutesTable = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({});
  
  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const { data, count } = await transportRoutesService.getRoutes(page, 10, filters);
      setRoutes(data);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching routes:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchRoutes();
  }, [page, filters]);
  
  // ... render table with routes data
};
```

### 5. Migration Strategy

1. **Create New Tables**: Run the SQL migration script to create the new tables
2. **Data Migration**: Create a one-time script to migrate data from the old structure to the new one
3. **Update Frontend**: Implement the new API service and form handlers
4. **Testing**: Test the new implementation thoroughly
5. **Deployment**: Deploy the changes in a controlled manner

### 6. Testing Checklist

- [ ] Create new route with all fields
- [ ] Create route with multiple transport types
- [ ] Create route with intermediate stops
- [ ] Create route with sightseeing options
- [ ] Edit existing route
- [ ] Delete route
- [ ] List routes with pagination
- [ ] Filter routes by status, country, etc.

## Example Form Data Structure

```typescript
// Example form data structure
const formData = {
  routeName: "Bangkok to Chiang Rai",
  country: "Thailand",
  transferType: "One-Way",
  startLocation: {
    code: "BKK",
    name: "Bangkok",
    coordinates: {
      latitude: 13.7563,
      longitude: 100.5018
    }
  },
  endLocation: {
    code: "CRI",
    name: "Chiang Rai",
    coordinates: {
      latitude: 19.9105,
      longitude: 99.8406
    }
  },
  intermediateStops: [
    {
      code: "LPG",
      name: "Lampang",
      coordinates: {
        latitude: 18.2916,
        longitude: 99.4913
      }
    }
  ],
  distance: 785,
  duration: "12 hours",
  description: "Direct route from Bangkok to Chiang Rai",
  notes: "Scenic route through northern Thailand",
  status: "active",
  enableSightseeing: true,
  transportTypes: [
    {
      type: "Bus",
      seatingCapacity: 40,
      luggageCapacity: 20,
      duration: "12 hours",
      price: 1200.00,
      notes: "Air-conditioned VIP bus"
    }
  ],
  sightseeingOptions: [
    {
      location: "White Temple",
      description: "Visit the famous White Temple in Chiang Rai",
      adultPrice: 500.00,
      childPrice: 250.00,
      additionalCharges: 100.00
    }
  ]
};
```