import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different location types
const createCustomIcon = (color: string, type: string) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: bold;
        color: white;
      ">
        ${type}
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const startIcon = createCustomIcon('#22c55e', 'S');
const endIcon = createCustomIcon('#ef4444', 'E');
const stopIcon = createCustomIcon('#3b82f6', 'I');

interface RouteLocation {
  code: string;
  name: string;
  coordinates?: [number, number] | string | [string, string]; // [lat, lng] or string that can be parsed
  locationCode?: string; // Added for compatibility with form data
}

interface RouteMapProps {
  startLocation?: RouteLocation;
  endLocation?: RouteLocation;
  intermediateStops?: RouteLocation[];
  className?: string;
  height?: string;
}

// Mock coordinates for demonstration - in a real app, these would come from a geocoding service
const getMockCoordinates = (locationCode: string): [number, number] => {
  const mockCoordinates: Record<string, [number, number]> = {
    // Major cities
    'NYC': [40.7128, -74.0060], // New York
    'LON': [51.5074, -0.1278],  // London
    'PAR': [48.8566, 2.3522],   // Paris
    'TOK': [35.6762, 139.6503], // Tokyo
    'SYD': [-33.8688, 151.2093], // Sydney
    'DXB': [25.2048, 55.2708],  // Dubai
    'BOM': [19.0760, 72.8777],  // Mumbai
    'DEL': [28.6139, 77.2090],  // Delhi
    'BLR': [12.9716, 77.5946],  // Bangalore
    'MAA': [13.0827, 80.2707],  // Chennai
    'CCU': [22.5726, 88.3639],  // Kolkata
    'HYD': [17.3850, 78.4867],  // Hyderabad
    'PNQ': [18.5204, 73.8567],  // Pune
    'AMD': [23.0225, 72.5714],  // Ahmedabad
    'JAI': [26.9124, 75.7873],  // Jaipur
    'LKO': [26.8467, 80.9462],  // Lucknow
    'KOL': [22.5726, 88.3639],  // Kolkata (alternative)
    'GOI': [15.2993, 74.1240],  // Goa
    'COK': [9.9312, 76.2673],   // Kochi
    'TRV': [8.5241, 76.9366],   // Trivandrum
    'BKK': [13.7563, 100.5018], // Bangkok
    'SIN': [1.3521, 103.8198],  // Singapore
    'KUL': [3.1390, 101.6869],  // Kuala Lumpur
    'HKG': [22.3193, 114.1694], // Hong Kong
    'ICN': [37.4602, 126.4407], // Seoul (Incheon)
    'NRT': [35.7720, 140.3929], // Tokyo (Narita)
    'LAX': [34.0522, -118.2437], // Los Angeles
    'SFO': [37.7749, -122.4194], // San Francisco
    'CHI': [41.8781, -87.6298],  // Chicago
    'MIA': [25.7617, -80.1918],  // Miami
    'LAS': [36.1699, -115.1398], // Las Vegas
    'SEA': [47.6062, -122.3321], // Seattle
    'DEN': [39.7392, -104.9903], // Denver
    'ATL': [33.7490, -84.3880],  // Atlanta
    'BOS': [42.3601, -71.0589],  // Boston
    'WAS': [38.9072, -77.0369],  // Washington DC
  };

  // Return mock coordinates or default to center of India if not found
  return mockCoordinates[locationCode.toUpperCase()] || [20.5937, 78.9629];
};

