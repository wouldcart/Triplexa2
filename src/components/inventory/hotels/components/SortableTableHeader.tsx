
import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { TableHead } from '@/components/ui/table';

type SortField = 'name' | 'country' | 'city' | 'starRating' | 'price' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

interface SortableTableHeaderProps {
  field: SortField;
  label: string;
  currentSortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

const SortableTableHeader: React.FC<SortableTableHeaderProps> = ({
  field,
  label,
  currentSortField,
  sortDirection,
  onSort,
  className = '',
  align = 'left',
}) => {
  const handleClick = () => {
    onSort(field);
  };

  const getAlignmentClass = () => {
    if (align === 'center') return 'justify-center';
    if (align === 'right') return 'justify-end';
    return '';
  };

  return (
    <TableHead 
      className={`cursor-pointer ${className}`}
      onClick={handleClick}
    >
      <div className={`flex items-center ${getAlignmentClass()}`}>
        {label}
        {currentSortField === field && (
          sortDirection === 'asc' 
            ? <ChevronUp className="h-4 w-4 ml-1" /> 
            : <ChevronDown className="h-4 w-4 ml-1" />
        )}
      </div>
    </TableHead>
  );
};

export default SortableTableHeader;
