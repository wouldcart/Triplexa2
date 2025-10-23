
import React from 'react';
import { cn } from '@/lib/utils';
import { Booking } from '@/data/mockData';
import { Calendar, MapPin, Users } from 'lucide-react';

interface BookingCardProps {
  booking: Booking;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking }) => {
  const { id, title, location, dateRange, travelers, status, amount, thumbnailUrl } = booking;

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
      <div className="relative h-32">
        <img 
          src={thumbnailUrl} 
          alt={title} 
          className="w-full h-full object-cover"
        />
        <div className={cn(
          "absolute top-3 right-3 px-3 py-1 text-xs font-medium rounded-full",
          status === 'Confirmed' ? "bg-green-500 text-white" : "bg-amber-500 text-white"
        )}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      </div>
      
      <div className="p-4 flex-1">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-gray-900 dark:text-white">{id} - {title}</h3>
        </div>
        
        <div className="mt-3 space-y-2">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>{location}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>{dateRange}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <Users className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>{travelers}</span>
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-100 dark:border-gray-700 p-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">Total Amount</span>
          <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(amount)}</span>
        </div>
      </div>
    </div>
  );
};

export default BookingCard;
