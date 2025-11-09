
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Query } from '@/types/query';
import ProposalService from '@/services/proposalService';
import { PricingService } from '@/services/pricingService';
import { formatCurrency } from '@/lib/formatters';
import { 
  FileText, Plus, DollarSign, Send, Users, Calendar, MapPin,
  CheckCircle, Clock, Car, Hotel, Landmark, Utensils
} from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import ProposalBasicInfo from '@/components/proposal/enhanced/ProposalBasicInfo';
import SmartModuleSelector from '@/components/proposal/SmartModuleSelector';
import AdvancedPricingEngine from '@/components/proposal/AdvancedPricingEngine';
import ProposalPreview from '@/components/proposal/ProposalPreview';

interface SelectedModule {
  id: string;
  type: 'transport' | 'hotel' | 'sightseeing' | 'restaurant' | 'additional';
  data: any;
  pricing: {
    basePrice: number;
    finalPrice: number;
    currency: string;
    breakdown?: {
      subtotal: number;
      markup: number;
      taxes?: number;
      discounts?: number;
    };
  };
  duration?: number;
  passengers?: number;
  nights?: number;
}

interface ProposalFormData {
  title: string;
  validUntil: Date;
  currency: string;
  paymentTerms: string;
  inclusions: string[];
  exclusions: string[];
  notes: string;
  markupType: 'percentage' | 'fixed';
  markupValue: number;
  branding: {
    companyLogo?: string;
    primaryColor: string;
    secondaryColor: string;
  };
}

