
import React, { useState } from 'react';
import { Hotel } from './types/hotel';
import {
  Table,
  TableBody,
} from '@/components/ui/table';
import HotelDeleteDialog from './dialogs/HotelDeleteDialog';
import EmptyHotelsList from './components/EmptyHotelsList';
import HotelsTableHeader from './components/HotelsTableHeader';
import HotelTableRow from './components/HotelTableRow';
import { useHotelsSort } from './hooks/useHotelsSort';
import { useHotelSearch } from './hooks/useHotelSearch';

interface HotelsTableProps {
  hotels: Hotel[];
  searchTerm: string;
}

const HotelsTable: React.FC<HotelsTableProps> = ({ hotels, searchTerm }) => {
  const [hotelToDelete, setHotelToDelete] = useState<Hotel | null>(null);

  // Use our new search hook
  const { filteredHotels } = useHotelSearch(hotels, searchTerm);
  
  // Use our new sort hook
  const { sortField, sortDirection, sortedHotels, handleSort } = useHotelsSort(filteredHotels);

  const handleOpenDelete = (hotel: Hotel) => {
    setHotelToDelete(hotel);
  };

  const handleCloseDelete = () => {
    setHotelToDelete(null);
  };

  if (sortedHotels.length === 0) {
    return <EmptyHotelsList searchTerm={searchTerm} />;
  }

  // Add ID numbers to hotels for display
  const hotelsWithIds = sortedHotels.map((hotel, index) => ({
    ...hotel,
    displayId: String(index + 1).padStart(3, '0')
  }));

  return (
    <>
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
        <Table>
          <HotelsTableHeader 
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
          <TableBody>
            {hotelsWithIds.map((hotel) => (
              <HotelTableRow 
                key={hotel.id}
                hotel={hotel}
                onDeleteClick={handleOpenDelete}
              />
            ))}
          </TableBody>
        </Table>
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

export default HotelsTable;
