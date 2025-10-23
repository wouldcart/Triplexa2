import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Hotel, 
  Calculator, 
  FileCheck, 
  Send, 
  Eye,
  Settings,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Query } from '@/types/query';
import { toast } from 'sonner';

import EnhancedPricingManagement from './pricing/EnhancedPricingManagement';
import EditableTermsConditions from './terms/EditableTermsConditions';
import AdvancedProposalActions from './actions/AdvancedProposalActions';

interface ProposalManagementProps {
  query: Query;
}

interface ProposalData {
  accommodations: any[];
  pricing: any;
  terms: any;
  status: 'draft' | 'ready' | 'sent';
}

const ProposalManagement: React.FC<ProposalManagementProps> = ({ query }) => {
  const [activeTab, setActiveTab] = useState('pricing');
  const [proposalData, setProposalData] = useState<ProposalData>({
    accommodations: [],
    pricing: null,
    terms: null,
    status: 'draft'
  });
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // Load existing proposal data
  useEffect(() => {
    loadProposalData();
  }, [query.id]);

  const loadProposalData = () => {
    try {
      const savedData = localStorage.getItem(`proposal_${query.id}`);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setProposalData(parsed);
      }
    } catch (error) {
      console.error('Error loading proposal data:', error);
    }
  };

  const saveProposalData = (updates: Partial<ProposalData>) => {
    setSaveStatus('saving');
    try {
      const updatedData = { ...proposalData, ...updates };
      setProposalData(updatedData);
      localStorage.setItem(`proposal_${query.id}`, JSON.stringify(updatedData));
      setSaveStatus('saved');
      toast.success('Proposal data saved');
    } catch (error) {
      setSaveStatus('unsaved');
      toast.error('Failed to save proposal data');
      console.error('Error saving proposal data:', error);
    }
  };

  const handleAccommodationUpdate = (accommodations: any[]) => {
    saveProposalData({ accommodations });
  };

  const handlePricingUpdate = (pricing: any) => {
    // Only save if pricing data has actually changed
    if (JSON.stringify(proposalData.pricing) !== JSON.stringify(pricing)) {
      saveProposalData({ pricing });
    }
  };

  const handleTermsUpdate = (terms: any) => {
    saveProposalData({ terms });
  };

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

  const getTabCompletionStatus = () => {
    return {
      pricing: proposalData.pricing !== null,
      terms: proposalData.terms !== null
    };
  };

  const completionStatus = getTabCompletionStatus();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Proposal Management
          </CardTitle>
          <div className="flex items-center gap-2">
            {getSaveStatusIcon()}
            <span className="text-sm text-muted-foreground">{getSaveStatusText()}</span>
            <Badge variant={proposalData.status === 'ready' ? 'default' : 'secondary'}>
              {proposalData.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="pricing" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Pricing
              {completionStatus.pricing && <CheckCircle className="h-3 w-3 text-green-600" />}
            </TabsTrigger>
            <TabsTrigger value="terms" className="flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Terms & Conditions
              {completionStatus.terms && <CheckCircle className="h-3 w-3 text-green-600" />}
            </TabsTrigger>
            <TabsTrigger value="actions" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Actions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pricing" className="p-6">
            <EnhancedPricingManagement
              query={query}
              pricing={proposalData.pricing}
              onUpdate={handlePricingUpdate}
            />
          </TabsContent>

          <TabsContent value="terms" className="p-6">
            <EditableTermsConditions
              query={query}
              terms={proposalData.terms}
              onUpdate={handleTermsUpdate}
            />
          </TabsContent>

          <TabsContent value="actions" className="p-6">
            <AdvancedProposalActions
              query={query}
              proposalData={proposalData}
              onStatusUpdate={(status) => saveProposalData({ status })}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ProposalManagement;