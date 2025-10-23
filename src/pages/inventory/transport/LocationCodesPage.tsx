
import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import LocationCodesManager from './components/locationCodes/LocationCodesManager';

const LocationCodesPage: React.FC = () => {
  return (
    <PageLayout>
      <div className="container mx-auto py-4 px-2 sm:px-6">
        <h1 className="text-2xl font-bold mb-6">Location Codes</h1>
        <LocationCodesManager />
      </div>
    </PageLayout>
  );
};

export default LocationCodesPage;