const CreateProposal: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [query, setQuery] = useState<Query | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedModules, setSelectedModules] = useState<SelectedModule[]>([]);
  const [proposalData, setProposalData] = useState<ProposalFormData>({
    title: '',
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    currency: 'THB',
    paymentTerms: '30% advance, 70% before travel',
    inclusions: [],
    exclusions: [],
    notes: '',
    markupType: 'percentage',
    markupValue: 10,
    branding: {
      primaryColor: '#0066cc',
      secondaryColor: '#f8f9fa'
    }
  });
  const [totalPricing, setTotalPricing] = useState({
    subtotal: 0,
    markup: 0,
    taxes: 0,
    discounts: 0,
    total: 0,
    perPerson: 0,
    currency: 'THB'
  });

  const steps = [
    { id: 0, title: 'Basic Info', icon: FileText, completed: false },
    { id: 1, title: 'Add Services', icon: Plus, completed: false },
    { id: 2, title: 'Pricing & Review', icon: DollarSign, completed: false },
    { id: 3, title: 'Preview & Send', icon: Send, completed: false }
  ];

  // Currency mapping based on country
  const getCurrencyByCountry = (country: string): string => {
    const currencyMap: { [key: string]: string } = {
      'Thailand': 'THB',
      'India': 'INR',
      'UAE': 'AED',
      'Malaysia': 'MYR',
      'Singapore': 'SGD'
    };
    return currencyMap[country] || 'USD';
  };

  useEffect(() => {
    const loadQuery = async () => {
      if (id) {
        const queryData = await ProposalService.getQueryByIdAsync(id);
        if (queryData) {
          setQuery(queryData);
          initializeProposalFromQuery(queryData);
        }
      }
    };
    loadQuery();
  }, [id]);

  useEffect(() => {
    calculateTotalPricing();
  }, [selectedModules, query, proposalData.markupType, proposalData.markupValue]);

  const initializeProposalFromQuery = (queryData: Query) => {
    const currency = getCurrencyByCountry(queryData.destination.country);
    setProposalData(prev => ({
      ...prev,
      title: `${queryData.destination.country} Tour Package - ${queryData.tripDuration.days} Days`,
      currency
    }));
  };

  const calculateTotalPricing = () => {
    if (!query) return;

    const subtotal = selectedModules.reduce((sum, module) => sum + module.pricing.basePrice, 0);
    const paxCount = query.paxDetails.adults + query.paxDetails.children;
    
    let markup = 0;
    if (proposalData.markupType === 'percentage') {
      markup = (subtotal * proposalData.markupValue) / 100;
    } else {
      markup = proposalData.markupValue * paxCount;
    }

    const taxes = subtotal * 0.07; // 7% tax
    const total = subtotal + markup + taxes;
    
    setTotalPricing({
      subtotal,
      markup,
      taxes,
      discounts: 0,
      total,
      perPerson: total / paxCount,
      currency: proposalData.currency
    });
  };

  const addModule = (moduleData: SelectedModule) => {
    setSelectedModules(prev => [...prev, moduleData]);
  };

  const removeModule = (moduleId: string) => {
    setSelectedModules(prev => prev.filter(m => m.id !== moduleId));
  };

  const updateModulePricing = (moduleId: string, newPricing: any) => {
    setSelectedModules(prev => 
      prev.map(m => 
        m.id === moduleId 
          ? { ...m, pricing: { ...m.pricing, ...newPricing } }
          : m
      )
    );
  };

  const handleStepChange = (step: number) => {
    setActiveStep(step);
  };

  const getStepProgress = () => {
    return ((activeStep + 1) / steps.length) * 100;
  };

  const canProceedToNextStep = () => {
    switch (activeStep) {
      case 0: return proposalData.title && proposalData.currency;
      case 1: return selectedModules.length > 0;
      case 2: return totalPricing.total > 0;
      case 3: return true;
      default: return false;
    }
  };

  if (!query) {
    return (
      <PageLayout>
        <div className="p-6 flex justify-center items-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading query details...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  const paxCount = query.paxDetails.adults + query.paxDetails.children;

  return (
    <PageLayout>
      <div className="p-6 space-y-6">
        {/* Header with Progress */}
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Create Proposal</h1>
              <p className="text-muted-foreground">Query ID: {query.id} • {query.destination.country}</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {paxCount} PAX
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {query.tripDuration.days} Days
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {formatCurrency(totalPricing.total)} {totalPricing.currency}
              </Badge>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = activeStep === index;
                const isCompleted = activeStep > index;
                
                return (
                  <div key={step.id} className="flex items-center">
                    <div 
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                        isActive 
                          ? 'bg-primary text-primary-foreground' 
                          : isCompleted 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-muted text-muted-foreground'
                      }`}
                      onClick={() => handleStepChange(index)}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                      <span className="text-sm font-medium">{step.title}</span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-8 h-0.5 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-muted'}`} />
                    )}
                  </div>
                );
              })}
            </div>
            <Progress value={getStepProgress()} className="h-2" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeStep === 0 && (
              <ProposalBasicInfo 
                query={query}
                proposalData={proposalData}
                onUpdateProposalData={setProposalData}
              />
            )}

            {activeStep === 1 && (
              <SmartModuleSelector 
                query={query}
                selectedModules={selectedModules}
                onAddModule={addModule}
                onRemoveModule={removeModule}
                onUpdatePricing={updateModulePricing}
              />
            )}

            {activeStep === 2 && (
              <AdvancedPricingEngine 
                selectedModules={selectedModules}
                totalPricing={totalPricing}
                query={query}
                proposalData={proposalData}
                onRemoveModule={removeModule}
                onUpdatePricing={updateModulePricing}
                onUpdateProposalData={setProposalData}
              />
            )}

            {activeStep === 3 && (
              <ProposalPreview 
                query={query}
                proposalData={{
                  totalCost: totalPricing.total,
                  pricing: {
                    basePrice: totalPricing.subtotal,
                    markup: totalPricing.markup,
                    finalPrice: totalPricing.total,
                    currency: totalPricing.currency
                  }
                }}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              {/* Quick Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Quick Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Modules:</span>
                    <span>{selectedModules.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(totalPricing.subtotal)} {totalPricing.currency}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Markup:</span>
                    <span>{formatCurrency(totalPricing.markup)} {totalPricing.currency}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm font-medium">
                    <span>Total:</span>
                    <span className="text-primary">
                      {formatCurrency(totalPricing.total)} {totalPricing.currency}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Per Person:</span>
                    <span>{formatCurrency(totalPricing.perPerson)} {totalPricing.currency}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Module Count by Type */}
              {selectedModules.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Selected Modules</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {['transport', 'hotel', 'sightseeing', 'restaurant', 'additional'].map(type => {
                      const count = selectedModules.filter(m => m.type === type).length;
                      if (count === 0) return null;
                      
                      const icons = {
                        transport: Car,
                        hotel: Hotel,
                        sightseeing: Landmark,
                        restaurant: Utensils,
                        additional: Plus
                      };
                      const Icon = icons[type as keyof typeof icons];
                      
                      return (
                        <div key={type} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Icon className="h-3 w-3" />
                            <span className="capitalize">{type}</span>
                          </div>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Navigation */}
              <div className="space-y-2">
                <Button 
                  onClick={() => handleStepChange(Math.max(0, activeStep - 1))}
                  variant="outline"
                  className="w-full"
                  disabled={activeStep === 0}
                >
                  Previous Step
                </Button>
                <Button 
                  onClick={() => handleStepChange(Math.min(steps.length - 1, activeStep + 1))}
                  className="w-full"
                  disabled={!canProceedToNextStep() || activeStep === steps.length - 1}
                >
                  {activeStep === steps.length - 1 ? 'Generate Proposal' : 'Next Step'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default CreateProposal;
