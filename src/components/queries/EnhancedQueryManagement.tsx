import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuSeparator, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  PlusCircle, Eye, Edit, FileText, Users, MoreHorizontal,
  Download, Upload, BarChart3, Clock, CheckCircle2,
  AlertCircle, TrendingUp, UserCheck, Settings, Calendar
} from 'lucide-react';
import { Query } from '@/types/query';
import { mockQueries, getEnquirySettings } from '@/data/queryData';
import { useToast } from '@/hooks/use-toast';
import { useActiveStaffData } from '@/hooks/useActiveStaffData';
import EnhancedProposalService from '@/services/enhancedProposalService';
import StaffAssignmentPanel from './components/StaffAssignmentPanel';
import QueryFiltersComponent from './components/QueryFilters';
import QueryPagination from './components/QueryPagination';
import { useQueryFilters } from './hooks/useQueryFilters';
import { useQueryPagination } from './hooks/useQueryPagination';
import { useQuerySelection } from './hooks/useQuerySelection';

interface EnhancedQueryManagementProps {
  queries?: Query[];
  onQueryUpdate?: (queries: Query[]) => void;
}

const EnhancedQueryManagement: React.FC<EnhancedQueryManagementProps> = ({
  queries: initialQueries = [],
  onQueryUpdate
}) => {
  const [queries, setQueries] = useState<Query[]>([]);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Use active staff data from management module
  const { activeStaff } = useActiveStaffData();

  // Get enquiry settings for ID format
  const enquirySettings = getEnquirySettings();

  // Load queries from localStorage on mount and when refreshTrigger changes
  useEffect(() => {
    const loadQueries = () => {
      try {
        const savedQueries = localStorage.getItem('travel_queries');
        let allQueries: Query[] = [];

        if (savedQueries) {
          const parsedQueries = JSON.parse(savedQueries);
          allQueries = Array.isArray(parsedQueries) ? parsedQueries : [];
        } else if (initialQueries.length > 0) {
          allQueries = [...initialQueries];
        } else {
          allQueries = [...mockQueries];
          localStorage.setItem('travel_queries', JSON.stringify(allQueries));
        }

        // Sort by creation date (newest first)
        allQueries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setQueries(allQueries);
        
        if (onQueryUpdate) {
          onQueryUpdate(allQueries);
        }
      } catch (error) {
        console.error('Error loading queries:', error);
        // Fall back to mock data
        const sortedMockQueries = [...mockQueries].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setQueries(sortedMockQueries);
      }
    };

    loadQueries();
  }, [refreshTrigger, initialQueries, onQueryUpdate]);

  // Listen for storage changes to refresh data
  useEffect(() => {
    const handleStorageChange = () => {
      setRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('enquiry-saved', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('enquiry-saved', handleStorageChange);
    };
  }, []);

  // Format enquiry ID - display the new EnqIdGenerator format properly
  const formatEnquiryId = (originalId: string) => {
    // Return the ID as-is since EnqIdGenerator already formats it properly
    // This supports the new country-specific format like ENQ2025-0001, ENQ/2025/0001, etc.
    return originalId;
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

  // Helper function to format travel duration with dates
  const formatTravelDuration = (query: Query) => {
    const fromDate = new Date(query.travelDates.from);
    const toDate = new Date(query.travelDates.to);
    
    // Format dates
    const fromFormatted = fromDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    const toFormatted = toDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
    
    return {
      nights: query.tripDuration.nights,
      days: query.tripDuration.days,
      dateRange: `${fromFormatted} - ${toFormatted}`,
      fromDate: fromFormatted,
      toDate: toFormatted
    };
  };

  // Use the custom hooks for filtering, pagination, and selection
  const {
    filters,
    filteredQueries,
    filterOptions,
    updateFilter,
    clearAllFilters,
    activeFiltersCount
  } = useQueryFilters(queries);

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
  } = useQueryPagination({ queries: filteredQueries });

  const {
    selectedQueries,
    selectionStatus,
    selectAllMode,
    toggleQuerySelection,
    togglePageSelection,
    selectAllFiltered,
    clearSelection,
    selectedQueryObjects
  } = useQuerySelection(paginatedQueries, filteredQueries);

  // Analytics calculations
  const analytics = useMemo(() => {
    const total = queries.length;
    const newQueries = queries.filter(q => q.status === 'new').length;
    const inProgress = queries.filter(q => q.status === 'in-progress').length;
    const proposalsSent = queries.filter(q => q.status === 'proposal-sent').length;
    const converted = queries.filter(q => q.status === 'converted').length;
    
    const conversionRate = total > 0 ? (converted / total * 100).toFixed(1) : '0';
    const responseRate = total > 0 ? ((inProgress + proposalsSent + converted) / total * 100).toFixed(1) : '0';
    
    return {
      total, newQueries, inProgress, proposalsSent, converted,
      conversionRate, responseRate
    };
  }, [queries]);

  // Bulk operations
  const handleBulkOperation = async (operation: string, data?: any) => {
    if (selectedQueries.length === 0) {
      toast({
        title: "No queries selected",
        description: "Please select queries to perform bulk operations.",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await EnhancedProposalService.processBulkOperation({
        type: operation as any,
        queryIds: selectedQueries,
        data: data || {}
      });

      toast({
        title: "Bulk operation completed",
        description: `${result.success} queries processed successfully. ${result.failed > 0 ? `${result.failed} failed.` : ''}`,
      });

      if (result.success > 0) {
        clearSelection();
        setBulkDialogOpen(false);
      }
    } catch (error) {
      toast({
        title: "Bulk operation failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: Query["status"]) => {
    const variants = {
      "new": "secondary",
      "assigned": "outline", 
      "in-progress": "default",
      "proposal-sent": "default",
      "confirmed": "default",
      "converted": "default",
      "cancelled": "destructive"
    } as const;

    const colors = {
      "new": "bg-gray-500 text-white dark:bg-gray-600",
      "assigned": "border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400",
      "in-progress": "bg-blue-500 text-white dark:bg-blue-600",
      "proposal-sent": "bg-amber-500 text-white dark:bg-amber-600", 
      "confirmed": "bg-green-500 text-white dark:bg-green-600",
      "converted": "bg-purple-500 text-white dark:bg-purple-600",
      "cancelled": "bg-red-500 text-white dark:bg-red-600"
    };

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  const getAssignedStaff = (query: Query) => {
    if (query.status === 'assigned' || query.status === 'in-progress') {
      // Use real staff data from active staff
      if (query.id === 'ENQ20250002') return activeStaff[0];
      if (query.id === 'ENQ20250003') return activeStaff[1];
      return activeStaff[1] || activeStaff[0]; // Fallback to first available staff
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header with Analytics */}
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Enhanced Enquiry Management</h1>
          <p className="text-muted-foreground">Advanced query management with bulk operations and analytics</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-background border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Query Analytics Dashboard</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{analytics.total}</div>
                  <div className="text-sm text-muted-foreground">Total Queries</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{analytics.newQueries}</div>
                  <div className="text-sm text-muted-foreground">New Queries</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{analytics.conversionRate}%</div>
                  <div className="text-sm text-muted-foreground">Conversion Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{analytics.responseRate}%</div>
                  <div className="text-sm text-muted-foreground">Response Rate</div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" asChild>
            <Link to="/queries/assign">
              <Users className="mr-2 h-4 w-4" />
              Assign Queries
            </Link>
          </Button>
          
          <Button asChild>
            <Link to="/queries/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Enquiry
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{analytics.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{analytics.newQueries}</div>
            <div className="text-sm text-muted-foreground">New</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{analytics.inProgress}</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{analytics.proposalsSent}</div>
            <div className="text-sm text-muted-foreground">Proposals</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{analytics.converted}</div>
            <div className="text-sm text-muted-foreground">Converted</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{analytics.conversionRate}%</div>
            <div className="text-sm text-muted-foreground">Conv. Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Assignment Panel */}
      <StaffAssignmentPanel 
        queries={queries} 
        onQueryUpdate={setQueries} 
      />

      {/* Enhanced Filters */}
      <QueryFiltersComponent
        filters={filters}
        filterOptions={filterOptions}
        activeFiltersCount={activeFiltersCount}
        onUpdateFilter={updateFilter}
        onClearAllFilters={clearAllFilters}
      />

      {/* Selection Actions */}
      {selectionStatus.hasSelection && (
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {selectionStatus.selectedCount} queries selected
              {selectAllMode === 'page' && selectionStatus.selectedCount < totalItems && (
                <>
                  {' '}from this page. 
                  <Button variant="link" className="p-0 h-auto" onClick={selectAllFiltered}>
                    Select all {totalItems} filtered results
                  </Button>
                </>
              )}
            </span>
            <Button variant="outline" size="sm" onClick={clearSelection}>
              Clear Selection
            </Button>
          </div>
          
          <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Settings className="h-4 w-4" />
                Bulk Actions
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-background border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Bulk Operations</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 p-4">
                <div className="text-sm text-muted-foreground">
                  {selectionStatus.selectedCount} queries selected
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => handleBulkOperation('assign', { staffId: 'staff_1' })}
                    className="gap-2"
                  >
                    <UserCheck className="h-4 w-4" />
                    Assign to Staff
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleBulkOperation('status-update', { status: 'in-progress' })}
                    className="gap-2"
                  >
                    <Clock className="h-4 w-4" />
                    Set In Progress
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleBulkOperation('export')}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export Selected
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleBulkOperation('template-apply', { templateId: 'beach-vacation' })}
                    className="gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Apply Template
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Enhanced Query Table with Duration column */}
      <Card className="bg-card border-border">
        <CardHeader className="py-4">
          <CardTitle className="flex items-center justify-between text-foreground">
            <span>Enquiry List <span className="text-xs text-muted-foreground">({totalItems} total, {paginatedQueries.length} showing)</span></span>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectionStatus.isPageFullySelected}
                indeterminate={selectionStatus.selectedOnPageCount > 0 && !selectionStatus.isPageFullySelected}
                onCheckedChange={togglePageSelection}
              />
              <span className="text-sm text-muted-foreground">Select Page</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-muted/50">
                  <TableHead className="w-[50px] text-muted-foreground">Select</TableHead>
                  <TableHead className="w-[120px] text-muted-foreground">ID</TableHead>
                  <TableHead className="text-muted-foreground">Agent</TableHead>
                  <TableHead className="text-muted-foreground">Destination</TableHead>
                  <TableHead className="text-muted-foreground">Duration & Dates</TableHead>
                  <TableHead className="text-muted-foreground">PAX</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Assigned Staff</TableHead>
                  <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedQueries.map((query) => {
                  const assignedStaff = getAssignedStaff(query);
                  const isSelected = selectedQueries.includes(query.id);
                  const paxInfo = formatPaxInfo(query.paxDetails);
                  const durationInfo = formatTravelDuration(query);
                  
                  return (
                    <TableRow key={query.id} className={`border-border ${isSelected ? 'bg-muted/50' : 'hover:bg-muted/50'}`}>
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleQuerySelection(query.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Link 
                          to={`/queries/${encodeURIComponent(query.id)}`}
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                        >
                          {formatEnquiryId(query.id)}
                        </Link>
                      </TableCell>
                      <TableCell className="text-foreground">{query.agentName}</TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium text-foreground">{query.destination.country}</span>
                          <span className="text-xs text-muted-foreground block">
                            {query.destination.cities.join(', ')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="font-bold text-lg text-purple-600 dark:text-purple-400">
                            {durationInfo.nights}N/{durationInfo.days}D
                          </div>
                          <div className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{durationInfo.dateRange}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="font-bold text-lg text-blue-600 dark:text-blue-400">{paxInfo.total} PAX</div>
                          <div className="text-xs text-muted-foreground font-medium">({paxInfo.breakdown})</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(query.status)}</TableCell>
                      <TableCell>
                        {assignedStaff ? (
                          <div className="flex items-center">
                            <Avatar className="h-7 w-7 mr-2">
                              <AvatarFallback className="bg-muted text-foreground">{assignedStaff.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm text-foreground">{assignedStaff.name}</div>
                              <div className="text-xs text-muted-foreground">{assignedStaff.role}</div>
                            </div>
                          </div>
                        ) : (
                          <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">
                            Not Assigned
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-background border-border">
                            <DropdownMenuItem asChild>
                              <Link to={`/queries/${encodeURIComponent(query.id)}`} className="flex items-center gap-2 text-foreground hover:bg-muted">
                                <Eye className="h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/queries/edit/${encodeURIComponent(query.id)}`} className="flex items-center gap-2 text-foreground hover:bg-muted">
                                <Edit className="h-4 w-4" />
                                Edit Query
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem 
                              onClick={() => navigate(`/queries/proposal/${encodeURIComponent(query.id)}`)}
                              className="flex items-center gap-2 text-foreground hover:bg-muted"
                            >
                              <FileText className="h-4 w-4" />
                              Create Proposal
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
                
                {paginatedQueries.length === 0 && (
                  <TableRow className="border-border">
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No enquiries found matching your criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <QueryPagination
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={totalItems}
        startIndex={startIndex}
        endIndex={endIndex}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
      />
    </div>
  );
};

export default EnhancedQueryManagement;
