import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Hotel, 
  Calculator, 
  FileCheck, 
  Send, 
  Eye,
  MessageSquare,
  Calendar,
  User
} from 'lucide-react';
import { Query } from '@/types/query';
import { getQueryById } from '@/data/queryData';
import { useAgentData } from '@/hooks/useAgentData';
import ProposalManagement from './ProposalManagement';

const EnquiryManagement: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [query, setQuery] = useState<Query | null>(null);
  const [loading, setLoading] = useState(true);
  const { getAgentById } = useAgentData();

  useEffect(() => {
    if (id) {
      const queryData = getQueryById(id);
      setQuery(queryData);
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading enquiry details...</p>
        </div>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="p-6 flex justify-center items-center h-96">
        <div className="text-center">
          <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Enquiry Not Found</h2>
          <p className="text-muted-foreground">The enquiry you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const agent = getAgentById(query.agentId);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Enquiry Management</h1>
          <p className="text-muted-foreground">ID: {query.id}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{query.destination.country}</Badge>
            <Badge variant="secondary">{query.status}</Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {agent?.name || 'Unknown Agent'}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(query.createdAt).toLocaleDateString()}
          </Badge>
        </div>
      </div>

      {/* Enquiry Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Enquiry Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium">Destination</p>
              <p className="text-sm text-muted-foreground">
                {query.destination.cities.join(', ')}, {query.destination.country}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Duration</p>
              <p className="text-sm text-muted-foreground">{query.tripDuration.days} days / {query.tripDuration.nights} nights</p>
            </div>
            <div>
              <p className="text-sm font-medium">Travelers</p>
              <p className="text-sm text-muted-foreground">
                {query.paxDetails.adults} adults, {query.paxDetails.children} children
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Budget</p>
              <p className="text-sm text-muted-foreground">
                {query.budget.currency} {query.budget.min.toLocaleString()} - {query.budget.max.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Travel Dates</p>
              <p className="text-sm text-muted-foreground">
                {new Date(query.travelDates.from).toLocaleDateString()} - {new Date(query.travelDates.to).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Agent</p>
              <p className="text-sm text-muted-foreground">{agent?.name || 'Unassigned'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proposal Management */}
      <ProposalManagement query={query} />
    </div>
  );
};

export default EnquiryManagement;