
import { useMemo } from 'react';
import { Query } from '@/types/query';
import { mockHotels } from '@/components/inventory/hotels/data/hotelData';
import { transportRoutes } from '@/pages/inventory/transport/data/transportData';
import { sightseeingData } from '@/pages/inventory/sightseeing/data/initialData';

export interface SmartSuggestion {
  id: string;
  type: 'activity' | 'transport' | 'accommodation' | 'meal';
  category: 'morning' | 'afternoon' | 'evening' | 'full-day';
  name: string;
  description: string;
  duration: string;
  price: number;
  location: string;
  timeSlot: string;
  popularity: number;
  seasonalScore: number;
  budgetFit: number;
  travelerTypeScore: number;
  data: any;
}

export interface DayTemplate {
  id: string;
  name: string;
  description: string;
  duration: string;
  totalCost: number;
  activities: SmartSuggestion[];
  popularity: number;
  bestFor: string[];
}

export const useSmartSuggestions = (query: Query, selectedDay?: number) => {
  // Analyze traveler profile
  const travelerProfile = useMemo(() => {
    const totalPax = query.paxDetails.adults + query.paxDetails.children;
    const hasChildren = query.paxDetails.children > 0;
    const isCouple = query.paxDetails.adults === 2 && query.paxDetails.children === 0;
    const isSolo = totalPax === 1;
    const isFamily = hasChildren;
    const isGroup = totalPax > 4;

    return {
      type: isFamily ? 'family' : isCouple ? 'couple' : isSolo ? 'solo' : isGroup ? 'group' : 'friends',
      paxCount: totalPax,
      hasChildren,
      budgetPerPax: (query.budget.min + query.budget.max) / 2 / totalPax
    };
  }, [query]);

  // Get seasonal context
  const seasonalContext = useMemo(() => {
    const travelDate = new Date(query.travelDates.from);
    const month = travelDate.getMonth() + 1;
    
    let season = 'spring';
    if (month >= 6 && month <= 8) season = 'summer';
    else if (month >= 9 && month <= 11) season = 'autumn';
    else if (month >= 12 || month <= 2) season = 'winter';

    return { season, month };
  }, [query.travelDates.from]);

  // Generate activity suggestions based on context
  const activitySuggestions = useMemo(() => {
    const suggestions: SmartSuggestion[] = [];

    sightseeingData
      .filter(activity => 
        query.destination.cities.some(city =>
          activity.city && city && 
          activity.city.toLowerCase().includes(city.toLowerCase())
        )
      )
      .forEach(activity => {
        const basePrice = typeof activity.price === 'object' ? activity.price.adult : activity.price || 50;
        const totalPrice = basePrice * travelerProfile.paxCount;

        // Calculate scores
        const budgetFit = Math.max(0, 100 - Math.abs(totalPrice - travelerProfile.budgetPerPax) / travelerProfile.budgetPerPax * 100);
        const travelerTypeScore = calculateTravelerTypeScore(activity, travelerProfile);
        const seasonalScore = calculateSeasonalScore(activity, seasonalContext);

        // Determine time category
        const category = determineTimeCategory(activity);

        suggestions.push({
          id: `activity_${activity.id}`,
          type: 'activity',
          category,
          name: activity.name || 'Unnamed Activity',
          description: activity.description || `Explore ${activity.name || 'activity'} in ${activity.city || 'destination'}`,
          duration: activity.duration || '2-3 hours',
          price: totalPrice,
          location: activity.city || '',
          timeSlot: getTimeSlot(category),
          popularity: 75 + Math.random() * 25,
          seasonalScore,
          budgetFit,
          travelerTypeScore,
          data: activity
        });
      });

    return suggestions.sort((a, b) => 
      (b.popularity + b.seasonalScore + b.budgetFit + b.travelerTypeScore) - 
      (a.popularity + a.seasonalScore + a.budgetFit + a.travelerTypeScore)
    );
  }, [query, travelerProfile, seasonalContext]);

  // Generate day templates
  const dayTemplates = useMemo(() => {
    const templates: DayTemplate[] = [];

    // Cultural Explorer Template
    const culturalActivities = activitySuggestions.filter(a => 
      a.name && (
        a.name.toLowerCase().includes('museum') || 
        a.name.toLowerCase().includes('temple') ||
        a.name.toLowerCase().includes('palace') ||
        a.name.toLowerCase().includes('cultural')
      )
    ).slice(0, 3);

    if (culturalActivities.length >= 2) {
      templates.push({
        id: 'cultural_explorer',
        name: 'Cultural Explorer',
        description: 'Immerse yourself in local culture and history',
        duration: 'Full Day',
        totalCost: culturalActivities.reduce((sum, a) => sum + a.price, 0),
        activities: culturalActivities,
        popularity: 85,
        bestFor: ['couple', 'solo', 'friends']
      });
    }

    // Adventure Seeker Template
    const adventureActivities = activitySuggestions.filter(a => 
      a.name && (
        a.name.toLowerCase().includes('trek') || 
        a.name.toLowerCase().includes('adventure') ||
        a.name.toLowerCase().includes('safari') ||
        a.name.toLowerCase().includes('outdoor')
      )
    ).slice(0, 2);

    if (adventureActivities.length >= 1) {
      templates.push({
        id: 'adventure_seeker',
        name: 'Adventure Seeker',
        description: 'Thrilling outdoor experiences and adventures',
        duration: 'Full Day',
        totalCost: adventureActivities.reduce((sum, a) => sum + a.price, 0),
        activities: adventureActivities,
        popularity: 80,
        bestFor: ['friends', 'couple', 'group']
      });
    }

    // Family Fun Template
    if (travelerProfile.hasChildren) {
      const familyActivities = activitySuggestions.filter(a => 
        a.name && (
          !a.name.toLowerCase().includes('bar') && 
          !a.name.toLowerCase().includes('nightlife')
        )
      ).slice(0, 3);

      templates.push({
        id: 'family_fun',
        name: 'Family Fun Day',
        description: 'Kid-friendly activities for the whole family',
        duration: 'Full Day',
        totalCost: familyActivities.reduce((sum, a) => sum + a.price, 0),
        activities: familyActivities,
        popularity: 90,
        bestFor: ['family']
      });
    }

    // Relaxed Explorer Template
    const relaxedActivities = activitySuggestions
      .filter(a => a.category !== 'full-day')
      .slice(0, 4);

    templates.push({
      id: 'relaxed_explorer',
      name: 'Relaxed Explorer',
      description: 'Take it easy with flexible, shorter activities',
      duration: 'Flexible',
      totalCost: relaxedActivities.reduce((sum, a) => sum + a.price, 0),
      activities: relaxedActivities,
      popularity: 75,
      bestFor: ['couple', 'solo', 'family']
    });

    return templates.sort((a, b) => {
      const aFit = a.bestFor.includes(travelerProfile.type) ? 20 : 0;
      const bFit = b.bestFor.includes(travelerProfile.type) ? 20 : 0;
      return (b.popularity + bFit) - (a.popularity + aFit);
    });
  }, [activitySuggestions, travelerProfile]);

  // Generate contextual suggestions for specific time slots
  const getTimeSlotSuggestions = (timeSlot: 'morning' | 'afternoon' | 'evening') => {
    return activitySuggestions
      .filter(s => s.category === timeSlot || s.category === 'full-day')
      .slice(0, 5);
  };

  return {
    activitySuggestions: activitySuggestions.slice(0, 10),
    dayTemplates,
    getTimeSlotSuggestions,
    travelerProfile,
    seasonalContext
  };
};

