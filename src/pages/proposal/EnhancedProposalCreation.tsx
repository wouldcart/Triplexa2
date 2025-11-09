
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Send, Eye, Sparkles } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { Query } from '@/types/query';
import ProposalService from '@/services/proposalService';
import { useToast } from '@/hooks/use-toast';
import { Breadcrumb } from '@/components/ui/breadcrumb';

const EnhancedProposalCreation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [query, setQuery] = useState<Query | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuery = async () => {
      try {
        if (!id) {
          throw new Error('Query ID not provided');
        }

        const queryData = await ProposalService.getQueryByIdAsync(id);
        if (!queryData) {
          throw new Error(`Query with ID ${id} not found`);
        }

        setQuery(queryData);
      } catch (error) {
        console.error('Error loading query:', error);
        toast({
          title: "Error loading query",
          description: error instanceof Error ? error.message : "Failed to load query details",
          variant: "destructive"
        });
        setTimeout(() => navigate('/queries'), 2000);
      } finally {
        setLoading(false);
      }
    };

    loadQuery();
  }, [id, navigate, toast]);

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <h2 className="text-xl font-semibold">Loading Query Details...</h2>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!query) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center text-red-600">Query Not Found</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                The query with ID "{id}" could not be found.
              </p>
              <Button onClick={() => navigate('/queries')} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Queries
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  const breadcrumbItems = [
    { label: 'Queries', href: '/queries' },
    { label: query.id, href: `/queries/${query.id}` },
    { label: 'Enhanced Proposal', icon: Sparkles }
  ];

  return (
    <PageLayout>
      <div className="space-y-6">
        <Breadcrumb items={breadcrumbItems} />
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate(`/queries/${encodeURIComponent(query.id)}`)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Query
            </Button>
            
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-green-600" />
                Enhanced Proposal
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">Query: {query.id}</Badge>
                <Badge variant="secondary">{query.destination.country}</Badge>
                <Badge variant="outline">
                  {query.paxDetails.adults + query.paxDetails.children} PAX
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Query Summary */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800">Query Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-green-700">Destination</p>
                <p className="text-sm text-green-600">{query.destination.country}</p>
                <p className="text-xs text-green-500">{query.destination.cities.join(', ')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-green-700">Travel Dates</p>
                <p className="text-sm text-green-600">
                  {new Date(query.travelDates.from).toLocaleDateString()} - {new Date(query.travelDates.to).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-green-700">Travelers</p>
                <p className="text-sm text-green-600">
                  {query.paxDetails.adults} Adults
                  {query.paxDetails.children > 0 && `, ${query.paxDetails.children} Children`}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-green-700">Package Type</p>
                <p className="text-sm text-green-600 capitalize">{query.packageType}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Proposal Form */}
        <Card>
          <CardHeader>
            <CardTitle>Enhanced Proposal Builder</CardTitle>
            <p className="text-muted-foreground">
              Form-based proposal creation with advanced customization options and rich content.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Enhanced Proposal Builder
              </h3>
              <p className="text-gray-500 mb-4">
                This feature is currently under development. Use the Advanced Proposal Builder for now.
              </p>
              <Button 
                onClick={() => navigate(`/queries/advanced-proposal/${encodeURIComponent(query.id)}`)}
                className="gap-2"
              >
                Use Advanced Builder
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default EnhancedProposalCreation;
