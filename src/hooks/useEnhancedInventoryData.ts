
import { useState, useEffect, useMemo } from 'react';
import { Hotel } from '@/components/inventory/hotels/types/hotel';
import { sightseeingData } from '@/pages/inventory/sightseeing/data/initialData';
import { Sightseeing } from '@/types/sightseeing';
import { Restaurant } from '@/pages/inventory/restaurants/types/restaurantTypes';
import { initialRestaurants } from '@/pages/inventory/restaurants/data/restaurantData';
import { TransportRoute } from '@/pages/queries/types/proposalTypes';
import { transportRoutes } from '@/pages/inventory/transport/data/transportData';
import { initialCities } from '@/pages/inventory/cities/data/cityData';
import { initialCountries } from '@/pages/inventory/countries/data/countryData';

interface InventoryFilters {
  countries?: string[];
  cities?: string[];
}

interface EnhancedInventoryData {
  hotels: Hotel[];
  restaurants: Restaurant[];
  sightseeing: Sightseeing[];
  transportRoutes: TransportRoute[];
  cities: typeof initialCities;
  countries: typeof initialCountries;
  currency: string;
  currencySymbol: string;
  loading: boolean;
  refreshData: () => void;
}

// Enhanced data loading functions with real-time updates
const getEnhancedSightseeingData = (): Sightseeing[] => {
  try {
    const data = localStorage.getItem('sightseeingData');
    return data ? JSON.parse(data) : sightseeingData;
  } catch (error) {
    console.error('Error getting sightseeing data from localStorage:', error);
    return sightseeingData;
  }
};

const getEnhancedHotelData = (): Hotel[] => {
  try {
    const data = localStorage.getItem('savedHotels');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting hotel data from localStorage:', error);
    return [];
  }
};

const getEnhancedRestaurantData = (): Restaurant[] => {
  try {
    const data = localStorage.getItem('savedRestaurants');
    if (data) {
      return JSON.parse(data);
    }
    return initialRestaurants.map(restaurant => ({
      ...restaurant,
      id: restaurant.id,
      vegOptions: restaurant.dietaryOptions?.vegetarian || false,
      currencyCode: restaurant.currencySymbol ? (restaurant.currencySymbol === '$' ? 'USD' : 'THB') : 'USD'
    })) as Restaurant[];
  } catch (error) {
    console.error('Error getting restaurant data from localStorage:', error);
    return initialRestaurants.map(restaurant => ({
      ...restaurant,
      id: restaurant.id,
      vegOptions: restaurant.dietaryOptions?.vegetarian || false,
      currencyCode: restaurant.currencySymbol ? (restaurant.currencySymbol === '$' ? 'USD' : 'THB') : 'USD'
    })) as Restaurant[];
  }
};

const getEnhancedTransportData = (): TransportRoute[] => {
  try {
    const data = localStorage.getItem('savedTransportRoutes');
    if (data) {
      return JSON.parse(data);
    }
    // Use all transport routes for enhanced filtering
    return transportRoutes.map(route => ({
      id: String(route.id),
      from: route.from || '',
      to: route.to || '',
      distance: route.distance || 0,
      duration: route.duration || '1h',
      transportType: route.transportType || 'Car',
      price: route.price || 0,
      name: route.name || `${route.from || ''} to ${route.to || ''}`,
      country: route.country || 'Thailand'
    })) as TransportRoute[];
  } catch (error) {
    console.error('Error getting transport data from localStorage:', error);
    return transportRoutes.map(route => ({
      id: String(route.id),
      from: route.from || '',
      to: route.to || '',
      distance: route.distance || 0,
      duration: route.duration || '1h',
      transportType: route.transportType || 'Car',
      price: route.price || 0,
      name: route.name || `${route.from || ''} to ${route.to || ''}`,
      country: route.country || 'Thailand'
    })) as TransportRoute[];
  }
};

