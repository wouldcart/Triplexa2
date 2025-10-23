
import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plane, 
  Hotel, 
  Bus, 
  Calendar, 
  Bell, 
  FileText, 
  Activity,
  Users,
  MapPin,
  Clock
} from 'lucide-react';
import { useAccessControl } from '@/hooks/use-access-control';
import { LogoutButton } from '@/components/common/LogoutButton';

const OperationsDashboard: React.FC = () => {
  const { canAccessModule } = useAccessControl();

  if (!canAccessModule('operations-dashboard')) {
    return (
      <PageLayout title="Access Denied">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">You don't have access to this dashboard.</p>
        </div>
      </PageLayout>
    );
  }

  const bookingsData = {
    confirmed: 45,
    pending: 12,
    cancelled: 3
  };

  const todayDepartures = [
    { id: 1, flight: 'AI 101', destination: 'Delhi', time: '09:30', status: 'On Time' },
    { id: 2, flight: 'SG 203', destination: 'Mumbai', time: '14:15', status: 'Delayed' },
    { id: 3, flight: 'UK 456', destination: 'Bangalore', time: '18:45', status: 'On Time' }
  ];

  return (
    <PageLayout
      title="Operations Dashboard"
      breadcrumbItems={[
        { title: "Home", href: "/" },
        { title: "Operations Dashboard", href: "/dashboards/operations" },
      ]}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Operations Executive Dashboard</h2>
            <p className="text-muted-foreground">Manage bookings, vendor coordination, and logistics</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Bell className="mr-2 h-4 w-4" />
              Notifications (3)
            </Button>
          </div>
          <LogoutButton />
        </div>

        {/* Bookings Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmed Bookings</CardTitle>
              <div className="h-4 w-4 bg-green-500 rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{bookingsData.confirmed}</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Bookings</CardTitle>
              <div className="h-4 w-4 bg-yellow-500 rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{bookingsData.pending}</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cancelled Bookings</CardTitle>
              <div className="h-4 w-4 bg-red-500 rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{bookingsData.cancelled}</div>
              <p className="text-xs text-muted-foreground">-3% from last month</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="departures" className="space-y-4">
          <TabsList>
            <TabsTrigger value="departures">
              <Plane className="mr-2 h-4 w-4" />
              Today's Departures
            </TabsTrigger>
            <TabsTrigger value="hotels">
              <Hotel className="mr-2 h-4 w-4" />
              Hotel Allocations
            </TabsTrigger>
            <TabsTrigger value="vendors">
              <Users className="mr-2 h-4 w-4" />
              Vendor Coordination
            </TabsTrigger>
            <TabsTrigger value="itineraries">
              <MapPin className="mr-2 h-4 w-4" />
              Itinerary Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="departures" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Today's Departures & Arrivals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todayDepartures.map((departure) => (
                    <div key={departure.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Plane className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">{departure.flight}</p>
                          <p className="text-sm text-muted-foreground">{departure.destination}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-medium">{departure.time}</p>
                          <Badge variant={departure.status === 'On Time' ? 'default' : 'destructive'}>
                            {departure.status}
                          </Badge>
                        </div>
                        <Button variant="outline" size="sm">
                          <Bell className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hotels" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Hotel & Transport Allocation Tracker</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Hotel className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Hotel allocation tracking will be implemented here</p>
                  <Button className="mt-4">
                    Manage Allocations
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vendors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Vendor Coordination Panel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Vendor coordination panel will be implemented here</p>
                  <Button className="mt-4">
                    Contact Vendors
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="itineraries" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Itinerary Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Itinerary editing and uploading tools will be implemented here</p>
                  <Button className="mt-4">
                    <FileText className="mr-2 h-4 w-4" />
                    Upload Itinerary
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex flex-col">
                <FileText className="h-6 w-6 mb-2" />
                PNR Upload
              </Button>
              <Button variant="outline" className="h-20 flex flex-col">
                <Activity className="h-6 w-6 mb-2" />
                Activity Log
              </Button>
              <Button variant="outline" className="h-20 flex flex-col">
                <Clock className="h-6 w-6 mb-2" />
                Real-time Updates
              </Button>
              <Button variant="outline" className="h-20 flex flex-col">
                <Calendar className="h-6 w-6 mb-2" />
                Schedule View
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default OperationsDashboard;
