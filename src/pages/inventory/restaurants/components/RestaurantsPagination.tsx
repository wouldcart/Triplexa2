
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface RestaurantsPaginationProps {
  currentPage: number;
  totalPages: number;
  onNextPage: () => void;
  onPrevPage: () => void;
}

const RestaurantsPagination: React.FC<RestaurantsPaginationProps> = ({
  currentPage,
  totalPages,
  onNextPage,
  onPrevPage
}) => {
  return (
    <div className="flex justify-center mt-6">
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onPrevPage}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <span className="text-sm">
          Page {currentPage} of {totalPages}
        </span>
        
        <Button
          variant="outline"
          size="icon"
          onClick={onNextPage}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default RestaurantsPagination;
