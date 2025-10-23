
import React, { useState, useEffect } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Calendar, CheckCheck, Clock, List, ListTodo, MoveVertical, TrendingUp, AlertTriangle, Users, MapPin } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockFollowUps, getInitialColumns, getFollowUpStats } from './data/followUpData';
import { FollowUp } from './types/followUpTypes';
import FollowUpsTable from './components/FollowUpsTable';
import FollowUpsBoard from './components/FollowUpsBoard';
import FollowUpsFilters from './components/FollowUpsFilters';
import AddFollowUpDialog from './components/AddFollowUpDialog';
import { EnquiryIntegrationService } from './services/enquiryIntegrationService';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const FollowUps: React.FC = () => {
  const [activeTab, setActiveTab] = useState('board');
  const [followUps, setFollowUps] = useState<FollowUp[]>(mockFollowUps);
  const [filteredFollowUps, setFilteredFollowUps] = useState<FollowUp[]>(mockFollowUps);
  const [columns, setColumns] = useState(getInitialColumns());
  const { toast } = useToast();

  const handleAddFollowUp = (newFollowUp: FollowUp) => {
    const updatedFollowUps = [...followUps, newFollowUp];
    setFollowUps(updatedFollowUps);
    setFilteredFollowUps(updatedFollowUps);
    
    // Update columns for the board view
    setColumns(prevColumns => {
      // Find the column that matches the status of the new follow-up
      return prevColumns.map(column => {
        if (column.id === newFollowUp.status) {
          return {
            ...column,
            followUps: [...column.followUps, newFollowUp]
          };
        }
        return column;
      });
    });

    toast.success({
      title: "Follow-up created",
      description: `Reminder set for ${format(new Date(newFollowUp.dueDate), "PPP 'at' p")}`,
    });
  };

  const handleFilterChange = (filters: any) => {
    let filtered = [...followUps];
    
    // Apply search filter - enhanced with enquiry data search
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(followUp => 
        followUp.title.toLowerCase().includes(searchTerm) ||
        (followUp.description && followUp.description.toLowerCase().includes(searchTerm)) ||
        (followUp.queryId && followUp.queryId.toLowerCase().includes(searchTerm)) ||
        (followUp.agentName && followUp.agentName.toLowerCase().includes(searchTerm)) ||
        (followUp.assignedTo && followUp.assignedTo.toLowerCase().includes(searchTerm)) ||
        (followUp.enquiryDetails?.destination && followUp.enquiryDetails.destination.toLowerCase().includes(searchTerm)) ||
        (followUp.enquiryDetails?.packageType && followUp.enquiryDetails.packageType.toLowerCase().includes(searchTerm)) ||
        (followUp.tags && followUp.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
      );
    }
    
    // Apply priority filter
    if (filters.priority && filters.priority !== 'all') {
      filtered = filtered.filter(followUp => followUp.priority === filters.priority);
    }

    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'overdue') {
        const now = new Date();
        filtered = filtered.filter(followUp => 
          new Date(followUp.dueDate) < now && 
          followUp.status !== 'completed' && 
          followUp.status !== 'cancelled'
        );
      } else {
        filtered = filtered.filter(followUp => followUp.status === filters.status);
      }
    }

    // Apply category filter
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(followUp => followUp.category === filters.category);
    }

    // Apply assigned to filter
    if (filters.assignedTo && filters.assignedTo !== 'all') {
      filtered = filtered.filter(followUp => followUp.assignedTo === filters.assignedTo);
    }

    // Apply enquiry status filter
    if (filters.enquiryStatus && filters.enquiryStatus !== 'all') {
      filtered = filtered.filter(followUp => 
        followUp.enquiryDetails?.enquiryStatus === filters.enquiryStatus
      );
    }

    // Apply booking status filter
    if (filters.bookingStatus && filters.bookingStatus !== 'all') {
      filtered = filtered.filter(followUp => 
        followUp.bookingDetails?.bookingStatus === filters.bookingStatus
      );
    }
    
    // Apply date filter
    if (filters.date) {
      const filterDate = new Date(filters.date);
      filtered = filtered.filter(followUp => {
        const followUpDate = new Date(followUp.dueDate);
        return (
          followUpDate.getDate() === filterDate.getDate() &&
          followUpDate.getMonth() === filterDate.getMonth() &&
          followUpDate.getFullYear() === filterDate.getFullYear()
        );
      });
    }

    // Apply overdue filter
    if (filters.overdue) {
      const now = new Date();
      filtered = filtered.filter(followUp => 
        new Date(followUp.dueDate) < now && 
        followUp.status !== 'completed' && 
        followUp.status !== 'cancelled'
      );
    }
    
    setFilteredFollowUps(filtered);
    
    // Update columns for the board view with filtered data
    const pendingFollowUps = filtered.filter(f => f.status === 'pending');
    const inProgressFollowUps = filtered.filter(f => f.status === 'in-progress');
    const completedFollowUps = filtered.filter(f => f.status === 'completed');
    const overdueFollowUps = filtered.filter(f => {
      const now = new Date();
      return new Date(f.dueDate) < now && f.status !== 'completed' && f.status !== 'cancelled';
    });
    
    setColumns([
      { id: 'pending', title: 'To Do', followUps: pendingFollowUps },
      { id: 'in-progress', title: 'In Progress', followUps: inProgressFollowUps },
      { id: 'completed', title: 'Completed', followUps: completedFollowUps },
      { id: 'overdue', title: 'Overdue', followUps: overdueFollowUps }
    ]);
  };

  // Get statistics for dashboard
  const stats = getFollowUpStats();

  return (
    <PageLayout>
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Enhanced Follow-ups Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Integrated enquiry and booking follow-up system
            </p>
          </div>
          <AddFollowUpDialog onAddFollowUp={handleAddFollowUp} />
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <List className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
                <Clock className="h-4 w-4 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold">{stats.inProgress}</p>
                </div>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
                <CheckCheck className="h-4 w-4 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                </div>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Urgent</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.urgent}</p>
                </div>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-4">
          <FollowUpsFilters onFilterChange={handleFilterChange} />
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="board">
                <MoveVertical className="mr-2 h-4 w-4" />
                Board View
              </TabsTrigger>
              <TabsTrigger value="list">
                <List className="mr-2 h-4 w-4" />
                All Tasks
              </TabsTrigger>
              <TabsTrigger value="pending">
                <ListTodo className="mr-2 h-4 w-4" />
                Pending ({stats.pending})
              </TabsTrigger>
              <TabsTrigger value="completed">
                <CheckCheck className="mr-2 h-4 w-4" />
                Completed ({stats.completed})
              </TabsTrigger>
              <TabsTrigger value="overdue">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Overdue ({stats.overdue})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="board">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MoveVertical className="h-5 w-5" />
                    Enhanced Follow-up Kanban Board
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Drag and drop follow-ups between status columns with enquiry context
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="h-[calc(100vh-400px)] min-h-[500px]">
                    <FollowUpsBoard initialColumns={columns} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="list">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <List className="h-5 w-5" />
                    All Follow-up Tasks
                    <Badge variant="secondary">{filteredFollowUps.length} tasks</Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Complete list with enquiry and booking details
                  </p>
                </CardHeader>
                <CardContent>
                  <FollowUpsTable followUps={filteredFollowUps} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="pending">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ListTodo className="h-5 w-5" />
                    Pending & In-Progress Tasks
                    <Badge variant="secondary">
                      {filteredFollowUps.filter(f => f.status === 'pending' || f.status === 'in-progress').length} tasks
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Tasks that require immediate attention
                  </p>
                </CardHeader>
                <CardContent>
                  <FollowUpsTable 
                    followUps={filteredFollowUps.filter(f => f.status === 'pending' || f.status === 'in-progress')} 
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="completed">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCheck className="h-5 w-5" />
                    Completed Follow-ups
                    <Badge variant="secondary">
                      {filteredFollowUps.filter(f => f.status === 'completed').length} tasks
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Successfully completed tasks with outcomes
                  </p>
                </CardHeader>
                <CardContent>
                  <FollowUpsTable 
                    followUps={filteredFollowUps.filter(f => f.status === 'completed')} 
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="overdue">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Overdue Tasks
                    <Badge variant="destructive">
                      {filteredFollowUps.filter(f => {
                        const now = new Date();
                        return new Date(f.dueDate) < now && f.status !== 'completed' && f.status !== 'cancelled';
                      }).length} overdue
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Tasks that have passed their due date and need urgent attention
                  </p>
                </CardHeader>
                <CardContent>
                  <FollowUpsTable 
                    followUps={filteredFollowUps.filter(f => {
                      const now = new Date();
                      return new Date(f.dueDate) < now && f.status !== 'completed' && f.status !== 'cancelled';
                    })} 
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PageLayout>
  );
};

export default FollowUps;
