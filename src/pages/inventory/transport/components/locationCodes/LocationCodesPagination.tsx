
import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface LocationCodesPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  indexOfFirstItem: number;
  indexOfLastItem: number;
}

const LocationCodesPagination: React.FC<LocationCodesPaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  indexOfFirstItem,
  indexOfLastItem
}) => {
  // Available pagination options
  const paginationOptions = [5, 10, 20, 50, 100];

  // Enhanced pagination logic for better UX
  const getPageNumbers = () => {
    const pageNumbers = [];
    
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
      return pageNumbers;
    }
    
    // Always show first page
    pageNumbers.push(1);
    
    if (currentPage > 3) {
      pageNumbers.push('...');
    }
    
    // Calculate neighborhood around current page
    const startNeighborhood = Math.max(2, currentPage - 1);
    const endNeighborhood = Math.min(totalPages - 1, currentPage + 1);
    
    // Add pages around current page
    for (let i = startNeighborhood; i <= endNeighborhood; i++) {
      if (!pageNumbers.includes(i) && i > 1 && i < totalPages) {
        pageNumbers.push(i);
      }
    }
    
    // Add ellipsis before last page if needed
    if (currentPage < totalPages - 2) {
      if (pageNumbers[pageNumbers.length - 1] !== '...') {
        pageNumbers.push('...');
      }
    }
    
    // Always show last page if more than 1 page
    if (totalPages > 1 && !pageNumbers.includes(totalPages)) {
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };

  // Handle change of items per page
  const handleItemsPerPageChange = (value: string) => {
    const newValue = parseInt(value, 10);
    onItemsPerPageChange(newValue);
  };

  if (totalPages <= 1 && totalItems <= paginationOptions[0]) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 p-4 border-t">
      <div className="text-sm text-muted-foreground flex items-center gap-2">
        <span>
          {totalItems === 0 ? 
            "No items to display" : 
            `Showing ${indexOfFirstItem + 1}-${indexOfLastItem} of ${totalItems}`
          }
        </span>
        <span className="flex items-center gap-2">
          <span>Show</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={handleItemsPerPageChange}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={itemsPerPage.toString()} />
            </SelectTrigger>
            <SelectContent>
              {paginationOptions.map(option => (
                <SelectItem key={option} value={option.toString()}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </span>
      </div>
      
      {totalItems > 0 && totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => currentPage > 1 && onPageChange(currentPage - 1)} 
                className={currentPage === 1 ? "cursor-not-allowed opacity-50" : "cursor-pointer"} 
              />
            </PaginationItem>
            
            {getPageNumbers().map((page, index) => (
              page === '...' ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={`page-${page}`}>
                  <PaginationLink 
                    isActive={currentPage === page}
                    onClick={() => typeof page === 'number' && onPageChange(page)}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              )
            ))}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)} 
                className={currentPage === totalPages ? "cursor-not-allowed opacity-50" : "cursor-pointer"} 
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default LocationCodesPagination;
