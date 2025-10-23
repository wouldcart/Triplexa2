import { ItineraryDay } from '@/components/proposal/DayByDayItineraryBuilder';
import { AccommodationStay } from '@/utils/accommodationCalculations';
import { calculateAccommodationOptionsPricing } from '@/utils/accommodationPricingUtils';
import { Query } from '@/types/query';
import { EnhancedMarkupData, AccommodationPricingOption, ServiceCost } from '@/types/enhancedMarkup';

export interface ProposalSummarySnapshot {
  baseCost: number;
  serviceCosts: ServiceCost;
  accommodationOptions: AccommodationPricingOption[];
  currency: string;
  lastCalculated: string;
}

/**
 * Compute a complete pricing snapshot from proposal days and accommodations
 * This creates data compatible with EnhancedMarkupData without changing existing models
 */
export function computeProposalSummarySnapshot(
  days: ItineraryDay[],
  accommodations: AccommodationStay[],
  query: Query
): ProposalSummarySnapshot {
  const adults = query?.paxDetails.adults || 1;
  const children = query?.paxDetails.children || 0;
  const totalPax = adults + children;

  // Calculate services costs (activities + transport)
  const serviceCosts = calculateServiceCosts(days, adults, children, totalPax);
  const baseCost = serviceCosts.sightseeing.total + serviceCosts.transport.totalCost + serviceCosts.dining.total;

  // Calculate accommodation options pricing
  const accommodationOptionsPricing = calculateAccommodationOptionsPricing(accommodations, query);
  
  // Convert to AccommodationPricingOption format
  const accommodationOptions: AccommodationPricingOption[] = ['standard', 'optional', 'alternative'].map((type, index) => {
    const optionNumber = (index + 1) as 1 | 2 | 3;
    const optionData = accommodationOptionsPricing.find(opt => opt.optionNumber === optionNumber);
    
    if (!optionData) {
      return {
        type: type as any,
        accommodations: [],
        serviceCosts,
        baseTotal: baseCost,
        markup: 0,
        finalTotal: baseCost,
        distribution: {
          method: 'separate' as const,
          adultPrice: baseCost / adults,
          childPrice: children > 0 ? baseCost / totalPax : 0,
          totalPrice: baseCost
        }
      };
    }

    const accommodationCost = optionData.totalCost;
    const totalBaseAmount = baseCost + accommodationCost;

    return {
      type: type as any,
      accommodations: optionData.accommodations.map(acc => ({
        id: `${acc.id}`,
        hotelName: acc.hotelName || 'Unnamed Hotel',
        roomType: acc.roomType || 'Standard Room',
        nights: acc.numberOfNights || 1,
        pricePerNight: acc.pricePerNightPerRoom || 0,
        numberOfRooms: acc.numberOfRooms || 1,
        totalPrice: acc.totalPrice || 0,
        type: type as any,
        dayId: acc.id || '',
        city: acc.city || ''
      })),
      serviceCosts: {
        ...serviceCosts,
        accommodation: {
          totalCost: accommodationCost,
          perPersonCost: accommodationCost / totalPax,
          totalRooms: optionData.accommodations.reduce((sum, acc) => sum + (acc.numberOfRooms || 1), 0),
          totalNights: optionData.accommodations.reduce((sum, acc) => sum + (acc.numberOfNights || 1), 0)
        }
      },
      baseTotal: totalBaseAmount,
      markup: 0,
      finalTotal: totalBaseAmount,
      distribution: {
        method: 'separate' as const,
        adultPrice: totalBaseAmount / adults,
        childPrice: children > 0 ? totalBaseAmount / totalPax : 0,
        totalPrice: totalBaseAmount
      }
    };
  }).filter(option => option.accommodations.length > 0 || option.baseTotal > 0);

  return {
    baseCost,
    serviceCosts,
    accommodationOptions,
    currency: query?.destination?.country || 'USA',
    lastCalculated: new Date().toISOString()
  };
}

/**
 * Calculate service costs from itinerary days
 */
function calculateServiceCosts(
  days: ItineraryDay[],
  adults: number,
  children: number,
  totalPax: number
): ServiceCost {
  let sightseeingTotal = 0;
  let transportTotal = 0;
  let diningTotal = 0;

  days.forEach((day) => {
    // Sightseeing calculation
    if (day.activities) {
      day.activities.forEach((activity) => {
        // For now, just use the base cost since the current schema doesn't have separate adult/child pricing
        sightseeingTotal += activity.cost || 0;
      });
    }

    // Transport calculation
    if (day.transport) {
      day.transport.forEach((transport) => {
        transportTotal += transport.price || 0;
      });
    }

    // Dining calculation - meals is just a boolean flag object, not itemized costs
    // For now, skip dining costs as they're not itemized in the current schema
  });

  return {
    sightseeing: { total: sightseeingTotal },
    transport: { 
      totalCost: transportTotal, 
      perPersonCost: transportTotal / totalPax 
    },
    dining: { total: diningTotal },
    accommodation: {
      totalCost: 0,
      perPersonCost: 0,
      totalRooms: 0,
      totalNights: 0
    }
  };
}

/**
 * Convert snapshot to EnhancedMarkupData format
 */
export function snapshotToEnhancedMarkupData(
  snapshot: ProposalSummarySnapshot,
  query: Query
): EnhancedMarkupData {
  return {
    options: snapshot.accommodationOptions,
    selectedOption: 'standard',
    markupSettings: {
      type: 'percentage',
      percentage: 15,
      slabs: [
        { minAmount: 0, maxAmount: 5000, percentage: 10 },
        { minAmount: 5001, maxAmount: 10000, percentage: 8 },
        { minAmount: 10001, maxAmount: Infinity, percentage: 7 }
      ]
    },
    adults: query?.paxDetails?.adults || 1,
    children: query?.paxDetails?.children || 0,
    totalPax: (query?.paxDetails?.adults || 1) + (query?.paxDetails?.children || 0)
  };
}

/**
 * Dispatch custom event for real-time sync
 */
export function dispatchProposalSummaryUpdate(queryId: string, snapshot: ProposalSummarySnapshot) {
  const event = new CustomEvent('proposal-summary-updated', {
    detail: { queryId, snapshot }
  });
  window.dispatchEvent(event);
}