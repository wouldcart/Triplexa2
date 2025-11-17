
import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { ItineraryProvider } from '@/contexts/ItineraryContext';
import { AIRouterProvider } from '@/contexts/AIRouterContext';
import CentralItineraryBuilder from '@/components/itinerary/CentralItineraryBuilder';

const ItineraryBuilder: React.FC = () => {
  return (
    <ItineraryProvider>
      <AIRouterProvider>
        <PageLayout>
          <CentralItineraryBuilder context="query" />
        </PageLayout>
      </AIRouterProvider>
    </ItineraryProvider>
  );
};

export default ItineraryBuilder;
