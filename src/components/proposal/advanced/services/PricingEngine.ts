
import { AdvancedProposalModule } from '@/types/advancedProposal';
import { Query } from '@/types/query';

interface PricingOptions {
  enableSeasonalPricing?: boolean;
  enableGroupDiscounts?: boolean;
  enableAdvanceBooking?: boolean;
  enableDemandPricing?: boolean;
}

export class AdvancedPricingEngine {
  private static instance: AdvancedPricingEngine;

  public static getInstance(): AdvancedPricingEngine {
    if (!AdvancedPricingEngine.instance) {
      AdvancedPricingEngine.instance = new AdvancedPricingEngine();
    }
    return AdvancedPricingEngine.instance;
  }

  calculateDynamicPricing(module: any, query: Query, options: PricingOptions = {}): number {
    let finalPrice = module.pricing?.basePrice || module.pricing?.finalPrice || 0;
    
    if (options.enableGroupDiscounts) {
      const totalPax = query.paxDetails.adults + query.paxDetails.children;
      if (totalPax >= 6) {
        finalPrice *= 0.9; // 10% group discount
      } else if (totalPax >= 4) {
        finalPrice *= 0.95; // 5% group discount
      }
    }

    if (options.enableSeasonalPricing) {
      const travelDate = new Date(query.travelDates.from);
      const month = travelDate.getMonth();
      
      // Peak season months (Dec, Jan, Feb)
      if ([11, 0, 1].includes(month)) {
        finalPrice *= 1.2; // 20% peak season markup
      }
      // Low season months (May, Jun, Sep, Oct)
      else if ([4, 5, 8, 9].includes(month)) {
        finalPrice *= 0.85; // 15% low season discount
      }
    }

    if (options.enableAdvanceBooking) {
      const bookingDate = new Date();
      const travelDate = new Date(query.travelDates.from);
      const daysInAdvance = Math.floor((travelDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysInAdvance >= 60) {
        finalPrice *= 0.9; // 10% early bird discount
      } else if (daysInAdvance >= 30) {
        finalPrice *= 0.95; // 5% advance booking discount
      }
    }

    return Math.round(finalPrice * 100) / 100;
  }

  calculateBundleDiscounts(modules: AdvancedProposalModule[]): any[] {
    const discounts = [];
    
    // Transport + Hotel bundle
    const hasTransport = modules.some(m => m.type === 'transport');
    const hasHotel = modules.some(m => m.type === 'hotel');
    
    if (hasTransport && hasHotel) {
      discounts.push({
        type: 'percentage',
        value: 5,
        description: 'Transport + Accommodation Bundle Discount'
      });
    }

    // Full service bundle (transport + hotel + sightseeing + restaurant)
    const hasAllServices = ['transport', 'hotel', 'sightseeing', 'restaurant'].every(type =>
      modules.some(m => m.type === type)
    );
    
    if (hasAllServices) {
      discounts.push({
        type: 'percentage',
        value: 10,
        description: 'Complete Package Bundle Discount'
      });
    }

    return discounts;
  }
}
