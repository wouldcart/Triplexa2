
import React from 'react';
import { useSupabaseHotelsData } from '../../hooks/useSupabaseHotelsData';
import RoomTypeForm from './RoomTypeForm';

interface RoomTypeFormContainerProps {
  hotelId: string;
  roomTypeId?: string;
  onCancel: () => void;
}

const RoomTypeFormContainer: React.FC<RoomTypeFormContainerProps> = ({ 
  hotelId, 
  roomTypeId, 
  onCancel 
}) => {
  const { hotels, loading } = useSupabaseHotelsData();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  const hotel = hotels.find(h => h.id === hotelId);

  if (!hotel) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Hotel not found</p>
      </div>
    );
  }

  return (
    <RoomTypeForm 
      hotelId={hotelId} 
      hotel={hotel}
      roomTypeId={roomTypeId}
      onCancel={onCancel}
    />
  );
};

export default RoomTypeFormContainer;
