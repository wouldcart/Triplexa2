
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Query } from '@/types/query';
import { ProposalData } from '@/services/proposalService';
import EnhancedProposalService from '@/services/enhancedProposalService';
import { 
  Plus, Copy, Edit, Trash2, Eye, Clock, 
  FileText, Calendar, DollarSign, Users, Share, Calculator
} from 'lucide-react';

interface ProposalListManagerProps {
  query: Query;
  onCreateNew: () => void;
  onEditProposal: (proposalId: string) => void;
  onViewProposal: (proposalId: string) => void;
}

const ProposalListManager: React.FC<ProposalListManagerProps> = ({
  query,
  onCreateNew,
  onEditProposal,
  onViewProposal
}) => {
  const [proposals, setProposals] = useState<ProposalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadProposals();
  }, [query.id]);

  const loadProposals = () => {
    try {
      console.log('Loading proposals for query:', query.id);
      const queryProposals = EnhancedProposalService.getProposalsByQuery(query.id);
      console.log('Found proposals:', queryProposals);
      setProposals(queryProposals);
      
      if (queryProposals.length > 0) {
        toast({
          title: "Proposals Loaded",
          description: `Found ${queryProposals.length} proposal(s) for this enquiry`
        });
      }
    } catch (error) {
      console.error('Error loading proposals:', error);
      toast({
        title: "Error loading proposals",
        description: "Failed to load proposals for this enquiry",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (proposalId: string) => {
    try {
      console.log('Duplicating proposal:', proposalId);
      const newProposalId = EnhancedProposalService.duplicateProposal(proposalId);
      if (newProposalId) {
        loadProposals(); // Refresh the list
        toast({
          title: "Proposal duplicated",
          description: `New proposal ${newProposalId} created successfully`
        });
      } else {
        throw new Error('Failed to duplicate proposal');
      }
    } catch (error) {
      console.error('Error duplicating proposal:', error);
      toast({
        title: "Duplication failed",
        description: "Failed to duplicate the proposal",
        variant: "destructive"
      });
    }
  };

  const handleShare = (proposalId: string) => {
    // Implement share functionality
    navigator.clipboard.writeText(`Proposal ID: ${proposalId}`);
    toast({
      title: "Proposal shared",
      description: "Proposal ID copied to clipboard"
    });
  };

  const handlePricing = (proposalId: string) => {
    // Navigate to pricing page or show pricing dialog
    toast({
      title: "Pricing Management",
      description: "Opening pricing options for this proposal"
    });
    // In a real app, this might navigate to a pricing page
    onEditProposal(proposalId);
  };

  const handleDelete = async (proposalId: string) => {
    try {
      // In a real implementation, you'd add a delete method to the service
      toast({
        title: "Delete functionality",
        description: "Delete functionality will be implemented in the next iteration"
      });
      setDeleteDialog(null);
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete the proposal",
        variant: "destructive"
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'sent': return 'default';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading proposals...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Proposals for {query.id}
            {proposals.length > 0 && (
              <Badge variant="outline">{proposals.length} proposals</Badge>
            )}
          </CardTitle>
          <Button onClick={onCreateNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Create New Proposal
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {proposals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No proposals created yet</p>
            <p className="text-sm mb-4">Create your first proposal for this enquiry</p>
            <Button onClick={onCreateNew} className="gap-2">
              <Plus className="h-4 w-4" />
              Create First Proposal
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {proposals.map((proposal) => (
              <Card key={proposal.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{proposal.id}</h3>
                        <Badge variant={getStatusBadgeVariant(proposal.metadata.status)}>
                          {proposal.metadata.status}
                        </Badge>
                        <Badge variant="outline">
                          v{proposal.metadata.version}
                        </Badge>
                        {proposal.modules.length > 0 && (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {proposal.modules.length} days
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          Created: {new Date(proposal.metadata.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Clock className="h-4 w-4" />
                          Updated: {new Date(proposal.metadata.updatedAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <DollarSign className="h-4 w-4" />
                          Total: {formatCurrency(proposal.totals.total)}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {proposal.totals.moduleCount} modules
                        </span>
                        <span>
                          Destinations: {query.destination.cities.join(', ')}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onViewProposal(proposal.id)}
                        className="gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleShare(proposal.id)}
                        className="gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Share className="h-3 w-3" />
                        Share
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handlePricing(proposal.id)}
                        className="gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Calculator className="h-3 w-3" />
                        Pricing
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onEditProposal(proposal.id)}
                        className="gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Modify
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDuplicate(proposal.id)}
                        className="gap-1"
                      >
                        <Copy className="h-3 w-3" />
                        Duplicate
                      </Button>
                      <Dialog open={deleteDialog === proposal.id} onOpenChange={(open) => setDeleteDialog(open ? proposal.id : null)}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete Proposal</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <p>Are you sure you want to delete proposal <strong>{proposal.id}</strong>?</p>
                            <p className="text-sm text-gray-600">This action cannot be undone.</p>
                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" onClick={() => setDeleteDialog(null)}>
                                Cancel
                              </Button>
                              <Button 
                                variant="destructive" 
                                onClick={() => handleDelete(proposal.id)}
                              >
                                Delete Proposal
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProposalListManager;
