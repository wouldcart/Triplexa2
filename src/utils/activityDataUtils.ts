import { ItineraryDay } from '@/components/proposal/DayByDayItineraryBuilder';

export interface EnhancedActivityData {
  id: string;
  name: string;
  description?: string;
  type: 'sightseeing' | 'transport' | 'meal' | 'accommodation' | 'activity';
  cost: number;
  duration?: string;
  
  // Enhanced data fields
  category?: string;
  effectivePax?: number;
  startTime?: string;
  endTime?: string;
  location?: string;
  
  // Sightseeing specific data
  selectedOptions?: string[];
  packageOptions?: Array<{
    id: string;
    name: string;
    price: number;
    included: boolean;
  }>;
  pricingOptions?: Array<{
    id: string;
    name: string;
    type: string;
    adultPrice: number;
    childPrice: number;
    isEnabled: boolean;
  }>;
  transferOptions?: Array<{
    id: string;
    type: string;
    vehicleType: string;
    price: number;
    isEnabled: boolean;
  }>;
  
  // Transport specific data
  transportType?: string;
  transportLabel?: string;
  vehicleType?: string;
  from?: string;
  to?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  seatingCapacity?: number;
  vehicleCount?: number;
  routeCode?: string;
  
  // Pricing breakdown
  priceBreakdown?: {
    basePrice: number;
    taxes?: number;
    fees?: number;
    discount?: number;
    finalPrice: number;
  };
  
  // Data integrity fields
  isDataComplete: boolean;
  validationErrors?: string[];
  lastUpdated?: string;
  dataSource?: 'manual' | 'sightseeing' | 'transport' | 'accommodation';
}

/**
 * Enhanced activity data preservation during save operations
 */
export const enhanceActivityData = (activity: any): EnhancedActivityData => {
  const baseActivity: EnhancedActivityData = {
    id: activity.id?.toString() || `activity_${Date.now()}`,
    name: activity.name || 'Unnamed Activity',
    description: activity.description || '',
    type: activity.type || 'activity',
    cost: activity.cost || activity.price || 0,
    duration: activity.duration || '2 hours',
    isDataComplete: false,
    lastUpdated: new Date().toISOString()
  };

  // Preserve sightseeing-specific data
  if (activity.selectedOptions || activity.packageOptions || activity.pricingOptions) {
    baseActivity.selectedOptions = activity.selectedOptions || [];
    baseActivity.packageOptions = activity.packageOptions || [];
    baseActivity.pricingOptions = activity.pricingOptions || [];
    baseActivity.transferOptions = activity.transferOptions || [];
    baseActivity.dataSource = 'sightseeing';
  }

  // Preserve transport-specific data
  if (activity.transportType || activity.vehicleType || activity.from || activity.to) {
    baseActivity.transportType = activity.transportType;
    baseActivity.transportLabel = activity.transportLabel;
    baseActivity.vehicleType = activity.vehicleType;
    baseActivity.from = activity.from;
    baseActivity.to = activity.to;
    baseActivity.pickupLocation = activity.pickupLocation;
    baseActivity.dropoffLocation = activity.dropoffLocation;
    baseActivity.seatingCapacity = activity.seatingCapacity;
    baseActivity.vehicleCount = activity.vehicleCount;
    baseActivity.routeCode = activity.routeCode;
    baseActivity.dataSource = 'transport';
  }

  // Preserve enhanced fields
  baseActivity.category = activity.category;
  baseActivity.effectivePax = activity.effectivePax;
  baseActivity.startTime = activity.startTime;
  baseActivity.endTime = activity.endTime;
  baseActivity.location = activity.location;

  // Create price breakdown
  baseActivity.priceBreakdown = {
    basePrice: baseActivity.cost,
    finalPrice: baseActivity.cost,
    ...activity.priceBreakdown
  };

  // Validate data completeness
  baseActivity.isDataComplete = validateActivityDataCompleteness(baseActivity);
  baseActivity.validationErrors = getActivityValidationErrors(baseActivity);

  return baseActivity;
};

/**
 * Validate if activity data is complete
 */
