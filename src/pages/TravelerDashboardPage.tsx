import React from 'react';
import TravelerLayout from '@/components/traveler/TravelerLayout';
import TravelerDashboard from '@/components/traveler/TravelerDashboard';

const TravelerDashboardPage: React.FC = () => {
  return (
    <TravelerLayout>
      <TravelerDashboard />
    </TravelerLayout>
  );
};

export default TravelerDashboardPage;