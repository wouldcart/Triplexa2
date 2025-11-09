
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Query } from '@/types/query';
import ProposalService from '@/services/proposalService';
import { useProposalBuilder } from '@/hooks/useProposalBuilder';
import EnhancedProposalService from '@/services/enhancedProposalService';

// Import section components
import ItineraryOverviewSummary from './sections/ItineraryOverviewSummary';
import InclusionExclusionEditor from './sections/InclusionExclusionEditor';
import TermsConditionsEditor from './sections/TermsConditionsEditor';
import AdvancedPricingCalculator from './sections/AdvancedPricingCalculator';
import ProposalReviewSummary from './sections/ProposalReviewSummary';

import { 
  Calendar, FileText, DollarSign, Settings, 
  ArrowLeft, Save, Eye, Mail, Download, 
  Share, MessageSquare, Check, X
} from 'lucide-react';

const ComprehensiveProposalManager: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [query, setQuery] = useState<Query | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Proposal data state
  const [proposalData, setProposalData] = useState({
    inclusions: [] as string[],
    exclusions: [] as string[],
    termsConditions: {
      paymentTerms: '',
      cancellationPolicy: '',
      additionalTerms: ''
    },
    pricing: {
      subtotal: 0,
      discountAmount: 0,
      markupAmount: 0,
      taxes: { total: 0 },
      finalTotal: 0,
      perPersonPrice: 0
    }
  });

  // Use the existing proposal builder hook
  const {
    days,
    totalCost,
    generateProposal
  } = useProposalBuilder(id);

  useEffect(() => {
    const loadQuery = async () => {
      if (id) {
        const queryData = await ProposalService.getQueryByIdAsync(id);
        if (queryData) {
          setQuery(queryData);
          loadExistingProposalData();
        } else {
          toast({
            title: "Query not found",
            description: "The requested query could not be found.",
            variant: "destructive"
          });
          navigate('/queries');
        }
        setLoading(false);
      }
    };
    loadQuery();
  }, [id, navigate, toast]);

  const loadExistingProposalData = () => {
    // Load existing proposal data from localStorage or service
    const savedData = localStorage.getItem(`comprehensive_proposal_${id}`);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setProposalData(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Error loading proposal data:', error);
      }
    }
  };

  const saveProposalData = () => {
    localStorage.setItem(`comprehensive_proposal_${id}`, JSON.stringify(proposalData));
  };

  const updateInclusionsExclusions = (data: { inclusions: string[]; exclusions: string[] }) => {
    setProposalData(prev => ({
      ...prev,
      inclusions: data.inclusions,
      exclusions: data.exclusions
    }));
    saveProposalData();
  };

  const updateTermsConditions = (data: any) => {
    setProposalData(prev => ({
      ...prev,
      termsConditions: data
    }));
    saveProposalData();
  };

  const updatePricing = (data: any) => {
    setProposalData(prev => ({
      ...prev,
      pricing: data
    }));
    saveProposalData();
  };

  // Action handlers
  const handlePreview = () => {
    // Implementation for preview
    toast({
      title: "Preview",
      description: "Opening proposal preview...",
    });
  };

  const handleSendEmail = () => {
    toast({
      title: "Email",
      description: "Sending proposal via email...",
    });
  };

  const handleDownloadPDF = () => {
    toast({
      title: "Download",
      description: "Generating PDF...",
    });
  };

  const handleShareLink = () => {
    toast({
      title: "Share Link",
      description: "Generating shareable link...",
    });
  };

  const handleShareWhatsApp = () => {
    toast({
      title: "WhatsApp",
      description: "Opening WhatsApp to share proposal...",
    });
  };

  const handleConfirm = async () => {
    try {
      const proposalId = await generateProposal();
      
      // Create booking from proposal
      toast({
        title: "Proposal Confirmed",
        description: "Booking has been created successfully!",
      });
      
      navigate(`/bookings/${proposalId}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to confirm proposal. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDrop = () => {
    if (confirm('Are you sure you want to drop this proposal and cancel the query?')) {
      // Clear proposal data
      localStorage.removeItem(`comprehensive_proposal_${id}`);
      localStorage.removeItem(`proposal_draft_${id}`);
      
      toast({
        title: "Proposal Dropped",
        description: "Query has been cancelled.",
        variant: "destructive"
      });
      
      navigate('/queries');
    }
  };

  const handleEditSection = (section: string) => {
    const tabMap: { [key: string]: string } = {
      'itinerary': 'overview',
      'inclusions': 'inclusions',
      'exclusions': 'inclusions',
      'terms': 'terms',
      'pricing': 'pricing'
    };
    
    setActiveTab(tabMap[section] || section);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <h2 className="text-xl font-semibold">Loading Proposal Manager...</h2>
        </div>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Query Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p>The requested query could not be found.</p>
            <Button onClick={() => navigate('/queries')} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Queries
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare comprehensive proposal data for review
  const comprehensiveProposal = {
    query,
    days,
    inclusions: proposalData.inclusions,
    exclusions: proposalData.exclusions,
    termsConditions: proposalData.termsConditions,
    ...proposalData.pricing
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-none">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl mb-2">Comprehensive Proposal Manager</CardTitle>
                <p className="text-blue-100">
                  {query.destination.cities.join(', ')}, {query.destination.country}
                </p>
                <p className="text-sm text-blue-100 mt-1">
                  Query ID: {query.id} • {days.length} days planned
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="secondary" 
                  onClick={() => navigate('/queries')}
                  className="gap-2 bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="overview" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="inclusions" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Inclusions/Exclusions
            </TabsTrigger>
            <TabsTrigger value="terms" className="flex items-center gap-1">
              <Settings className="h-4 w-4" />
              Terms & Conditions
            </TabsTrigger>
            <TabsTrigger value="pricing" className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              Pricing
            </TabsTrigger>
            <TabsTrigger value="review" className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              Review
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <ItineraryOverviewSummary
              days={days}
              totalCost={totalCost}
              currency="USD"
            />
          </TabsContent>

          <TabsContent value="inclusions" className="mt-6">
            <InclusionExclusionEditor
              data={{
                inclusions: proposalData.inclusions,
                exclusions: proposalData.exclusions
              }}
              onChange={updateInclusionsExclusions}
            />
          </TabsContent>

          <TabsContent value="terms" className="mt-6">
            <TermsConditionsEditor
              data={proposalData.termsConditions}
              onChange={updateTermsConditions}
            />
          </TabsContent>

          <TabsContent value="pricing" className="mt-6">
            <AdvancedPricingCalculator
              basePrice={totalCost}
              paxDetails={{
                adults: query.paxDetails.adults,
                children: query.paxDetails.children,
                infants: query.paxDetails.infants
              }}
              onChange={updatePricing}
              currency="USD"
            />
          </TabsContent>

          <TabsContent value="review" className="mt-6">
            <ProposalReviewSummary
              proposal={comprehensiveProposal}
              onEdit={handleEditSection}
              onPreview={handlePreview}
              onSendEmail={handleSendEmail}
              onDownloadPDF={handleDownloadPDF}
              onShareLink={handleShareLink}
              onShareWhatsApp={handleShareWhatsApp}
              onConfirm={handleConfirm}
              onDrop={handleDrop}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ComprehensiveProposalManager;