export const validateActivityDataCompleteness = (activity: EnhancedActivityData): boolean => {
  // Basic required fields
  if (!activity.name || !activity.type || activity.cost <= 0) {
    return false;
  }

  // Type-specific validation
  switch (activity.type) {
    case 'sightseeing':
      return !!(activity.duration && (activity.selectedOptions?.length || activity.packageOptions?.length));
    
    case 'transport':
      return !!(activity.from && activity.to && activity.vehicleType);
    
    case 'accommodation':
      return !!(activity.location);
    
    default:
      return true;
  }
};

/**
 * Get validation errors for an activity
 */
export const getActivityValidationErrors = (activity: EnhancedActivityData): string[] => {
  const errors: string[] = [];

  if (!activity.name.trim()) {
    errors.push('Activity name is required');
  }

  if (activity.cost <= 0) {
    errors.push('Activity must have a valid price');
  }

  // Type-specific validation
  switch (activity.type) {
    case 'sightseeing':
      if (!activity.duration) {
        errors.push('Duration is required for sightseeing activities');
      }
      if (!activity.selectedOptions?.length && !activity.packageOptions?.length) {
        errors.push('Sightseeing options or packages must be selected');
      }
      break;
    
    case 'transport':
      if (!activity.from) errors.push('Origin location is required');
      if (!activity.to) errors.push('Destination location is required');
      if (!activity.vehicleType) errors.push('Vehicle type is required');
      break;
  }

  return errors;
};

/**
 * Calculate activity statistics for validation
 */
export const calculateActivityStats = (days: any[]) => {
  const allActivities = days.flatMap(day => day.activities.map(enhanceActivityData));
  
  const stats = {
    total: allActivities.length,
    complete: allActivities.filter(a => a.isDataComplete).length,
    incomplete: allActivities.filter(a => !a.isDataComplete).length,
    byType: {
      sightseeing: allActivities.filter(a => a.type === 'sightseeing').length,
      transport: allActivities.filter(a => a.type === 'transport').length,
      accommodation: allActivities.filter(a => a.type === 'accommodation').length,
      meal: allActivities.filter(a => a.type === 'meal').length,
      activity: allActivities.filter(a => a.type === 'activity').length
    },
    byDataSource: {
      sightseeing: allActivities.filter(a => a.dataSource === 'sightseeing').length,
      transport: allActivities.filter(a => a.dataSource === 'transport').length,
      manual: allActivities.filter(a => a.dataSource === 'manual').length
    },
    totalCost: allActivities.reduce((sum, a) => sum + a.cost, 0),
    incompleteActivities: allActivities.filter(a => !a.isDataComplete)
  };

  return stats;
};

/**
 * Enhanced activity storage with validation
 */
export const saveActivityDataWithValidation = (queryId: string, days: any[]): void => {
  try {
    // Enhance all activity data
    const enhancedDays = days.map(day => ({
      ...day,
      activities: day.activities.map(enhanceActivityData)
    }));

    // Calculate statistics
    const stats = calculateActivityStats(enhancedDays);
    
    // Save enhanced data
    const dataToSave = {
      queryId,
      days: enhancedDays,
      activityStats: stats,
      savedAt: new Date().toISOString(),
      version: Date.now()
    };

    localStorage.setItem(`proposal_draft_${queryId}`, JSON.stringify(dataToSave));
    localStorage.setItem(`activity_data_${queryId}`, JSON.stringify({
      stats,
      incompleteActivities: stats.incompleteActivities,
      validationSummary: {
        totalActivities: stats.total,
        completeActivities: stats.complete,
        dataQualityScore: Math.round((stats.complete / stats.total) * 100) || 0
      }
    }));

    console.log('Enhanced activity data saved:', {
      totalActivities: stats.total,
      completeActivities: stats.complete,
      dataQualityScore: Math.round((stats.complete / stats.total) * 100) || 0
    });

  } catch (error) {
    console.error('Error saving enhanced activity data:', error);
  }
};

/**
 * Load enhanced activity statistics
 */
export const loadActivityStats = (queryId: string) => {
  try {
    const saved = localStorage.getItem(`activity_data_${queryId}`);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Error loading activity stats:', error);
  }
  return null;
};