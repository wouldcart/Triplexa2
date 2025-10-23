import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Download, 
  Phone, 
  Mail, 
  Calendar,
  Users,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { useAccessControl } from '@/hooks/use-access-control';

const SalesBookings: React.FC = () => {
  const { canAccessModule } = useAccessControl();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('confirmed');

  if (!canAccessModule('sales-dashboard')) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">You don't have access to this module.</p>
      </div>
    );
  }

  const bookings = [
    {
      id: 'BKG001',
      enquiryId: 'ENQ001',
      client: 'Dream Tours Pvt Ltd',
      contact: 'Rahul Sharma',
      email: 'rahul@dreamtours.com',
      phone: '+91 98765 43210',
      destination: 'Thailand Package',
      travelers: 15,
      totalAmount: '₹4,75,000',
      paidAmount: '₹2,37,500',
      balanceAmount: '₹2,37,500',
      status: 'confirmed',
      bookingDate: '2024-01-16',
      travelDate: '2024-02-15',
      duration: '7 Days, 6 Nights',
      commission: '₹47,500',
      paymentStatus: 'partial'
    },
    {
      id: 'BKG002',
      enquiryId: 'ENQ002',
      client: 'Vacation Paradise',
      contact: 'Priya Patel',
      email: 'priya@vacationparadise.com',
      phone: '+91 87654 32109',
      destination: 'Dubai Deluxe',
      travelers: 8,
      totalAmount: '₹3,20,000',
      paidAmount: '₹3,20,000',
      balanceAmount: '₹0',
      status: 'confirmed',
      bookingDate: '2024-01-14',
      travelDate: '2024-01-28',
      duration: '5 Days, 4 Nights',
      commission: '₹32,000',
      paymentStatus: 'paid'
    },
    {
      id: 'BKG003',
      enquiryId: 'ENQ005',
      client: 'Business Travels',
      contact: 'Suresh Gupta',
      email: 'suresh@businesstravels.com',
      phone: '+91 98765 11111',
      destination: 'Singapore Corporate',
      travelers: 12,
      totalAmount: '₹5,40,000',
      paidAmount: '₹1,62,000',
      balanceAmount: '₹3,78,000',
      status: 'pending',
      bookingDate: '2024-01-18',
      travelDate: '2024-03-10',
      duration: '4 Days, 3 Nights',
      commission: '₹54,000',
      paymentStatus: 'advance'
    }
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      confirmed: { class: 'bg-green-100 text-green-800', icon: CheckCircle },
      pending: { class: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
      cancelled: { class: 'bg-red-100 text-red-800', icon: XCircle },
      completed: { class: 'bg-blue-100 text-blue-800', icon: CheckCircle }
    };
    return variants[status as keyof typeof variants] || { class: 'bg-gray-100 text-gray-800', icon: Clock };
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants = {
      paid: 'bg-green-100 text-green-800',
      partial: 'bg-orange-100 text-orange-800',
      advance: 'bg-blue-100 text-blue-800',
      pending: 'bg-red-100 text-red-800'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.destination.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || booking.status === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Booking Management</h1>
          <p className="text-muted-foreground">Track and manage confirmed bookings and payments</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Manual Booking
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold">{bookings.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">₹13.35L</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Commission Earned</p>
                <p className="text-2xl font-bold">₹1.34L</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Payments</p>
                <p className="text-2xl font-bold">₹6.16L</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bookings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({bookings.length})</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed ({bookings.filter(b => b.status === 'confirmed').length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({bookings.filter(b => b.status === 'pending').length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({bookings.filter(b => b.status === 'completed').length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredBookings.map((booking) => {
            const statusInfo = getStatusBadge(booking.status);
            const StatusIcon = statusInfo.icon;
            
            return (
              <Card key={booking.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{booking.client}</CardTitle>
                        <Badge className={statusInfo.class} variant="secondary">
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {booking.status.toUpperCase()}
                        </Badge>
                        <Badge className={getPaymentStatusBadge(booking.paymentStatus)} variant="secondary">
                          {booking.paymentStatus.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Booking ID: {booking.id} | Enquiry: {booking.enquiryId}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Mail className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{booking.contact}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{booking.destination}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{booking.travelers} travelers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{booking.duration}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-muted-foreground text-sm">Total Amount:</span>
                      <p className="font-semibold">{booking.totalAmount}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm">Paid:</span>
                      <p className="font-semibold text-green-600">{booking.paidAmount}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm">Balance:</span>
                      <p className="font-semibold text-orange-600">{booking.balanceAmount}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm">Commission:</span>
                      <p className="font-semibold text-purple-600">{booking.commission}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Booking Date:</span>
                      <span className="ml-2">{new Date(booking.bookingDate).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Travel Date:</span>
                      <span className="ml-2 font-medium">{new Date(booking.travelDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button size="sm">Send Voucher</Button>
                    <Button variant="outline" size="sm">Payment Reminder</Button>
                    <Button variant="outline" size="sm">Update Status</Button>
                    <Button variant="outline" size="sm">Add Note</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SalesBookings;