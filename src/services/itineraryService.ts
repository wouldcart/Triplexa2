import { CentralItinerary, ItineraryGenerationRequest, ItineraryDay, ItineraryActivity, ItineraryAccommodation, ItineraryTransport, ItineraryMeal, ItineraryLocation } from '@/types/itinerary';
import { Hotel } from '@/components/inventory/hotels/types/hotel';
import { Sightseeing } from '@/types/sightseeing';
import { Restaurant } from '@/pages/inventory/restaurants/types/restaurantTypes';
import { TransportRoute } from '@/pages/queries/types/proposalTypes';
import { v4 as uuidv4 } from 'uuid';
import { addDays, format } from 'date-fns';

export class ItineraryService {
  private static hotels: Hotel[] = [];
  private static sightseeing: Sightseeing[] = [];
  private static restaurants: Restaurant[] = [];
  private static transportRoutes: TransportRoute[] = [];

  static setInventoryData(data: {
    hotels: Hotel[];
    sightseeing: Sightseeing[];
    restaurants: Restaurant[];
    transportRoutes: TransportRoute[];
  }) {
    this.hotels = data.hotels;
    this.sightseeing = data.sightseeing;
    this.restaurants = data.restaurants;
    this.transportRoutes = data.transportRoutes;
  }

  static async generateItinerary(request: ItineraryGenerationRequest): Promise<CentralItinerary> {
    const itinerary: CentralItinerary = {
      id: uuidv4(),
      title: `${request.destinations.join(', ')} Adventure`,
      description: `AI-generated itinerary for ${request.travelers.adults} adults${request.travelers.children > 0 ? ` and ${request.travelers.children} children` : ''}`,
      startDate: request.startDate,
      endDate: request.endDate,
      duration: this.calculateDuration(request.startDate, request.endDate),
      destinations: this.generateDestinations(request.destinations),
      preferences: {
        budget: request.budget,
        travelers: request.travelers,
        interests: request.preferences.interests,
        accommodationType: request.preferences.accommodationType,
        transportPreference: request.preferences.transportPreference,
        dietaryRestrictions: request.preferences.dietaryRestrictions,
      },
      days: [],
      pricing: {
        baseCost: 0,
        markup: 0,
        markupType: 'percentage',
        finalPrice: 0,
        currency: request.budget.currency,
      },
      status: 'generated',
      context: request.context,
      contextId: request.contextId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system',
    };

    // Generate daily itinerary
    itinerary.days = await this.generateDailyItinerary(itinerary);
    
    // Calculate pricing
    itinerary.pricing = this.calculatePricing(itinerary);

    return itinerary;
  }

  private static calculateDuration(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return {
      days: days,
      nights: days - 1,
    };
  }

  private static generateDestinations(destinationNames: string[]): ItineraryLocation[] {
    return destinationNames.map(name => ({
      id: uuidv4(),
      name,
      country: name.includes(',') ? name.split(',')[1].trim() : 'Unknown',
      city: name.includes(',') ? name.split(',')[0].trim() : name,
    }));
  }

  private static async generateDailyItinerary(itinerary: CentralItinerary): Promise<ItineraryDay[]> {
    const days: ItineraryDay[] = [];
    const totalDays = itinerary.duration.days;
    
    for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
      const currentDate = addDays(new Date(itinerary.startDate), dayNum - 1);
      const location = itinerary.destinations[Math.floor((dayNum - 1) / Math.max(1, totalDays / itinerary.destinations.length))];
      
      const day: ItineraryDay = {
        id: uuidv4(),
        day: dayNum,
        date: format(currentDate, 'yyyy-MM-dd'),
        location,
        activities: this.generateActivities(location, dayNum, itinerary.preferences.interests),
        meals: this.generateMeals(location),
        totalCost: 0,
      };

      // Add accommodation (except last day)
      if (dayNum < totalDays) {
        day.accommodation = this.generateAccommodation(location, day.date, itinerary.preferences.accommodationType);
      }

      // Add transport (except first day)
      if (dayNum > 1) {
        const previousLocation = days[dayNum - 2].location;
        if (previousLocation.city !== location.city) {
          day.transport = [this.generateTransport(previousLocation, location)];
        }
      }

      day.totalCost = this.calculateDayCost(day);
      days.push(day);
    }

