
import React from 'react';
import { Booking } from '@/data/mockData';
import BookingCard from './BookingCard';

interface UpcomingBookingsProps {
  bookings: Booking[];
}

const UpcomingBookings: React.FC<UpcomingBookingsProps> = ({ bookings }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Bookings</h3>
        <a href="#" className="text-sm font-medium text-brand-blue hover:underline flex items-center">
          View All
          <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </a>
      </div>
      
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {bookings.map((booking) => (
          <BookingCard key={booking.id} booking={booking} />
        ))}
      </div>
    </div>
  );
};

export default UpcomingBookings;
