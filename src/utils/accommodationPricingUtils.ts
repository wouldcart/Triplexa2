import { Query } from '@/types/query';
import { AccommodationStay } from '@/utils/accommodationCalculations';

export interface AccommodationPricingBreakdown {
  adults: {
    count: number;
    totalPrice: number;
    pricePerPerson: number;
  };
  children: {
    count: number;
    totalPrice: number;
    pricePerPerson: number;
    discountPercentage: number;
  };
  totalPrice: number;
  priceStructure: 'room-based' | 'per-person';
}

export interface OptionPricingBreakdown {
  optionNumber: number;
  accommodations: AccommodationStay[];
  totalCost: number;
  pricingBreakdown: AccommodationPricingBreakdown;
}

/**
 * Calculate accommodation pricing breakdown for adults and children
 * @param accommodations - Array of accommodation stays
 * @param query - Query object containing pax details
 * @returns AccommodationPricingBreakdown
 */
export function calculateAccommodationPricing(
  accommodations: AccommodationStay[],
  query: Query
): AccommodationPricingBreakdown {
  const adults = query?.paxDetails.adults || 1;
  const children = query?.paxDetails.children || 0;
  const totalPax = adults + children;
  
  // Calculate total accommodation cost
  const totalAccommodationCost = accommodations.reduce(
    (sum, acc) => sum + (acc.totalPrice || 0), 
    0
  );

  // For accommodations, typically room-based pricing where children may have additional charges
  // or be included in the room rate
  
  // Base room cost covers adults
  const baseRoomCost = totalAccommodationCost;
  
  // Children pricing - simple calculation without discounts
  const childrenExtraCharges = children > 0 
    ? calculateChildrenExtraCharges(accommodations, children)
    : 0;

  const adultPrice = baseRoomCost;
  const childPrice = childrenExtraCharges;
  const totalPrice = adultPrice + childPrice;

  return {
    adults: {
      count: adults,
      totalPrice: adultPrice,
      pricePerPerson: adults > 0 ? adultPrice / adults : 0
    },
    children: {
      count: children,
      totalPrice: childPrice,
      pricePerPerson: children > 0 ? childPrice / children : 0,
      discountPercentage: 0
    },
    totalPrice,
    priceStructure: 'room-based'
  };
}

/**
 * Calculate children extra charges for accommodations
 * @param accommodations - Array of accommodations
 * @param childrenCount - Number of children
 * @returns Total extra charges for children
 */
function calculateChildrenExtraCharges(
  accommodations: AccommodationStay[],
  childrenCount: number
): number {
  // Calculate based on extra bed charges and child policies
  return accommodations.reduce((totalCharges, accommodation) => {
    // If accommodation has explicit children count and extra bed costs
    if (accommodation.numberOfChildren > 0 && accommodation.extraBeds > 0) {
      // Use accommodation-specific children charges
      const baseExtraBedCost = (accommodation.totalPrice || 0) * 0.3; // 30% of room rate for extra bed
      return totalCharges + baseExtraBedCost;
    }
    
    // Otherwise, calculate based on standard children pricing
    const perNightChildCharge = (accommodation.pricePerNightPerRoom || 0) * 0.25; // 25% of room rate per child
    const totalChildCharge = perNightChildCharge * (accommodation.numberOfNights || 1) * childrenCount;
    
    return totalCharges + totalChildCharge;
  }, 0);
}

/**
 * Group accommodations by option and calculate pricing for each
 * @param accommodations - All accommodations
 * @param query - Query object
 * @returns Array of option pricing breakdowns
 */
export function calculateAccommodationOptionsPricing(
  accommodations: AccommodationStay[],
  query: Query
): OptionPricingBreakdown[] {
  const options: OptionPricingBreakdown[] = [];
  
  // Group by option number
  for (let optionNumber = 1; optionNumber <= 3; optionNumber++) {
    const optionAccommodations = accommodations.filter(
      acc => acc.optionNumber === optionNumber
    );
    
    if (optionAccommodations.length > 0) {
      const pricingBreakdown = calculateAccommodationPricing(
        optionAccommodations,
        query
      );
      
      const totalCost = optionAccommodations.reduce(
        (sum, acc) => sum + (acc.totalPrice || 0),
        0
      );
      
      options.push({
        optionNumber,
        accommodations: optionAccommodations,
        totalCost,
        pricingBreakdown
      });
    }
  }
  
  return options;
}

/**
 * Get option display details
 * @param optionNumber - Option number (1, 2, 3)
 * @returns Display configuration for the option
 */
export function getOptionDisplayConfig(optionNumber: number) {
  const configs = {
    1: {
      title: 'Accommodations',
      icon: 'Hotel',
      colorClass: 'primary',
      borderClass: 'border-l-primary/60',
      bgClass: 'bg-gradient-to-r from-card to-primary/5',
      badgeClass: 'bg-primary/10 border-primary/30'
    },
    2: {
      title: 'Optional Accommodations',
      icon: 'Hotel',
      colorClass: 'amber-600',
      borderClass: 'border-l-amber-600/60',
      bgClass: 'bg-gradient-to-r from-card to-amber-50/50 dark:to-amber-950/20',
      badgeClass: 'bg-amber-100 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400'
    },
    3: {
      title: 'Alternative Accommodations',
      icon: 'Hotel',
      colorClass: 'violet-600',
      borderClass: 'border-l-violet-600/60',
      bgClass: 'bg-gradient-to-r from-card to-violet-50/50 dark:to-violet-950/20',
      badgeClass: 'bg-violet-100 dark:bg-violet-900/20 border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400'
    }
  };
  
  return configs[optionNumber as keyof typeof configs] || configs[1];
}
