
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PlusCircle, Search, Filter, Download, Upload, Users,
  MapPin, Clock, User, CheckCircle2, AlertCircle, TrendingUp,
  BarChart3, Settings, Activity, Calendar, Globe, Building2
} from 'lucide-react';
import { mockQueries } from '@/data/queryData';
import { Query } from '@/types/query';
import { useToast } from '@/hooks/use-toast';
import QuickCreateQuery from './components/QuickCreateQuery';
import EnhancedQueryList from './components/EnhancedQueryList';

const TravelEnquiryHub: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [queries, setQueries] = useState<Query[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load queries from localStorage and merge with mock data, sorted by creation date (newest first)
  useEffect(() => {
    const loadQueries = () => {
      try {
        const savedQueries = localStorage.getItem('travel_queries');
        let allQueries: Query[] = [];

        if (savedQueries) {
          const parsedQueries = JSON.parse(savedQueries);
          // Use saved queries as primary source
          allQueries = Array.isArray(parsedQueries) ? parsedQueries : [];
        } else {
          // Fall back to mock data if no saved queries
          allQueries = [...mockQueries];
        }

        // Sort by creation date (newest first)
        allQueries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setQueries(allQueries);
      } catch (error) {
        console.error('Error loading queries:', error);
        // Fall back to mock data on error
        const sortedMockQueries = [...mockQueries].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setQueries(sortedMockQueries);
      }
    };

    loadQueries();
  }, [refreshTrigger]);

  // Filter queries based on search term and status
  const filteredQueries = useMemo(() => {
    return queries.filter(query => {
      const matchesSearch = searchTerm === '' || 
        query.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        // Support searching by just the number part of new enquiry IDs (e.g. "0001" for "ENQ2025-0001")
        query.id.replace(/[^0-9]/g, '').includes(searchTerm.replace(/[^0-9]/g, '')) ||
        query.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        query.destination.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        query.destination.cities.some(city => city.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = selectedStatus === 'all' || query.status === selectedStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [queries, searchTerm, selectedStatus]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = queries.length;
    const newQueries = queries.filter(q => q.status === 'new').length;
    const assigned = queries.filter(q => q.status === 'assigned').length;
    const inProgress = queries.filter(q => q.status === 'in-progress').length;
    const completed = queries.filter(q => q.status === 'completed' || q.status === 'converted').length;
    const proposalsSent = queries.filter(q => q.status === 'proposal-sent').length;
    
    const conversionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { 
      total, 
      new: newQueries, 
      assigned, 
      inProgress, 
      completed, 
      proposalsSent,
      conversionRate
    };
  }, [queries]);

  // Handle successful query creation
  const handleQuickCreateSuccess = (newQuery: Query) => {
    // Trigger refresh to reload queries from localStorage
    setRefreshTrigger(prev => prev + 1);
    
    toast({
      title: "Enquiry Created",
      description: `New enquiry ${newQuery.id} has been created and will appear at the top of the list`,
    });
    
    setShowQuickCreate(false);
  };

  // Handle query updates (assignments, status changes, etc.)
  const handleQueryUpdate = (updatedQueries: Query[]) => {
    // Sort updated queries by creation date (newest first)
    const sortedQueries = [...updatedQueries].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    setQueries(sortedQueries);
    
    // Save to localStorage
    try {
      localStorage.setItem('travel_queries', JSON.stringify(sortedQueries));
    } catch (error) {
      console.error('Error saving queries:', error);
    }
  };

  // Calculate query priority (0-10 scale)
  const calculatePriority = (query: Query): number => {
    let score = 0;
    
    // Urgency based on travel date
    const daysUntilTravel = Math.floor((new Date(query.travelDates.from).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilTravel <= 7) score += 4;
    else if (daysUntilTravel <= 30) score += 2;
    else if (daysUntilTravel <= 60) score += 1;
    
    // Budget value
    if (query.budget.max > 5000) score += 3;
    else if (query.budget.max > 2000) score += 2;
    else if (query.budget.max > 1000) score += 1;
    
    // Group size
    const totalPax = query.paxDetails.adults + query.paxDetails.children;
    if (totalPax >= 10) score += 2;
    else if (totalPax >= 5) score += 1;
    
    // Status urgency
    if (query.status === 'new') score += 1;
    
    return Math.min(score, 10);
  };

  // Categorize query based on characteristics
  const categorizeQuery = (query: Query): string => {
    const totalPax = query.paxDetails.adults + query.paxDetails.children;
    const budget = query.budget.max;
    
    if (budget > 5000 && totalPax <= 4) return 'Luxury';
    if (totalPax >= 10) return 'Group';
    if (query.packageType.toLowerCase().includes('adventure')) return 'Adventure';
    if (query.packageType.toLowerCase().includes('family')) return 'Family';
    if (query.packageType.toLowerCase().includes('honeymoon')) return 'Romance';
    if (budget < 1000) return 'Budget';
    
    return 'Standard';
  };

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Travel Enquiry Hub
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive enquiry management with intelligent assignment and real-time tracking
          </p>
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4" />
            <span>Showing {filteredQueries.length} of {queries.length} enquiries • Sorted by newest first</span>
          </div>
        </div>
        
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setShowQuickCreate(true)} size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <PlusCircle className="h-4 w-4 mr-2" />
              Quick Create
            </Button>
            <Button onClick={() => navigate('/queries/create')} size="sm" className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700">
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Enquiry
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <MapPin className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">New</p>
                <p className="text-2xl font-bold text-orange-600">{stats.new}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Assigned</p>
                <p className="text-2xl font-bold text-blue-600">{stats.assigned}</p>
              </div>
              <User className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-purple-600">{stats.inProgress}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Proposals</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.proposalsSent}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversion</p>
                <p className="text-2xl font-bold text-green-600">{stats.conversionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="enquiries" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="enquiries" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Enquiries
          </TabsTrigger>
          <TabsTrigger value="assignment" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Assignment
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Overview Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Overview dashboard coming soon...</p>
                <p className="text-sm mt-2">Track performance metrics, trends, and insights</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enquiries Tab */}
        <TabsContent value="enquiries" className="space-y-4">
          {/* Search and Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Enquiry Management</span>
                <Badge variant="secondary" className="text-xs">
                  {filteredQueries.length} results • Newest first
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 items-center space-x-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by ID (e.g. ENQ2025-0001, 0001), agent, destination..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <select 
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="border border-input rounded-md px-3 py-2 text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="new">New</option>
                    <option value="assigned">Assigned</option>
                    <option value="in-progress">In Progress</option>
                    <option value="proposal-sent">Proposal Sent</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="converted">Converted</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Query List */}
          <EnhancedQueryList 
            queries={filteredQueries}
            calculatePriority={calculatePriority}
            categorizeQuery={categorizeQuery}
          />
        </TabsContent>

        {/* Assignment Tab */}
        <TabsContent value="assignment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Assignment Interface
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Assignment interface coming soon...</p>
                <p className="text-sm mt-2">Bulk assign queries to staff members and manage workloads</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Analytics dashboard coming soon...</p>
                <p className="text-sm mt-2">Track conversion rates, response times, and performance metrics</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Create Query Dialog */}
      {showQuickCreate && (
        <QuickCreateQuery
          isOpen={showQuickCreate}
          onClose={() => setShowQuickCreate(false)}
          onSuccess={handleQuickCreateSuccess}
        />
      )}
    </div>
  );
};

export default TravelEnquiryHub;
