import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSupabaseHotelsData } from '../hooks/useSupabaseHotelsData';
import { toast } from 'sonner';

const HotelCrudTest: React.FC = () => {
  const { 
    hotels, 
    loading, 
    error, 
    addHotel, 
    updateHotel, 
    deleteHotel,
    addRoomType,
    refreshHotels 
  } = useSupabaseHotelsData();

  const [testHotelName, setTestHotelName] = useState('Test Hotel');
  const [selectedHotelId, setSelectedHotelId] = useState('');

  const handleCreateTestHotel = async () => {
    try {
      const testHotel = {
        name: testHotelName,
        starRating: 4,
        description: 'A test hotel created for CRUD testing',
        country: 'United States',
        city: 'New York',
        address: '123 Test Street, New York, NY 10001',
        latitude: 40.7128,
        longitude: -74.0060,
        contactInfo: {
          phone: '+1-555-0123',
          email: 'test@testhotel.com',
          website: 'https://testhotel.com'
        },
        facilities: ['WiFi', 'Pool', 'Gym'],
        amenities: ['Air Conditioning', 'Room Service'],
        images: ['https://example.com/hotel1.jpg'],
        policies: {
          checkIn: '15:00',
          checkOut: '11:00',
          cancellation: 'Free cancellation up to 24 hours before check-in'
        },
        status: 'active' as const,
        currency: 'USD'
      };

      await addHotel(testHotel);
      toast.success('Test hotel created successfully!');
    } catch (error) {
      console.error('Error creating test hotel:', error);
      toast.error('Failed to create test hotel');
    }
  };

  const handleUpdateTestHotel = async () => {
    if (!selectedHotelId) {
      toast.error('Please select a hotel to update');
      return;
    }

    try {
      await updateHotel(selectedHotelId, {
        description: 'Updated test hotel description - ' + new Date().toISOString()
      });
      toast.success('Hotel updated successfully!');
    } catch (error) {
      console.error('Error updating hotel:', error);
      toast.error('Failed to update hotel');
    }
  };

  const handleDeleteTestHotel = async () => {
    if (!selectedHotelId) {
      toast.error('Please select a hotel to delete');
      return;
    }

    try {
      await deleteHotel(selectedHotelId);
      toast.success('Hotel deleted successfully!');
      setSelectedHotelId('');
    } catch (error) {
      console.error('Error deleting hotel:', error);
      toast.error('Failed to delete hotel');
    }
  };

  const handleAddTestRoomType = async () => {
    if (!selectedHotelId) {
      toast.error('Please select a hotel to add room type');
      return;
    }

    try {
      const testRoomType = {
        hotelId: selectedHotelId,
        name: 'Test Room Type',
        description: 'A test room type',
        capacity: 2,
        adultPrice: 150,
        childPrice: 75,
        currency: 'USD',
        amenities: ['WiFi', 'TV'],
        images: ['https://example.com/room1.jpg'],
        availability: true,
        mealPlan: 'breakfast' as const
      };

      await addRoomType(testRoomType);
      toast.success('Test room type added successfully!');
    } catch (error) {
      console.error('Error adding room type:', error);
      toast.error('Failed to add room type');
    }
  };

  if (loading) {
    return <div>Loading hotels...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Hotel CRUD Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="hotelName">Test Hotel Name</Label>
            <Input
              id="hotelName"
              value={testHotelName}
              onChange={(e) => setTestHotelName(e.target.value)}
              placeholder="Enter hotel name"
            />
          </div>

          <div>
            <Label htmlFor="hotelSelect">Select Hotel for Update/Delete</Label>
            <select
              id="hotelSelect"
              value={selectedHotelId}
              onChange={(e) => setSelectedHotelId(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Select a hotel...</option>
              {hotels.map((hotel) => (
                <option key={hotel.id} value={hotel.id}>
                  {hotel.name} ({hotel.id})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleCreateTestHotel}>
              Create Test Hotel
            </Button>
            <Button onClick={handleUpdateTestHotel} variant="outline">
              Update Selected Hotel
            </Button>
            <Button onClick={handleDeleteTestHotel} variant="destructive">
              Delete Selected Hotel
            </Button>
            <Button onClick={handleAddTestRoomType} variant="secondary">
              Add Test Room Type
            </Button>
            <Button onClick={refreshHotels} variant="ghost">
              Refresh Hotels
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Hotels ({hotels.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {hotels.length === 0 ? (
            <p>No hotels found. Create a test hotel to get started.</p>
          ) : (
            <div className="space-y-2">
              {hotels.map((hotel) => (
                <div key={hotel.id} className="p-3 border rounded">
                  <h4 className="font-semibold">{hotel.name}</h4>
                  <p className="text-sm text-gray-600">
                    {hotel.city}, {hotel.country} | {hotel.starRating} stars
                  </p>
                  <p className="text-xs text-gray-500">ID: {hotel.id}</p>
                  {hotel.roomTypes && hotel.roomTypes.length > 0 && (
                    <p className="text-xs text-blue-600">
                      Room Types: {hotel.roomTypes.length}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HotelCrudTest;