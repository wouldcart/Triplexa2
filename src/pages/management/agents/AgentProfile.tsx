
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  BarChart3, 
  Calendar, 
  CheckCheck, 
  Clock, 
  FileText, 
  Globe, 
  Mail, 
  MapPin, 
  Phone, 
  PieChart, 
  Star, 
  Users, 
  Building, 
  User
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import PageLayout from '@/components/layout/PageLayout';
import { 
  getQueriesByAgentId, 
  getBookingsByAgentId,
  getCustomersByAgentId,
  getRecentActivity,
  getStaffAssignmentsForAgent
} from '@/data/agentData';
import { AgentManagementService } from '@/services/agentManagementService';
import { Agent, AgentActivity, Customer } from '@/types/agent';
import { Query } from '@/types/query';
import StaffAssignmentTab from './components/StaffAssignmentTab';
import type { Agent as UiAgent } from '@/types/agent';

const AgentProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [agent, setAgent] = useState<UiAgent | null>(null);
  const [queries, setQueries] = useState<Query[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [recentActivity, setRecentActivity] = useState<AgentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAgentData = async () => {
    if (id) {
      const { data, error } = await AgentManagementService.getAgentById(String(id));
      if (error) {
        console.error('Failed to load agent', error);
      }
      if (data) {
        const a = data as any;
        const uiAgent: UiAgent = {
          id: 0,
          name: a.name || '',
          email: a.email || '',
          country: a.country || '',
          city: a.city || '',
          type: (a.type === 'company' ? 'company' : 'individual'),
          status: a.status === 'active' ? 'active' : 'inactive',
          commissionType: (a.commission_type === 'flat' ? 'flat' : 'percentage'),
          commissionValue: (a.commission_value !== undefined && a.commission_value !== null) ? String(a.commission_value) : '',
          profileImage: a.profile_image || undefined,
          contact: {
            email: a.email || '',
            phone: a.phone || ''
          },
          joinDate: a.created_at || new Date().toISOString(),
          createdAt: a.created_at || new Date().toISOString(),
          source: {
            type: (a.source_type || 'website'),
            details: a.source_details || ''
          },
          stats: {
            totalQueries: 0,
            totalBookings: 0,
            conversionRate: 0,
            revenueGenerated: 0,
            averageBookingValue: 0,
            activeCustomers: 0
          },
          recentActivity: [],
          staffAssignments: []
        };
        setAgent(uiAgent);
        // keep mock tabs for now
        const agentIdNum = parseInt(id);
        setQueries(getQueriesByAgentId(agentIdNum));
        setBookings(getBookingsByAgentId(agentIdNum));
        setCustomers(getCustomersByAgentId(agentIdNum));
        setRecentActivity(getRecentActivity(agentIdNum));
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgentData();
  }, [id]);

  // Handler for when staff assignments change
  const handleAssignmentChange = () => {
    loadAgentData();
  };

  if (loading) {
    return (
      <PageLayout title="Agent Profile">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading agent profile...</p>
        </div>
      </PageLayout>
    );
  }

  if (!agent) {
    return (
      <PageLayout title="Agent Profile">
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">Agent not found</p>
        </div>
      </PageLayout>
    );
  }

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd MMM yyyy');
    } catch (e) {
      return dateStr;
    }
  };

  const formatDateTime = (dateTimeStr: string) => {
    try {
      return format(new Date(dateTimeStr), 'dd MMM yyyy, HH:mm');
    } catch (e) {
      return dateTimeStr;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <PageLayout
      title="Agent Profile"
      breadcrumbItems={[
        { title: "Home", href: "/" },
        { title: "Agent Management", href: "/management/agents" },
        { title: agent.name, href: `/management/agents/view/${agent.id}` },
      ]}
    >
      <div className="space-y-6">
        {/* Agent Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <Avatar className="h-24 w-24 border">
                {agent.profileImage ? (
                  <AvatarImage src={agent.profileImage} alt={agent.name} />
                ) : (
                  <AvatarFallback className="text-3xl">
                    {agent.type === 'company' ? 
                      <Building className="h-12 w-12" /> : 
                      <User className="h-12 w-12" />
                    }
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1">
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{agent.name}</h2>
                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                      <Globe className="h-4 w-4" />
                      <span>{agent.city}, {agent.country}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-start md:items-end mt-2 md:mt-0 space-y-2">
                    <Badge variant={agent.status === 'active' ? 'success' : 'secondary'}>
                      {agent.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                    <div className="text-sm text-muted-foreground flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>Joined: {formatDate(agent.joinDate)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${agent.contact.email}`} className="text-sm hover:underline">
                        {agent.contact.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${agent.contact.phone}`} className="text-sm hover:underline">
                        {agent.contact.phone}
                      </a>
                    </div>
                    {agent.contact.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a href={`https://${agent.contact.website}`} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline">
                          {agent.contact.website}
                        </a>
                      </div>
                    )}
                  </div>
                  <div>
                    {agent.contact.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                        <span className="text-sm">{agent.contact.address}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Star className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Commission: {agent.commissionValue} ({agent.commissionType})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm capitalize">
                        Type: {agent.type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Conversion Rate</span>
                    <span className="text-sm font-medium">{agent.stats.conversionRate}%</span>
                  </div>
                  <Progress value={agent.stats.conversionRate} className="h-2 mt-1" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Total Queries</span>
                    <span className="text-2xl font-bold">{agent.stats.totalQueries}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Confirmed Bookings</span>
                    <span className="text-2xl font-bold">{agent.stats.totalBookings}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                <span className="text-3xl font-bold">
                  {formatCurrency(agent.stats.revenueGenerated)}
                </span>
                <span className="text-sm text-muted-foreground mt-2">
                  Avg. Booking Value: {formatCurrency(agent.stats.averageBookingValue)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Customer Base</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                <span className="text-3xl font-bold">{agent.stats.activeCustomers}</span>
                <span className="text-sm text-muted-foreground mt-2">Active customers</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="queries">
          <TabsList>
            <TabsTrigger value="queries">Queries</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="staff">Staff Assignment</TabsTrigger>
          </TabsList>

          {/* Queries Tab */}
          <TabsContent value="queries" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Enquiries & Queries</CardTitle>
              </CardHeader>
              <CardContent>
                {queries.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">ID</th>
                          <th className="text-left p-2">Destination</th>
                          <th className="text-left p-2">Travel Dates</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-left p-2">Created At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {queries.map((query) => (
                          <tr key={query.id} className="border-b hover:bg-muted/50">
                            <td className="p-2">{query.id}</td>
                            <td className="p-2">
                              {query.destination.country} ({query.destination.cities.join(', ')})
                            </td>
                            <td className="p-2">
                              {formatDate(query.travelDates.from)} to {formatDate(query.travelDates.to)}
                            </td>
                            <td className="p-2">
                              <Badge variant={
                                query.status === 'new' ? 'default' :
                                query.status === 'confirmed' ? 'success' : 'secondary'
                              }>
                                {query.status}
                              </Badge>
                            </td>
                            <td className="p-2">
                              {formatDateTime(query.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No queries found for this agent</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Confirmed Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {bookings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Booking ID</th>
                          <th className="text-left p-2">Customer</th>
                          <th className="text-left p-2">Destination</th>
                          <th className="text-left p-2">Travel Dates</th>
                          <th className="text-left p-2">Amount</th>
                          <th className="text-left p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map((booking) => (
                          <tr key={booking.id} className="border-b hover:bg-muted/50">
                            <td className="p-2">{booking.id}</td>
                            <td className="p-2">{booking.customerName}</td>
                            <td className="p-2">{booking.destination}</td>
                            <td className="p-2">
                              {formatDate(booking.travelDates.from)} to {formatDate(booking.travelDates.to)}
                            </td>
                            <td className="p-2">{formatCurrency(booking.totalAmount)}</td>
                            <td className="p-2">
                              <Badge variant={
                                booking.status === 'confirmed' ? 'success' : 'secondary'
                              }>
                                {booking.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No bookings found for this agent</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Top Customers</CardTitle>
              </CardHeader>
              <CardContent>
                {customers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Customer</th>
                          <th className="text-left p-2">Contact</th>
                          <th className="text-left p-2">Bookings</th>
                          <th className="text-left p-2">Total Spent</th>
                          <th className="text-left p-2">Last Booking</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customers.map((customer) => (
                          <tr key={customer.id} className="border-b hover:bg-muted/50">
                            <td className="p-2">{customer.name}</td>
                            <td className="p-2">
                              <div>{customer.email}</div>
                              {customer.phone && <div className="text-xs text-muted-foreground">{customer.phone}</div>}
                            </td>
                            <td className="p-2">{customer.bookingsCount}</td>
                            <td className="p-2">{formatCurrency(customer.totalSpent)}</td>
                            <td className="p-2">
                              {customer.lastBookingDate ? formatDate(customer.lastBookingDate) : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No customers data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex gap-4 pb-4 border-b last:border-0">
                        <div className="min-w-8 mt-1">
                          {activity.action.includes('Query') && <FileText className="h-6 w-6 text-blue-500" />}
                          {activity.action.includes('Booking') && <CheckCheck className="h-6 w-6 text-green-500" />}
                          {activity.action.includes('Customer') && <Users className="h-6 w-6 text-purple-500" />}
                          {activity.action.includes('Proposal') && <PieChart className="h-6 w-6 text-orange-500" />}
                          {!activity.action.includes('Query') && 
                           !activity.action.includes('Booking') && 
                           !activity.action.includes('Customer') && 
                           !activity.action.includes('Proposal') && 
                           <Clock className="h-6 w-6 text-gray-500" />}
                        </div>
                        <div>
                          <div className="font-medium">{activity.action}</div>
                          <div className="text-sm text-muted-foreground">{activity.details}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatDateTime(activity.date)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No recent activity recorded</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staff Assignment Tab */}
          <TabsContent value="staff" className="space-y-4 mt-4">
            <StaffAssignmentTab agent={agent} onAssignmentChange={handleAssignmentChange} />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default AgentProfile;
