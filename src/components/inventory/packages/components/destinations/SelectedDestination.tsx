
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { Destination } from '@/types/package';

interface SelectedDestinationProps {
  destination: Destination;
  index: number;
  onRemoveDestination: (country: string, city?: string) => void;
}

const SelectedDestination: React.FC<SelectedDestinationProps> = ({
  destination,
  index,
  onRemoveDestination
}) => {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
      <div className="flex justify-between items-center">
        <div className="font-medium">{destination.country}</div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onRemoveDestination(destination.country)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {destination.cities.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {destination.cities.map((city, cityIndex) => (
            <Badge 
              key={cityIndex} 
              variant="outline"
              className="flex items-center gap-1 bg-white dark:bg-gray-700"
            >
              {city}
              <button 
                onClick={() => onRemoveDestination(destination.country, city)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default SelectedDestination;
