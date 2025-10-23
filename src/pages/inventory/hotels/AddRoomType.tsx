
import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSupabaseHotelsData } from '@/components/inventory/hotels/hooks/useSupabaseHotelsData';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import RoomTypeFormContainer from '@/components/inventory/hotels/forms/room-type';

const AddRoomType = () => {
  const navigate = useNavigate();
  const { hotelId, id } = useParams<{ hotelId?: string; id?: string }>();
  const [searchParams] = useSearchParams();
  const { hotels } = useSupabaseHotelsData();
  
  // Use hotelId if available, otherwise use id (for backward compatibility)
  const actualHotelId = hotelId || id;
  
  // Extract external_id from query parameters
  const externalId = searchParams.get('external_id');
  
  console.log('AddRoomType - hotelId:', hotelId, 'id:', id, 'actualHotelId:', actualHotelId, 'externalId:', externalId);
  
  // Find the hotel by ID
  const hotel = hotels.find(h => h.id === actualHotelId);
  
  // Handle cancel
  const handleCancel = () => {
    navigate(`/inventory/hotels/${actualHotelId}`);
  };
  
  // Check if hotel exists
  React.useEffect(() => {
    if (!hotel && hotels.length > 0) {
      console.log('Hotel not found, hotels available:', hotels.length);
      toast.error('Hotel not found');
      navigate('/inventory/hotels');
    }
  }, [hotel, hotels, navigate]);
  
  if (!actualHotelId) {
    return (
      <PageLayout>
        <div className="container py-6">
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <h1 className="text-2xl font-bold mb-4">Invalid Hotel ID</h1>
            <p className="text-gray-500 mb-6">No hotel ID provided in the URL.</p>
            <Button asChild>
              <Link to="/inventory/hotels">Back to Hotels</Link>
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }
  
  if (!hotel && hotels.length > 0) {
    return (
      <PageLayout>
        <div className="container py-6">
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <h1 className="text-2xl font-bold mb-4">Hotel Not Found</h1>
            <p className="text-gray-500 mb-6">The hotel you're looking for doesn't exist.</p>
            <Button asChild>
              <Link to="/inventory/hotels">Back to Hotels</Link>
            </Button>
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
            <Link to={`/inventory/hotels/${actualHotelId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Hotel
            </Link>
          </Button>
          <h1 className="text-2xl font-bold ml-2">Add Room Type</h1>
        </div>
        
        {hotel && (
          <Card className="mb-6">
            <CardHeader className="bg-gray-50 dark:bg-gray-800 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Hotel: {hotel.name}</h2>
                {externalId && (
                  <Badge variant="outline" className="text-sm">
                    External ID: {externalId}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <p>{hotel.city}, {hotel.country}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Rating</p>
                  <p>{hotel.starRating} Star</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Category</p>
                  <p>{hotel.category}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {actualHotelId && (
          <RoomTypeFormContainer 
            hotelId={actualHotelId} 
            onCancel={handleCancel}
          />
        )}
      </div>
    </PageLayout>
  );
};

export default AddRoomType;
