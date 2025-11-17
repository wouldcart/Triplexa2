import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useParams, useNavigate } from 'react-router-dom';
import { Query } from '@/types/query';
import ProposalService from '@/services/proposalService';
import { useProposalBuilder } from '@/hooks/useProposalBuilder';
import { useAutoSaveProposal } from '@/hooks/useAutoSaveProposal';
import { EnhancedProposalManager as EPM } from '@/services/enhancedProposalManager';
import { 
  Save, Share, Eye, FileText, Calculator, 
  Users, Calendar, MapPin, DollarSign, CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DayByDayItineraryBuilder } from '@/components/proposal/DayByDayItineraryBuilder';
import EnhancedPricingCalculator from './EnhancedPricingCalculator';
import ProposalPreview from './ProposalPreview';
import ShareProposalDialog from './ShareProposalDialog';

interface EnhancedProposalManagerProps {
  queryId?: string;
}

const EnhancedProposalManager: React.FC<EnhancedProposalManagerProps> = ({ queryId: propQueryId }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const currentQueryId = propQueryId || id;
  const [query, setQuery] = useState<Query | null>(null);
  const [activeTab, setActiveTab] = useState('builder');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [savedProposalId, setSavedProposalId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  const {
    days,
    totalCost,
    loading,
    generateProposal,
    saveDraft
  } = useProposalBuilder(currentQueryId, {
    draftType: 'enhanced',
    autoLoadDraft: true
  });

  // Auto-save functionality
  const { manualSave, lastSaved, saveError, isSaving } = useAutoSaveProposal({
    queryId: currentQueryId || '',
    days,
    totalCost,
    query: query || undefined,
    enabled: true,
    showToast: false
  });

  useEffect(() => {
    const loadQuery = async () => {
      if (currentQueryId) {
        const queryData = await ProposalService.getQueryByIdAsync(currentQueryId);
        setQuery(queryData || null);
      }
    };
    loadQuery();
  }, [currentQueryId]);

  const handleSaveProposal = async () => {
    if (!query) return;
    
    setSaveStatus('saving');
    try {
      // Save using the enhanced proposal manager
      const proposalId = EPM.saveEnhancedProposal({
        queryId: currentQueryId,
        query,
        days,
        totalCost,
        pricing: {
          basePrice: totalCost,
          markup: 0,
          finalPrice: totalCost,
          currency: 'USD'
        }
      });
      
      setSavedProposalId(proposalId);
      setSaveStatus('saved');
      
      toast({
        title: "Proposal Saved",
        description: "Your proposal has been saved successfully",
      });

      // Store success state in localStorage for redirect
      localStorage.setItem(`proposal_saved_${currentQueryId}`, JSON.stringify({
        proposalId,
        savedAt: new Date().toISOString()
      }));

    } catch (error) {
      console.error('Error saving proposal:', error);
      setSaveStatus('unsaved');
      toast({
        title: "Save Failed",
        description: "There was an error saving your proposal",
        variant: "destructive"
      });
    }
  };

  const handlePreview = () => {
    manualSave(); // Save current state before preview
    setIsPreviewOpen(true);
  };

  const handleShare = () => {
    if (!savedProposalId) {
      toast({
        title: "Save First",
        description: "Please save the proposal before sharing",
        variant: "destructive"
      });
      return;
    }
    setIsShareDialogOpen(true);
  };

  const handleRedirectToProposals = () => {
    if (savedProposalId) {
      navigate(`/proposals/${savedProposalId}`);
    } else {
      navigate('/proposals');
    }
  };

  if (!query) {
    return (
      <div className="p-6 flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading query details...</p>
        </div>
      </div>
    );
  }

  const paxCount = query.paxDetails.adults + query.paxDetails.children;

  const getSaveStatusIcon = () => {
    switch (saveStatus) {
      case 'saved':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'saving':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />;
      case 'unsaved':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
    }
  };

  const getSaveStatusText = () => {
    if (saveError) {
      return `Auto-save error: ${saveError}`;
    }
    if (isSaving) {
      return 'Auto-saving...';
    }
    if (lastSaved) {
      return `Auto-saved ${lastSaved.toLocaleTimeString()}`;
    }
    switch (saveStatus) {
      case 'saved':
        return 'All changes saved';
      case 'saving':
        return 'Saving...';
      case 'unsaved':
        return 'Unsaved changes';
      default:
        return 'Ready';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Enhanced Proposal Manager</h1>
          <p className="text-muted-foreground">Query ID: {query.id}</p>
          <div className="flex items-center gap-2 mt-1">
            {getSaveStatusIcon()}
            <span className="text-sm text-muted-foreground">{getSaveStatusText()}</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {paxCount} PAX
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {query.tripDuration.days} Days
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {query.destination.cities.join(', ')}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              ${totalCost.toFixed(2)}
            </Badge>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreview}
            disabled={days.length === 0}
            className="flex items-center gap-1"
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveProposal}
            disabled={saveStatus === 'saving' || days.length === 0}
            className="flex items-center gap-1"
          >
            <Save className="h-4 w-4" />
            {saveStatus === 'saving' ? 'Saving...' : 'Save Proposal'}
          </Button>
          
          <Button
            size="sm"
            onClick={handleShare}
            disabled={!savedProposalId}
            className="flex items-center gap-1"
          >
            <Share className="h-4 w-4" />
            Share
          </Button>
          
          {savedProposalId && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRedirectToProposals}
              className="flex items-center gap-1"
            >
              <CheckCircle2 className="h-4 w-4" />
              View Proposals
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="builder" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            Builder
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-1">
            <Calculator className="h-4 w-4" />
            Pricing
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="mt-6">
          <DayByDayItineraryBuilder
            queryId={currentQueryId || ''}
            query={query}
            onDataChange={(updatedDays) => {
              // Sync with proposal builder state
              console.log('Enhanced proposal manager - data changed:', updatedDays);
              setSaveStatus('unsaved');
            }}
          />
        </TabsContent>

        <TabsContent value="pricing" className="mt-6">
          <EnhancedPricingCalculator 
            query={query}
            days={days}
            onPricingUpdate={(pricing) => {
              // Handle pricing updates
              console.log('Updated pricing:', pricing);
            }}
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          <ProposalPreview
            query={query}
            days={days}
            totalCost={totalCost}
            onSave={handleSaveProposal}
            onShare={handleShare}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ShareProposalDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        proposalId={savedProposalId}
        query={query}
      />
    </div>
  );
};

export default EnhancedProposalManager;