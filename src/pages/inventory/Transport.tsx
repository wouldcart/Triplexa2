
import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import TransportTabs from './transport/components/TransportTabs';

const TransportPage: React.FC = () => {
  return (
    <PageLayout>
      <div className="container mx-auto py-4 px-2 sm:px-6">
        <TransportTabs />
      </div>
    </PageLayout>
  );
};

export default TransportPage;
