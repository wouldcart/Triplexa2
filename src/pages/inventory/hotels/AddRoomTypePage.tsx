
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { useSupabaseHotelsData } from '@/components/inventory/hotels/hooks/useSupabaseHotelsData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Star, MapPin, Clock, Users } from 'lucide-react';
import AddRoomTypeDialog from '@/components/inventory/hotels/components/AddRoomTypeDialog';
const AddRoomTypePage: React.FC = () => {
  const { hotelId } = useParams<{ hotelId: string }>();
  const navigate = useNavigate();
  const { hotels, addRoomType, updateRoomType, deleteRoomType } = useSupabaseHotelsData();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingRoomType, setEditingRoomType] = useState(null);
  
  const hotel = hotels.find(h => h.id === hotelId);
  
  useEffect(() => {
    // If no hotel found, redirect back to hotels list
    if (!hotel && hotels.length > 0) {
      navigate('/inventory/hotels');
    }
  }, [hotel, hotels, navigate]);

  if (!hotel) {
    return (
      <PageLayout>
        <div className="container py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Hotel Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The hotel you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate('/inventory/hotels')}>
              Return to Hotels
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Use hotel's currency symbol directly from database, fallback to '$' if not available
  const currencySymbol = hotel.currency_symbol || '$';

  const handleAddRoomType = (roomTypeData: any) => {
    console.log('Adding room type to hotel:', hotelId, roomTypeData);
    
    const newRoomType = {
      ...roomTypeData,
      id: `room${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      currency: hotel.currency || 'USD',
      status: 'active'
    };
    
    addRoomType({ ...newRoomType, hotelId });
    setShowAddDialog(false);
  };

  const handleEditRoomType = (roomType: any) => {
    console.log('Editing room type:', roomType.id);
    setEditingRoomType(roomType);
    setShowAddDialog(true);
  };

  const handleUpdateRoomType = (roomTypeData: any) => {
    if (editingRoomType) {
      console.log('Updating room type:', editingRoomType.id, roomTypeData);
      updateRoomType(editingRoomType.id, { ...roomTypeData, hotelId });
      setEditingRoomType(null);
      setShowAddDialog(false);
    }
  };

  const handleDeleteRoomType = (roomTypeId: string) => {
    console.log('Deleting room type:', roomTypeId);
    deleteRoomType(roomTypeId);
  };

  const handleFinish = () => {
    navigate(`/inventory/hotels/view/${hotelId}`);
  };

  return (
    <PageLayout>
      <div className="container py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/inventory/hotels/view/${hotelId}`)}
              className="mb-4 md:mb-0"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Hotel
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Room Type
            </Button>
            <Button
              variant="outline"
              onClick={handleFinish}
            >
              Finish & View Hotel
            </Button>
          </div>
        </div>

        {/* Hotel Summary Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{hotel.name}</CardTitle>
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  <div className="flex items-center">
                    <div className="flex">
                      {Array.from({ length: hotel.starRating }).map((_, index) => (
                        <Star key={index} className="h-4 w-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <span className="ml-2 text-muted-foreground">{hotel.category}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span className="text-sm">
                      {hotel.location}, {hotel.city}, {hotel.country}
                    </span>
                  </div>
                </div>
              </div>
              <Badge variant="outline">
                Currency: {currencySymbol}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Check-in</div>
                  <div className="text-sm text-muted-foreground">{hotel.checkInTime}</div>
                </div>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Check-out</div>
                  <div className="text-sm text-muted-foreground">{hotel.checkOutTime}</div>
                </div>
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Room Types</div>
                  <div className="text-sm text-muted-foreground">{hotel.roomTypes.length}</div>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium">Status</div>
                <Badge 
                  variant={hotel.status === 'active' ? 'default' : 'secondary'}
                  className="mt-1"
                >
                  {hotel.status.charAt(0).toUpperCase() + hotel.status.slice(1)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Room Types Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Room Types</CardTitle>
              <Button
                onClick={() => setShowAddDialog(true)}
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Room Type
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {hotel.roomTypes.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {hotel.roomTypes.map((roomType) => (
                  <Card key={roomType.id} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{roomType.name}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {roomType.configuration} • {roomType.mealPlan}
                          </p>
                        </div>
                        <Badge variant={roomType.status === 'active' ? 'default' : 'secondary'}>
                          {roomType.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm font-medium">Capacity</p>
                          <p className="text-sm text-muted-foreground">
                            {roomType.capacity.adults} Adults, {roomType.capacity.children} Children
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Adult Price</p>
                          <p className="text-sm text-muted-foreground">
                            {currencySymbol}{roomType.adultPrice}/night
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Child Price</p>
                          <p className="text-sm text-muted-foreground">
                            {currencySymbol}{roomType.childPrice}/night
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Extra Bed</p>
                          <p className="text-sm text-muted-foreground">
                            {currencySymbol}{roomType.extraBedPrice}/night
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRoomType(roomType)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteRoomType(roomType.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border rounded-md bg-muted/20">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Room Types Added</h3>
                <p className="text-muted-foreground mb-4">
                  Add room types to make this hotel available for booking
                </p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Room Type
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Room Type Dialog */}
        <AddRoomTypeDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSave={editingRoomType ? handleUpdateRoomType : handleAddRoomType}
          hotelCurrency={hotel.currency || 'USD'}
          currencySymbol={currencySymbol}
          initialData={editingRoomType}
          mode={editingRoomType ? 'edit' : 'add'}
        />
      </div>
    </PageLayout>
  );
};

export default AddRoomTypePage;