    return days;
  }

  private static generateActivities(location: ItineraryLocation, dayNum: number, interests: string[]): ItineraryActivity[] {
    const activities: ItineraryActivity[] = [];
    
    // Filter sightseeing by location
    const localSightseeing = this.sightseeing.filter(s => 
      s.city === location.city || s.country === location.country
    );

    // Generate 2-3 activities per day
    const numActivities = Math.min(3, Math.max(2, localSightseeing.length));
    
    for (let i = 0; i < numActivities && i < localSightseeing.length; i++) {
      const sight = localSightseeing[i];
      const startHour = 9 + (i * 3); // Space activities 3 hours apart
      
      activities.push({
        id: uuidv4(),
        name: sight.name,
        type: 'sightseeing',
        location: {
          id: uuidv4(),
          name: sight.name,
          country: sight.country,
          city: sight.city,
        },
        startTime: `${startHour.toString().padStart(2, '0')}:00`,
        endTime: `${(startHour + 2).toString().padStart(2, '0')}:00`,
        duration: '2 hours',
        price: this.getPrice(sight.price || 0),
        description: sight.description,
        inclusions: sight.policies?.inclusions || (sight.description ? [sight.description] : []),
      });
    }

    return activities;
  }

  private static generateMeals(location: ItineraryLocation): ItineraryMeal[] {
    const meals: ItineraryMeal[] = [];
    
    // Filter restaurants by location
    const localRestaurants = this.restaurants.filter(r => 
      r.city === location.city || r.country === location.country
    );

    if (localRestaurants.length > 0) {
      // Add lunch and dinner
      const lunchRestaurant = localRestaurants[0];
      const dinnerRestaurant = localRestaurants[Math.min(1, localRestaurants.length - 1)];

      meals.push({
        id: uuidv4(),
        type: 'lunch',
        restaurant: lunchRestaurant.name,
        location: {
          id: uuidv4(),
          name: lunchRestaurant.name,
          country: lunchRestaurant.country,
          city: lunchRestaurant.city,
        },
        cuisine: lunchRestaurant.cuisine,
        price: lunchRestaurant.averageCost || 30,
        time: '12:30',
      });

      meals.push({
        id: uuidv4(),
        type: 'dinner',
        restaurant: dinnerRestaurant.name,
        location: {
          id: uuidv4(),
          name: dinnerRestaurant.name,
          country: dinnerRestaurant.country,
          city: dinnerRestaurant.city,
        },
        cuisine: dinnerRestaurant.cuisine,
        price: dinnerRestaurant.averageCost || 50,
        time: '19:00',
      });
    }

    return meals;
  }

  private static generateAccommodation(location: ItineraryLocation, date: string, type: 'budget' | 'mid-range' | 'luxury'): ItineraryAccommodation {
    // Filter hotels by location and type
    const localHotels = this.hotels.filter(h => 
      h.city === location.city || h.country === location.country
    );

    let selectedHotel = localHotels[0];
    if (selectedHotel) {
      // Filter by accommodation type
      if (type === 'luxury' && selectedHotel.starRating && selectedHotel.starRating >= 4) {
        selectedHotel = localHotels.find(h => h.starRating && h.starRating >= 4) || selectedHotel;
      } else if (type === 'mid-range' && selectedHotel.starRating && selectedHotel.starRating >= 3) {
        selectedHotel = localHotels.find(h => h.starRating && h.starRating >= 3 && h.starRating < 4) || selectedHotel;
      }
    }

    const defaultHotel = {
      name: `${location.city} Hotel`,
      starRating: type === 'luxury' ? 5 : type === 'mid-range' ? 3 : 2,
      price: type === 'luxury' ? 300 : type === 'mid-range' ? 150 : 80,
      amenities: ['WiFi', 'Breakfast', 'AC'],
    };

    const hotel = selectedHotel || defaultHotel;

    return {
      id: uuidv4(),
      name: hotel.name,
      type: 'hotel',
      location,
      checkIn: date,
      checkOut: format(addDays(new Date(date), 1), 'yyyy-MM-dd'),
      nights: 1,
      roomType: 'Deluxe Room',
      price: hotel.price || defaultHotel.price,
      starRating: hotel.starRating,
      amenities: (selectedHotel && 'amenities' in selectedHotel) ? selectedHotel.amenities : defaultHotel.amenities,
    };
  }

  private static generateTransport(from: ItineraryLocation, to: ItineraryLocation): ItineraryTransport {
    // Find transport route
    const route = this.transportRoutes.find(r => 
      (r.from === from.city && r.to === to.city) ||
      (r.from === from.country && r.to === to.country)
    );

    return {
      id: uuidv4(),
      type: route?.transportType === 'flight' ? 'flight' : 'car',
      from,
      to,
      duration: route?.duration || '2 hours',
      price: route?.price || 100,
      details: route?.name || `${from.city} to ${to.city}`,
    };
  }

  private static calculateDayCost(day: ItineraryDay): number {
    let total = 0;
    
    // Activities cost
    total += day.activities.reduce((sum, activity) => sum + activity.price, 0);
    
    // Meals cost
    total += day.meals.reduce((sum, meal) => sum + meal.price, 0);
    
    // Accommodation cost
    if (day.accommodation) {
      total += day.accommodation.price;
    }
    
    // Transport cost
    if (day.transport) {
      total += day.transport.reduce((sum, transport) => sum + transport.price, 0);
    }
    
    return total;
  }

  private static calculatePricing(itinerary: CentralItinerary) {
    const baseCost = itinerary.days.reduce((sum, day) => sum + day.totalCost, 0);
    const markup = baseCost * 0.15; // 15% default markup
    
    return {
      baseCost,
      markup,
      markupType: 'percentage' as const,
      finalPrice: baseCost + markup,
      currency: itinerary.preferences.budget.currency,
    };
  }

  private static getPrice(price: number | { adult: number; child: number; }): number {
    if (typeof price === 'number') {
      return price;
    } else if (price && typeof price === 'object' && 'adult' in price) {
      return price.adult;
    }
    return 0;
  }
}
