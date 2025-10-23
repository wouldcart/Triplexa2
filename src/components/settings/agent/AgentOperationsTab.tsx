
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Filter, Download, Upload, Settings, Users, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';

// Mock data for agents
const mockAgents = [
  { id: 1, name: 'Travel Pro Agency', email: 'contact@travelpro.com', tier: 'premium', status: 'active', totalBookings: 245 },
  { id: 2, name: 'Adventure Tours Ltd', email: 'info@adventure.com', tier: 'vip', status: 'active', totalBookings: 389 },
  { id: 3, name: 'City Breaks Co', email: 'hello@citybreaks.com', tier: 'basic', status: 'inactive', totalBookings: 67 },
  { id: 4, name: 'Luxury Getaways', email: 'bookings@luxury.com', tier: 'vip', status: 'active', totalBookings: 512 },
];

const AgentOperationsTab: React.FC = () => {
  const [selectedAgents, setSelectedAgents] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const handleSelectAgent = (agentId: number) => {
    setSelectedAgents(prev => 
      prev.includes(agentId) 
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  const handleSelectAll = () => {
    const filteredAgents = mockAgents.filter(agent => {
      const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTier = filterTier === 'all' || agent.tier === filterTier;
      const matchesStatus = filterStatus === 'all' || agent.status === filterStatus;
      return matchesSearch && matchesTier && matchesStatus;
    });
    
    setSelectedAgents(filteredAgents.map(agent => agent.id));
  };

  const handleBulkOperation = (operation: string) => {
    if (selectedAgents.length === 0) {
      toast.error('Please select at least one agent');
      return;
    }
    
    toast.success(`${operation} applied to ${selectedAgents.length} agent(s)`);
    setSelectedAgents([]);
  };

  const filteredAgents = mockAgents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = filterTier === 'all' || agent.tier === filterTier;
    const matchesStatus = filterStatus === 'all' || agent.status === filterStatus;
    return matchesSearch && matchesTier && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Bulk Operations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Bulk Agent Operations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              onClick={() => handleBulkOperation('Activate')}
              disabled={selectedAgents.length === 0}
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Activate Selected ({selectedAgents.length})
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleBulkOperation('Deactivate')}
              disabled={selectedAgents.length === 0}
            >
              <UserX className="mr-2 h-4 w-4" />
              Deactivate Selected
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleBulkOperation('Update Commission')}
              disabled={selectedAgents.length === 0}
            >
              <Settings className="mr-2 h-4 w-4" />
              Update Commission
            </Button>
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Import Agents
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Agent Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search agents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterTier} onValueChange={setFilterTier}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
                <SelectItem value="partner">Partner</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSelectAll} variant="outline">
              Select All Filtered
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Agents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedAgents.length === filteredAgents.length && filteredAgents.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Agent Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Bookings</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedAgents.includes(agent.id)}
                      onCheckedChange={() => handleSelectAgent(agent.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{agent.name}</TableCell>
                  <TableCell>{agent.email}</TableCell>
                  <TableCell>
                    <Badge variant={
                      agent.tier === 'vip' ? 'default' : 
                      agent.tier === 'premium' ? 'secondary' : 'outline'
                    }>
                      {agent.tier.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={agent.status === 'active' ? 'default' : 'destructive'}>
                      {agent.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{agent.totalBookings}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentOperationsTab;
