import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  MessageSquare, 
  Phone, 
  Mail, 
  TrendingUp,
  Search,
  Filter,
  User2,
  Building2,
  PlusCircle
} from 'lucide-react';
import { useAccessControl } from '@/hooks/use-access-control';
import PageLayout from '@/components/layout/PageLayout';
import { useApp } from '@/contexts/AppContext';
import { AgentManagementService } from '@/services/agentManagementService';
import type { ManagedAgent } from '@/types/agentManagement';

const SalesAgents: React.FC = () => {
  const navigate = useNavigate();
  const { canAccessModule } = useAccessControl();
  const { currentUser } = useApp();
  const isStaff = (currentUser?.role || '').toLowerCase() === 'staff';
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [agents, setAgents] = useState<ManagedAgent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  if (!canAccessModule('sales-dashboard')) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">You don't have access to this module.</p>
        </div>
      </PageLayout>
    );
  }

  const loadAgents = async () => {
    try {
      setLoading(true);
      const { data, error } = await AgentManagementService.getAgents();
      if (error) {
        setError('Failed to load agents');
        console.error('Error loading agents:', error);
        setAgents([]);
        return;
      }
      const allAgents = (data || []);
      const visibleAgents = isStaff && currentUser?.id
        ? allAgents.filter(a => String(a.created_by || '') === String(currentUser.id))
        : allAgents;
      setAgents(visibleAgents);
    } catch (err) {
      setError('Failed to load agents');
      console.error('Error loading agents:', err);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch = searchTerm === "" ||
      (agent.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (agent.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || (agent.type || 'individual') === typeFilter;
    const matchesStatus = statusFilter === "all" || (agent.status || 'inactive') === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const agentStats = {
    totalAgents: filteredAgents.length,
    activeAgents: filteredAgents.filter(a => a.status === 'active').length,
    totalRevenue: '₹0',
    totalBookings: 0
  };

  return (
    <PageLayout
      title="Agent Management"
      breadcrumbItems={[
        { title: "Home", href: "/" },
        { title: "Sales", href: "/sales" },
        { title: "Agent Management", href: "/sales/agents" },
      ]}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Agent Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage and monitor your B2B travel agents
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total Agents: {agentStats.totalAgents}
            </span>
            <Button onClick={() => navigate('/management/agents/add')}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Agent
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Agents</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{agentStats.totalAgents}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-100">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Agents</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{agentStats.activeAgents}</p>
                </div>
                <div className="p-3 rounded-full bg-green-100">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{agentStats.totalRevenue}</p>
                </div>
                <div className="p-3 rounded-full bg-purple-100">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Bookings</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{agentStats.totalBookings}</p>
                </div>
                <div className="p-3 rounded-full bg-orange-100">
                  <MessageSquare className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search agents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="company">Company</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Agent Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Agents</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAgents.map((agent) => (
                <AgentCard 
                  key={agent.id} 
                  agent={{
                    id: agent.id,
                    name: agent.name,
                    email: agent.email,
                    country: (agent.country || '—'),
                    city: (agent.city || '—'),
                    type: agent.type || 'individual',
                    status: agent.status || 'inactive',
                    commissionType: agent.commission_type || 'percentage',
                    commissionValue: String(agent.commission_value ?? '0%'),
                    totalBookings: 0,
                    revenue: '₹0',
                    lastActivity: agent.updated_at || agent.created_at || ''
                  }}
                  onEdit={() => navigate(`/management/agents/${agent.id}/edit`)}
                  onToggleStatus={async () => {
                    const newStatus = agent.status === 'active' ? 'inactive' : 'active';
                    const { error } = await AgentManagementService.updateAgent({ id: agent.id, status: newStatus });
                    if (!error) {
                      setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, status: newStatus } : a));
                    } else {
                      console.error('Failed to update status', error);
                    }
                  }}
                />
              ))}
            </div>
            {filteredAgents.length === 0 && (
              <div className="text-center py-10 text-gray-500">
                No agents found matching your criteria
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="active" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAgents
                .filter((agent) => agent.status === "active")
                .map((agent) => (
                  <AgentCard 
                    key={agent.id} 
                    agent={{
                      id: agent.id,
                      name: agent.name,
                      email: agent.email,
                      country: (agent.country || '—'),
                      city: (agent.city || '—'),
                      type: agent.type || 'individual',
                      status: agent.status || 'inactive',
                      commissionType: agent.commission_type || 'percentage',
                      commissionValue: String(agent.commission_value ?? '0%'),
                      totalBookings: 0,
                      revenue: '₹0',
                      lastActivity: agent.updated_at || agent.created_at || ''
                    }}
                    onEdit={() => navigate(`/management/agents/${agent.id}/edit`)}
                    onToggleStatus={async () => {
                      const newStatus = agent.status === 'active' ? 'inactive' : 'active';
                      const { error } = await AgentManagementService.updateAgent({ id: agent.id, status: newStatus });
                      if (!error) {
                        setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, status: newStatus } : a));
                      } else {
                        console.error('Failed to update status', error);
                      }
                    }}
                  />
                ))}
            </div>
          </TabsContent>
          
          <TabsContent value="inactive" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAgents
                .filter((agent) => agent.status === "inactive")
                .map((agent) => (
                  <AgentCard 
                    key={agent.id} 
                    agent={{
                      id: agent.id,
                      name: agent.name,
                      email: agent.email,
                      country: (agent.country || '—'),
                      city: (agent.city || '—'),
                      type: agent.type || 'individual',
                      status: agent.status || 'inactive',
                      commissionType: agent.commission_type || 'percentage',
                      commissionValue: String(agent.commission_value ?? '0%'),
                      totalBookings: 0,
                      revenue: '₹0',
                      lastActivity: agent.updated_at || agent.created_at || ''
                    }}
                    onEdit={() => navigate(`/management/agents/${agent.id}/edit`)}
                    onToggleStatus={async () => {
                      const newStatus = agent.status === 'active' ? 'inactive' : 'active';
                      const { error } = await AgentManagementService.updateAgent({ id: agent.id, status: newStatus });
                      if (!error) {
                        setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, status: newStatus } : a));
                      } else {
                        console.error('Failed to update status', error);
                      }
                    }}
                  />
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

