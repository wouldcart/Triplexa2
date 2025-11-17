
import { useState, useEffect } from 'react';
import { Hotel } from '@/components/inventory/hotels/types/hotel';
import { sightseeingData } from '@/pages/inventory/sightseeing/data/initialData';
import { Sightseeing } from '@/types/sightseeing';
import { Restaurant } from '@/pages/inventory/restaurants/types/restaurantTypes';
import { initialRestaurants } from '@/pages/inventory/restaurants/data/restaurantData';
import { TransportRoute } from '@/pages/queries/types/proposalTypes';
import { transportRoutes } from '@/pages/inventory/transport/data/transportData';
import { CitiesService, CityRow } from '@/services/citiesService';
import { CountriesService, CountryRow } from '@/services/countriesService';
import { listTransportRoutes, mapRouteRowToProposalRoute } from '@/services/transportRoutesService';

// Function to get sightseeing data from localStorage with real-time updates
const getSavedSightseeingData = (): Sightseeing[] => {
  try {
    const data = localStorage.getItem('sightseeingData');
    return data ? JSON.parse(data) : sightseeingData;
  } catch (error) {
    console.error('Error getting sightseeing data from localStorage:', error);
    return sightseeingData;
  }
};

// Function to get hotel data from localStorage with real-time updates
const getSavedHotelData = (): Hotel[] => {
  try {
    const data = localStorage.getItem('savedHotels');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting hotel data from localStorage:', error);
    return [];
  }
};

// Function to get restaurant data from localStorage with real-time updates
const getSavedRestaurantData = (): Restaurant[] => {
  try {
    const data = localStorage.getItem('savedRestaurants');
    if (data) {
      return JSON.parse(data);
    }
    // Adapt initial restaurant data if no saved data
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

// Function to get transport data from localStorage with real-time updates
const getSavedTransportData = (): TransportRoute[] => {
  try {
    const data = localStorage.getItem('savedTransportRoutes');
    if (data) {
      return JSON.parse(data);
    }
    // Use all transport routes, not just first 10
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

// Define the return type for the hook
interface InventoryData {
  hotels: Hotel[];
  restaurants: Restaurant[];
  sightseeing: Sightseeing[];
  transportRoutes: TransportRoute[];
  cities: CityRow[];
  countries: CountryRow[];
  currency: string;
  currencySymbol: string;
  refreshData: () => void;
  loading: boolean;
}

export const useInventoryData = (): InventoryData => {
  const [data, setData] = useState<InventoryData>({
    hotels: [],
    restaurants: [],
    sightseeing: [],
    transportRoutes: [],
    cities: [],
    countries: [],
    currency: 'USD',
    currencySymbol: '$',
    refreshData: () => {},
    loading: true
  });

  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load real-time data from localStorage and fallback to initial data
      const hotelData = getSavedHotelData();
      const sightseeingDataFromStorage = getSavedSightseeingData();
      const restaurantData = getSavedRestaurantData();
      // Try remote transport routes first, fallback to local if unavailable
      let transportData: TransportRoute[] = [];
      try {
        const rows = await listTransportRoutes();
        transportData = rows.map(mapRouteRowToProposalRoute);
      } catch (err) {
        console.warn('Falling back to local transport routes due to remote error:', err);
        transportData = getSavedTransportData();
      }

      // Use only Supabase data - no fallback to mock data
      let finalHotelData = hotelData;

      // Process sightseeing data to ensure proper typing
      const processedSightseeingData = sightseeingDataFromStorage.map(item => {
        const typedItem: Sightseeing = {
          ...item,
          price: item.price === undefined ? { adult: 0, child: 0 } : 
                 typeof item.price === 'number' ? { adult: item.price, child: item.price / 2 } : 
                 item.price
        };
        return typedItem;
      });

      // Load cities and countries from new services
      let citiesData: CityRow[] = [];
      let countriesData: CountryRow[] = [];

      try {
        const citiesResponse = await CitiesService.getAllCities();
        if (citiesResponse.success && citiesResponse.data && Array.isArray(citiesResponse.data)) {
          citiesData = citiesResponse.data;
        }
      } catch (error) {
        console.error("Error loading cities data:", error);
      }

      try {
        const countriesResponse = await CountriesService.getAllCountries();
        if (countriesResponse.success && countriesResponse.data && Array.isArray(countriesResponse.data)) {
          countriesData = countriesResponse.data;
        }
      } catch (error) {
        console.error("Error loading countries data:", error);
      }

      setData(prevData => ({
        ...prevData,
        hotels: finalHotelData,
        restaurants: restaurantData,
        sightseeing: processedSightseeingData,
        transportRoutes: transportData,
        cities: citiesData,
        countries: countriesData,
        loading: false
      }));

      console.log('Inventory data loaded:', {
        hotels: finalHotelData.length,
        restaurants: restaurantData.length,
        sightseeing: processedSightseeingData.length,
        transportRoutes: transportData.length,
        cities: citiesData.length,
        countries: countriesData.length
      });

    } catch (error) {
      console.error("Error loading inventory data:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    loadData();
  };

  useEffect(() => {
    loadData();

    // Listen for localStorage changes to update data in real-time
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'savedHotels' || 
          e.key === 'sightseeingData' || 
          e.key === 'savedRestaurants' || 
          e.key === 'savedTransportRoutes') {
        console.log('Storage changed, refreshing inventory data');
        loadData();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return {
    ...data,
    refreshData,
    loading
  };
};