const RouteMap: React.FC<RouteMapProps> = ({
  startLocation,
  endLocation,
  intermediateStops = [],
  className = '',
  height = '400px'
}) => {
  const mapRef = useRef<L.Map | null>(null);

  // Get coordinates for each location, using mock data if real coordinates aren't available
  const getLocationCoordinates = (location?: RouteLocation): [number, number] => {
    if (!location) return [0, 0];
    
    // Handle coordinates that might be stored as a string "[lat, lng]" or as an array
    if (location.coordinates) {
      if (Array.isArray(location.coordinates)) {
        // Handle both number and string arrays
        return [Number(location.coordinates[0]), Number(location.coordinates[1])];
      } else if (typeof location.coordinates === 'string') {
        try {
          // Parse string coordinates like "[13.7563, 100.5018]"
          const parsed = JSON.parse(location.coordinates.replace(/\s/g, ''));
          if (Array.isArray(parsed) && parsed.length === 2) {
            return [Number(parsed[0]), Number(parsed[1])];
          }
        } catch (e) {
          console.error("Failed to parse coordinates:", e);
        }
      }
    }
    
    // Extract location code from the full code (e.g., "NYC APT" -> "NYC")
    const code = location.locationCode || location.code;
    const shortCode = code.split(' ')[0];
    return getMockCoordinates(shortCode);
  };

  // Get all locations that have coordinates
  const validLocations = [
    startLocation,
    endLocation,
    ...intermediateStops
  ].filter((location): location is RouteLocation => 
    location !== undefined
  );

  // Calculate center and zoom based on locations
  const getMapCenter = (): [number, number] => {
    if (validLocations.length === 0) {
      return [20.5937, 78.9629]; // Default to India center
    }
    
    if (validLocations.length === 1) {
      const coords = validLocations[0].coordinates || getMockCoordinates(validLocations[0].code);
      return coords;
    }
    
    // Calculate center of all locations
    const latSum = validLocations.reduce((sum, loc) => {
      const coords = loc.coordinates || getMockCoordinates(loc.code);
      return sum + coords[0];
    }, 0);
    const lngSum = validLocations.reduce((sum, loc) => {
      const coords = loc.coordinates || getMockCoordinates(loc.code);
      return sum + coords[1];
    }, 0);
    
    return [latSum / validLocations.length, lngSum / validLocations.length];
  };

  const getZoomLevel = (): number => {
    if (validLocations.length <= 1) return 10;
    
    // Calculate bounds and determine appropriate zoom
    const lats = validLocations.map(loc => {
      const coords = loc.coordinates || getMockCoordinates(loc.code);
      return coords[0];
    });
    const lngs = validLocations.map(loc => {
      const coords = loc.coordinates || getMockCoordinates(loc.code);
      return coords[1];
    });
    
    const latDiff = Math.max(...lats) - Math.min(...lats);
    const lngDiff = Math.max(...lngs) - Math.min(...lngs);
    const maxDiff = Math.max(latDiff, lngDiff);
    
    if (maxDiff > 20) return 3;
    if (maxDiff > 10) return 4;
    if (maxDiff > 5) return 5;
    if (maxDiff > 2) return 6;
    if (maxDiff > 1) return 7;
    if (maxDiff > 0.5) return 8;
    return 9;
  };

  const center = getMapCenter();
  const zoom = getZoomLevel();

  // Create polyline path as coordinate pairs
  const polylinePath: [number, number][] = validLocations.map(location => {
    const coords = location.coordinates || getMockCoordinates(location.code);
    return [coords[0], coords[1]];
  });

  // Fit bounds when locations change
  useEffect(() => {
    if (mapRef.current && validLocations.length > 1) {
      const bounds = L.latLngBounds(validLocations.map(loc => {
        const coords = loc.coordinates || getMockCoordinates(loc.code);
        return coords;
      }));
      mapRef.current.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [validLocations.length]);

  const getIcon = (location: RouteLocation) => {
    if (location === startLocation) return startIcon;
    if (location === endLocation) return endIcon;
    return stopIcon;
  };

  return (
    <div className={`route-map ${className}`} style={{ height }}>
      {validLocations.length === 0 ? (
        <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center text-gray-500">
            <div className="text-lg mb-2">🗺️</div>
            <div>Select locations to view route map</div>
          </div>
        </div>
      ) : (
        <MapContainer
          ref={mapRef}
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          className="rounded-lg"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Route polyline */}
          {polylinePath.length > 1 && (
            <Polyline
              positions={polylinePath}
              pathOptions={{
                color: "#3b82f6",
                weight: 3,
                opacity: 0.7,
                dashArray: "5, 10"
              }}
            />
          )}
          
          {/* Location markers */}
          {validLocations.map((location, index) => {
            const coords = location.coordinates || getMockCoordinates(location.code);
            return (
              <Marker
                key={`${location.code}-${index}`}
                position={coords}
                icon={getIcon(location)}
              >
                <Popup>
                  <div className="text-center">
                    <div className="font-semibold">
                      {location === startLocation ? (
                        <span className="text-green-600">Start Location</span>
                      ) : location === endLocation ? (
                        <span className="text-red-600">End Location</span>
                      ) : (
                        <span className="text-blue-600">Stop {intermediateStops.indexOf(location) + 1}</span>
                      )}
                    </div>
                    <div className="font-medium">{location.name}</div>
                    <div className="text-sm text-gray-500">{location.code}</div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      )}

      {/* Custom CSS for marker styling */}
      <style jsx>{`
        .route-map .start-marker {
          filter: hue-rotate(120deg);
        }
        .route-map .end-marker {
          filter: hue-rotate(0deg);
        }
      `}</style>
    </div>
  );
};

export default RouteMap;