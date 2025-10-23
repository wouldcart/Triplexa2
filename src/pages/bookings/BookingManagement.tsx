
import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { EnhancedBookingsTable } from '@/components/bookings/EnhancedBookingsTable';

const BookingManagement: React.FC = () => {
  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Booking Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage confirmed bookings, send confirmations, and track booking status with query references.
          </p>
        </div>
        
        <EnhancedBookingsTable />
      </div>
    </PageLayout>
  );
};

export default BookingManagement;
