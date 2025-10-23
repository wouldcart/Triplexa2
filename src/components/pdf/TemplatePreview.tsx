import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  X, 
  Download, 
  Share2, 
  Monitor, 
  Tablet, 
  Smartphone,
  FileText,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Printer
} from 'lucide-react';
import { Query } from '@/types/query';
import { getQueryById } from '@/data/queryData';

interface TemplatePreviewProps {
  template: any;
  onClose: () => void;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({ template, onClose }) => {
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Sample query data for preview
  const sampleQuery: Query = {
    id: 'ENQ20250008',
    agentId: 1,
    agentName: 'Sarah Johnson',
    destination: {
      country: 'Thailand',
      cities: ['Bangkok', 'Phuket', 'Chiang Mai']
    },
    paxDetails: {
      adults: 2,
      children: 0,
      infants: 0
    },
    travelDates: {
      from: '2024-03-15',
      to: '2024-03-22'
    },
    tripDuration: {
      days: 7,
      nights: 6
    },
    packageType: 'Honeymoon',
    specialRequests: ['Romantic accommodations', 'Private transfers'],
    budget: {
      min: 2000,
      max: 3000,
      currency: 'USD'
    },
    status: 'active',
    priority: 'high',
    assignedTo: 'agent@travel.com',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-20T15:45:00Z',
    notes: 'Honeymoon couple looking for luxury experience',
    communicationPreference: 'email'
  };

  const customerDetails = {
    name: 'John & Sarah Smith',
    email: 'john.smith@email.com',
    phone: '+1 234-567-8900'
  };

  const sampleItinerary = [
    {
      day: 1,
      date: '2024-03-15',
      city: 'Bangkok',
      title: 'Arrival in Bangkok',
      description: 'Welcome to Thailand! Private transfer to your luxury hotel.',
      hotel: {
        name: 'Mandarin Oriental Bangkok',
        rating: 5,
        roomType: 'Deluxe River View Suite',
        checkIn: '2024-03-15',
        checkOut: '2024-03-17'
      },
      activities: [
        {
          time: '10:00 AM',
          name: 'Airport Pickup',
          description: 'Private luxury transfer from Suvarnabhumi Airport',
          duration: '1 hour',
          type: 'transport'
        },
        {
          time: '2:00 PM',
          name: 'Hotel Check-in & Welcome',
          description: 'Settle into your romantic suite with river views',
          duration: '2 hours',
          type: 'accommodation'
        },
        {
          time: '7:00 PM',
          name: 'Romantic Dinner Cruise',
          description: 'Sunset dinner cruise along the Chao Phraya River',
          duration: '3 hours',
          type: 'dining'
        }
      ],
      transport: [
        {
          type: 'Private Car',
          route: 'Airport to Hotel',
          vehicle: 'Mercedes E-Class',
          duration: '45 minutes'
        }
      ],
      meals: {
        breakfast: false,
        lunch: false,
        dinner: true
      },
      totalCost: 450
    },
    {
      day: 2,
      date: '2024-03-16',
      city: 'Bangkok',
      title: 'Bangkok City Exploration',
      description: 'Discover the cultural treasures of Bangkok',
      activities: [
        {
          time: '9:00 AM',
          name: 'Grand Palace Tour',
          description: 'Explore the magnificent Grand Palace and Wat Pho temple',
          duration: '4 hours',
          type: 'sightseeing'
        },
        {
          time: '2:00 PM',
          name: 'Traditional Thai Massage',
          description: 'Couples spa treatment at luxury spa',
          duration: '2 hours',
          type: 'wellness'
        },
        {
          time: '7:00 PM',
          name: 'Rooftop Bar Experience',
          description: 'Cocktails at Sky Bar with panoramic city views',
          duration: '2 hours',
          type: 'dining'
        }
      ],
      meals: {
        breakfast: true,
        lunch: true,
        dinner: true
      },
      totalCost: 320
    }
  ];

  const agentDetails = {
    name: 'Sarah Johnson',
    title: 'Senior Travel Consultant',
    phone: '+1 555-0123',
    email: 'sarah.johnson@travelagency.com',
    whatsapp: '+1 555-0123',
    company: 'Dream Destinations Travel',
    logo: '/api/placeholder/150/60'
  };

  const renderPreviewContent = () => {
    return (
      <div className="space-y-8 text-gray-800">
        {/* Header Section */}
        <div className="text-center border-b pb-6">
          <div className="flex items-center justify-center mb-4">
            <img src={agentDetails.logo} alt="Company Logo" className="h-16" />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">{agentDetails.company}</h1>
          <h2 className="text-2xl font-semibold mb-2">{sampleQuery.destination.country} Travel Proposal</h2>
          <p className="text-lg text-muted-foreground">
            Customized {sampleQuery.packageType} Package for {customerDetails.name}
          </p>
          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <div><strong>Travel Dates:</strong> {sampleQuery.travelDates.from} to {sampleQuery.travelDates.to}</div>
            <div><strong>Duration:</strong> {sampleQuery.tripDuration.days} Days / {sampleQuery.tripDuration.nights} Nights</div>
            <div><strong>Travelers:</strong> {sampleQuery.paxDetails.adults} Adults</div>
          </div>
        </div>

        {/* Day-wise Itinerary */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-center mb-6">Day-wise Itinerary</h3>
          
          {sampleItinerary.map((day) => (
            <Card key={day.day} className="overflow-hidden">
              <div className="bg-primary text-primary-foreground p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xl font-bold">Day {day.day} - {day.title}</h4>
                    <p className="text-sm opacity-90">{day.date} | {day.city}</p>
                  </div>
                  <Badge variant="secondary" className="bg-white text-primary">
                    ${day.totalCost}
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-6 space-y-6">
                <p className="text-muted-foreground">{day.description}</p>

                {/* Hotel Information */}
                {day.hotel && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h5 className="font-semibold mb-2 flex items-center gap-2">
                      🏨 Accommodation
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium">{day.hotel.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ⭐ {day.hotel.rating} Star Hotel | {day.hotel.roomType}
                        </p>
                      </div>
                      <div className="text-sm">
                        <p><strong>Check-in:</strong> {day.hotel.checkIn}</p>
                        <p><strong>Check-out:</strong> {day.hotel.checkOut}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Activities */}
                <div>
                  <h5 className="font-semibold mb-3">Activities & Schedule</h5>
                  <div className="space-y-3">
                    {day.activities.map((activity, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-background rounded border-l-4 border-primary">
                        <div className="text-primary font-medium text-sm min-w-20">
                          {activity.time}
                        </div>
                        <div className="flex-1">
                          <h6 className="font-medium">{activity.name}</h6>
                          <p className="text-sm text-muted-foreground mb-1">{activity.description}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>⏱️ {activity.duration}</span>
                            <Badge variant="outline" className="text-xs">{activity.type}</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Meals */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">Meals Included</h5>
                  <div className="flex items-center gap-4 text-sm">
                    <span className={`flex items-center gap-1 ${day.meals.breakfast ? 'text-green-600' : 'text-muted-foreground'}`}>
                      🍳 Breakfast {day.meals.breakfast ? '✓' : '✗'}
                    </span>
                    <span className={`flex items-center gap-1 ${day.meals.lunch ? 'text-green-600' : 'text-muted-foreground'}`}>
                      🥗 Lunch {day.meals.lunch ? '✓' : '✗'}
                    </span>
                    <span className={`flex items-center gap-1 ${day.meals.dinner ? 'text-green-600' : 'text-muted-foreground'}`}>
                      🍽️ Dinner {day.meals.dinner ? '✓' : '✗'}
                    </span>
                  </div>
                </div>

                {/* Transport */}
                {day.transport && day.transport.length > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">Transportation</h5>
                    {day.transport.map((transport, index) => (
                      <div key={index} className="text-sm">
                        <p><strong>{transport.type}:</strong> {transport.route}</p>
                        <p className="text-muted-foreground">{transport.vehicle} | {transport.duration}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pricing Summary */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-4 text-center">Package Investment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Base Package (2 Adults)</span>
                  <span>$2,400</span>
                </div>
                <div className="flex justify-between">
                  <span>Luxury Upgrades</span>
                  <span>$350</span>
                </div>
                <div className="flex justify-between">
                  <span>Service Fees</span>
                  <span>$120</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total Investment</span>
                  <span className="text-primary">$2,870 USD</span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Package Includes:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>✓ Luxury accommodation for 6 nights</li>
                  <li>✓ Private airport transfers</li>
                  <li>✓ Daily breakfast</li>
                  <li>✓ Professional tour guide</li>
                  <li>✓ All entrance fees</li>
                  <li>✓ 24/7 support</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agent Contact Information */}
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-bold mb-4">Your Travel Consultant</h3>
            <div className="max-w-md mx-auto">
              <h4 className="font-semibold text-lg">{agentDetails.name}</h4>
              <p className="text-sm opacity-90 mb-3">{agentDetails.title}</p>
              <div className="space-y-1 text-sm">
                <p>📞 Phone: {agentDetails.phone}</p>
                <p>📧 Email: {agentDetails.email}</p>
                <p>💬 WhatsApp: {agentDetails.whatsapp}</p>
              </div>
              <p className="text-xs opacity-75 mt-3">
                Available 24/7 for your travel needs
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground border-t pt-4">
          <p>This proposal is valid for 15 days from the date of issue.</p>
          <p>Terms and conditions apply. Please contact us for detailed terms.</p>
        </div>
      </div>
    );
  };

  const getViewportClass = () => {
    switch (viewMode) {
      case 'tablet':
        return 'max-w-2xl';
      case 'mobile':
        return 'max-w-sm';
      default:
        return 'max-w-4xl';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold">{template.name}</h2>
              <p className="text-sm text-muted-foreground">PDF Template Preview</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center border rounded-lg p-1">
              <Button
                size="sm"
                variant={viewMode === 'desktop' ? 'default' : 'ghost'}
                onClick={() => setViewMode('desktop')}
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'tablet' ? 'default' : 'ghost'}
                onClick={() => setViewMode('tablet')}
              >
                <Tablet className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'mobile' ? 'default' : 'ghost'}
                onClick={() => setViewMode('mobile')}
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setZoomLevel(Math.max(25, zoomLevel - 25))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm px-2">{zoomLevel}%</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setZoomLevel(Math.min(200, zoomLevel + 25))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setZoomLevel(100)}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {/* Actions */}
            <Button variant="outline">
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-1" />
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 bg-gray-100 overflow-auto">
        <div className="p-8">
          <div 
            className={`mx-auto bg-white shadow-lg transition-all duration-300 ${getViewportClass()}`}
            style={{ 
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center'
            }}
          >
            <div className="p-8">
              {renderPreviewContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Page Controls */}
      <div className="border-t bg-background px-6 py-3">
        <div className="flex items-center justify-center gap-4">
          <Button size="sm" variant="outline" disabled={currentPage === 1}>
            Previous
          </Button>
          <span className="text-sm">Page {currentPage} of 1</span>
          <Button size="sm" variant="outline" disabled>
            Next
          </Button>
          <Button size="sm" variant="outline">
            <Printer className="h-4 w-4 mr-1" />
            Print Preview
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TemplatePreview;