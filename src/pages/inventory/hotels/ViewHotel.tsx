import React from 'react';
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { useSupabaseHotelsData } from '@/components/inventory/hotels/hooks/useSupabaseHotelsData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { hotelAmenities } from '@/components/inventory/hotels/data/hotelData';
import { 
  Star, 
  MapPin, 
  Calendar, 
  Edit, 
  ArrowLeft,
  Globe,
  Clock,
  Check,
  Plus,
  Grid3X3,
  List,
  Filter
} from 'lucide-react';
import HotelDeleteDialog from '@/components/inventory/hotels/dialogs/HotelDeleteDialog';
import RoomTypesListView from '@/components/inventory/hotels/RoomTypesListView';
import RoomTypesGridView from '@/components/inventory/hotels/RoomTypesGridView';
  import RoomTypesPagination from '@/components/inventory/hotels/RoomTypesPagination';
  import { useToast } from '@/hooks/use-toast';
  import type { HotelAmenity } from '@/components/inventory/hotels/types/hotel';

const ViewHotel: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hotels, loading, updateHotel, updateRoomTypeStatus } = useSupabaseHotelsData();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [roomViewMode, setRoomViewMode] = useState<'grid' | 'list'>('grid');
  const [roomsCurrentPage, setRoomsCurrentPage] = useState(1);
  const [roomsPerPage, setRoomsPerPage] = useState(6);
  const [roomStatusFilter, setRoomStatusFilter] = useState<'all' | 'active' | 'inactive' | 'draft'>('all');
  const { toast } = useToast();
  
  // Extract hotel ID from URL params or path
  const hotelId = id;
  
  console.log('ViewHotel component loaded');
  console.log('Hotel ID from params:', hotelId);
  console.log('Hotels data:', hotels);
  console.log('Loading state:', loading);
  
  // Find the hotel
  const hotel = hotels.find(h => h.id === hotelId);
  
  console.log('Found hotel:', hotel);
  
  // Set primary image as default selected image
  useEffect(() => {
    if (hotel) {
      const primaryImage = hotel.images.find(img => img.isPrimary);
      setSelectedImage(primaryImage?.url || hotel.images[0]?.url || null);
    }
  }, [hotel]);
  
  // Get amenity names
  const getAmenityNames = (amenityIds: string[]) => {
    return amenityIds.map(id => {
      const amenity = hotelAmenities.find(a => a.id === id);
      return amenity ? amenity.name : id;
    });
  };

  // Status badge color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'inactive':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
      case 'draft':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };
  
  // Group amenities by category
  const amenitiesByCategory = React.useMemo<Record<string, HotelAmenity[]>>(() => {
    if (!hotel) return {} as Record<string, HotelAmenity[]>;
    
    return hotel.amenities.reduce((acc, amenityId) => {
      const amenity = hotelAmenities.find(a => a.id === amenityId);
      if (amenity) {
        if (!acc[amenity.category]) {
          acc[amenity.category] = [];
        }
        acc[amenity.category].push(amenity);
      }
      return acc;
    }, {} as Record<string, HotelAmenity[]>);
  }, [hotel]);

  // Filter and paginate room types
  const filteredRooms = React.useMemo(() => {
    if (!hotel) return [];
    
    let filtered = hotel.roomTypes;
    
    if (roomStatusFilter !== 'all') {
      filtered = filtered.filter(room => room.status === roomStatusFilter);
    }
    
    return filtered;
  }, [hotel, roomStatusFilter]);

  const totalRoomPages = Math.ceil(filteredRooms.length / roomsPerPage);
  const startIndex = (roomsCurrentPage - 1) * roomsPerPage;
  const endIndex = startIndex + roomsPerPage;
  const paginatedRooms = filteredRooms.slice(startIndex, endIndex);

  // Handle room status update
  const handleRoomStatusUpdate = async (roomId: string, newStatus: 'active' | 'inactive') => {
    try {
      await updateRoomTypeStatus(roomId, newStatus);
      toast({
        title: 'Status Updated',
        description: `Room type status updated to ${newStatus}`,
      });
    } catch (err) {
      toast({
        title: 'Update Failed',
        description: 'Could not update room type status',
        variant: 'destructive',
      });
    }
  };

  // Handle room deletion
  const handleRoomDelete = (roomId: string) => {
    if (!hotel) return;
    
    const updatedRoomTypes = hotel.roomTypes.filter(room => room.id !== roomId);
    
    const updatedHotel = {
      ...hotel,
      roomTypes: updatedRoomTypes,
      updatedAt: new Date().toISOString()
    };
    
    updateHotel(hotel.id, updatedHotel);
    
    toast({
      title: "Room Deleted",
      description: "Room type has been deleted successfully",
      variant: "destructive",
    });
  };

  // Handle pagination
  const handleRoomsPageChange = (page: number) => {
    setRoomsCurrentPage(page);
  };

  const handleRoomsPerPageChange = (perPage: number) => {
    setRoomsPerPage(perPage);
    setRoomsCurrentPage(1);
  };
  
  if (loading) {
    return (
      <PageLayout>
        <div className="container py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading hotel data...</p>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }
  
  if (!hotel) {
    return (
      <PageLayout>
        <div className="container py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Hotel Not Found</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              The hotel you're looking for (ID: {hotelId}) doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate('/inventory/hotels')}>
              Return to Hotels
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Format price with the hotel's own currency
  const formatHotelCurrency = (amount: number) => {
    return formatCurrency(amount, hotel.currency || 'THB');
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
              onClick={() => navigate('/inventory/hotels')}
              className="mb-4 md:mb-0"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Hotels
            </Button>
            <Badge className={getStatusColor(hotel.status)}>
              {hotel.status.charAt(0).toUpperCase() + hotel.status.slice(1)}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link 
                to={`/inventory/hotels/${hotel.id}/edit`}
                onClick={() => console.log('Edit Hotel link clicked, navigating to:', `/inventory/hotels/${hotel.id}/edit`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Hotel
              </Link>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
            >
              Delete Hotel
            </Button>
          </div>
        </div>

        {/* Hotel Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{hotel.name}</h1>
          <div className="flex flex-wrap items-center gap-4 mt-2">
            <div className="flex items-center">
              <div className="flex">
                {Array.from({ length: hotel.starRating }).map((_, index) => (
                  <Star key={index} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <span className="ml-2 text-gray-500 dark:text-gray-400">
                {hotel.category}
              </span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
              <span>
                {hotel.location}, {hotel.city}, {hotel.country}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="rooms">Room Types</TabsTrigger>
            <TabsTrigger value="amenities">Amenities</TabsTrigger>
            <TabsTrigger value="images">Gallery</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</h3>
                        <p className="mt-1">
                          {hotel.address.street}, {hotel.address.city}, {hotel.address.state}{" "}
                          {hotel.address.zipCode}, {hotel.address.country}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Category</h3>
                        <p className="mt-1">{hotel.category}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Check-in / Check-out</h3>
                        <p className="mt-1">{hotel.checkInTime} / {hotel.checkOutTime}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Google Maps</h3>
                        <a
                          href={hotel.googleMapLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                        >
                          <Globe className="h-4 w-4 mr-1" />
                          View on Google Maps
                        </a>
                      </div>
                      <div className="md:col-span-2">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h3>
                        <p className="mt-1">{hotel.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Location</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Latitude</h3>
                        <p className="mt-1">{hotel.latitude}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Longitude</h3>
                        <p className="mt-1">{hotel.longitude}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Room Types</h3>
                        <p className="mt-1">{hotel.roomTypes.length} types available</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Starting Price</h3>
                        <p className="mt-1 text-lg font-semibold">
                          {formatHotelCurrency(
                            Math.min(...hotel.roomTypes.map(room => room.adultPrice))
                          )}
                          <span className="text-sm font-normal text-gray-500 dark:text-gray-400"> / night</span>
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Check-in Time</h3>
                        <div className="flex items-center mt-1">
                          <Clock className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                          <span>{hotel.checkInTime}</span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Check-out Time</h3>
                        <div className="flex items-center mt-1">
                          <Clock className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                          <span>{hotel.checkOutTime}</span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Popular Amenities</h3>
                        <div className="mt-1 space-y-1">
                          {getAmenityNames(hotel.amenities.slice(0, 5)).map((amenity, index) => (
                            <div key={index} className="flex items-center">
                              <Check className="h-4 w-4 mr-2 text-green-500 dark:text-green-400" />
                              <span>{amenity}</span>
                            </div>
                          ))}
                          {hotel.amenities.length > 5 && (
                            <div className="text-blue-600 dark:text-blue-400 cursor-pointer" onClick={() => setActiveTab('amenities')}>
                              + {hotel.amenities.length - 5} more amenities
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="mt-6">
                  <Button 
                    className="w-full"
                    onClick={() => setActiveTab('rooms')}
                  >
                    View Room Types
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Room Types Tab */}
          <TabsContent value="rooms">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold">Room Types</h2>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <select 
                    value={roomStatusFilter}
                    onChange={(e) => setRoomStatusFilter(e.target.value as any)}
                    className="border border-input rounded-md px-3 py-2 text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center border rounded-md">
                  <Button
                    variant={roomViewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setRoomViewMode('grid')}
                    className="rounded-r-none"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={roomViewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setRoomViewMode('list')}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  asChild
                >
                  <Link to={`/inventory/hotels/add-room-type/${hotel.id}`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Room Type
                  </Link>
                </Button>
              </div>
            </div>

            {filteredRooms.length > 0 ? (
              <div className="space-y-4">
                {roomViewMode === 'grid' ? (
                  <RoomTypesGridView
                    roomTypes={paginatedRooms}
                    hotelId={hotel.id}
                    currency={hotel.currency || 'THB'}
                    currencySymbol={hotel.currency_symbol || '$'}
                    onStatusUpdate={handleRoomStatusUpdate}
                    onDelete={handleRoomDelete}
                  />
                ) : (
                  <RoomTypesListView
                    roomTypes={paginatedRooms}
                    hotelId={hotel.id}
                    currency={hotel.currency || 'THB'}
                    currencySymbol={hotel.currency_symbol || '$'}
                    onStatusUpdate={handleRoomStatusUpdate}
                    onDelete={handleRoomDelete}
                  />
                )}
                
                {totalRoomPages > 1 && (
                  <RoomTypesPagination
                    currentPage={roomsCurrentPage}
                    totalPages={totalRoomPages}
                    totalItems={filteredRooms.length}
                    itemsPerPage={roomsPerPage}
                    onPageChange={handleRoomsPageChange}
                    onItemsPerPageChange={handleRoomsPerPageChange}
                  />
                )}
              </div>
            ) : (
              <div className="text-center py-12 border rounded-md bg-gray-50 dark:bg-gray-800">
                <h3 className="text-lg font-medium mb-2">
                  {roomStatusFilter === 'all' ? 'No Room Types Added' : `No ${roomStatusFilter} Room Types`}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {roomStatusFilter === 'all' 
                    ? 'Add room types to make this hotel available for booking'
                    : `No room types found with ${roomStatusFilter} status`
                  }
                </p>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  asChild
                >
                  <Link to={`/inventory/hotels/add-room-type/${hotel.id}`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Room Type
                  </Link>
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Amenities Tab */}
          <TabsContent value="amenities">
            <Card>
              <CardHeader>
                <CardTitle>Hotel Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(amenitiesByCategory).map(([category, amenities]) => (
                    <div key={category} className="space-y-2">
                      <h3 className="font-medium capitalize">{category} Amenities</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {amenities.map((amenity) => (
                          <div key={amenity.id} className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500 dark:text-green-400" />
                            <span>{amenity.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <div className="aspect-square w-full bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden">
                  {selectedImage && (
                    <img 
                      src={selectedImage} 
                      alt={hotel.name} 
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-4">Hotel Images</h3>
                <div className="grid grid-cols-2 gap-2">
                  {hotel.images.map((image) => (
                    <div 
                      key={image.id}
                      className={`
                        aspect-square rounded-md overflow-hidden cursor-pointer
                        ${selectedImage === image.url ? 'ring-2 ring-blue-500' :  'hover:opacity-90 transition-opacity'}
                      `}
                      onClick={() => setSelectedImage(image.url)}
                    >
                      <img 
                        src={image.url} 
                        alt={hotel.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Dialog */}
      {showDeleteDialog && (
        <HotelDeleteDialog
          hotel={hotel}
          open={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
        />
      )}
    </PageLayout>
  );
};

export default ViewHotel;
