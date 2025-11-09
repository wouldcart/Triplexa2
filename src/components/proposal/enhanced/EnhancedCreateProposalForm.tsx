
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Query } from '@/types/query';
import ProposalService from '@/services/proposalService';
import { PricingService } from '@/services/pricingService';
import { formatCurrency } from '@/lib/formatters';
import { 
  Car, Hotel, Landmark, Utensils, Plus, Settings, 
  Users, Calendar, MapPin, DollarSign, Calculator,
  CheckCircle, Clock, FileText, Send
} from 'lucide-react';
import ProposalBasicInfo from './ProposalBasicInfo';
import SmartModuleSelector from './SmartModuleSelector';
import EnhancedPricingSummary from './EnhancedPricingSummary';
import ProposalPreview from '../ProposalPreview';

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
  branding: {
    companyLogo?: string;
    primaryColor: string;
    secondaryColor: string;
  };
}

const EnhancedCreateProposalForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [query, setQuery] = useState<Query | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedModules, setSelectedModules] = useState<SelectedModule[]>([]);
  const [proposalData, setProposalData] = useState<ProposalFormData>({
    title: '',
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    currency: 'THB',
    paymentTerms: '30% advance, 70% before travel',
    inclusions: [],
    exclusions: [],
    notes: '',
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
    { id: 1, title: 'Select Modules', icon: Plus, completed: false },
    { id: 2, title: 'Pricing & Review', icon: DollarSign, completed: false },
    { id: 3, title: 'Preview & Send', icon: Send, completed: false }
  ];

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
  }, [selectedModules, query]);

  const initializeProposalFromQuery = (queryData: Query) => {
    setProposalData(prev => ({
      ...prev,
      title: `${queryData.destination.country} Tour Package - ${queryData.tripDuration.days} Days`,
      currency: queryData.destination.country === 'Thailand' ? 'THB' : 
                queryData.destination.country === 'India' ? 'INR' : 'USD'
    }));
  };

  const calculateTotalPricing = () => {
    if (!query) return;

    const subtotal = selectedModules.reduce((sum, module) => sum + module.pricing.basePrice, 0);
    const paxCount = query.paxDetails.adults + query.paxDetails.children;
    
    const pricing = PricingService.calculateMarkup(subtotal, paxCount, proposalData.currency);
    
    setTotalPricing({
      subtotal: pricing.basePrice,
      markup: pricing.markup,
      taxes: pricing.basePrice * 0.07, // 7% tax example
      discounts: 0,
      total: pricing.finalPrice + (pricing.basePrice * 0.07),
      perPerson: (pricing.finalPrice + (pricing.basePrice * 0.07)) / paxCount,
      currency: pricing.currency
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
      <div className="p-6 flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading query details...</p>
        </div>
      </div>
    );
  }

  const paxCount = query.paxDetails.adults + query.paxDetails.children;

  return (
    <div className="p-6 space-y-6">
      {/* Header with Progress */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Create Enhanced Proposal</h1>
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
            <Card>
              <CardHeader>
                <CardTitle>Pricing Review & Adjustments</CardTitle>
              </CardHeader>
              <CardContent>
                <EnhancedPricingSummary 
                  selectedModules={selectedModules}
                  totalPricing={totalPricing}
                  query={query}
                  currency={proposalData.currency}
                  onRemoveModule={removeModule}
                  onUpdatePricing={updateModulePricing}
                  onCurrencyChange={(currency) => setProposalData(prev => ({ ...prev, currency }))}
                />
              </CardContent>
            </Card>
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
                  <span>Total:</span>
                  <span className="font-medium">
                    {formatCurrency(totalPricing.total)} {totalPricing.currency}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Per Person:</span>
                  <span>{formatCurrency(totalPricing.perPerson)} {totalPricing.currency}</span>
                </div>
              </CardContent>
            </Card>

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
  );
};

export default EnhancedCreateProposalForm;
