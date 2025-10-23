import { useMemo } from 'react';
import { Query } from '@/types/query';
import { ItineraryDay } from '@/components/proposal/DayByDayItineraryBuilder';

interface ValidationRule {
  id: string;
  label: string;
  status: 'valid' | 'warning' | 'invalid';
  message: string;
  skippable?: boolean;
  skipped?: boolean;
}

interface UseProposalValidationProps {
  query: Query | null;
  days: ItineraryDay[];
  totalCost: number;
  skippedRules?: string[];
  proposalManagementData?: any;
}

export const useProposalValidation = ({
  query,
  days,
  totalCost,
  skippedRules = [],
  proposalManagementData
}: UseProposalValidationProps) => {
  const validationRules = useMemo((): ValidationRule[] => {
    const rules: ValidationRule[] = [];

    // Early return if query is null
    if (!query) {
      rules.push({
        id: 'no-query',
        label: 'Query Data',
        status: 'invalid',
        message: 'Query data is not available'
      });
      return rules;
    }

    // Check if itinerary has days
    if (days.length === 0) {
      rules.push({
        id: 'no-days',
        label: 'Itinerary Days',
        status: 'invalid',
        message: 'At least one day must be added to the itinerary'
      });
    } else {
      rules.push({
        id: 'has-days',
        label: 'Itinerary Days',
        status: 'valid',
        message: `${days.length} days configured`
      });
    }

    // Check if days have activities
    const daysWithoutActivities = days.filter(day => day.activities.length === 0);
    if (daysWithoutActivities.length > 0) {
      rules.push({
        id: 'empty-days',
        label: 'Day Activities',
        status: 'warning',
        message: `${daysWithoutActivities.length} day(s) have no activities`
      });
    } else if (days.length > 0) {
      rules.push({
        id: 'all-days-have-activities',
        label: 'Day Activities',
        status: 'valid',
        message: 'All days have activities configured'
      });
    }

    // Check total cost
    if (totalCost <= 0) {
      rules.push({
        id: 'no-cost',
        label: 'Proposal Pricing',
        status: 'warning',
        message: 'Total cost is zero - pricing may need review'
      });
    } else {
      rules.push({
        id: 'has-cost',
        label: 'Proposal Pricing',
        status: 'valid',
        message: `Total cost: $${totalCost.toFixed(2)}`
      });
    }

    // Check trip duration match
    const expectedDays = query.tripDuration?.days || 0;
    if (expectedDays > 0 && days.length !== expectedDays) {
      rules.push({
        id: 'duration-mismatch',
        label: 'Trip Duration',
        status: 'warning',
        message: `Itinerary has ${days.length} days but query requested ${expectedDays} days`
      });
    } else if (expectedDays > 0) {
      rules.push({
        id: 'duration-match',
        label: 'Trip Duration',
        status: 'valid',
        message: `Trip duration matches query (${expectedDays} days)`
      });
    }

    // Check for accommodations (skippable)
    const accommodationActivities = days.flatMap(day => 
      day.activities.filter(activity => activity.type === 'accommodation')
    );
    
    if (skippedRules.includes('no-accommodation')) {
      rules.push({
        id: 'no-accommodation',
        label: 'Accommodations',
        status: 'valid',
        message: 'Accommodation requirement skipped',
        skippable: true,
        skipped: true
      });
    } else if (accommodationActivities.length === 0) {
      rules.push({
        id: 'no-accommodation',
        label: 'Accommodations',
        status: 'warning',
        message: 'No accommodations found in itinerary (this can be skipped)',
        skippable: true
      });
    } else {
      rules.push({
        id: 'has-accommodation',
        label: 'Accommodations',
        status: 'valid',
        message: `${accommodationActivities.length} accommodation(s) configured`
      });
    }

    // Enhanced activity validation with completeness check
    const allActivities = days.flatMap(day => day.activities);
    const sightseeingActivities = allActivities.filter(activity => activity.type === 'sightseeing');
    const transportActivities = allActivities.filter(activity => activity.type === 'transport');
    
    // Check activity data completeness
    const incompleteActivities = allActivities.filter(activity => {
      // Check if activity has essential data based on type
      switch (activity.type) {
        case 'sightseeing':
          return !activity.selectedOptions?.length && !activity.packageOptions?.length;
        case 'transport':
          return !(activity as any).from || !(activity as any).to || !(activity as any).vehicleType;
        default:
          return false;
      }
    });
    
    if (incompleteActivities.length > 0) {
      rules.push({
        id: 'incomplete-activities',
        label: 'Activity Data Completeness',
        status: 'warning',
        message: `${incompleteActivities.length} activity(ies) have incomplete configuration data`
      });
    } else if (allActivities.length > 0) {
      rules.push({
        id: 'complete-activities',
        label: 'Activity Data Completeness',
        status: 'valid',
        message: 'All activities have complete configuration data'
      });
    }

    // Sightseeing activities validation
    if (sightseeingActivities.length === 0) {
      rules.push({
        id: 'no-sightseeing',
        label: 'Sightseeing Activities',
        status: 'warning',
        message: 'No sightseeing activities found'
      });
    } else {
      const completeSightseeing = sightseeingActivities.filter(activity => 
        activity.selectedOptions?.length || activity.packageOptions?.length
      );
      rules.push({
        id: 'has-sightseeing',
        label: 'Sightseeing Activities',
        status: completeSightseeing.length === sightseeingActivities.length ? 'valid' : 'warning',
        message: `${sightseeingActivities.length} sightseeing activity(ies) - ${completeSightseeing.length} with complete data`
      });
    }
    
    // Transport activities validation
    if (transportActivities.length === 0) {
      rules.push({
        id: 'no-transport',
        label: 'Transportation',
        status: 'warning',
        message: 'No transportation activities found'
      });
    } else {
      const completeTransport = transportActivities.filter(activity => 
        (activity as any).from && (activity as any).to && (activity as any).vehicleType
      );
      rules.push({
        id: 'has-transport',
        label: 'Transportation',
        status: completeTransport.length === transportActivities.length ? 'valid' : 'warning',
        message: `${transportActivities.length} transport activity(ies) - ${completeTransport.length} with complete data`
      });
    }

    // Check proposal management data completeness
    if (proposalManagementData) {
      // Check terms & conditions
      const hasTerms = proposalManagementData.termsConditions && 
        (proposalManagementData.termsConditions.inclusions?.length > 0 ||
         proposalManagementData.termsConditions.exclusions?.length > 0 ||
         proposalManagementData.termsConditions.paymentTerms ||
         proposalManagementData.termsConditions.cancellationPolicy);
      
      if (hasTerms) {
        rules.push({
          id: 'has-terms',
          label: 'Terms & Conditions',
          status: 'valid',
          message: 'Terms and conditions have been configured'
        });
      } else {
        rules.push({
          id: 'no-terms',
          label: 'Terms & Conditions',
          status: 'warning',
          message: 'Terms and conditions not configured in Proposal Management'
        });
      }

      // Check email configuration
      const hasEmailConfig = proposalManagementData.emailData &&
        (proposalManagementData.emailData.to || proposalManagementData.emailData.subject);
      
      if (hasEmailConfig) {
        rules.push({
          id: 'has-email-config',
          label: 'Email Configuration',
          status: 'valid',
          message: 'Email settings configured for proposal sharing'
        });
      } else {
        rules.push({
          id: 'no-email-config',
          label: 'Email Configuration',
          status: 'warning',
          message: 'Email settings not configured in Proposal Management'
        });
      }

      // Check pricing configuration
      const hasPricingConfig = proposalManagementData.pricingConfig &&
        (proposalManagementData.pricingConfig.mode || 
         proposalManagementData.pricingConfig.adultMarkup ||
         proposalManagementData.pricingConfig.childMarkup);
      
      if (hasPricingConfig) {
        rules.push({
          id: 'has-pricing-config',
          label: 'Pricing Configuration',
          status: 'valid',
          message: 'Pricing and markup settings configured'
        });
      } else {
        rules.push({
          id: 'no-pricing-config',
          label: 'Pricing Configuration',
          status: 'warning',
          message: 'Pricing and markup not configured in Proposal Management'
        });
      }
    } else {
      rules.push({
        id: 'no-proposal-management',
        label: 'Proposal Management',
        status: 'warning',
        message: 'No proposal management data found - configure in Proposal Management tab'
      });
    }

    return rules;
  }, [query, days, totalCost, skippedRules, proposalManagementData]);

  const hasErrors = validationRules.some(rule => rule.status === 'invalid');
  const hasWarnings = validationRules.some(rule => rule.status === 'warning');
  const isValid = !hasErrors;

  return {
    validationRules,
    hasErrors,
    hasWarnings,
    isValid
  };
};