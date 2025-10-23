
import React from 'react';

interface EmptyHotelsListProps {
  searchTerm?: string;
}

const EmptyHotelsList: React.FC<EmptyHotelsListProps> = ({ searchTerm }) => {
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
};

export default EmptyHotelsList;
