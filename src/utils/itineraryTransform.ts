
import { ItineraryDay, ItineraryActivity } from '@/types/itinerary';

interface CentralItineraryDay {
  id: string;
  dayNumber: number;
  title: string;
  city: string;
  description: string;
  date: string;
  activities: Array<{
    id: string;
    name: string;
    description: string;
    duration: string;
    price: number;
    type: string;
  }>;
  transport?: Array<{
    id: string;
    name: string;
    from: string;
    to: string;
    price: number;
    type?: string;
    routeCode?: string;
    vehicleType?: string;
    duration?: string;
  }>;
  accommodation?: {
    id: string;
    name: string;
    type: string;
    price: number;
    hotel?: string;
    roomType?: string;
    checkIn?: string;
    checkOut?: string;
    nights?: number;
  };
  totalCost: number;
}

export interface ProposalItineraryData {
  days: ProposalItineraryDay[];
  totalCost: number;
}

interface ProposalItineraryDay {
  id: string;
  day: number;
  date: string;
  location: {
    id: string;
    name: string;
    city: string;
    country: string;
  };
  activities: Array<{
    id: string;
    name: string;
    type: 'sightseeing' | 'transport' | 'meal' | 'accommodation' | 'activity';
    location: {
      id: string;
      name: string;
      city: string;
      country: string;
    };
    startTime: string;
    endTime: string;
    duration: string;
    price: number;
    description: string;
  }>;
  transport: Array<{
    id: string;
    name: string;
    from: string;
    to: string;
    duration: string;
    price: number;
    type?: string;
    routeCode?: string;
    vehicleType?: string;
  }>;
  accommodation: {
    id: string;
    name: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    roomType: string;
    price: number;
  };
  meals: Array<{
    id: string;
    name: string;
    type: string;
    time: string;
    price: number;
  }>;
  totalCost: number;
}

export class ItineraryTransform {
  /**
   * Transform central itinerary data to proposal itinerary format
   */
  static centralToProposal(centralDays: CentralItineraryDay[]): ProposalItineraryData {
    const proposalDays = centralDays.map((centralDay, index) => ({
      id: centralDay.id,
      day: centralDay.dayNumber,
      date: centralDay.date,
      location: {
        id: `loc-${centralDay.city}`,
        name: centralDay.city,
        city: centralDay.city,
        country: 'India', // Default country
      },
      activities: centralDay.activities.map(activity => ({
        id: activity.id,
        name: activity.name,
        type: this.mapCentralToProposalActivityType(activity.type) as 'sightseeing' | 'transport' | 'meal' | 'accommodation' | 'activity',
        location: {
          id: `loc-${centralDay.city}`,
          name: centralDay.city,
          city: centralDay.city,
          country: 'India',
        },
        startTime: '09:00',
        endTime: '17:00',
        duration: activity.duration,
        price: activity.price,
        description: activity.description || '',
      })),
      transport: centralDay.transport?.map(transport => ({
        id: transport.id,
        name: transport.name,
        from: transport.from,
        to: transport.to,
        duration: transport.duration || '2 hours',
        price: transport.price,
        type: transport.type,
        routeCode: transport.routeCode,
        vehicleType: transport.vehicleType,
      })) || [],
      accommodation: centralDay.accommodation ? {
        id: centralDay.accommodation.id,
        name: centralDay.accommodation.name,
        checkIn: centralDay.accommodation.checkIn || centralDay.date,
        checkOut: centralDay.accommodation.checkOut || centralDay.date,
        nights: centralDay.accommodation.nights || 1,
        roomType: centralDay.accommodation.roomType || 'Standard',
        price: centralDay.accommodation.price,
      } : {
        id: `default-acc-${centralDay.id}`,
        name: 'Standard Hotel',
        checkIn: centralDay.date,
        checkOut: centralDay.date,
        nights: 1,
        roomType: 'Standard',
        price: 0,
      },
      meals: [
        {
          id: `meal-${centralDay.id}`,
          name: 'Breakfast',
          type: 'breakfast',
          time: '08:00',
          price: 500,
        }
      ],
      totalCost: centralDay.totalCost,
    }));

    const totalCost = proposalDays.reduce((sum, day) => sum + day.totalCost, 0);

    return {
      days: proposalDays,
      totalCost
    };
  }