export const useEnhancedInventoryData = (filters?: InventoryFilters): EnhancedInventoryData => {
  const [data, setData] = useState<EnhancedInventoryData>({
    hotels: [],
    restaurants: [],
    sightseeing: [],
    transportRoutes: [],
    cities: initialCities,
    countries: initialCountries,
    currency: 'USD',
    currencySymbol: '$',
    loading: true,
    refreshData: () => {}
  });

  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load enhanced real-time data
      const hotelData = getEnhancedHotelData();
      const sightseeingDataFromStorage = getEnhancedSightseeingData();
      const restaurantData = getEnhancedRestaurantData();
      const transportData = getEnhancedTransportData();

      // Use only Supabase data - no fallback to mock data
      let finalHotelData = hotelData;

      // Process sightseeing data with enhanced typing
      const processedSightseeingData = sightseeingDataFromStorage.map(item => {
        const typedItem: Sightseeing = {
          ...item,
          price: item.price === undefined ? { adult: 0, child: 0 } : 
                 typeof item.price === 'number' ? { adult: item.price, child: item.price / 2 } : 
                 item.price
        };
        return typedItem;
      });

      setData(prevData => ({
        ...prevData,
        hotels: finalHotelData,
        restaurants: restaurantData,
        sightseeing: processedSightseeingData,
        transportRoutes: transportData,
        loading: false
      }));

      console.log('Enhanced inventory data loaded:', {
        hotels: finalHotelData.length,
        restaurants: restaurantData.length,
        sightseeing: processedSightseeingData.length,
        transportRoutes: transportData.length
      });

    } catch (error) {
      console.error("Error loading enhanced inventory data:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    loadData();
  };

  // Enhanced filtering with real-time updates
  const filteredData = useMemo(() => {
    if (!filters || (!filters.countries?.length && !filters.cities?.length)) {
      return { ...data, refreshData, loading };
    }

    const filterByLocation = (items: any[], locationFields: string[]) => {
      return items.filter(item => {
        // Check multiple location fields
        const itemLocations = locationFields.map(field => item[field]).filter(Boolean);
        if (itemLocations.length === 0) return true;

        // Enhanced country matching
        if (filters.countries?.length) {
          const matchesCountry = filters.countries.some(country => 
            itemLocations.some(location => {
              // Ensure location is a string before calling toLowerCase
              const locationStr = String(location || '');
              const countryStr = String(country || '');
              return locationStr.toLowerCase().includes(countryStr.toLowerCase()) ||
                     countryStr.toLowerCase().includes(locationStr.toLowerCase());
            })
          );
          if (matchesCountry) return true;
        }

        // Enhanced city matching
        if (filters.cities?.length) {
          const matchesCity = filters.cities.some(city => 
            itemLocations.some(location => {
              // Ensure location is a string before calling toLowerCase
              const locationStr = String(location || '');
              const cityStr = String(city || '');
              return locationStr.toLowerCase().includes(cityStr.toLowerCase()) ||
                     cityStr.toLowerCase().includes(locationStr.toLowerCase());
            })
          );
          if (matchesCity) return true;
        }

        return false;
      });
    };

    return {
      ...data,
      hotels: filterByLocation(data.hotels, ['city', 'location', 'address']),
      restaurants: filterByLocation(data.restaurants, ['city', 'location', 'address']),
      sightseeing: filterByLocation(data.sightseeing, ['city', 'location']),
      transportRoutes: data.transportRoutes.filter(route => {
        if (!filters.countries?.length && !filters.cities?.length) return true;
        
        const routeCountry = String(route.country || '');
        const routeFrom = String(route.from || '');
        const routeTo = String(route.to || '');

        // Enhanced transport filtering
        const matchesCountry = filters.countries?.some(country => {
          const countryStr = String(country || '');
          return routeCountry.toLowerCase().includes(countryStr.toLowerCase()) ||
                 countryStr.toLowerCase().includes(routeCountry.toLowerCase());
        });

        const matchesCity = filters.cities?.some(city => {
          const cityStr = String(city || '');
          return routeFrom.toLowerCase().includes(cityStr.toLowerCase()) ||
                 routeTo.toLowerCase().includes(cityStr.toLowerCase()) ||
                 cityStr.toLowerCase().includes(routeFrom.toLowerCase()) ||
                 cityStr.toLowerCase().includes(routeTo.toLowerCase());
        });

        return matchesCountry || matchesCity;
      }),
      refreshData,
      loading
    };
  }, [data, filters, loading]);

  useEffect(() => {
    loadData();

    // Enhanced storage change listener for real-time updates
    const handleStorageChange = (e: StorageEvent) => {
      const watchedKeys = ['savedHotels', 'sightseeingData', 'savedRestaurants', 'savedTransportRoutes'];
      if (watchedKeys.includes(e.key || '')) {
        console.log(`Storage changed for ${e.key}, refreshing enhanced inventory data`);
        loadData();
      }
    };

    // Listen for custom events as well for immediate updates
    const handleCustomUpdate = () => {
      console.log('Custom inventory update triggered');
      loadData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('inventoryUpdate', handleCustomUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('inventoryUpdate', handleCustomUpdate);
    };
  }, []);

  return filteredData;
};
