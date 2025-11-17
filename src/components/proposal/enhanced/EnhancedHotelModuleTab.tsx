
import React from 'react';
import HotelModuleTab from './HotelModuleTab';
import EnhancedAccommodationPlanning from '../accommodation/EnhancedAccommodationPlanning';
import { OptionalCitiesAccommodation } from '../accommodation/OptionalCitiesAccommodation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Hotel, ListChecks } from 'lucide-react';
import { Hotel as HotelType } from '@/components/inventory/hotels/types/hotel';
import { Query } from '@/types/query';

interface EnhancedHotelModuleTabProps {
  country: string;
  hotels: HotelType[];
  selectedModules: any[];
  onAddModule: (module: any) => void;
  onRemoveModule: (id: string) => void;
  onUpdatePricing: (id: string, pricing: any) => void;
  query?: Query;
}

const EnhancedHotelModuleTab: React.FC<EnhancedHotelModuleTabProps> = ({
  country,
  hotels,
  selectedModules,
  onAddModule,
  onRemoveModule,
  onUpdatePricing,
  query
}) => {
  const hotelModules = selectedModules.filter(module => module.type === 'hotel');

  const handleUpdateAccommodation = (id: string, updates: any) => {
    const moduleIndex = selectedModules.findIndex(module => module.id === id);
    if (moduleIndex !== -1) {
      const updatedModule = { ...selectedModules[moduleIndex], ...updates };
      onUpdatePricing(id, updatedModule);
    }
  };

  const handleRemoveAccommodation = (id: string) => {
    onRemoveModule(id);
  };

  return (
    <Tabs defaultValue="selection" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="selection" className="flex items-center gap-2">
          <Hotel className="h-4 w-4" />
          Hotel Selection
        </TabsTrigger>
        <TabsTrigger value="planning" className="flex items-center gap-2">
          <ListChecks className="h-4 w-4" />
          Accommodation Planning
        </TabsTrigger>
      </TabsList>

      <TabsContent value="selection" className="mt-6">
        <HotelModuleTab
          country={country}
          hotels={hotels}
          selectedModules={selectedModules}
          onAddModule={onAddModule}
          onRemoveModule={onRemoveModule}
          onUpdatePricing={onUpdatePricing}
          query={query}
        />
      </TabsContent>

      <TabsContent value="planning" className="mt-6">
        {query && (
          <OptionalCitiesAccommodation query={query} />
        )}
        <EnhancedAccommodationPlanning
          selectedAccommodations={hotelModules.map(module => ({
            id: module.id,
            hotel: module.data.hotel,
            roomType: module.data.roomType,
            nights: module.nights || 1,
            rooms: module.data.numRooms,
            checkIn: query?.travelDates?.from || '',
            checkOut: query?.travelDates?.to || '',
            pricing: module.pricing,
            similarOptions: module.similarOptions || []
          }))}
          availableHotels={hotels}
          onUpdateAccommodation={handleUpdateAccommodation}
          onRemoveAccommodation={handleRemoveAccommodation}
          queryId={query?.id}
        />
      </TabsContent>
    </Tabs>
  );
};

export default EnhancedHotelModuleTab;
