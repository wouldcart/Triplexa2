
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash, Star, ChevronDown } from 'lucide-react';
import { Hotel } from '../types/hotel';
import { formatHotelPrice, getCurrencyByCountry, formatCurrencyWithSymbol } from '../utils/currencyUtils';
import CurrencyIcon from './CurrencyIcon';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface HotelTableRowProps {
  hotel: Hotel & { displayId?: string };
  onDeleteClick: (hotel: Hotel) => void;
}

const HotelTableRow: React.FC<HotelTableRowProps> = ({ hotel, onDeleteClick }) => {
  const [showPricing, setShowPricing] = useState(false);

  // Status badge color mapping
  const getStatusColor = (status: Hotel['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-700';
      case 'draft':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-700';
    }
  };

  // Format price with the correct currency
  const formatPrice = (price: number, hotel: Hotel) => {
    const currencyCode = hotel.currency || getCurrencyByCountry(hotel.country).code;
    return formatHotelPrice(price, currencyCode);
  };

  // Get currency information
  const getCurrency = (hotel: Hotel) => {
    return hotel.currency || getCurrencyByCountry(hotel.country).code;
  };

  // Get currency symbol for display (prefer value from hotels table)
  const getCurrencySymbol = (hotel: Hotel) => {
    // Prefer symbol stored on the hotel record (supports both camel and snake case)
    const symbolFromHotel = hotel.currencySymbol || (hotel as any).currency_symbol;
    if (symbolFromHotel) return symbolFromHotel;

    // Country-specific override for UAE/Dubai
    if (hotel.country === "United Arab Emirates" || hotel.country === "UAE") {
      return "د.إ";
    }

    // Fallback to country-derived symbol
    return getCurrencyByCountry(hotel.country).symbol;
  };

  return (
    <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700">
      <TableCell className="font-mono text-sm text-gray-500 dark:text-gray-400 font-medium">
        #{hotel.displayId || '001'}
      </TableCell>
      <TableCell className="font-medium">
        <Link 
          to={`/inventory/hotels/${hotel.id}`}
          className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900 dark:text-gray-100">{hotel.name}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              View Details →
            </span>
          </div>
        </Link>
      </TableCell>
      <TableCell className="text-gray-700 dark:text-gray-300">{hotel.country}</TableCell>
      <TableCell className="text-gray-700 dark:text-gray-300">{hotel.city}</TableCell>
      <TableCell className="text-gray-600 dark:text-gray-400">{hotel.location}</TableCell>
      <TableCell className="text-center">
        <div className="inline-flex">
          {Array.from({ length: typeof hotel.starRating === 'number' ? hotel.starRating : 0 }).map((_, index) => (
            <Star key={index} className="h-4 w-4 text-yellow-400 fill-current" />
          ))}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {hotel.roomTypes.slice(0, 2).map((roomType, idx) => (
            <Badge 
              key={idx}
              variant="outline"
              className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
            >
              {roomType.name}
            </Badge>
          ))}
          {hotel.roomTypes.length > 2 && (
            <Badge 
              variant="outline" 
              className="text-xs bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600"
            >
              +{hotel.roomTypes.length - 2} more
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 flex items-center justify-end gap-1 w-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <div className="flex items-center">
                <span className="mr-1 text-sm font-medium">{getCurrencySymbol(hotel)}</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatPrice(
                    Math.min(...hotel.roomTypes.map(room => room.adultPrice)),
                    hotel
                  )}
                </span>
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-72" align="end">
            <div className="p-3">
              <h4 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">Room Type Pricing</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {hotel.roomTypes.map((roomType, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{roomType.name}</span>
                      <Badge variant="outline" className={getStatusColor(roomType.status)}>
                        {roomType.status}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Adult Price:</span>
                        <div className="flex items-center font-medium">
                          <span className="mr-1 text-sm">{getCurrencySymbol(hotel)}</span>
                          <span>{formatPrice(roomType.adultPrice, hotel)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Child Price:</span>
                        <div className="flex items-center font-medium">
                          <span className="mr-1 text-sm">{getCurrencySymbol(hotel)}</span>
                          <span>{formatPrice(roomType.childPrice, hotel)}</span>
                        </div>
                      </div>
                      {roomType.extraBedPrice > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Extra Bed:</span>
                          <div className="flex items-center font-medium">
                            <span className="mr-1 text-sm">{getCurrencySymbol(hotel)}</span>
                            <span>{formatPrice(roomType.extraBedPrice, hotel)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </TableCell>
      <TableCell className="text-center">
        <Badge className={getStatusColor(hotel.status)}>
          {hotel.status.charAt(0).toUpperCase() + hotel.status.slice(1)}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-2">
          <Button asChild variant="outline" size="sm" className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <Link to={`/inventory/hotels/${hotel.id}/edit`}>
              <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </Link>
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="h-8 w-8 p-0 text-red-500 dark:text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800/40"
            onClick={() => onDeleteClick(hotel)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default HotelTableRow;