interface AgentCardProps {
  agent: {
    id: string;
    name: string;
    email: string;
    country: string;
    city: string;
    type: string;
    status: string;
    commissionType: string;
    commissionValue: string;
    totalBookings: number;
    revenue: string;
    lastActivity: string;
  };
  onEdit?: () => void;
  onToggleStatus?: () => void;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, onEdit, onToggleStatus }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{agent.name}</CardTitle>
        <Badge variant={agent.status === "active" ? "default" : "secondary"}>
          {agent.status === "active" ? "Active" : "Inactive"}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex items-center mb-3">
          {agent.type === "company" ? (
            <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
          ) : (
            <User2 className="h-4 w-4 mr-2 text-muted-foreground" />
          )}
          <span className="text-xs text-muted-foreground capitalize">
            {agent.type}
          </span>
        </div>
        
        <div className="space-y-2 text-sm">
          <p className="text-gray-500">{agent.email}</p>
          <div className="flex items-center gap-1 text-gray-500">
            <span>{agent.city}, {agent.country}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Revenue:</span>
            <span className="font-semibold text-green-600">{agent.revenue}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Bookings:</span>
            <span className="font-semibold">{agent.totalBookings}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Commission:</span>
            <span className="font-semibold">{agent.commissionValue}</span>
          </div>
          <div className="text-xs text-gray-400">
            Last activity: {agent.lastActivity}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>Edit</Button>
            )}
            {onToggleStatus && (
              <Button variant="outline" size="sm" onClick={onToggleStatus}>
                {agent.status === 'active' ? 'Deactivate' : 'Activate'}
              </Button>
            )}
          </div>
        </div>
        
        <div className="mt-4 flex gap-2">
          <Button size="sm" variant="outline" className="flex-1">
            <Phone className="h-3 w-3 mr-1" />
            Call
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <Mail className="h-3 w-3 mr-1" />
            Email
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <MessageSquare className="h-3 w-3 mr-1" />
            Chat
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesAgents;