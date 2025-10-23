import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdvancedSearchFilter, FilterGroup } from '@/components/dashboard/AdvancedSearchFilter';
import { 
  FileText, 
  Calendar, 
  Users, 
  Upload, 
  Wallet, 
  BookOpen, 
  Settings,
  Plus,
  Search,
  Filter
} from 'lucide-react';

// Proposals Section
export const ProposalsSection: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});

  const allProposals = [
    { id: 1, title: "Bali Adventure Package", client: "John Smith", status: "pending", amount: 2500, destination: "Bali", date: "2024-03-15" },
    { id: 2, title: "European Tour", client: "Sarah Johnson", status: "approved", amount: 5200, destination: "Europe", date: "2024-04-20" },
    { id: 3, title: "Safari Experience", client: "Mike Wilson", status: "draft", amount: 3800, destination: "Africa", date: "2024-05-10" },
    { id: 4, title: "Tokyo City Break", client: "Emma Davis", status: "pending", amount: 1800, destination: "Japan", date: "2024-03-25" },
    { id: 5, title: "Caribbean Cruise", client: "Robert Brown", status: "approved", amount: 4200, destination: "Caribbean", date: "2024-06-15" },
    { id: 6, title: "Mountain Trek Nepal", client: "Lisa Wilson", status: "draft", amount: 2900, destination: "Nepal", date: "2024-07-01" },
  ];

  const filterGroups: FilterGroup[] = [
    {
      id: 'status',
      label: 'Status',
      type: 'multiselect',
      options: [
        { id: 'pending', label: 'Pending', value: 'pending', count: 2 },
        { id: 'approved', label: 'Approved', value: 'approved', count: 2 },
        { id: 'draft', label: 'Draft', value: 'draft', count: 2 },
      ]
    },
    {
      id: 'destination',
      label: 'Destination',
      type: 'multiselect',
      options: [
        { id: 'bali', label: 'Bali', value: 'Bali', count: 1 },
        { id: 'europe', label: 'Europe', value: 'Europe', count: 1 },
        { id: 'africa', label: 'Africa', value: 'Africa', count: 1 },
        { id: 'japan', label: 'Japan', value: 'Japan', count: 1 },
        { id: 'caribbean', label: 'Caribbean', value: 'Caribbean', count: 1 },
        { id: 'nepal', label: 'Nepal', value: 'Nepal', count: 1 },
      ]
    },
    {
      id: 'amount',
      label: 'Amount Range',
      type: 'range',
      min: 0,
      max: 10000
    },
    {
      id: 'date',
      label: 'Date Range',
      type: 'date'
    }
  ];

  const quickFilters = [
    { id: 'pending', label: 'Pending', value: 'pending', count: 2 },
    { id: 'high-value', label: 'High Value (>$4000)', value: 'high-value', count: 2 },
    { id: 'this-month', label: 'This Month', value: 'this-month', count: 3 },
  ];

  const filteredProposals = useMemo(() => {
    let filtered = allProposals;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(proposal =>
        proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        proposal.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        proposal.destination.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(proposal => filters.status.includes(proposal.status));
    }

    // Apply destination filter
    if (filters.destination && filters.destination.length > 0) {
      filtered = filtered.filter(proposal => filters.destination.includes(proposal.destination));
    }

    // Apply amount range filter
    if (filters.amount) {
      if (filters.amount.min) {
        filtered = filtered.filter(proposal => proposal.amount >= parseInt(filters.amount.min));
      }
      if (filters.amount.max) {
        filtered = filtered.filter(proposal => proposal.amount <= parseInt(filters.amount.max));
      }
    }

    // Apply quick filters
    if (filters.quick) {
      switch (filters.quick) {
        case 'pending':
          filtered = filtered.filter(proposal => proposal.status === 'pending');
          break;
        case 'high-value':
          filtered = filtered.filter(proposal => proposal.amount > 4000);
          break;
        case 'this-month':
          const currentMonth = new Date().getMonth();
          filtered = filtered.filter(proposal => new Date(proposal.date).getMonth() === currentMonth);
          break;
      }
    }

    return filtered;
  }, [searchQuery, filters, allProposals]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Proposals</h2>
          <p className="text-muted-foreground">Manage your travel proposals</p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Proposal
        </Button>
      </div>

      {/* Advanced Search and Filter */}
      <AdvancedSearchFilter
        searchPlaceholder="Search proposals, clients, or destinations..."
        filterGroups={filterGroups}
        quickFilters={quickFilters}
        onSearch={setSearchQuery}
        onFilter={setFilters}
        onClear={() => {
          setSearchQuery('');
          setFilters({});
        }}
        activeFilters={filters}
        resultCount={filteredProposals.length}
      />
      
      <div className="grid gap-4">
        {filteredProposals.map((proposal) => (
          <Card key={proposal.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{proposal.title}</CardTitle>
                  <CardDescription>
                    Client: {proposal.client} • {proposal.destination} • {proposal.date}
                  </CardDescription>
                </div>
                <Badge variant={proposal.status === 'approved' ? 'default' : proposal.status === 'pending' ? 'secondary' : 'outline'}>
                  {proposal.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">${proposal.amount.toLocaleString()}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">View</Button>
                  <Button size="sm">Edit</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredProposals.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No proposals found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || Object.keys(filters).length > 0 
                  ? "Try adjusting your search or filters" 
                  : "Create your first proposal to get started"}
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Proposal
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

// Fixed Departures Section
export const FixedDeparturesSection: React.FC = () => {
  const departures = [
    { id: 1, destination: "Bali, Indonesia", date: "2024-03-15", seats: 12, booked: 8 },
    { id: 2, destination: "Paris, France", date: "2024-04-20", seats: 20, booked: 15 },
    { id: 3, destination: "Tokyo, Japan", date: "2024-05-10", seats: 15, booked: 10 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Fixed Departures</h2>
          <p className="text-muted-foreground">Manage scheduled departures</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Departure
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {departures.map((departure) => (
          <Card key={departure.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {departure.destination}
              </CardTitle>
              <CardDescription>{departure.date}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Seats Available:</span>
                  <span>{departure.seats - departure.booked}/{departure.seats}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${(departure.booked / departure.seats) * 100}%` }}
                  ></div>
                </div>
                <Button className="w-full" size="sm">Manage</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Client Details Section
export const ClientDetailsSection: React.FC = () => {
  const clients = [
    { id: 1, name: "John Smith", email: "john@email.com", phone: "+1234567890", bookings: 5 },
    { id: 2, name: "Sarah Johnson", email: "sarah@email.com", phone: "+1234567891", bookings: 3 },
    { id: 3, name: "Mike Wilson", email: "mike@email.com", phone: "+1234567892", bookings: 7 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Client Details</h2>
          <p className="text-muted-foreground">Manage your clients</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>
      
      <div className="grid gap-4">
        {clients.map((client) => (
          <Card key={client.id}>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <CardTitle>{client.name}</CardTitle>
                  <CardDescription>{client.email}</CardDescription>
                </div>
                <Badge>{client.bookings} bookings</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{client.phone}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">Contact</Button>
                  <Button size="sm">View Details</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Documents Section
export const DocumentsSection: React.FC = () => {
  const documents = [
    { id: 1, name: "Travel Insurance Policy", type: "PDF", size: "2.4 MB", date: "2024-01-15" },
    { id: 2, name: "Passport Copy", type: "JPG", size: "1.2 MB", date: "2024-01-10" },
    { id: 3, name: "Visa Application", type: "PDF", size: "3.1 MB", date: "2024-01-08" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Documents</h2>
          <p className="text-muted-foreground">Manage travel documents</p>
        </div>
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>
      
      <div className="grid gap-4">
        {documents.map((doc) => (
          <Card key={doc.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-sm text-muted-foreground">{doc.type} • {doc.size} • {doc.date}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">Download</Button>
                  <Button size="sm" variant="outline">Share</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Commission Wallet Section
export const CommissionWalletSection: React.FC = () => {
  const transactions = [
    { id: 1, description: "Bali Package Commission", amount: "+$250", date: "2024-01-15", status: "completed" },
    { id: 2, description: "European Tour Commission", amount: "+$520", date: "2024-01-12", status: "completed" },
    { id: 3, description: "Withdrawal to Bank", amount: "-$300", date: "2024-01-10", status: "pending" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Commission Wallet</h2>
          <p className="text-muted-foreground">Track your earnings</p>
        </div>
        <Button>
          <Wallet className="h-4 w-4 mr-2" />
          Withdraw
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Balance</CardDescription>
            <CardTitle className="text-2xl">$2,450.00</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>This Month</CardDescription>
            <CardTitle className="text-2xl text-green-600">+$770.00</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-2xl text-orange-600">$300.00</CardTitle>
          </CardHeader>
        </Card>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Recent Transactions</h3>
        {transactions.map((transaction) => (
          <Card key={transaction.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{transaction.description}</p>
                  <p className="text-sm text-muted-foreground">{transaction.date}</p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${transaction.amount.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.amount}
                  </p>
                  <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                    {transaction.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Reports Section
export const ReportsSection: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Reports & Analytics</h2>
          <p className="text-muted-foreground">View your performance metrics</p>
        </div>
        <Button>
          <BookOpen className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Sales</CardDescription>
            <CardTitle className="text-2xl">$45,230</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Bookings</CardDescription>
            <CardTitle className="text-2xl">127</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Conversion Rate</CardDescription>
            <CardTitle className="text-2xl">68%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg. Deal Size</CardDescription>
            <CardTitle className="text-2xl">$356</CardTitle>
          </CardHeader>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Performance Chart</CardTitle>
          <CardDescription>Sales performance over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-muted/50 rounded-lg">
            <p className="text-muted-foreground">Chart visualization would go here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Enhanced Profile Settings Section
export const EnhancedProfileSettings: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Settings</h2>
          <p className="text-muted-foreground">Manage your account settings</p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Account Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              Edit Profile
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Change Password
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Notification Preferences
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Business Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              Commission Rates
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Payment Methods
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Tax Information
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};