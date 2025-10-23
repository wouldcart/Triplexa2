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
  Edit, 
  Phone, 
  Mail, 
  Calendar,
  Users,
  MapPin,
  Clock,
  DollarSign
} from 'lucide-react';
import { useAccessControl } from '@/hooks/use-access-control';

const SalesEnquiries: React.FC = () => {
  const { canAccessModule } = useAccessControl();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('new');

  if (!canAccessModule('sales-dashboard')) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">You don't have access to this module.</p>
      </div>
    );
  }

  const enquiries = [
    {
      id: 'ENQ001',
      client: 'Dream Tours Pvt Ltd',
      contact: 'Rahul Sharma',
      email: 'rahul@dreamtours.com',
      phone: '+91 98765 43210',
      destination: 'Thailand, Malaysia',
      travelers: 15,
      budget: '₹4,50,000',
      status: 'new',
      priority: 'high',
      dateReceived: '2024-01-15',
      followUpDate: '2024-01-18',
      duration: '7 Days',
      requirements: 'Corporate group, luxury accommodation'
    },
    {
      id: 'ENQ002',
      client: 'Vacation Paradise',
      contact: 'Priya Patel',
      email: 'priya@vacationparadise.com',
      phone: '+91 87654 32109',
      destination: 'Dubai, Abu Dhabi',
      travelers: 8,
      budget: '₹2,80,000',
      status: 'hot',
      priority: 'medium',
      dateReceived: '2024-01-14',
      followUpDate: '2024-01-17',
      duration: '5 Days',
      requirements: 'Family group, mid-range hotels'
    },
    {
      id: 'ENQ003',
      client: 'Travel Express',
      contact: 'Amit Kumar',
      email: 'amit@travelexpress.com',
      phone: '+91 76543 21098',
      destination: 'Singapore, Bali',
      travelers: 25,
      budget: '₹6,25,000',
      status: 'followup',
      priority: 'high',
      dateReceived: '2024-01-12',
      followUpDate: '2024-01-16',
      duration: '9 Days',
      requirements: 'Group booking, customized itinerary'
    }
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      new: 'bg-blue-100 text-blue-800',
      hot: 'bg-orange-100 text-orange-800',
      followup: 'bg-yellow-100 text-yellow-800',
      converted: 'bg-green-100 text-green-800',
      lost: 'bg-red-100 text-red-800'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: 'destructive',
      medium: 'default',
      low: 'secondary'
    };
    return variants[priority as keyof typeof variants] || 'secondary';
  };

  const filteredEnquiries = enquiries.filter(enquiry => {
    const matchesSearch = enquiry.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         enquiry.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         enquiry.destination.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || enquiry.status === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Enquiry Management</h1>
          <p className="text-muted-foreground">Manage and track all customer enquiries</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Enquiry
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search enquiries..."
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
          <TabsTrigger value="all">All ({enquiries.length})</TabsTrigger>
          <TabsTrigger value="new">New ({enquiries.filter(e => e.status === 'new').length})</TabsTrigger>
          <TabsTrigger value="hot">Hot ({enquiries.filter(e => e.status === 'hot').length})</TabsTrigger>
          <TabsTrigger value="followup">Follow-up ({enquiries.filter(e => e.status === 'followup').length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredEnquiries.map((enquiry) => (
            <Card key={enquiry.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{enquiry.client}</CardTitle>
                      <Badge className={getStatusBadge(enquiry.status)} variant="secondary">
                        {enquiry.status.toUpperCase()}
                      </Badge>
                        <Badge variant={getPriorityBadge(enquiry.priority) as "default" | "destructive" | "outline" | "secondary" | "success"}>
                          {enquiry.priority.toUpperCase()}
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">ID: {enquiry.id}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
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
                    <span className="text-sm">{enquiry.contact}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{enquiry.destination}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{enquiry.travelers} travelers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{enquiry.budget}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="ml-2 font-medium">{enquiry.duration}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Received:</span>
                    <span className="ml-2">{new Date(enquiry.dateReceived).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Follow-up:</span>
                    <span className="ml-1 text-orange-600 font-medium">
                      {new Date(enquiry.followUpDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-muted-foreground text-sm">Requirements:</span>
                  <p className="text-sm mt-1">{enquiry.requirements}</p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button size="sm">Convert to Quote</Button>
                  <Button variant="outline" size="sm">Schedule Follow-up</Button>
                  <Button variant="outline" size="sm">Add Notes</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SalesEnquiries;