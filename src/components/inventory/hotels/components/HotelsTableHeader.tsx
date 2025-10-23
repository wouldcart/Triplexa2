
import React from 'react';
import { TableHeader, TableRow, TableHead } from '@/components/ui/table';
import SortableTableHeader from './SortableTableHeader';
import { Hash } from 'lucide-react';

type SortField = 'name' | 'country' | 'city' | 'starRating' | 'price' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

interface HotelsTableHeaderProps {
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

const HotelsTableHeader: React.FC<HotelsTableHeaderProps> = ({
  sortField,
  sortDirection,
  onSort
}) => {
  return (
    <TableHeader className="bg-gray-50 dark:bg-gray-700">
      <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-700">
        <TableHead className="w-[80px] font-semibold text-gray-700 dark:text-gray-200">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4" />
            ID
          </div>
        </TableHead>
        <SortableTableHeader 
          field="name"
          label="Hotel Name"
          currentSortField={sortField}
          sortDirection={sortDirection}
          onSort={onSort}
          className="w-[250px] font-semibold text-gray-700 dark:text-gray-200"
        />
        <SortableTableHeader 
          field="country"
          label="Country"
          currentSortField={sortField}
          sortDirection={sortDirection}
          onSort={onSort}
          className="font-semibold text-gray-700 dark:text-gray-200"
        />
        <SortableTableHeader 
          field="city"
          label="City"
          currentSortField={sortField}
          sortDirection={sortDirection}
          onSort={onSort}
          className="font-semibold text-gray-700 dark:text-gray-200"
        />
        <SortableTableHeader 
          field="city"
          label="Location"
          currentSortField={sortField}
          sortDirection={sortDirection}
          onSort={onSort}
          className="font-semibold text-gray-700 dark:text-gray-200"
        />
        <SortableTableHeader 
          field="starRating"
          label="Rating"
          currentSortField={sortField}
          sortDirection={sortDirection}
          onSort={onSort}
          align="center"
          className="font-semibold text-gray-700 dark:text-gray-200"
        />
        <SortableTableHeader 
          field="city"
          label="Room Types"
          currentSortField={sortField}
          sortDirection={sortDirection}
          onSort={onSort}
          className="font-semibold text-gray-700 dark:text-gray-200"
        />
        <SortableTableHeader 
          field="price"
          label="Min. Price"
          currentSortField={sortField}
          sortDirection={sortDirection}
          onSort={onSort}
          align="right"
          className="font-semibold text-gray-700 dark:text-gray-200"
        />
        <SortableTableHeader 
          field="city"
          label="Status"
          currentSortField={sortField}
          sortDirection={sortDirection}
          onSort={onSort}
          align="center"
          className="font-semibold text-gray-700 dark:text-gray-200"
        />
        <TableHead className="text-right font-semibold text-gray-700 dark:text-gray-200">
          Actions
        </TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default HotelsTableHeader;
