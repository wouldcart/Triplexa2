
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calendar, Clock, Globe, MapPin, Users, Utensils, Car, Hotel, Camera, FileText, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { TourPackage } from '@/types/package';
import { tourPackageService } from '@/integrations/supabase/services/tourPackageService';
import { useToast } from '@/hooks/use-toast';

const ViewPackage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [packageData, setPackageData] = useState<TourPackage | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  useEffect(() => {
    const loadPackage = async () => {
      if (!id) return;
      try {
        const pkg = await tourPackageService.getTourPackageById(id);
        setPackageData(pkg);
      } catch (error: any) {
        toast({
          title: 'Package not found',
          description: error?.message ?? 'The requested package could not be found.',
          variant: 'destructive'
        });
        navigate('/inventory/packages');
      }
    };
    loadPackage();
  }, [id, navigate, toast]);
  
  if (!packageData) {
    return (
      <PageLayout>
        <div className="p-6 flex items-center justify-center h-full">
          <p>Loading package details...</p>
        </div>
      </PageLayout>
    );
  }
  
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: packageData.currency || 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Get the first banner image or default
  const bannerImage = packageData.banners && packageData.banners.length > 0 
    ? packageData.banners[0] 
    : 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2070';
    
  // Function to get status badge color
  const getStatusBadge = () => {
    switch (packageData.status) {
      case 'published':
        return <Badge className="bg-green-500 hover:bg-green-600">Published</Badge>;
      case 'draft':
        return <Badge variant="outline" className="text-gray-500 border-gray-300">Draft</Badge>;
      default:
        return null;
    }
  };
  
  return (
    <PageLayout>
      <div className="p-3 sm:p-6">
        <div className="flex items-center gap-2 mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/inventory/packages')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-grow">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {packageData.name}
              </h1>
              <div className="flex items-center space-x-2">
                {getStatusBadge()}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate(`/inventory/packages/${id}/edit`)}
                  className="ml-2 flex items-center gap-1"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit Package</span>
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Created on {new Date(packageData.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        {/* Banner Image */}
        <div className="relative h-48 sm:h-64 w-full mb-6 rounded-lg overflow-hidden">
          <img 
            src={bannerImage} 
            alt={packageData.name} 
            className="w-full h-full object-cover"
          />
          {packageData.isFixedDeparture && (
            <Badge variant="secondary" className="absolute top-4 left-4 bg-blue-500 text-white hover:bg-blue-600">
              Fixed Departure
            </Badge>
          )}
        </div>
        
        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="flex items-center p-4 space-x-4">
              <div className="rounded-full bg-primary/10 p-2">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-medium">{packageData.days} Days / {packageData.nights} Nights</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-4 space-x-4">
              <div className="rounded-full bg-primary/10 p-2">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Destinations</p>
                <p className="font-medium">
                  {Array.isArray(packageData.destinations) && packageData.destinations.length > 0
                    ? packageData.destinations
                        .map(d => d?.country)
                        .filter(Boolean)
                        .join(', ')
                    : 'No destinations'}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-4 space-x-4">
              <div className="rounded-full bg-primary/10 p-2">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Min. Guests</p>
                <p className="font-medium">{packageData.minPax} persons</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-4 space-x-4">
              <div className="rounded-full bg-primary/10 p-2">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Price Per Person</p>
                <p className="font-medium">{formatCurrency(packageData.pricePerPerson)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="flex flex-nowrap overflow-x-auto gap-2 p-1 w-full">
            <TabsTrigger value="overview" className="flex gap-2 min-w-max px-3 py-2 text-sm sm:text-base">
              <FileText className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="itinerary" className="flex gap-2 min-w-max px-3 py-2 text-sm sm:text-base">
              <Calendar className="h-4 w-4" />
              <span>Itinerary</span>
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex gap-2 min-w-max px-3 py-2 text-sm sm:text-base">
              <FileText className="h-4 w-4" />
              <span>Pricing</span>
            </TabsTrigger>
            <TabsTrigger value="terms" className="flex gap-2 min-w-max px-3 py-2 text-sm sm:text-base">
              <FileText className="h-4 w-4" />
              <span>Terms</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Package Overview</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Destinations</h4>
                  {Array.isArray(packageData.destinations) && packageData.destinations.length > 0 ? (
                    <div className="mt-2 space-y-3">
                      {packageData.destinations.map((destination, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                          <div className="flex items-center mb-1">
                            <MapPin className="h-4 w-4 mr-1 text-gray-500" />
                            <span className="font-medium">{destination?.country || 'Unknown country'}</span>
                          </div>
                          <div className="ml-5 flex flex-wrap gap-2">
                            {Array.isArray(destination?.cities) && destination.cities.length > 0 ? (
                              destination.cities.map((city, idx) => (
                                <Badge key={idx} variant="secondary">
                                  {city}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-gray-500">No cities listed</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-gray-500">No destinations specified.</p>
                  )}
                </div>
                
                {packageData.themes && packageData.themes.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Tour Theme</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {packageData.themes.map(theme => (
                        <Badge key={theme} variant="outline">
                          {theme}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {packageData.isFixedDeparture && packageData.departureDate && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Departure Details</h4>
                    <div className="mt-2 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                      <div className="flex items-center mb-1">
                        <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                        <span>Departure Date: {new Date(packageData.departureDate).toLocaleDateString()}</span>
                      </div>
                      {packageData.totalSeats && (
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1 text-gray-500" />
                          <span>Total Seats: {packageData.totalSeats}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Start & End Points</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1 text-gray-500" />
                        <span className="font-medium">Start: {packageData.startCity}</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1 text-gray-500" />
                        <span className="font-medium">End: {packageData.endCity}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Gallery Card */}
            {packageData.banners && packageData.banners.length > 0 && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Gallery</h3>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {packageData.banners.map((banner, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                        <img 
                          src={banner} 
                          alt={`Gallery ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="itinerary" className="space-y-4">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Detailed Itinerary</h3>
              </CardHeader>
              <CardContent>
                {packageData.itinerary.map((day, index) => (
                  <div key={index} className={cn(
                    "border-l-2 pl-4 py-4",
                    index === 0 ? "" : "border-t",
                    index === packageData.itinerary.length - 1 ? "" : "border-dashed"
                  )}>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                      <div>
                        <h4 className="text-md font-semibold">
                          Day {day.day}: {day.title || day.city || ''}
                        </h4>
                        <div className="text-sm text-gray-500">
                          {day.accommodation?.hotelName || day.accommodation?.customHotelName 
                            ? `Stay: ${day.accommodation.hotelName || day.accommodation.customHotelName}` 
                            : 'No accommodation (departure day)'}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={day.meals?.breakfast ? "default" : "outline"} className="text-xs">B</Badge>
                        <Badge variant={day.meals?.lunch ? "default" : "outline"} className="text-xs">L</Badge>
                        <Badge variant={day.meals?.dinner ? "default" : "outline"} className="text-xs">D</Badge>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 dark:text-gray-300 mb-3">{day.description}</p>
                    
                    {Array.isArray(day.activities) && day.activities.length > 0 && (
                      <div className="space-y-2 mt-3">
                        <h5 className="text-sm font-medium">Activities:</h5>
                        <div className="space-y-2">
                          {day.activities.map((activity, actIdx) => (
                            <div key={actIdx} className="flex items-start bg-gray-50 dark:bg-gray-800 p-2 rounded">
                              <div className="mr-3">
                                {activity.type === 'hotel' && <Hotel className="h-4 w-4 text-gray-500" />}
                                {activity.type === 'sightseeing' && <Camera className="h-4 w-4 text-gray-500" />}
                                {activity.type === 'transport' && <Car className="h-4 w-4 text-gray-500" />}
                                {activity.type === 'free' && <Clock className="h-4 w-4 text-gray-500" />}
                                {activity.type === 'additional' && <FileText className="h-4 w-4 text-gray-500" />}
                                {activity.type === 'gala' && <Utensils className="h-4 w-4 text-gray-500" />}
                              </div>
                              <div>
                                <div className="font-medium text-sm">{activity.title}</div>
                                <div className="text-sm text-gray-500">{activity.description}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="pricing" className="space-y-4">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Pricing Details</h3>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Base Cost</p>
                    <p className="text-lg font-semibold">{formatCurrency(packageData.baseCost)}</p>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Markup</p>
                    <p className="text-lg font-semibold">{packageData.markup}%</p>
                  </div>
                  
                  {packageData.commission && (
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Commission</p>
                      <p className="text-lg font-semibold">{packageData.commission}%</p>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Final Package Price</p>
                    <p className="text-lg font-bold">{formatCurrency(packageData.finalPrice)}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Price Per Person</p>
                    <p className="text-lg font-bold">{formatCurrency(packageData.pricePerPerson)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="terms" className="space-y-4">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Inclusions & Exclusions</h3>
              </CardHeader>
              <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Inclusions</h4>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg whitespace-pre-wrap">
                    {packageData.inclusions || 'No inclusions specified.'}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Exclusions</h4>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg whitespace-pre-wrap">
                    {packageData.exclusions || 'No exclusions specified.'}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Policies</h3>
              </CardHeader>
              <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Cancellation Policy</h4>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg whitespace-pre-wrap">
                    {packageData.cancellationPolicy || 'No cancellation policy specified.'}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Payment Policy</h4>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg whitespace-pre-wrap">
                    {packageData.paymentPolicy || 'No payment policy specified.'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default ViewPackage;
