
import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import TransportRoutesTab from './components/routes/TransportRoutesTab';

const TransportRoutesPage: React.FC = () => {
  return (
    <PageLayout>
      <div className="container mx-auto py-4 px-2 sm:px-6">
        <h1 className="text-2xl font-bold mb-6">Transport Routes</h1>
        <TransportRoutesTab />
      </div>
    </PageLayout>
  );
};

export default TransportRoutesPage;