// Helper functions
function calculateTravelerTypeScore(activity: any, profile: any): number {
  let score = 50;
  
  if (profile.hasChildren) {
    if (activity.name && (
        activity.name.toLowerCase().includes('family') || 
        activity.name.toLowerCase().includes('kid') ||
        activity.name.toLowerCase().includes('children')
      )) {
      score += 30;
    }
    if (activity.name && (
        activity.name.toLowerCase().includes('bar') ||
        activity.name.toLowerCase().includes('nightlife')
      )) {
      score -= 40;
    }
  }
  
  if (profile.type === 'couple') {
    if (activity.name && (
        activity.name.toLowerCase().includes('romantic') ||
        activity.name.toLowerCase().includes('sunset') ||
        activity.name.toLowerCase().includes('dinner')
      )) {
      score += 25;
    }
  }
  
  return Math.max(0, Math.min(100, score));
}

function calculateSeasonalScore(activity: any, context: any): number {
  let score = 50;
  
  if (context.season === 'summer') {
    if (activity.name && (
        activity.name.toLowerCase().includes('beach') ||
        activity.name.toLowerCase().includes('water') ||
        activity.name.toLowerCase().includes('outdoor')
      )) {
      score += 30;
    }
  }
  
  if (context.season === 'winter') {
    if (activity.name && (
        activity.name.toLowerCase().includes('indoor') ||
        activity.name.toLowerCase().includes('museum') ||
        activity.name.toLowerCase().includes('temple')
      )) {
      score += 20;
    }
  }
  
  return Math.max(0, Math.min(100, score));
}

function determineTimeCategory(activity: any): 'morning' | 'afternoon' | 'evening' | 'full-day' {
  const name = activity.name ? activity.name.toLowerCase() : '';
  
  if (name.includes('sunrise') || name.includes('morning')) return 'morning';
  if (name.includes('sunset') || name.includes('evening') || name.includes('night')) return 'evening';
  if (name.includes('full day') || name.includes('trek') || name.includes('safari')) return 'full-day';
  
  return 'afternoon';
}

function getTimeSlot(category: string): string {
  switch (category) {
    case 'morning': return '9:00 AM - 12:00 PM';
    case 'afternoon': return '1:00 PM - 5:00 PM'; 
    case 'evening': return '6:00 PM - 9:00 PM';
    case 'full-day': return '9:00 AM - 6:00 PM';
    default: return '1:00 PM - 5:00 PM';
  }
}
