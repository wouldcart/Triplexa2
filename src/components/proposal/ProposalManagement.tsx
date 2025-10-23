import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, Mail, Download, Share, Users, MapPin, Calendar, 
  DollarSign, Clock, Phone, Edit, Send, CheckCircle, Settings,
  Eye, Copy, Save, AlertCircle, Hotel
} from 'lucide-react';
import { TeamsManagement } from '@/components/proposal/teams/TeamsManagement';
import { ConditionsModule } from '@/components/proposal/conditions/ConditionsModule';
import { AdvancedPricingModule } from '@/components/proposal/pricing/AdvancedPricingModule';
import { getCurrencyByCountry } from '@/utils/currencyUtils';
import EnhancedDayCard from '@/components/proposal/itinerary/EnhancedDayCard';
import EnhancedAccommodationPlanning from '@/components/proposal/accommodation/EnhancedAccommodationPlanning';
import { extractAccommodationsFromDays, mapAccommodationsToDays } from '@/utils/accommodationUtils';
import EditableTermsConditionsModule from './sections/EditableTermsConditionsModule';
import EditableEmailForm from './enhanced/EditableEmailForm';
import EnhancedPreviewDialog from './enhanced/EnhancedPreviewDialog';
import { useProposalPersistence } from '@/hooks/useProposalPersistence';
import PDFTemplateSelector from '@/components/pdf/PDFTemplateSelector';
import { SimplifiedMarkupModule } from './pricing/SimplifiedMarkupModule';
import { universalPDFService } from '@/services/universalPDFService';

interface ProposalManagementProps {
  queryId: string;
  proposalData?: any;
  onAction?: (action: string, data?: any) => void;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  responsibilities: string[];
}

