import React from 'react';
import { Outlet } from 'react-router-dom';
import { SalesNavigation } from '@/components/sales/SalesNavigation';

const SalesLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-background">
      <SalesNavigation />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default SalesLayout;