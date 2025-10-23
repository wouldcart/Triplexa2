
import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Headphones, 
  Ticket, 
  MessageSquare, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Search,
  BookOpen,
  Phone,
  Mail
} from 'lucide-react';
import { useAccessControl } from '@/hooks/use-access-control';

const SupportDashboard: React.FC = () => {
  const { canAccessModule } = useAccessControl();

  if (!canAccessModule('support-dashboard')) {
    return (
      <PageLayout title="Access Denied">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">You don't have access to this dashboard.</p>
        </div>
      </PageLayout>
    );
  }

  const supportStats = {
    newTickets: 12,
    openTickets: 28,
    resolvedTickets: 156,
    avgResolutionTime: '4.2 hrs'
  };

  const recentTickets = [
    { id: 1, title: 'Booking Cancellation Request', client: 'Dream Tours', priority: 'High', status: 'Open', time: '2 hrs ago' },
    { id: 2, title: 'Payment Gateway Issue', client: 'Travel Express', priority: 'Critical', status: 'In Progress', time: '4 hrs ago' },
    { id: 3, title: 'Itinerary Modification', client: 'Wanderlust Co.', priority: 'Medium', status: 'Resolved', time: '1 day ago' }
  ];

  return (
    <PageLayout
      title="Support Dashboard"
      breadcrumbItems={[
        { title: "Home", href: "/" },
        { title: "Support Dashboard", href: "/dashboards/support" },
      ]}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Customer Support Dashboard</h2>
            <p className="text-muted-foreground">Handle agent complaints, booking issues, and refund requests</p>
          </div>
          <div className="flex gap-2">
            <Button>
              <Ticket className="mr-2 h-4 w-4" />
              New Ticket
            </Button>
          </div>
        </div>

        {/* Support Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Tickets</CardTitle>
              <Ticket className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{supportStats.newTickets}</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{supportStats.openTickets}</div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{supportStats.resolvedTickets}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
              <Clock className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{supportStats.avgResolutionTime}</div>
              <p className="text-xs text-muted-foreground">Response time</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tickets" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tickets">
              <Ticket className="mr-2 h-4 w-4" />
              Ticketing System
            </TabsTrigger>
            <TabsTrigger value="refunds">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Refunds & Amendments
            </TabsTrigger>
            <TabsTrigger value="bookings">
              <Search className="mr-2 h-4 w-4" />
              Booking Status
            </TabsTrigger>
            <TabsTrigger value="knowledge">
              <BookOpen className="mr-2 h-4 w-4" />
              Knowledge Base
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tickets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Smart Ticketing System</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTickets.map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${
                          ticket.priority === 'Critical' ? 'bg-red-500' :
                          ticket.priority === 'High' ? 'bg-orange-500' : 'bg-blue-500'
                        }`}></div>
                        <div>
                          <p className="font-medium">{ticket.title}</p>
                          <p className="text-sm text-muted-foreground">{ticket.client} • {ticket.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={
                          ticket.priority === 'Critical' ? 'destructive' :
                          ticket.priority === 'High' ? 'destructive' : 'secondary'
                        }>
                          {ticket.priority}
                        </Badge>
                        <Badge variant={ticket.status === 'Resolved' ? 'default' : 'outline'}>
                          {ticket.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="refunds" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Refund & Amendment Center</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Automated workflow with approval routing</p>
                  <Button className="mt-4">
                    Process Refunds
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Booking Status Tracker</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Real-time booking monitoring across all systems</p>
                  <Button className="mt-4">
                    Check Booking Status
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="knowledge" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Knowledge Base Access</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center p-6 border rounded-lg">
                    <BookOpen className="h-8 w-8 mx-auto mb-3 text-blue-500" />
                    <h3 className="font-medium mb-2">FAQ Library</h3>
                    <p className="text-sm text-muted-foreground mb-4">Searchable frequently asked questions</p>
                    <Button variant="outline" size="sm">Browse FAQ</Button>
                  </div>
                  <div className="text-center p-6 border rounded-lg">
                    <MessageSquare className="h-8 w-8 mx-auto mb-3 text-green-500" />
                    <h3 className="font-medium mb-2">Quick Templates</h3>
                    <p className="text-sm text-muted-foreground mb-4">Pre-configured response templates</p>
                    <Button variant="outline" size="sm">Use Templates</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Communication Center */}
        <Card>
          <CardHeader>
            <CardTitle>Communication Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <MessageSquare className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <div className="text-lg font-semibold">45</div>
                <p className="text-sm text-muted-foreground">Chat Messages</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Mail className="h-6 w-6 mx-auto mb-2 text-green-500" />
                <div className="text-lg font-semibold">28</div>
                <p className="text-sm text-muted-foreground">Email Threads</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <Phone className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                <div className="text-lg font-semibold">12</div>
                <p className="text-sm text-muted-foreground">Call Logs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default SupportDashboard;
