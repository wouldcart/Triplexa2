
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Eye, Edit, Mail, Bell, Search, Filter, 
  Calendar, MapPin, Users, DollarSign, Clock 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Booking {
  id: string;
  queryId: string;
  customerName: string;
  destination: string;
  travelDates: {
    from: string;
    to: string;
  };
  pax: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
  confirmedAt?: string;
  agentName: string;
  paymentStatus: 'pending' | 'partial' | 'completed';
  specialRequests: string[];
}

const mockBookings: Booking[] = [
  {
    id: 'BK-2025-001',
    queryId: 'ENQ20250001',
    customerName: 'John & Sarah Smith',
    destination: 'Thailand (Bangkok, Ayutthaya)',
    travelDates: {
      from: '2025-02-14',
      to: '2025-02-19'
    },
    pax: 2,
    totalAmount: 2850,
    status: 'confirmed',
    createdAt: '2025-01-20T14:30:00Z',
    confirmedAt: '2025-01-21T09:15:00Z',
    agentName: 'Bangkok Explorer Tours',
    paymentStatus: 'partial',
    specialRequests: ['Temple tours', 'Traditional massage']
  },
  {
    id: 'BK-2025-002',
    queryId: 'ENQ20250002',
    customerName: 'Johnson Family',
    destination: 'Thailand (Phuket, Krabi)',
    travelDates: {
      from: '2025-03-10',
      to: '2025-03-17'
    },
    pax: 6,
    totalAmount: 5240,
    status: 'pending',
    createdAt: '2025-01-22T11:20:00Z',
    agentName: 'Island Paradise Travel',
    paymentStatus: 'pending',
    specialRequests: ['Beach activities', 'Kids-friendly restaurants']
  },
  {
    id: 'BK-2025-003',
    queryId: 'ENQ20250003',
    customerName: 'Michael & Emma Williams',
    destination: 'Thailand (Koh Samui, Bangkok)',
    travelDates: {
      from: '2025-04-20',
      to: '2025-04-28'
    },
    pax: 2,
    totalAmount: 8900,
    status: 'confirmed',
    createdAt: '2025-01-23T16:45:00Z',
    confirmedAt: '2025-01-24T10:30:00Z',
    agentName: 'Luxury Thailand Escapes',
    paymentStatus: 'completed',
    specialRequests: ['Private villa', 'Yacht charter']
  }
];

export const EnhancedBookingsTable: React.FC = () => {
  const { toast } = useToast();
  const [bookings] = useState<Booking[]>(mockBookings);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>(mockBookings);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailData, setEmailData] = useState({
    subject: '',
    message: ''
  });

  React.useEffect(() => {
    let filtered = [...bookings];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.queryId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.agentName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    setFilteredBookings(filtered);
  }, [searchTerm, statusFilter, bookings]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, label: 'Pending' },
      confirmed: { variant: 'default' as const, label: 'Confirmed' },
      cancelled: { variant: 'destructive' as const, label: 'Cancelled' },
      completed: { variant: 'outline' as const, label: 'Completed' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'destructive' as const, label: 'Pending' },
      partial: { variant: 'secondary' as const, label: 'Partial' },
      completed: { variant: 'default' as const, label: 'Paid' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleSendConfirmation = () => {
    if (!selectedBooking) return;

    // In a real app, this would send an actual email
    console.log('Sending confirmation email:', {
      bookingId: selectedBooking.id,
      queryId: selectedBooking.queryId,
      customer: selectedBooking.customerName,
      ...emailData
    });

    toast({
      title: 'Confirmation Sent',
      description: `Booking confirmation sent to ${selectedBooking.customerName}`
    });

    // Send system notification
    toast({
      title: 'System Notification',
      description: `Booking ${selectedBooking.id} confirmation processed`
    });

    setEmailDialogOpen(false);
    setEmailData({ subject: '', message: '' });
  };

  const handleStatusUpdate = (bookingId: string, newStatus: string) => {
    // In a real app, this would update the database
    console.log('Updating booking status:', { bookingId, newStatus });

    toast({
      title: 'Status Updated',
      description: `Booking ${bookingId} status changed to ${newStatus}`
    });

    // Send system notification
    toast({
      title: 'System Notification',
      description: `Booking status update notification sent to stakeholders`
    });
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Booking Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by Query ID, customer, destination, or agent..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Query ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Travel Dates</TableHead>
                  <TableHead>PAX</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.id}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{booking.queryId}</Badge>
                    </TableCell>
                    <TableCell>{booking.customerName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{booking.destination}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(booking.travelDates.from).toLocaleDateString()}</div>
                        <div className="text-muted-foreground">
                          to {new Date(booking.travelDates.to).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span>{booking.pax}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{booking.totalAmount.toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    <TableCell>{getPaymentStatusBadge(booking.paymentStatus)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {booking.agentName}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedBooking(booking);
                                setEmailData({
                                  subject: `Booking Confirmation - ${booking.id}`,
                                  message: `Dear ${booking.customerName},\n\nYour booking has been confirmed for your trip to ${booking.destination}.\n\nBooking Details:\n- Query ID: ${booking.queryId}\n- Travel Dates: ${new Date(booking.travelDates.from).toLocaleDateString()} to ${new Date(booking.travelDates.to).toLocaleDateString()}\n- Total Amount: $${booking.totalAmount.toLocaleString()}\n\nThank you for choosing us for your travel needs.`
                                });
                              }}
                            >
                              <Mail className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Send Booking Confirmation</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Subject</label>
                                <Input
                                  value={emailData.subject}
                                  onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">Message</label>
                                <Textarea
                                  value={emailData.message}
                                  onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                                  rows={8}
                                />
                              </div>
                              <div className="flex gap-2 justify-end">
                                <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleSendConfirmation}>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Send Confirmation
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                        >
                          <Bell className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {filteredBookings.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No bookings found matching your criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
