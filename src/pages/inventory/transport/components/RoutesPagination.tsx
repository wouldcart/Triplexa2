
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

interface RoutesPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (value: number) => void;
  indexOfFirstItem?: number;
  indexOfLastItem?: number;
  usingExternalPagination?: boolean;
}

const RoutesPagination: React.FC<RoutesPaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  indexOfFirstItem,
  indexOfLastItem,
  usingExternalPagination = false
}) => {
  // Available pagination options
  const paginationOptions = [10, 20, 50, 100, 200];

  // Enhanced pagination logic for better UX
  const getPageNumbers = () => {
    const pageNumbers = [];
    
    // Handle small page count (5 or fewer pages)
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
      return pageNumbers;
    }
    
    // Always show first page
    pageNumbers.push(1);
    
    // Smart ellipsis for better navigation
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
  
  // Calculate actual items displayed
  const firstItemDisplayed = totalItems === 0 ? 0 : (indexOfFirstItem !== undefined ? indexOfFirstItem + 1 : (currentPage - 1) * itemsPerPage + 1);
  const lastItemDisplayed = Math.min(indexOfLastItem !== undefined ? indexOfLastItem : currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 py-4">
      <div className="text-sm text-muted-foreground flex items-center gap-2">
        <span>
          {totalItems === 0 ? 
            "No items to display" : 
            `Showing ${firstItemDisplayed}-${lastItemDisplayed} of ${totalItems}`
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
      
      {totalItems > 0 && (
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
                className={currentPage === totalPages || totalPages === 0 ? "cursor-not-allowed opacity-50" : "cursor-pointer"} 
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default RoutesPagination;
