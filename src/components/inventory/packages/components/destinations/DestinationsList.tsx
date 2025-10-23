
import React from 'react';
import { Label } from '@/components/ui/label';
import { Destination } from '@/types/package';
import SelectedDestination from './SelectedDestination';

interface DestinationsListProps {
  destinations: Destination[];
  onRemoveDestination: (country: string, city?: string) => void;
}

const DestinationsList: React.FC<DestinationsListProps> = ({
  destinations,
  onRemoveDestination
}) => {
  return (
    <div className="space-y-2 mt-4">
      <Label>Selected Destinations</Label>
      {destinations && destinations.length > 0 ? (
        <div className="space-y-2">
          {destinations.map((destination, index) => (
            <SelectedDestination
              key={index}
              destination={destination}
              index={index}
              onRemoveDestination={onRemoveDestination}
            />
          ))}
        </div>
      ) : (
        <div className="text-gray-500 dark:text-gray-400 text-sm p-4 text-center border border-dashed rounded-md">
          No destinations selected. Please add at least one destination.
        </div>
      )}
    </div>
  );
};

export default DestinationsList;