export const ProposalManagement: React.FC<ProposalManagementProps> = ({
  queryId,
  proposalData,
  onAction
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('pricing');
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [realItineraryData, setRealItineraryData] = useState<any[]>([]);
  const [pricingBreakdown, setPricingBreakdown] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPDFTemplateSelectorOpen, setIsPDFTemplateSelectorOpen] = useState(false);

  // Use persistent data hook
  const {
    data: persistentData,
    updateItineraryData,
    updateTermsConditions,
    updateEmailData,
    updatePricingConfig
  } = useProposalPersistence(queryId);

  // Phase 2: Optimized data loading with proper loading state and non-blocking operations
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  useEffect(() => {
    if (!queryId) return;

    // Optimized data loading with batched localStorage operations
    const loadAllData = () => {
      setIsLoadingData(true);
      
      // Make all localStorage operations non-blocking
      Promise.resolve().then(() => {
        try {
          // Batch multiple localStorage keys for efficiency
          const keys = [
            `proposal_persistence_${queryId}_enhanced`,
            `markup_settings_${queryId}`,
            `itinerary_builder_${queryId}`
          ];
          
          const loadedData = keys.reduce((acc, key) => {
            try {
              const value = localStorage.getItem(key);
              if (value) acc[key] = JSON.parse(value);
            } catch (error) {
              console.warn(`Corrupted data in ${key}, removing`);
              localStorage.removeItem(key);
            }
            return acc;
          }, {} as Record<string, any>);
          
          // Load real itinerary data from various sources
          const loadRealItineraryData = () => {
            // First try persistent data
            if (persistentData.itineraryData.length > 0) {
              console.log('Loading itinerary from persistent data');
              setRealItineraryData(persistentData.itineraryData);
              return;
            }

            // Then try from proposalData
            if (proposalData?.days && Array.isArray(proposalData.days)) {
              console.log('Loading itinerary from proposalData');
              setRealItineraryData(proposalData.days);
              return;
            }

            // Try localStorage keys
            const storageKeys = [
              `proposal_draft_${queryId}`,
              `itinerary_builder_${queryId}`,
              `central_itinerary_${queryId}`
            ];

            for (const storageKey of storageKeys) {
              try {
                const savedData = localStorage.getItem(storageKey);
                if (savedData) {
                  const parsedData = JSON.parse(savedData);
                  let daysData = null;
                  
                  if (parsedData.days?.length) daysData = parsedData.days;
                  else if (parsedData.data?.length) daysData = parsedData.data;
                  else if (Array.isArray(parsedData) && parsedData.length) daysData = parsedData;
                  
                  if (daysData) {
                    console.log(`✅ Loaded itinerary from ${storageKey}`);
                    setRealItineraryData(daysData);
                    return;
                  }
                }
              } catch (error) {
                console.warn(`Error loading from ${storageKey}:`, error);
                localStorage.removeItem(storageKey);
              }
            }

            // Fallback to empty array
            console.log('No itinerary data found, using empty array');
            setRealItineraryData([]);
          };

          loadRealItineraryData();
          
        } catch (error) {
          console.error('Error in batched data loading:', error);
          setRealItineraryData([]);
        } finally {
          setIsLoadingData(false);
        }
      });
    };

    loadAllData();
  }, [queryId, persistentData.itineraryData, proposalData]);

  // Handle accommodation updates from the enhanced planning component
  const handleAccommodationUpdate = (accommodationData: any) => {
    console.log('Accommodation data updated in ProposalManagement:', accommodationData);
    
    // Update the real itinerary data with accommodation changes
    const updatedDays = mapAccommodationsToDays(accommodationData, realItineraryData);
    setRealItineraryData(updatedDays);
    
    // Save back to localStorage to persist changes
    try {
      const draftData = {
        queryId,
        days: updatedDays,
        totalCost: updatedDays.reduce((total, day) => total + (day.totalCost || 0), 0),
        savedAt: new Date().toISOString(),
        accommodations: accommodationData,
        version: Date.now()
      };
      localStorage.setItem(`proposal_draft_${queryId}`, JSON.stringify(draftData));
      
      // Also save accommodation-specific data
      localStorage.setItem(`accommodations_${queryId}`, JSON.stringify(accommodationData));
      
      toast({
        title: "Accommodations Updated",
        description: "Your accommodation changes have been saved to the itinerary",
      });
    } catch (error) {
      console.error('Error saving accommodation updates:', error);
      toast({
        title: "Save Error",
        description: "Could not save accommodation changes",
        variant: "destructive"
      });
    }
  };

  const handleSendEmail = () => {
    if (!persistentData.emailData.to || !persistentData.emailData.subject) {
      toast({
        title: "Missing Information",
        description: "Please fill in recipient email and subject",
        variant: "destructive"
      });
      return;
    }

    onAction?.('send', persistentData.emailData);
    
    toast({
      title: "Email Sent",
      description: "Your proposal has been sent successfully",
    });
  };

  const handleTermsSave = () => {
    toast({
      title: "Terms Saved",
      description: "Terms & conditions have been saved successfully",
    });
  };

  const handlePricingUpdate = (pricing: any) => {
    setPricingBreakdown(pricing);
    updatePricingConfig({
      mode: pricing.mode || 'separate',
      adultMarkup: pricing.adultMarkup || 15,
      childMarkup: pricing.childMarkup || 10,
      childDiscountPercent: pricing.childDiscountPercent || 25
    });
  };

  const handleDownloadPDF = () => {
    setIsPDFTemplateSelectorOpen(true);
  };

  const handleTemplateSelect = async (templateId: string) => {
    try {
      // Extract accommodations from itinerary data
      const accommodations = extractAccommodationsFromDays(realItineraryData);
      
      // Prepare proposal data for PDF generation
      const proposalPDFData = {
        queryId,
        destination: query?.destination,
        itinerary: realItineraryData,
        accommodations: accommodations,
        pricing: pricingBreakdown,
        teams: team,
        conditions: persistentData.termsConditions,
        generatedAt: new Date(),
        clientInfo: {
          name: query?.clientName || 'Valued Client',
          email: query?.clientEmail || '',
          phone: query?.clientPhone || ''
        }
      };

      const pdfBlob = await universalPDFService.generateProposalPDF(proposalPDFData);
      const filename = `proposal-${queryId}-${new Date().toISOString().split('T')[0]}.pdf`;
      universalPDFService.downloadPDF(pdfBlob, filename);

      onAction?.('download', { templateId });
      toast({
        title: "PDF Generated",
        description: "Your proposal PDF has been generated and downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleShareWhatsApp = () => {
    onAction?.('share');
  };

  const calculateTotalCost = () => {
    if (!realItineraryData || realItineraryData.length === 0) return 0;
    return realItineraryData.reduce((total, day) => total + (day.totalCost || 0), 0);
  };

  const getCountryCurrency = () => {
    // Get country from query data or proposalData
    const country = proposalData?.query?.destination?.country || 
                   proposalData?.destination?.country || 
                   'Thailand'; // Default to Thailand
    
    return getCurrencyByCountry(country);
  };

  const formatCurrency = (amount: number) => {
    const { symbol, code } = getCountryCurrency();
    
    // Handle different currency formatting
    if (code === 'THB') {
      return `${symbol}${amount.toLocaleString('th-TH', { minimumFractionDigits: 0 })}`;
    } else if (code === 'AED') {
      return `${symbol}${amount.toLocaleString('ar-AE', { minimumFractionDigits: 0 })}`;
    } else if (code === 'SGD') {
      return `${symbol}${amount.toLocaleString('en-SG', { minimumFractionDigits: 0 })}`;
    } else if (code === 'INR') {
      return `${symbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: code,
        minimumFractionDigits: 0,
      }).format(amount);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const totalCost = calculateTotalCost();
  const query = proposalData?.query;
  const { code: currencyCode } = getCountryCurrency();

  // Phase 1: Loading state component
  if (isLoadingData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground">Loading proposal data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Proposal Management</h2>
          <p className="text-muted-foreground">Review, customize and send your travel proposal</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-100 text-green-700">
            {realItineraryData.length} days planned
          </Badge>
          <Badge variant="outline" className="bg-blue-100 text-blue-700">
            Total: {formatCurrency(totalCost)}
          </Badge>
        </div>
      </div>

      {/* Tabs Navigation with Radix UI */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full h-auto">
          <TabsTrigger 
            value="pricing" 
            className="flex items-center gap-2 py-3 px-4 transition-all duration-200 hover:bg-accent/50"
          >
            <DollarSign className="h-4 w-4" />
            Markup
          </TabsTrigger>
          <TabsTrigger 
            value="conditions" 
            className="flex items-center gap-2 py-3 px-4 transition-all duration-200 hover:bg-accent/50"
          >
            <FileText className="h-4 w-4" />
            Terms
          </TabsTrigger>
          <TabsTrigger 
            value="actions" 
            className="flex items-center gap-2 py-3 px-4 transition-all duration-200 hover:bg-accent/50"
          >
            <Send className="h-4 w-4" />
            Share
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pricing" className="mt-4 space-y-4">
          {/* Phase 3: Proper loading state without Suspense */}
          <SimplifiedMarkupModule
            queryId={queryId}
            query={query}
            onPricingUpdate={(pricingSnapshot) => {
              console.log('Pricing data updated:', pricingSnapshot);
              
              // Phase 2: Extract real pricing data from the snapshot
              const adultMarkup = pricingSnapshot?.markup?.percentage || 15;
              const childMarkup = adultMarkup * 0.8; // 80% of adult markup
              
              // Phase 4: Update pricing configuration with actual data for real-time sync
              updatePricingConfig({
                mode: 'separate',
                adultMarkup,
                childMarkup,
                childDiscountPercent: 25
              });

              // Phase 4: Trigger real-time sync event
              window.dispatchEvent(new CustomEvent('proposal-pricing-updated', {
                detail: { queryId, snapshot: pricingSnapshot }
              }));
            }}
          />
        </TabsContent>

        <TabsContent value="conditions" className="mt-4 space-y-4">
          {/* Phase 3: Proper loading state without Suspense */}
          <EditableTermsConditionsModule
            data={persistentData.termsConditions}
            onChange={(updatedTerms) => {
              // Phase 4: Enhanced real-time sync for terms updates
              updateTermsConditions(updatedTerms);
              
              // Trigger real-time sync event
              window.dispatchEvent(new CustomEvent('proposal-terms-updated', {
                detail: { queryId, terms: updatedTerms }
              }));
            }}
          />
        </TabsContent>

        <TabsContent value="actions" className="mt-4 space-y-4">
          <div className="space-y-6">
            {/* Enhanced Preview Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Enhanced Preview Before Sending
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Preview Mode Selector */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setIsPreviewOpen(true)}
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Enhanced Preview
                  </Button>
                  
                  {/* Email Preview Dialog */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Mail className="h-4 w-4" />
                        Email Preview
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Email Preview & Edit</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="previewEmailTo">To</Label>
                            <Input id="previewEmailTo" defaultValue={persistentData.emailData.to || "client@example.com"} />
                          </div>
                          <div>
                            <Label htmlFor="previewEmailSubject">Subject</Label>
                            <Input id="previewEmailSubject" defaultValue={`Your ${query?.destination?.cities?.join(', ')} Travel Proposal`} />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="previewEmailBody">Email Body</Label>
                          <Textarea 
                            id="previewEmailBody" 
                            rows={12}
                            defaultValue={`Dear Valued Client,

We're excited to present your personalized travel proposal for ${query?.destination?.cities?.join(', ')}, ${query?.destination?.country}.

📍 Destination: ${query?.destination?.cities?.join(', ')}, ${query?.destination?.country}
📅 Duration: ${realItineraryData.length} days
💰 Total Cost: ${formatCurrency(totalCost)}
👥 Travelers: ${(query?.paxDetails?.adults || 0) + (query?.paxDetails?.children || 0)} person(s)

Your itinerary includes:
${realItineraryData.slice(0, 3).map((day, index) => 
  `• Day ${day.day}: ${day.title || day.city} - ${formatCurrency(day.totalCost || 0)}`
).join('\n')}

TOUR INCLUSIONS:
${persistentData.termsConditions.inclusions.map(item => `• ${item}`).join('\n')}

TOUR EXCLUSIONS:
${persistentData.termsConditions.exclusions.map(item => `• ${item}`).join('\n')}

PAYMENT TERMS:
${persistentData.termsConditions.paymentTerms || 'Standard payment terms apply'}

CANCELLATION POLICY:
${persistentData.termsConditions.cancellationPolicy || 'Standard cancellation policy applies'}

${persistentData.termsConditions.additionalTerms ? `ADDITIONAL TERMS:
${persistentData.termsConditions.additionalTerms}

` : ''}This proposal is valid for 30 days. Please feel free to reach out with any questions or modifications.

Best regards,
Your Travel Team`}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline">Save Changes</Button>
                          <Button>Send Email</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  {/* WhatsApp Preview Dialog */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Phone className="h-4 w-4" />
                        WhatsApp Preview
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>WhatsApp Preview & Edit</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="whatsappMessage">WhatsApp Message</Label>
                          <Textarea 
                            id="whatsappMessage" 
                            rows={10}
                            defaultValue={`🌟 Your ${query?.destination?.cities?.join(', ')} Travel Proposal is Ready! 🌟

📍 ${query?.destination?.cities?.join(', ')}, ${query?.destination?.country}
📅 ${realItineraryData.length} amazing days
💰 Total: ${formatCurrency(totalCost)}

Highlights:
${realItineraryData.slice(0, 2).map((day) => 
  `✈️ Day ${day.day}: ${day.title || day.city}`
).join('\n')}

📋 INCLUSIONS:
${persistentData.termsConditions.inclusions.slice(0, 3).map(item => `✅ ${item}`).join('\n')}${persistentData.termsConditions.inclusions.length > 3 ? '\n➕ And more...' : ''}

💳 PAYMENT: ${persistentData.termsConditions.paymentTerms?.split('\n')[0] || 'Flexible payment terms available'}

📝 Valid for 30 days. All terms & conditions included in detailed proposal.

This incredible journey awaits you! Ready to book? Let's chat! 💬`}
                          />
                        </div>
                        <div>
                          <Label htmlFor="phoneNumber">Phone Number</Label>
                          <Input id="phoneNumber" placeholder="+1234567890" />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline">Save Changes</Button>
                          <Button className="bg-green-600 hover:bg-green-700">Send WhatsApp</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  {/* PDF Preview Dialog */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <FileText className="h-4 w-4" />
                        PDF Preview
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>PDF Preview & Settings</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6">
                        {/* PDF Settings */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="pdfTitle">Document Title</Label>
                            <Input id="pdfTitle" defaultValue={`${query?.destination?.cities?.join(', ')} Travel Proposal`} />
                          </div>
                          <div>
                            <Label htmlFor="companyName">Company Name</Label>
                            <Input id="companyName" defaultValue="Your Travel Agency" />
                          </div>
                        </div>
                        
                        {/* PDF Options */}
                        <div className="space-y-3">
                          <h4 className="font-medium">Include in PDF:</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="pdfItinerary" defaultChecked />
                              <Label htmlFor="pdfItinerary">Detailed Itinerary</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="pdfPricing" defaultChecked />
                              <Label htmlFor="pdfPricing">Pricing Breakdown</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="pdfAccommodation" defaultChecked />
                              <Label htmlFor="pdfAccommodation">Accommodation Details</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="pdfTerms" defaultChecked />
                              <Label htmlFor="pdfTerms">Terms & Conditions</Label>
                            </div>
                          </div>
                        </div>
                        
                        {/* PDF Preview */}
                        <div className="border rounded-lg p-6 bg-muted/30 min-h-[300px]">
                          <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold">{query?.destination?.cities?.join(', ')} Travel Proposal</h2>
                            <p className="text-muted-foreground">Prepared for our valued client</p>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <strong>Destination:</strong> {query?.destination?.cities?.join(', ')}, {query?.destination?.country}
                              </div>
                              <div>
                                <strong>Duration:</strong> {realItineraryData.length} days
                              </div>
                              <div>
                                <strong>Total Cost:</strong> {formatCurrency(totalCost)}
                              </div>
                              <div>
                                <strong>Travelers:</strong> {(query?.paxDetails?.adults || 0) + (query?.paxDetails?.children || 0)} person(s)
                              </div>
                            </div>
                            
                            <div className="mt-4">
                              <h4 className="font-semibold mb-2">Itinerary Highlights:</h4>
                              <div className="space-y-2 text-sm">
                                {realItineraryData.slice(0, 3).map((day, index) => (
                                  <div key={index} className="flex justify-between">
                                    <span>Day {day.day}: {day.title || day.city}</span>
                                    <span>{formatCurrency(day.totalCost || 0)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          <Button variant="outline">Save Settings</Button>
                          <Button>Download PDF</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Quick Preview Summary */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <h4 className="font-medium mb-3">Proposal Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Destination:</span>
                      <p className="font-medium">{query?.destination?.cities?.join(', ')} - {query?.destination?.country}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration:</span>
                      <p className="font-medium">{realItineraryData.length} days planned</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Cost:</span>
                      <p className="font-medium text-primary">{formatCurrency(totalCost)}</p>
                    </div>
                  </div>
                  
                  {realItineraryData.length > 0 && (
                    <div className="mt-4">
                      <span className="text-muted-foreground text-sm">Recent highlights:</span>
                      <div className="mt-2 space-y-1">
                        {realItineraryData.slice(0, 2).map((day, index) => (
                          <div key={index} className="text-sm bg-background rounded p-2">
                            <span className="font-medium">Day {day.day}:</span> {day.title || day.city}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Edit Options */}
                <div className="space-y-4">
                  <h4 className="font-medium">Customize Before Sending</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="proposalTitle">Proposal Title</Label>
                      <Input
                        id="proposalTitle"
                        defaultValue={`${query?.destination?.cities?.join(', ')} Travel Experience`}
                        placeholder="Enter proposal title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="validityDays">Valid for (days)</Label>
                      <Input
                        id="validityDays"
                        type="number"
                        defaultValue="30"
                        placeholder="30"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="customMessage">Custom Message</Label>
                    <Textarea
                      id="customMessage"
                      placeholder="Add a personalized message for your client..."
                      rows={3}
                      defaultValue="We're excited to present this carefully crafted travel experience for you."
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="includePricing" defaultChecked />
                      <Label htmlFor="includePricing">Include detailed pricing</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="includeTerms" defaultChecked />
                      <Label htmlFor="includeTerms">Include terms & conditions</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Enhanced Email Section */}
            <EditableEmailForm
              query={query}
              days={realItineraryData}
              totalCost={totalCost}
              emailData={persistentData.emailData}
              onEmailDataChange={updateEmailData}
              onSendEmail={handleSendEmail}
            />

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" onClick={handleDownloadPDF} className="gap-2">
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                  <Button variant="outline" onClick={handleShareWhatsApp} className="gap-2">
                    <Share className="h-4 w-4" />
                    Share WhatsApp
                  </Button>
                  <Button variant="outline" onClick={() => onAction?.('copy')} className="gap-2">
                    <Copy className="h-4 w-4" />
                    Copy Link
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Proposal Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Proposal Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Draft Created</span>
                    <Badge variant="secondary">Complete</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Pricing Configured</span>
                    <Badge variant={totalCost > 0 ? "secondary" : "outline"}>
                      {totalCost > 0 ? "Complete" : "Pending"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Ready to Send</span>
                    <Badge variant={persistentData.emailData.to ? "secondary" : "outline"}>
                      {persistentData.emailData.to ? "Ready" : "Set Email"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Terms & Conditions</span>
                    <Badge variant={(persistentData.termsConditions.paymentTerms || persistentData.termsConditions.cancellationPolicy) ? "secondary" : "outline"}>
                      {(persistentData.termsConditions.paymentTerms || persistentData.termsConditions.cancellationPolicy) ? "Set" : "Not Set"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>
          </TabsContent>
      </Tabs>

      {/* Enhanced Preview Dialog */}
      <EnhancedPreviewDialog
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        query={query}
        days={realItineraryData}
        pricingBreakdown={pricingBreakdown}
        termsConditions={persistentData.termsConditions}
        onDownloadPDF={() => {
          toast({
            title: "PDF Generated",
            description: "Your proposal PDF is being generated",
          });
        }}
        onShare={() => {
          toast({
            title: "Share Link Generated",
            description: "Proposal share link has been created",
          });
        }}
        onSendEmail={handleSendEmail}
      />

      {/* PDF Template Selector */}
      <PDFTemplateSelector
        isOpen={isPDFTemplateSelectorOpen}
        onClose={() => setIsPDFTemplateSelectorOpen(false)}
        query={{
          id: queryId,
          destination: { country: '', cities: [] },
          paxDetails: { adults: 2, children: 0 }
        } as any}
        onTemplateSelect={handleTemplateSelect}
      />
    </div>
  );
};
