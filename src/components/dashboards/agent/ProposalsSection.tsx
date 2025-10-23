import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProposalData } from '@/hooks/useProposalData';
import { 
  Eye, Share, Edit, Copy, MapPin, Users, 
  Calendar, DollarSign, Search, Filter, Building2, UserCheck, Settings
} from 'lucide-react';

const ProposalsSection: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  
  const { proposals, loading, getProposalsBySource, updateProposalStatus } = useProposalData();

  const getStatusBadge = (status: string, source: string) => {
    const sourceIcon = source === 'admin' ? <Building2 className="h-3 w-3 mr-1" /> : 
                      source === 'staff' ? <UserCheck className="h-3 w-3 mr-1" /> : 
                      <Settings className="h-3 w-3 mr-1" />;
    
    switch (status) {
      case 'draft':
        return <Badge variant="secondary" className="flex items-center">{sourceIcon}Draft</Badge>;
      case 'shared':
        return <Badge variant="outline" className="flex items-center">{sourceIcon}Shared</Badge>;
      case 'confirmed':
        return <Badge variant="default" className="flex items-center">{sourceIcon}Confirmed</Badge>;
      default:
        return <Badge variant="secondary" className="flex items-center">{sourceIcon}{status}</Badge>;
    }
  };

  const filteredProposals = proposals.filter(proposal => {
    const matchesStatus = statusFilter === "all" || proposal.status === statusFilter;
    const matchesSource = sourceFilter === "all" || proposal.source === sourceFilter;
    const matchesSearch = proposal.tripName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proposal.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proposal.destination.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSource && matchesSearch;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Edit className="h-5 w-5 mr-2" />
            My Proposals / Quotations
          </CardTitle>
          <CardDescription>
            Manage all your travel proposals and quotations from admin, staff, and your own creations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Proposals ({proposals.length})</TabsTrigger>
              <TabsTrigger value="admin">Admin ({getProposalsBySource('admin').length})</TabsTrigger>
              <TabsTrigger value="staff">Staff ({getProposalsBySource('staff').length})</TabsTrigger>
              <TabsTrigger value="agent">My Proposals ({getProposalsBySource('agent').length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search proposals, clients, destinations..."
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
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="shared">Shared</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Building2 className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="admin">Admin Created</SelectItem>
                    <SelectItem value="staff">Staff Created</SelectItem>
                    <SelectItem value="agent">Agent Created</SelectItem>
                  </SelectContent>
                </Select>
                <Button className="whitespace-nowrap">
                  <Edit className="h-4 w-4 mr-2" />
                  Create New Proposal
                </Button>
              </div>

              {/* Proposals Grid */}
              <div className="grid gap-4">
                {filteredProposals.map((proposal) => (
                  <Card key={proposal.id} className="border hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{proposal.tripName}</h3>
                              <p className="text-sm text-muted-foreground">
                                ID: {proposal.id} • Client: {proposal.clientName} • Created by: {proposal.createdBy}
                              </p>
                            </div>
                            {getStatusBadge(proposal.status, proposal.source)}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{proposal.destination}</div>
                            <div className="text-xs text-muted-foreground">
                              {proposal.cities.join(", ")}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {proposal.pax.adults + proposal.pax.children + proposal.pax.infants} Pax
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {proposal.pax.adults}A {proposal.pax.children > 0 && `${proposal.pax.children}C`} {proposal.pax.infants > 0 && `${proposal.pax.infants}I`}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{proposal.value}</div>
                            <div className="text-xs text-muted-foreground">
                              Total Value
                            </div>
                          </div>
                        </div>
                      </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          {proposal.status === 'draft' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => updateProposalStatus(proposal.id, 'shared')}
                            >
                              <Share className="h-4 w-4 mr-2" />
                              Share
                            </Button>
                          )}
                          {proposal.status === 'shared' && (
                            <Button 
                              size="sm"
                              onClick={() => updateProposalStatus(proposal.id, 'confirmed')}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Confirm
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <Copy className="h-4 w-4 mr-2" />
                            Clone
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="admin">
              <ProposalsList proposals={getProposalsBySource('admin')} source="admin" updateStatus={updateProposalStatus} />
            </TabsContent>

            <TabsContent value="staff">
              <ProposalsList proposals={getProposalsBySource('staff')} source="staff" updateStatus={updateProposalStatus} />
            </TabsContent>

            <TabsContent value="agent">
              <ProposalsList proposals={getProposalsBySource('agent')} source="agent" updateStatus={updateProposalStatus} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper component for proposal list
const ProposalsList: React.FC<{
  proposals: any[];
  source: string;
  updateStatus: (id: string, status: 'draft' | 'shared' | 'confirmed') => void;
}> = ({ proposals, source, updateStatus }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'shared':
        return <Badge variant="outline">Shared</Badge>;
      case 'confirmed':
        return <Badge variant="default">Confirmed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (proposals.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No proposals found from {source}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {proposals.map((proposal) => (
        <Card key={proposal.id} className="border hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{proposal.tripName}</h3>
                    <p className="text-sm text-muted-foreground">
                      ID: {proposal.id} • Client: {proposal.clientName} • Created by: {proposal.createdBy}
                    </p>
                  </div>
                  {getStatusBadge(proposal.status)}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{proposal.destination}</div>
                      <div className="text-xs text-muted-foreground">
                        {proposal.cities.join(", ")}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {proposal.pax.adults + proposal.pax.children + proposal.pax.infants} Pax
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {proposal.pax.adults}A {proposal.pax.children > 0 && `${proposal.pax.children}C`} {proposal.pax.infants > 0 && `${proposal.pax.infants}I`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{proposal.value}</div>
                      <div className="text-xs text-muted-foreground">
                        Total Value
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                {proposal.status === 'draft' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => updateStatus(proposal.id, 'shared')}
                  >
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                )}
                {proposal.status === 'shared' && (
                  <Button 
                    size="sm"
                    onClick={() => updateStatus(proposal.id, 'confirmed')}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Confirm
                  </Button>
                )}
                <Button variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Clone
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProposalsSection;