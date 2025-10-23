import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  ArrowRightLeft,
  MapPin,
  Clock,
  User,
  Zap,
  CheckCircle,
  AlertCircle,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Grid3X3,
  List,
  BarChart3,
  RefreshCw,
  Settings,
  Activity,
  Timer,
  TrendingUp,
  Edit
} from 'lucide-react';
import { mockQueries } from '@/data/queryData';
import { useAutoAssignmentSettings } from '@/hooks/useAutoAssignmentSettings';
import { useActiveStaffData } from '@/hooks/useActiveStaffData';
import { Query } from '@/types/query';
import QuickCreateQuery from './components/QuickCreateQuery';
import { CountryBasedAssignmentDialog } from '@/components/queries/CountryBasedAssignmentDialog';
import QueryFiltersComponent from '@/components/queries/components/QueryFilters';
import EnhancedEnquiryCard from '@/components/queries/EnhancedEnquiryCard';
import EnquiryListTable from '@/components/queries/EnquiryListTable';
import BulkOperationsPanel from '@/components/queries/BulkOperationsPanel';
import AdvancedFilters from '@/components/queries/AdvancedFilters';
import { useQueryFilters } from '@/components/queries/hooks/useQueryFilters';
import { useQueryPagination } from '@/components/queries/hooks/useQueryPagination';
import { useToast } from '@/hooks/use-toast';

interface SortConfig {
  key: 'createdAt' | 'agentName' | 'destination' | 'status' | 'pax' | 'priority' | 'lastActivity' | 'budget' | 'departure';
  direction: 'asc' | 'desc';
}

