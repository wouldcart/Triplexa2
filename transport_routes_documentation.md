# Transport Routes Database Structure Documentation

## Overview

This document describes the comprehensive database structure for storing transport route information from the "Add New Transport Route" form. The structure is designed to properly handle all aspects of transport routes including basic route information, route segments, transport types, and sightseeing options.

## Database Tables

### 1. transport_routes (Main Table)

Stores the primary route information:

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| route_code | VARCHAR(100) | Auto-generated route code |
| route_name | VARCHAR(255) | Name of the route (auto-generated from locations) |
| country | VARCHAR(100) | Country (default: Thailand) |
| transfer_type | VARCHAR(50) | One-Way, Round-Trip, Multi-Stop, en route |
| start_location | VARCHAR(100) | Starting location code |
| start_location_full_name | VARCHAR(255) | Full name of starting location |
| start_coordinates | JSONB | Coordinates of starting location |
| end_location | VARCHAR(100) | Ending location code |
| end_location_full_name | VARCHAR(255) | Full name of ending location |
| end_coordinates | JSONB | Coordinates of ending location |
| distance | INTEGER | Distance in kilometers |
| duration | VARCHAR(100) | Duration of the route |
| description | TEXT | Route description |
| notes | TEXT | Additional notes |
| status | VARCHAR(20) | Active or Inactive |
| enable_sightseeing | BOOLEAN | Whether sightseeing is enabled |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |
| created_by | UUID | User who created the record |
| updated_by | UUID | User who last updated the record |

### 2. intermediate_stops

Stores intermediate stops along the route:

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| route_id | UUID | Foreign key to transport_routes |
| stop_order | INTEGER | Order of the stop in the route |
| location_code | VARCHAR(100) | Location code |
| full_name | VARCHAR(255) | Full name of the location |
| coordinates | JSONB | Coordinates of the location |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### 3. transport_types

Stores multiple transport options for each route:

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| route_id | UUID | Foreign key to transport_routes |
| type | VARCHAR(100) | Type of transport (Ferry, etc.) |
| seating_capacity | INTEGER | Number of seats available |
| luggage_capacity | INTEGER | Luggage capacity |
| duration | VARCHAR(100) | Duration using this transport type |
| price | DECIMAL(10,2) | Price for this transport type |
| notes | TEXT | Additional notes |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### 4. sightseeing_options

Stores sightseeing options available on the route:

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| route_id | UUID | Foreign key to transport_routes |
| location | VARCHAR(255) | Sightseeing location |
| description | TEXT | Description of the sightseeing option |
| adult_price | DECIMAL(10,2) | Price for adults |
| child_price | DECIMAL(10,2) | Price for children |
| additional_charges | DECIMAL(10,2) | Any additional charges |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

## Database Views

### transport_routes_view

A comprehensive view that joins all related tables to provide a complete picture of each route with its stops, transport types, and sightseeing options.

## Database Functions

### 1. create_transport_route(route_data JSONB)

Creates a new transport route with all related data in a single transaction.

### 2. update_transport_route(route_id UUID, route_data JSONB)

Updates an existing transport route and all related data.

### 3. delete_transport_route(route_id UUID)

Deletes a transport route and all related data.

## Frontend Integration

### Data Mapping

When integrating with the frontend, map form fields to database fields as follows:

#### Basic Route Information
- Country → transport_routes.country
- Route Name → transport_routes.route_name (auto-generated)
- Notes → transport_routes.notes
- Description → transport_routes.description
- Distance → transport_routes.distance
- Duration → transport_routes.duration
- Route Code → transport_routes.route_code (auto-generated)

#### Route Segments
- Transfer Type → transport_routes.transfer_type
- Start Location → transport_routes.start_location, transport_routes.start_location_full_name, transport_routes.start_coordinates
- End Location → transport_routes.end_location, transport_routes.end_location_full_name, transport_routes.end_coordinates
- Intermediate Stops → intermediate_stops table (multiple records)

#### Transport Information
- Transport Types → transport_types table (multiple records)
- Each transport type includes: type, seating_capacity, luggage_capacity, duration, price, notes

#### Sightseeing Options
- Sightseeing Locations → sightseeing_options table (multiple records)
- Each sightseeing option includes: location, description, adult_price, child_price, additional_charges

### Implementation Steps

1. **Form Submission**:
   - Collect all form data into a structured JSON object
   - Call the `create_transport_route` function with this JSON object

2. **Editing Routes**:
   - Load the route data from the `transport_routes_view` view
   - Populate the form with the data
   - On save, call the `update_transport_route` function

3. **Deleting Routes**:
   - Call the `delete_transport_route` function with the route ID

### Example JSON Structure for API Calls

```json
{
  "route_code": "BKK-CRI-001",
  "route_name": "Bangkok to Chiang Rai",
  "country": "Thailand",
  "transfer_type": "One-Way",
  "start_location": "BKK",
  "start_location_full_name": "Bangkok",
  "start_coordinates": {"latitude": "13.7563", "longitude": "100.5018"},
  "end_location": "CRI",
  "end_location_full_name": "Chiang Rai",
  "end_coordinates": {"latitude": "19.9105", "longitude": "99.8406"},
  "distance": 785,
  "duration": "12 hours",
  "description": "Direct route from Bangkok to Chiang Rai",
  "notes": "Scenic route through northern Thailand",
  "status": "active",
  "enable_sightseeing": true,
  
  "intermediate_stops": [
    {
      "location_code": "LPG",
      "full_name": "Lampang",
      "coordinates": {"latitude": "18.2916", "longitude": "99.4913"}
    }
  ],
  
  "transport_types": [
    {
      "type": "Bus",
      "seating_capacity": 40,
      "luggage_capacity": 20,
      "duration": "12 hours",
      "price": 1200.00,
      "notes": "Air-conditioned VIP bus"
    },
    {
      "type": "Private Car",
      "seating_capacity": 4,
      "luggage_capacity": 3,
      "duration": "10 hours",
      "price": 4500.00,
      "notes": "Luxury sedan with driver"
    }
  ],
  
  "sightseeing_options": [
    {
      "location": "White Temple",
      "description": "Visit the famous White Temple in Chiang Rai",
      "adult_price": 500.00,
      "child_price": 250.00,
      "additional_charges": 100.00
    }
  ]
}
```