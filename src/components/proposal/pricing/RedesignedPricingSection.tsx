
import React from 'react';
import { AdvancedPricingModule } from './AdvancedPricingModule';
import { EnhancedMarkupModule } from './EnhancedMarkupModule';
import { Query } from '@/types/query';

interface RedesignedPricingSectionProps {
  proposalData?: any;
  query?: Query;
  team?: any[];
  onPricingUpdate?: (pricing: any) => void;
  useEnhancedMarkup?: boolean;
}

export const RedesignedPricingSection: React.FC<RedesignedPricingSectionProps> = ({
  proposalData,
  query,
  team,
  onPricingUpdate,
  useEnhancedMarkup = true
}) => {
  // Always use the new single-page design
  return (
    <div className="w-full">
      <AdvancedPricingModule
        proposalData={proposalData}
        query={query}
        team={team}
        onPricingUpdate={onPricingUpdate}
        useEnhancedMarkup={useEnhancedMarkup}
      />
    </div>
  );
};

export default RedesignedPricingSection;
