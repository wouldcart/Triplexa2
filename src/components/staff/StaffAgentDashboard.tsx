
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Users, Plus, Search, Edit, Eye, Trash2, 
  TrendingUp, MapPin, Calendar, DollarSign
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAccessControl } from '@/hooks/use-access-control';
import { agents } from '@/data/agentData';
import { Agent } from '@/types/agent';

interface StaffAgentDashboardProps {
  onCreateAgent?: () => void;
  onEditAgent?: (agentId: number) => void;
  onViewAgent?: (agentId: number) => void;
}

const StaffAgentDashboard: React.FC<StaffAgentDashboardProps> = ({
  onCreateAgent,
  onEditAgent,
  onViewAgent
}) => {
  const { currentUser } = useApp();
  const { canManageAgent, getAccessibleAgents, canCreateAgent } = useAccessControl();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('my-agents');

  // Get agents accessible to current staff member
  const accessibleAgents = useMemo(() => {
    return getAccessibleAgents(agents);
  }, []);

  // Filter agents based on search and status
  const filteredAgents = useMemo(() => {
    return accessibleAgents.filter(agent => {
      const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           agent.country.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [accessibleAgents, searchTerm, statusFilter]);

  // Get agents created by current staff
  const myAgents = useMemo(() => {
    if (!currentUser) return [];
    return filteredAgents.filter(agent => 
      agent.createdBy?.staffId === parseInt(currentUser.id)
    );
  }, [filteredAgents, currentUser]);

  // Get agents assigned to current staff
  const assignedAgents = useMemo(() => {
    if (!currentUser) return [];
    return filteredAgents.filter(agent => 
      agent.staffAssignments?.some(assignment => 
        assignment.staffId === parseInt(currentUser.id) && 
        agent.createdBy?.staffId !== parseInt(currentUser.id)
      )
    );
  }, [filteredAgents, currentUser]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalAgents = myAgents.length + assignedAgents.length;
    const activeAgents = filteredAgents.filter(a => a.status === 'active').length;
    const totalRevenue = filteredAgents.reduce((sum, agent) => sum + agent.stats.revenueGenerated, 0);
    const avgConversion = filteredAgents.length > 0 
      ? Math.round(filteredAgents.reduce((sum, agent) => sum + agent.stats.conversionRate, 0) / filteredAgents.length)
      : 0;

    return {
      totalAgents,
      activeAgents,
      totalRevenue,
      avgConversion
    };
  }, [myAgents, assignedAgents, filteredAgents]);

  const handleAgentAction = (agent: Agent, action: 'edit' | 'view' | 'delete') => {
    if (!canManageAgent(agent.id, action)) {
      return;
    }

    switch (action) {
      case 'edit':
        onEditAgent?.(agent.id);
        break;
      case 'view':
        onViewAgent?.(agent.id);
        break;
      case 'delete':
        // Handle delete logic
        console.log('Delete agent:', agent.id);
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">My Agent Portfolio</h2>
          <p className="text-gray-600">Manage your created and assigned agents</p>
        </div>
        {canCreateAgent() && (
          <Button onClick={onCreateAgent} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create New Agent
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Agents</p>
                <p className="text-2xl font-bold">{stats.totalAgents}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Agents</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeAgents}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-purple-600">${stats.totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Conversion</p>
                <p className="text-2xl font-bold text-orange-600">{stats.avgConversion}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search agents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="my-agents">My Agents ({myAgents.length})</TabsTrigger>
          <TabsTrigger value="assigned">Assigned to Me ({assignedAgents.length})</TabsTrigger>
          <TabsTrigger value="all">All Accessible ({filteredAgents.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="my-agents" className="space-y-4">
          <AgentTable 
            agents={myAgents} 
            onAgentAction={handleAgentAction}
            canManageAgent={canManageAgent}
            showOwnership={false}
          />
        </TabsContent>

        <TabsContent value="assigned" className="space-y-4">
          <AgentTable 
            agents={assignedAgents} 
            onAgentAction={handleAgentAction}
            canManageAgent={canManageAgent}
            showOwnership={true}
          />
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <AgentTable 
            agents={filteredAgents} 
            onAgentAction={handleAgentAction}
            canManageAgent={canManageAgent}
            showOwnership={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface AgentTableProps {
  agents: Agent[];
  onAgentAction: (agent: Agent, action: 'edit' | 'view' | 'delete') => void;
  canManageAgent: (agentId: number, action: string) => boolean;
  showOwnership: boolean;
}

const AgentTable: React.FC<AgentTableProps> = ({ 
  agents, 
  onAgentAction, 
  canManageAgent, 
  showOwnership 
}) => {
  if (agents.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No agents found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent Details</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Performance</TableHead>
              {showOwnership && <TableHead>Created By</TableHead>}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents.map((agent) => (
              <TableRow key={agent.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{agent.name}</p>
                    <p className="text-sm text-gray-500">{agent.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={agent.type === 'company' ? 'default' : 'secondary'}>
                        {agent.type}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {agent.commissionValue} ({agent.commissionType})
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-gray-400" />
                    <span className="text-sm">{agent.city}, {agent.country}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={agent.status === 'active' ? 'success' : 'secondary'}>
                    {agent.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p>{agent.stats.conversionRate}% conversion</p>
                    <p className="text-gray-500">${agent.stats.revenueGenerated.toLocaleString()}</p>
                  </div>
                </TableCell>
                {showOwnership && (
                  <TableCell>
                    <div className="text-sm">
                      <p>{agent.createdBy?.staffName || 'System'}</p>
                      <p className="text-gray-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(agent.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAgentAction(agent, 'view')}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    {canManageAgent(agent.id, 'edit') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAgentAction(agent, 'edit')}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                    {canManageAgent(agent.id, 'delete') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAgentAction(agent, 'delete')}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default StaffAgentDashboard;
