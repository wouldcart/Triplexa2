
import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import TransportTypesTab from './components/types/TransportTypesTab';

const TransportTypesPage: React.FC = () => {
  return (
    <PageLayout>
      <div className="container mx-auto py-4 px-2 sm:px-6">
        <h1 className="text-2xl font-bold mb-6">Transport Types</h1>
        <TransportTypesTab />
      </div>
    </PageLayout>
  );
};

export default TransportTypesPage;
