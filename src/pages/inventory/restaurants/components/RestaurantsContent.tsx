
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Utensils, Plus } from 'lucide-react';
import { Restaurant } from '../types/restaurantTypes';
import RestaurantCard from './RestaurantCard';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface RestaurantsContentProps {
  filteredRestaurants: Restaurant[];
  currentRestaurants: Restaurant[];
  currentPage: number;
  totalPages: number;
  onViewDetails: (restaurant: Restaurant) => void;
  onEdit: (restaurant: Restaurant) => void;
  onDelete: (restaurant: Restaurant) => void;
  onAddRestaurant: () => void;
  onNextPage: () => void;
  onPrevPage: () => void;
}

const RestaurantsContent: React.FC<RestaurantsContentProps> = ({
  filteredRestaurants,
  currentRestaurants,
  currentPage,
  totalPages,
  onViewDetails,
  onEdit,
  onDelete,
  onAddRestaurant,
  onNextPage,
  onPrevPage
}) => {
  // Results count for display
  const indexOfFirstRestaurant = filteredRestaurants.length === 0 ? 0 : (currentPage - 1) * 6 + 1;
  const indexOfLastRestaurant = Math.min(currentPage * 6, filteredRestaurants.length);

  // Calculate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total pages is less than max pages to show
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);
      
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust start and end page based on current page
      if (currentPage <= 2) {
        endPage = 3;
      } else if (currentPage >= totalPages - 1) {
        startPage = totalPages - 2;
      }
      
      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pageNumbers.push('ellipsis1');
      }
      
      // Add pages around current page
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push('ellipsis2');
      }
      
      // Always show last page
      if (totalPages > 1) {
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };
  
  const goToPage = (page: number) => {
    // Since we don't have direct access to goToPage from props,
    // we'll use onNextPage and onPrevPage to navigate
    if (page > currentPage) {
      // Need to go forward
      const steps = page - currentPage;
      for (let i = 0; i < steps; i++) {
        onNextPage();
      }
    } else if (page < currentPage) {
      // Need to go backward
      const steps = currentPage - page;
      for (let i = 0; i < steps; i++) {
        onPrevPage();
      }
    }
  };
  
  return (
    <>
      {/* Results count */}
      <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Showing {filteredRestaurants.length === 0 ? 0 : indexOfFirstRestaurant}-
        {indexOfLastRestaurant} of {filteredRestaurants.length} restaurants
      </div>

      {/* Restaurant Cards Grid */}
      {filteredRestaurants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {currentRestaurants.map((restaurant) => (
            <RestaurantCard 
              key={restaurant.id}
              restaurant={restaurant}
              onViewDetails={() => onViewDetails(restaurant)}
              onEdit={() => onEdit(restaurant)}
              onDelete={() => onDelete(restaurant)}
            />
          ))}
        </div>
      ) : (
        <Card className="mb-6">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Utensils className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No restaurants found</h3>
            <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
              There are no restaurants matching your search criteria. Try adjusting your filters or add a new restaurant.
            </p>
            <Button 
              className="mt-4 bg-brand-blue hover:bg-brand-blue/90"
              onClick={onAddRestaurant}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Restaurant
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Enhanced Pagination */}
      {filteredRestaurants.length > 0 && totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={onPrevPage} 
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {getPageNumbers().map((page, index) => (
                page === 'ellipsis1' || page === 'ellipsis2' ? (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={`page-${page}`}>
                    <PaginationLink
                      onClick={() => typeof page === 'number' && goToPage(page)}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={onNextPage} 
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </>
  );
};

export default RestaurantsContent;
