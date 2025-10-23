
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useSupabaseHotelsData } from '@/components/inventory/hotels/hooks/useSupabaseHotelsData';
import { useToast } from '@/hooks/use-toast';
import RoomTypeFormContainer from '@/components/inventory/hotels/forms/room-type';

const EditRoomType = () => {
  const navigate = useNavigate();
  const { hotelId, roomTypeId } = useParams<{ hotelId: string; roomTypeId: string }>();
  const { hotels, loading } = useSupabaseHotelsData();
  const { toast } = useToast();
  
  console.log('EditRoomType params:', { hotelId, roomTypeId });
  console.log('Hotels data:', hotels);
  
  // Find the hotel by ID
  const hotel = hotels.find(h => h.id === hotelId);
  const roomType = hotel?.roomTypes.find(r => r.id === roomTypeId);
  
  console.log('Found hotel:', hotel);
  console.log('Found room type:', roomType);
  
  // Handle cancel
  const handleCancel = () => {
    navigate(`/inventory/hotels/${hotelId}`);
  };
  
  // Check if hotel and room type exist
  useEffect(() => {
    if (!loading && hotels.length > 0) {
      if (!hotel) {
        toast({
          title: 'Error',
          description: 'Hotel not found.',
          variant: 'destructive',
        });
        navigate('/inventory/hotels');
        return;
      }
      
      if (!roomType) {
        toast({
          title: 'Error',
          description: 'Room type not found.',
          variant: 'destructive',
        });
        navigate(`/inventory/hotels/${hotelId}`);
      }
    }
  }, [hotel, roomType, hotels, hotelId, navigate, toast, loading]);
  
  if (loading) {
    return (
      <PageLayout>
        <div className="container py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading room type data...</p>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }
  
  if (!hotel || !roomType) {
    return (
      <PageLayout>
        <div className="container py-6">
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <h1 className="text-2xl font-bold mb-4">Resource Not Found</h1>
            <p className="text-gray-500 mb-6">The hotel or room type you're looking for doesn't exist.</p>
            <div className="flex gap-4">
              <Button asChild variant="outline">
                <Link to="/inventory/hotels">Back to Hotels</Link>
              </Button>
              {hotelId && (
                <Button asChild>
                  <Link to={`/inventory/hotels/${hotelId}`}>Back to Hotel Details</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }
  
  return (
    <PageLayout>
      <div className="container py-6">
        <div className="flex items-center mb-6">
          <Button asChild variant="ghost" size="sm">
            <Link to={`/inventory/hotels/${hotelId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Hotel
            </Link>
          </Button>
          <h1 className="text-2xl font-bold ml-4">Edit Room Type: {roomType.name}</h1>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <RoomTypeFormContainer 
            hotelId={hotelId!}
            roomTypeId={roomTypeId}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </PageLayout>
  );
};

export default EditRoomType;
