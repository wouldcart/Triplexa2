import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useParams } from 'react-router-dom';
import { Query } from '@/types/query';
import ProposalService from '@/services/proposalService';
import { EnhancedProposalManager as EPM } from '@/services/enhancedProposalManager';
import { useAutoSaveProposal } from '@/hooks/useAutoSaveProposal';
import { toast } from 'sonner';
import { 
  FileText, Calculator, Eye, Share2, Save, 
  Settings, AlertCircle, CheckCircle 
} from 'lucide-react';

// Import the enhanced proposal components
import EnhancedProposalBuilder from './EnhancedProposalBuilder';
import AdvancedPricingCalculator from './AdvancedPricingCalculator';
import ProposalPreview from './ProposalPreview';
import ShareSystem from './ShareSystem';

interface EnhancedProposalManagerProps {
  context?: 'enhanced';
}

const EnhancedProposalManager: React.FC<EnhancedProposalManagerProps> = () => {
  const { id } = useParams<{ id: string }>();
  const [query, setQuery] = useState<Query | null>(null);
  const [activeTab, setActiveTab] = useState('builder');
  const [proposalData, setProposalData] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  
  // Auto-save functionality  
  const { manualSave, lastSaved, saveError, isSaving } = useAutoSaveProposal({
    queryId: id || '',
    days: proposalData?.days || [],
    totalCost: proposalData?.totalCost || 0,
    query: query || undefined,
    enabled: true,
    debounceMs: 5000, // Increased from 2000ms to 5000ms for better typing experience
    showToast: false
  });

  // Load existing enhanced proposal data
  useEffect(() => {
    if (id) {
      const existingData = EPM.getProposal(id);
      if (existingData) {
        setProposalData(existingData);
        console.log('Loaded existing enhanced proposal:', existingData);
      }
    }
  }, [id]);

  useEffect(() => {
    const load = async () => {
      if (id) {
        const queryData = await ProposalService.getQueryByIdAsync(id);
        setQuery(queryData);

        // Load existing proposal data
        const existingProposal = EPM.getProposal(id);
        if (existingProposal) {
          setProposalData(existingProposal);
        }
      }
    };
    load();
  }, [id]);

  const handleSaveProposal = async () => {
    if (!query || !proposalData) return;
    
    setSaveStatus('saving');
    try {
      const proposalId = EPM.saveEnhancedProposal({
        queryId: id,
        query,
        days: proposalData.days || [],
        totalCost: proposalData.totalCost || 0,
        pricing: proposalData.pricing || {
          basePrice: 0,
          markup: 0,
          finalPrice: 0,
          currency: 'USD'
        }
      });
      
      setSaveStatus('saved');
      toast.success('Proposal saved successfully');
      return proposalId;
    } catch (error) {
      setSaveStatus('unsaved');
      toast.error('Failed to save proposal');
      console.error('Save error:', error);
    }
  };

  const handleDataUpdate = (newData: any) => {
    setProposalData(prev => ({ ...prev, ...newData }));
    setSaveStatus('unsaved');
  };

  if (!query) {
    return (
      <div className="p-6 flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading query details...</p>
        </div>
      </div>
    );
  }

  const getSaveStatusIcon = () => {
    switch (saveStatus) {
      case 'saved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'saving':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />;
      case 'unsaved':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
    }
  };

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saved':
        return 'All changes saved';
      case 'saving':
        return 'Saving...';
      case 'unsaved':
        return 'Unsaved changes';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header with Save Status */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Enhanced Proposal Manager</h1>
          <p className="text-muted-foreground">Query ID: {query.id}</p>
          <div className="flex items-center gap-2 mt-1">
            {getSaveStatusIcon()}
            <span className="text-sm text-muted-foreground">{getSaveStatusText()}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveProposal}
            disabled={saveStatus === 'saving'}
            className="flex items-center gap-1"
          >
            <Save className="h-3 w-3" />
            Save Proposal
          </Button>
          
          <Badge variant="outline">
            {query.destination.cities.join(', ')}, {query.destination.country}
          </Badge>
        </div>
      </div>

      {/* Main Tabbed Interface */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="builder" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Builder
              </TabsTrigger>
              <TabsTrigger value="pricing" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Pricing
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="share" className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="builder" className="p-6 pt-0">
              <EnhancedProposalBuilder 
                context="enhanced"
                onDataUpdate={handleDataUpdate}
              />
            </TabsContent>
            
            <TabsContent value="pricing" className="p-6 pt-0">
              <AdvancedPricingCalculator
                query={query}
                proposalData={proposalData}
                onPricingUpdate={handleDataUpdate}
              />
            </TabsContent>
            
            <TabsContent value="preview" className="p-6 pt-0">
              <ProposalPreview
                query={query}
                proposalData={proposalData}
              />
            </TabsContent>
            
            <TabsContent value="share" className="p-6 pt-0">
              <ShareSystem
                query={query}
                proposalData={proposalData}
                onSave={handleSaveProposal}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedProposalManager;