import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import HotelCrudTest from '@/components/inventory/hotels/test/HotelCrudTest';

const TestHotelCrud: React.FC = () => {
  return (
    <PageLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Hotel CRUD Test</h1>
        <p className="text-gray-600 mb-6">
          This page allows you to test the hotel CRUD operations with Supabase integration.
        </p>
        <HotelCrudTest />
      </div>
    </PageLayout>
  );
};

export default TestHotelCrud;