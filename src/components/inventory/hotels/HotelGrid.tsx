
import React from 'react';
import { Link } from 'react-router-dom';
import { Hotel } from './types/hotel';
import { formatHotelPrice, getCurrencyByCountry } from './utils/currencyUtils';
import { Star, MapPin, Calendar, Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import HotelDeleteDialog from './dialogs/HotelDeleteDialog';

interface HotelGridProps {
  hotels: Hotel[];
  searchTerm: string;
}

const HotelGrid: React.FC<HotelGridProps> = ({ hotels, searchTerm }) => {
  const [hotelToDelete, setHotelToDelete] = React.useState<Hotel | null>(null);

  // Filter hotels by search term
  const filteredHotels = hotels.filter(hotel => 
    hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hotel.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hotel.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hotel.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDelete = (hotel: Hotel) => {
    setHotelToDelete(hotel);
  };

  const handleCloseDelete = () => {
    setHotelToDelete(null);
  };

  // Status badge color mapping
  const getStatusColor = (status: Hotel['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'inactive':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
      case 'draft':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  if (filteredHotels.length === 0) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-lg font-medium">No hotels found</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          {searchTerm
            ? `No hotels matching "${searchTerm}"`
            : "No hotels available with the current filters"}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {filteredHotels.map((hotel) => (
          <Card key={hotel.id} className="overflow-hidden hover:shadow-md transition-shadow touch-manipulation">
            <div className="h-40 sm:h-48 relative">
              <img 
                src={hotel.images[0]?.url} 
                alt={hotel.name} 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex flex-col gap-1 sm:gap-2">
                <Badge className={`text-xs ${getStatusColor(hotel.status)}`}>
                  {hotel.status.charAt(0).toUpperCase() + hotel.status.slice(1)}
                </Badge>
              </div>
              <div className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-white dark:bg-gray-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md flex items-center">
                <div className="flex">
                  {Array.from({ length: typeof hotel.starRating === 'number' ? hotel.starRating : 0 }).map((_, index) => (
                    <Star key={index} className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
              </div>
            </div>
            
            <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-semibold text-sm sm:text-lg text-gray-900 dark:text-white line-clamp-2 flex-1">{hotel.name}</h3>
                <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                  {hotel.currencySymbol || getCurrencyByCountry(hotel.country).symbol}
                  {formatHotelPrice(
                    Math.min(...hotel.roomTypes.map(room => room.adultPrice)),
                    hotel.currency || getCurrencyByCountry(hotel.country).code
                  )}
                  <span className="text-xs text-gray-500 dark:text-gray-400"> / night</span>
                </span>
              </div>
              <div className="flex items-center mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                <span className="truncate">{hotel.city}, {hotel.country}</span>
              </div>
            </CardHeader>
            
            <CardContent className="py-2 px-3 sm:px-6">
              <div className="mb-2 sm:mb-3">
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Room Types:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {hotel.roomTypes.slice(0, 2).map((roomType, idx) => (
                    <span 
                      key={idx}
                      className="inline-block bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md"
                    >
                      {roomType.name}
                    </span>
                  ))}
                  {hotel.roomTypes.length > 2 && (
                    <span className="inline-block bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md">
                      +{hotel.roomTypes.length - 2} more
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                <span className="truncate">Check-in: {hotel.checkInTime} • Check-out: {hotel.checkOutTime}</span>
              </div>
            </CardContent>
            
            <CardFooter className="border-t border-gray-100 dark:border-gray-700 pt-3 sm:pt-4 gap-1 sm:gap-2 flex px-3 sm:px-6 pb-3 sm:pb-6">
              <Button asChild variant="outline" size="sm" className="flex-1 min-h-[36px] text-xs sm:text-sm">
                <Link to={`/inventory/hotels/${hotel.id}`}>View Details</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="px-2 sm:px-3 min-h-[36px] min-w-[36px]">
                <Link to={`/inventory/hotels/${hotel.id}/edit`}><Edit className="h-3 w-3 sm:h-4 sm:w-4" /></Link>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="px-2 sm:px-3 min-h-[36px] min-w-[36px] text-red-500 dark:text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800/40"
                onClick={() => handleOpenDelete(hotel)}
              >
                <Trash className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {hotelToDelete && (
        <HotelDeleteDialog
          hotel={hotelToDelete}
          open={!!hotelToDelete}
          onClose={handleCloseDelete}
        />
      )}
    </>
  );
};

export default HotelGrid;