const Queries: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAutoAssignmentEnabled } = useAutoAssignmentSettings();
  const { activeStaff } = useActiveStaffData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'desc' });
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [showCountryAssignment, setShowCountryAssignment] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [selectedQueries, setSelectedQueries] = useState<Query[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
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
          // Save mock data to localStorage for future use
          localStorage.setItem('travel_queries', JSON.stringify(allQueries));
        }

        // Sort by creation date (newest first)
        allQueries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setQueries(allQueries);
        console.log('Loaded queries:', allQueries.length);
      } catch (error) {
        console.error('Error loading queries:', error);
        // Fall back to mock data on error
        const sortedMockQueries = [...mockQueries].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setQueries(sortedMockQueries);
        localStorage.setItem('travel_queries', JSON.stringify(sortedMockQueries));
      }
    };

    loadQueries();
  }, [refreshTrigger]);

  // Listen for storage changes to refresh data when enquiries are created/updated
  useEffect(() => {
    const handleStorageChange = () => {
      setRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events from the form
    window.addEventListener('enquiry-saved', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('enquiry-saved', handleStorageChange);
    };
  }, []);

  // Real-time refresh functionality
  useEffect(() => {
    if (!isRealTimeEnabled) return;

    const interval = setInterval(() => {
      setLastRefresh(new Date());
      // Trigger refresh to reload queries from localStorage
      setRefreshTrigger(prev => prev + 1);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [isRealTimeEnabled]);

  // Use the query filters hook
  const {
    filters,
    filteredQueries,
    filterOptions,
    updateFilter,
    clearAllFilters,
    activeFiltersCount
  } = useQueryFilters(queries);

  // Use pagination hook
  const {
    currentPage,
    itemsPerPage,
    totalPages,
    startIndex,
    endIndex,
    paginatedQueries,
    handlePageChange,
    handleItemsPerPageChange,
    totalItems
  } = useQueryPagination({ queries: filteredQueries, itemsPerPage: 10 });

  // Enhanced sorting function
  const handleSort = (key: SortConfig['key']) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Helper function to format PAX information - Updated to exclude infants from total
  const formatPaxInfo = (paxDetails: Query['paxDetails']) => {
    // Total PAX excludes infants (they are for record only)
    const total = paxDetails.adults + paxDetails.children;
    let breakdown = '';
    
    if (paxDetails.adults > 0) {
      breakdown += `${paxDetails.adults}A`;
    }
    if (paxDetails.children > 0) {
      breakdown += breakdown ? ` ${paxDetails.children}C` : `${paxDetails.children}C`;
    }
    if (paxDetails.infants > 0) {
      breakdown += breakdown ? ` ${paxDetails.infants}I` : `${paxDetails.infants}I`;
    }
    
    return {
      total, 
      breakdown: breakdown || '0'
    };
  };

  // Enhanced filter and sort queries
  const filteredAndSortedQueries = useMemo(() => {
    let filtered = filteredQueries.filter(query => {
      const matchesSearch = searchTerm === '' || 
        query.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        query.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        query.destination.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        query.destination.cities.some(city => city.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = selectedStatus === 'all' || query.status === selectedStatus;
      
      return matchesSearch && matchesStatus;
    });

    // Enhanced sorting logic
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortConfig.key) {
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'agentName':
          comparison = a.agentName.localeCompare(b.agentName);
          break;
        case 'destination':
          comparison = a.destination.country.localeCompare(b.destination.country);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'pax':
          // Updated PAX sorting to exclude infants
          const aPax = a.paxDetails.adults + a.paxDetails.children;
          const bPax = b.paxDetails.adults + b.paxDetails.children;
          comparison = aPax - bPax;
          break;
        case 'priority':
          const aPriority = a.id === 'TQ-2024-001' ? 9 : a.id === 'TQ-2024-004' ? 8 : 5;
          const bPriority = b.id === 'TQ-2024-001' ? 9 : b.id === 'TQ-2024-004' ? 8 : 5;
          comparison = aPriority - bPriority;
          break;
        case 'budget':
          const aBudget = a.budget?.max || 0;
          const bBudget = b.budget?.max || 0;
          comparison = aBudget - bBudget;
          break;
        case 'departure':
          comparison = new Date(a.travelDates.from).getTime() - new Date(b.travelDates.from).getTime();
          break;
        case 'lastActivity':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        default:
          comparison = 0;
      }
      
      return sortConfig.direction === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [filteredQueries, searchTerm, selectedStatus, sortConfig]);

  // Enhanced query statistics
  const stats = useMemo(() => {
    const total = queries.length;
    const newQueries = queries.filter(q => q.status === 'new').length;
    const assigned = queries.filter(q => q.status === 'assigned').length;
    const inProgress = queries.filter(q => q.status === 'in-progress').length;
    const completed = queries.filter(q => q.status === 'completed' || q.status === 'converted').length;
    const proposalsSent = queries.filter(q => q.status === 'proposal-sent').length;
    
    const conversionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const avgResponseTime = '2.4 hours';
    const slaBreaches = queries.filter(q => {
      const hoursAgo = (new Date().getTime() - new Date(q.createdAt).getTime()) / (1000 * 60 * 60);
      const slaHours = q.packageType === 'luxury' ? 1 : q.packageType === 'business' ? 2 : 4;
      return hoursAgo > slaHours && q.status === 'new';
    }).length;
    
    return { 
      total, 
      new: newQueries, 
      assigned, 
      inProgress, 
      completed, 
      proposalsSent,
      conversionRate, 
      avgResponseTime,
      slaBreaches
    };
  }, [queries, lastRefresh]);

  // Selection handlers
  const handleSelectQuery = (query: Query, checked: boolean) => {
    if (checked) {
      setSelectedQueries(prev => [...prev, query]);
    } else {
      setSelectedQueries(prev => prev.filter(q => q.id !== query.id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedQueries(filteredAndSortedQueries);
    } else {
      setSelectedQueries([]);
    }
  };

  // Bulk operations handlers
  const handleBulkAssign = (staffMember: string) => {
    const updatedQueries = queries.map(query => {
      if (selectedQueries.some(sq => sq.id === query.id)) {
        return { ...query, assignedTo: staffMember, status: 'assigned', updatedAt: new Date().toISOString() };
      }
      return query;
    });
    setQueries(updatedQueries);
    localStorage.setItem('travel_queries', JSON.stringify(updatedQueries));
    
    toast({
      title: "Bulk Assignment Complete",
      description: `${selectedQueries.length} enquiries assigned to ${staffMember}`,
    });
    setSelectedQueries([]);
  };

  const handleBulkStatusUpdate = (status: string) => {
    const updatedQueries = queries.map(query => {
      if (selectedQueries.some(sq => sq.id === query.id)) {
        return { ...query, status, updatedAt: new Date().toISOString() };
      }
      return query;
    });
    setQueries(updatedQueries);
    localStorage.setItem('travel_queries', JSON.stringify(updatedQueries));
    
    toast({
      title: "Status Updated",
      description: `${selectedQueries.length} enquiries status updated to ${status}`,
    });
    setSelectedQueries([]);
  };

  const handleBulkPriorityUpdate = (priority: string) => {
    const updatedQueries = queries.map(query => {
      if (selectedQueries.some(sq => sq.id === query.id)) {
        return { ...query, priority, updatedAt: new Date().toISOString() };
      }
      return query;
    });
    setQueries(updatedQueries);
    localStorage.setItem('travel_queries', JSON.stringify(updatedQueries));
    
    toast({
      title: "Priority Updated",
      description: `${selectedQueries.length} enquiries priority set to ${priority}`,
    });
    setSelectedQueries([]);
  };

  const handleBulkExport = () => {
    const dataStr = JSON.stringify(selectedQueries, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `enquiries_export_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    toast({
      title: "Export Complete",
      description: `${selectedQueries.length} enquiries exported successfully`,
    });
  };

  const handleBulkDelete = () => {
    const updatedQueries = queries.filter(query => !selectedQueries.some(sq => sq.id === query.id));
    setQueries(updatedQueries);
    localStorage.setItem('travel_queries', JSON.stringify(updatedQueries));
    
    toast({
      title: "Enquiries Deleted",
      description: `${selectedQueries.length} enquiries have been deleted`,
      variant: "destructive",
    });
    setSelectedQueries([]);
  };

  const handleQuickAssign = (query: Query) => {
    setSelectedQuery(query);
    setShowCountryAssignment(true);
  };

  const handleQuickCreateSuccess = (newQuery: Query) => {
    // Add new query to the beginning of the list and save to localStorage
    const updatedQueries = [newQuery, ...queries];
    setQueries(updatedQueries);
    localStorage.setItem('travel_queries', JSON.stringify(updatedQueries));
    
    toast({
      title: "Enquiry Created",
      description: `New enquiry ${newQuery.id} has been created and appears first in the list`,
    });
    
    setShowQuickCreate(false);
  };

  const getSortIcon = (key: SortConfig['key']) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    }
    return sortConfig.direction === 'desc' ? 
      <ArrowDown className="h-4 w-4 text-blue-600" /> : 
      <ArrowUp className="h-4 w-4 text-blue-600" />;
  };

  const availableStaffCount = activeStaff.filter(s => 
    s.active && s.assigned < s.workloadCapacity
  ).length;

  // Enhanced query list rendering
  const renderEnquiryRow = (query: Query) => {
    const paxInfo = formatPaxInfo(query.paxDetails);
    const isSelected = selectedQueries.some(q => q.id === query.id);
    
    return (
      <div key={query.id} className="flex items-start gap-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => handleSelectQuery(query, !!checked)}
          className="mt-4"
        />
        <div className="flex-1">
          <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-blue-700">{query.id}</h3>
                <Badge variant="outline" className="text-xs">
                  {paxInfo.total} PAX ({paxInfo.breakdown})
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={query.status === 'new' ? 'secondary' : 'default'}>
                  {query.status.replace('-', ' ').toUpperCase()}
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/queries/edit/${encodeURIComponent(query.id)}`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Agent</p>
                <p className="font-medium">{query.agentName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Destination</p>
                <p className="font-medium">{query.destination.country}</p>
                <p className="text-xs text-muted-foreground">{query.destination.cities.join(', ')}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Travel Date</p>
                <p className="font-medium">{new Date(query.travelDates.from).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Duration</p>
                <p className="font-medium">{query.tripDuration.nights}N/{query.tripDuration.days}D</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4 pt-3 border-t">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Budget: ${query.budget.min.toLocaleString()} - ${query.budget.max.toLocaleString()}</span>
                <span>Created: {new Date(query.createdAt).toLocaleDateString()}</span>
                <span>Updated: {new Date(query.updatedAt).toLocaleDateString()}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleQuickAssign(query)}
              >
                <User className="h-4 w-4 mr-2" />
                {query.status === 'new' ? 'Assign' : 'Reassign'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <PageLayout>
      <div className="space-y-6 p-4 lg:p-6">
        {/* Enhanced Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Enhanced Query Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive enquiry tracking with detailed travel information and real-time updates
            </p>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" />
              <span>Showing {filteredAndSortedQueries.length} of {queries.length} enquiries • Sorted by newest first</span>
              <span className="text-green-600">• Live</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <Badge 
                variant={isAutoAssignmentEnabled ? "default" : "secondary"}
                className={`flex items-center gap-1 ${
                  isAutoAssignmentEnabled ? "bg-green-600" : ""
                }`}
              >
                {isAutoAssignmentEnabled ? (
                  <Zap className="h-3 w-3" />
                ) : (
                  <User className="h-3 w-3" />
                )}
                Auto-Assignment {isAutoAssignmentEnabled ? "ON" : "OFF"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
                className={isRealTimeEnabled ? "border-green-500 text-green-700" : ""}
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isRealTimeEnabled ? 'animate-spin' : ''}`} />
                Real-time {isRealTimeEnabled ? "ON" : "OFF"}
              </Button>
              <span className="text-sm text-muted-foreground">
                ({availableStaffCount} staff available)
              </span>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button variant="outline" size="sm" onClick={handleBulkExport}>
                <Download className="h-4 w-4 mr-2" />
                Export All
              </Button>
              <Button onClick={() => navigate('/queries/create')} size="sm" className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Enquiry
              </Button>
              <Button onClick={() => setShowQuickCreate(true)} size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Quick Create
              </Button>
            </div>
          </div>
        </div>

        {/* Status Alerts */}
        {isAutoAssignmentEnabled && stats.new > 0 && (
          <Alert className="border-green-200 bg-green-50">
            <Zap className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Auto-assignment is active. New enquiries will be automatically assigned based on destination country expertise.
              <strong> {stats.new} unassigned enquiries</strong> are available for processing.
            </AlertDescription>
          </Alert>
        )}

        {stats.slaBreaches > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <Timer className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>{stats.slaBreaches} enquiries</strong> have breached SLA response times and require immediate attention.
            </AlertDescription>
          </Alert>
        )}

        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
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

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">SLA Breach</p>
                  <p className="text-2xl font-bold text-red-600">{stats.slaBreaches}</p>
                </div>
                <Timer className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <AdvancedFilters
            onFiltersChange={(filters) => console.log('Advanced filters:', filters)}
            onClearFilters={() => console.log('Clear advanced filters')}
            activeFiltersCount={0}
          />
        )}

        {/* Bulk Operations Panel */}
        <BulkOperationsPanel
          selectedQueries={selectedQueries}
          onClearSelection={() => setSelectedQueries([])}
          onBulkAssign={handleBulkAssign}
          onBulkStatusUpdate={handleBulkStatusUpdate}
          onBulkPriorityUpdate={handleBulkPriorityUpdate}
          onBulkExport={handleBulkExport}
          onBulkDelete={handleBulkDelete}
        />

        {/* Enhanced Enquiry List */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">Enhanced Enquiry List</span>
                <Badge variant="secondary" className="text-xs">
                  {filteredAndSortedQueries.length} items • Newest first
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => navigate('/queries/create')} size="sm" className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Enquiry
                </Button>
                <div className="flex items-center gap-1">
                  <Checkbox
                    checked={selectedQueries.length === filteredAndSortedQueries.length && filteredAndSortedQueries.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm text-muted-foreground">Select All</span>
                </div>
                <Button
                  variant={viewMode === 'card' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('card')}
                >
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  Card View
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                >
                  <List className="h-4 w-4 mr-2" />
                  Table View
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* Search and Filters */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
              <div className="flex flex-1 items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, agent, destination, or city..."
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
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/queries/assign')}
                >
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Assign Queries
                </Button>
              </div>
            </div>

            {/* Sorting Controls */}
            <div className="flex flex-wrap gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600 mr-2">Sort by:</span>
              <Button
                variant={sortConfig.key === 'createdAt' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSort('createdAt')}
                className="gap-2"
              >
                <CalendarDays className="h-4 w-4" />
                Created (Newest First)
                {getSortIcon('createdAt')}
              </Button>
              <Button
                variant={sortConfig.key === 'priority' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSort('priority')}
                className="gap-2"
              >
                <AlertCircle className="h-4 w-4" />
                Priority
                {getSortIcon('priority')}
              </Button>
              <Button
                variant={sortConfig.key === 'departure' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSort('departure')}
                className="gap-2"
              >
                <CalendarDays className="h-4 w-4" />
                Departure
                {getSortIcon('departure')}
              </Button>
              <Button
                variant={sortConfig.key === 'budget' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSort('budget')}
                className="gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Budget
                {getSortIcon('budget')}
              </Button>
              <Button
                variant={sortConfig.key === 'pax' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSort('pax')}
                className="gap-2"
              >
                <User className="h-4 w-4" />
                PAX Count
                {getSortIcon('pax')}
              </Button>
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
              <span>Showing {filteredAndSortedQueries.length} enquiries with enhanced details (newest first)</span>
              <span>
                Sorted by: {sortConfig.key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} 
                ({sortConfig.direction === 'desc' ? 'Descending' : 'Ascending'})
              </span>
            </div>

            {/* Enquiry List */}
            <div className="space-y-4">
              {viewMode === 'card' ? (
                // Card View with enhanced functionality
                filteredAndSortedQueries.map(renderEnquiryRow)
              ) : (
                // Table View
                <div className="space-y-2">
                  {filteredAndSortedQueries.map((query) => (
                    <div key={query.id} className="flex items-center gap-3 p-2 border rounded-lg hover:bg-gray-50 transition-colors">
                      <Checkbox
                        checked={selectedQueries.some(q => q.id === query.id)}
                        onCheckedChange={(checked) => handleSelectQuery(query, !!checked)}
                      />
                      <div className="flex-1">
                        <EnquiryListTable 
                          queries={[query]}
                          onAssignQuery={handleQuickAssign}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {filteredAndSortedQueries.length === 0 && (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No enquiries found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search criteria or filters
                  </p>
                  <Button onClick={() => navigate('/queries/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Enquiry
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dialogs */}
        {showQuickCreate && (
          <QuickCreateQuery 
            isOpen={showQuickCreate} 
            onClose={() => setShowQuickCreate(false)}
            onSuccess={handleQuickCreateSuccess}
          />
        )}

        {showCountryAssignment && selectedQuery && (
          <CountryBasedAssignmentDialog
            query={selectedQuery}
            open={showCountryAssignment}
            onOpenChange={setShowCountryAssignment}
          />
        )}
      </div>
    </PageLayout>
  );
};

export default Queries;