  /**
   * Transform proposal itinerary data back to central format
   */
  static proposalToCentral(proposalDays: ProposalItineraryDay[]): ItineraryDay[] {
    return proposalDays.map((proposalDay, index) => ({
      id: proposalDay.id,
      day: proposalDay.day,
      date: proposalDay.date,
      location: {
        id: proposalDay.location.id,
        name: proposalDay.location.name,
        city: proposalDay.location.city,
        country: proposalDay.location.country,
      },
      activities: proposalDay.activities.map(activity => ({
        id: activity.id,
        name: activity.name,
        type: this.mapProposalToCentralActivityType(activity.type),
        location: activity.location,
        startTime: activity.startTime,
        endTime: activity.endTime,
        duration: activity.duration,
        price: activity.price,
        description: activity.description,
      })),
      transport: proposalDay.transport.map(transport => ({
        id: transport.id,
        type: transport.type as 'flight' | 'car' | 'bus' | 'train' | 'boat' || 'car',
        from: {
          id: `loc-${transport.from}`,
          name: transport.from,
          city: transport.from,
          country: 'India',
        },
        to: {
          id: `loc-${transport.to}`,
          name: transport.to,
          city: transport.to,
          country: 'India',
        },
        duration: transport.duration,
        price: transport.price,
      })),
      meals: proposalDay.meals.map(meal => ({
        id: meal.id,
        type: meal.type as 'breakfast' | 'lunch' | 'dinner',
        restaurant: meal.name,
        location: proposalDay.location,
        cuisine: 'Local',
        price: meal.price,
        time: meal.time,
      })),
      totalCost: proposalDay.totalCost,
    }));
  }

  /**
   * Map central activity type to proposal activity type
   */
  private static mapCentralToProposalActivityType(type: string): string {
    switch (type) {
      case 'cultural':
      case 'adventure':
      case 'relaxation':
      case 'dining':
        return 'activity';
      case 'transport':
        return 'transport';
      case 'meal':
        return 'meal';
      case 'accommodation':
        return 'accommodation';
      case 'sightseeing':
      default:
        return 'sightseeing';
    }
  }

  /**
   * Map proposal activity type back to central activity type
   */
  private static mapProposalToCentralActivityType(type: string): 'sightseeing' | 'adventure' | 'cultural' | 'relaxation' | 'dining' {
    switch (type) {
      case 'activity':
        return 'adventure';
      case 'meal':
        return 'dining';
      case 'sightseeing':
      default:
        return 'sightseeing';
    }
  }

  /**
   * Create sample central itinerary data
   */
  static createSampleCentralItinerary(): CentralItineraryDay[] {
    return [
      {
        id: 'day-1',
        dayNumber: 1,
        title: 'Arrival in Delhi',
        city: 'Delhi',
        description: 'Arrival and city exploration',
        date: '2024-01-15',
        activities: [
          {
            id: 'act-1',
            name: 'Red Fort Visit',
            description: 'Explore the historic Red Fort',
            duration: '2 hours',
            price: 500,
            type: 'sightseeing'
          }
        ],
        transport: [
          {
            id: 'transport-1',
            name: 'Airport Transfer',
            from: 'Delhi Airport',
            to: 'Hotel',
            price: 1000,
            type: 'car',
            duration: '1 hour'
          }
        ],
        accommodation: {
          id: 'acc-1',
          name: 'Hotel Delhi',
          type: 'hotel',
          price: 5000,
          roomType: 'Deluxe',
          checkIn: '2024-01-15',
          checkOut: '2024-01-16',
          nights: 1
        },
        totalCost: 6500
      }
    ];
  }
}
