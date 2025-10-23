
import { useState, useEffect, useMemo } from 'react';
import { useInventoryData } from '@/pages/queries/hooks/useInventoryData';
import { ProposalDay } from '@/components/proposal/DayPlanningInterface';
import { EnhancedProposalTemplate } from '@/services/proposalTemplateService';

interface ModuleSuggestion {
  id: string;
  type: 'hotel' | 'transport' | 'sightseeing' | 'restaurant';
  name: string;
  description: string;
  price: number;
  currency: string;
  rating?: number;
  category: string;
  city: string;
  country: string;
  duration?: string;
  paxBased?: boolean;
}

interface SmartSuggestions {
  hotels: ModuleSuggestion[];
  transport: ModuleSuggestion[];
  sightseeing: ModuleSuggestion[];
  restaurants: ModuleSuggestion[];
  dayTemplates: ProposalDay[];
}

export const useSmartTemplateSuggestions = (
  selectedCountry: string,
  selectedCities: string[],
  templateCategory: 'Budget' | 'Standard' | 'Premium' | 'Luxury' = 'Standard'
) => {
  const { hotels, restaurants, sightseeing, transportRoutes, loading } = useInventoryData();
  const [suggestions, setSuggestions] = useState<SmartSuggestions>({
    hotels: [],
    transport: [],
    sightseeing: [],
    restaurants: [],
    dayTemplates: []
  });

  const categoryPriceRanges = {
    Budget: { min: 0, max: 100 },
    Standard: { min: 50, max: 200 },
    Premium: { min: 150, max: 400 },
    Luxury: { min: 300, max: 1000 }
  };

  const priceRange = categoryPriceRanges[templateCategory];

  const filteredSuggestions = useMemo(() => {
    if (!selectedCountry || loading) return suggestions;

    // Filter hotels by country/cities and category
    const hotelSuggestions: ModuleSuggestion[] = hotels
      .filter(hotel => {
        const matchesCountry = hotel.country?.toLowerCase() === selectedCountry.toLowerCase();
        const matchesCity = selectedCities.length === 0 || 
          selectedCities.some(city => hotel.city?.toLowerCase().includes(city.toLowerCase()));
        
        // Get price for category filtering
        const roomTypes = hotel.roomTypes || [];
        const standardRoom = roomTypes.find(r => r.name?.toLowerCase().includes('standard')) || roomTypes[0];
        const price = standardRoom?.adultPrice || hotel.minRate || 100;
        
        return matchesCountry && matchesCity && price >= priceRange.min && price <= priceRange.max;
      })
      .map(hotel => {
        const roomTypes = hotel.roomTypes || [];
        const standardRoom = roomTypes.find(r => r.name?.toLowerCase().includes('standard')) || roomTypes[0];
        const price = standardRoom?.adultPrice || hotel.minRate || 100;
        
        return {
          id: hotel.id.toString(),
          type: 'hotel' as const,
          name: hotel.name,
          description: hotel.description || '',
          price,
          currency: hotel.currency || 'USD',
          rating: (hotel as any).rating || undefined,
          category: hotel.category || templateCategory,
          city: hotel.city || '',
          country: hotel.country || selectedCountry
        };
      })
      .slice(0, 10);

    // Filter transport by cities
    const transportSuggestions: ModuleSuggestion[] = transportRoutes
      .filter(route => {
        const matchesCity = selectedCities.some(city => 
          route.from?.toLowerCase().includes(city.toLowerCase()) ||
          route.to?.toLowerCase().includes(city.toLowerCase())
        );
        const price = route.price || 50;
        return matchesCity && price >= priceRange.min * 0.3 && price <= priceRange.max * 0.5;
      })
      .map(route => ({
        id: route.id.toString(),
        type: 'transport' as const,
        name: route.name || `${route.from} to ${route.to}`,
        description: `${route.transportType} transport - ${route.duration}`,
        price: route.price || 50,
        currency: 'USD',
        category: route.transportType || 'Car',
        city: route.from || '',
        country: route.country || selectedCountry,
        duration: route.duration,
        paxBased: true
      }))
      .slice(0, 8);

    // Filter sightseeing by cities and price
    const sightseeingSuggestions: ModuleSuggestion[] = sightseeing
      .filter(activity => {
        const matchesCity = selectedCities.some(city =>
          activity.city?.toLowerCase().includes(city.toLowerCase())
        );
        const price = typeof activity.price === 'object' ? activity.price.adult : activity.price || 0;
        return matchesCity && price >= priceRange.min * 0.2 && price <= priceRange.max * 0.4;
      })
      .map(activity => {
        const price = typeof activity.price === 'object' ? activity.price.adult : activity.price || 0;
        return {
          id: activity.id.toString(),
          type: 'sightseeing' as const,
          name: activity.name,
          description: activity.description || '',
          price,
          currency: 'USD',
          rating: (activity as any).rating || undefined,
          category: activity.category || 'Cultural',
          city: activity.city || '',
          country: selectedCountry,
          duration: activity.duration,
          paxBased: true
        };
      })
      .slice(0, 12);

    // Filter restaurants by cities and price
    const restaurantSuggestions: ModuleSuggestion[] = restaurants
      .filter(restaurant => {
        const matchesCity = selectedCities.some(city =>
          restaurant.city?.toLowerCase().includes(city.toLowerCase())
        );
        const price = restaurant.averageCost || 25;
        return matchesCity && price >= priceRange.min * 0.1 && price <= priceRange.max * 0.3;
      })
      .map(restaurant => ({
        id: restaurant.id.toString(),
        type: 'restaurant' as const,
        name: restaurant.name,
        description: restaurant.description || '',
        price: restaurant.averageCost || 25,
        currency: restaurant.currencyCode || 'USD',
        rating: restaurant.rating,
        category: restaurant.cuisine || 'Local',
        city: restaurant.city || '',
        country: selectedCountry,
        paxBased: true
      }))
      .slice(0, 8);

    // Generate day templates based on suggestions
    const dayTemplates = generateDayTemplates(
      selectedCities,
      hotelSuggestions,
      transportSuggestions,
      sightseeingSuggestions,
      restaurantSuggestions
    );

    return {
      hotels: hotelSuggestions,
      transport: transportSuggestions,
      sightseeing: sightseeingSuggestions,
      restaurants: restaurantSuggestions,
      dayTemplates
    };
  }, [hotels, restaurants, sightseeing, transportRoutes, selectedCountry, selectedCities, templateCategory, loading]);

  const generateDayTemplates = (
    cities: string[],
    hotelSuggestions: ModuleSuggestion[],
    transportSuggestions: ModuleSuggestion[],
    sightseeingSuggestions: ModuleSuggestion[],
    restaurantSuggestions: ModuleSuggestion[]
  ): ProposalDay[] => {
    const templates: ProposalDay[] = [];
    
    cities.forEach((city, index) => {
      const cityHotels = hotelSuggestions.filter(h => h.city.toLowerCase().includes(city.toLowerCase()));
      const citySightseeing = sightseeingSuggestions.filter(s => s.city.toLowerCase().includes(city.toLowerCase()));
      const cityRestaurants = restaurantSuggestions.filter(r => r.city.toLowerCase().includes(city.toLowerCase()));
      
      // Arrival day template
      templates.push({
        id: `arrival_${city.toLowerCase()}`,
        dayNumber: index + 1,
        date: '',
        city,
        title: `Arrival in ${city}`,
        description: `Welcome to ${city} - Check-in and initial exploration`,
        activities: [
          ...(index > 0 ? [{
            id: `transport_${index}`,
            name: `Transfer to ${city}`,
            price: transportSuggestions[0]?.price || 50,
            duration: '2-3 hours'
          }] : []),
          {
            id: `checkin_${city}`,
            name: 'Hotel Check-in',
            price: 0,
            duration: '30 minutes'
          },
          ...(citySightseeing.slice(0, 1).map(activity => ({
            id: activity.id,
            name: activity.name,
            price: activity.price,
            duration: activity.duration || '2 hours'
          })))
        ],
        meals: { breakfast: false, lunch: true, dinner: true },
        totalCost: calculateDayCost(cityHotels[0], citySightseeing.slice(0, 1), cityRestaurants.slice(0, 1))
      });

      // Exploration day template
      if (citySightseeing.length > 1) {
        templates.push({
          id: `explore_${city.toLowerCase()}`,
          dayNumber: index + 2,
          date: '',
          city,
          title: `${city} Exploration`,
          description: `Full day exploring the highlights of ${city}`,
          activities: citySightseeing.slice(1, 3).map(activity => ({
            id: activity.id,
            name: activity.name,
            price: activity.price,
            duration: activity.duration || '3 hours'
          })),
          meals: { breakfast: true, lunch: true, dinner: false },
          totalCost: calculateDayCost(cityHotels[0], citySightseeing.slice(1, 3), [])
        });
      }
    });

    return templates;
  };

  const calculateDayCost = (
    hotel?: ModuleSuggestion,
    activities: ModuleSuggestion[] = [],
    restaurants: ModuleSuggestion[] = []
  ): number => {
    const hotelCost = hotel?.price || 0;
    const activitiesCost = activities.reduce((sum, activity) => sum + activity.price, 0);
    const restaurantCost = restaurants.reduce((sum, restaurant) => sum + restaurant.price, 0);
    return hotelCost + activitiesCost + restaurantCost;
  };

  useEffect(() => {
    setSuggestions(filteredSuggestions);
  }, [filteredSuggestions]);

  return {
    suggestions,
    loading,
    priceRange,
    refreshSuggestions: () => setSuggestions(filteredSuggestions)
  };
};
