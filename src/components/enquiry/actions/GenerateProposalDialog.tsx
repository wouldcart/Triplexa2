import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Settings, 
  Wand2, 
  Check,
  Package,
  DollarSign,
  Calendar,
  MapPin
} from 'lucide-react';
import { Query } from '@/types/query';
import { toast } from 'sonner';

interface GenerateProposalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  query: Query;
  proposalData: any;
  onGenerate: (generatedData: any) => void;
}

interface GenerationOptions {
  includeItinerary: boolean;
  includePricing: boolean;
  includeTerms: boolean;
  includeAccommodations: boolean;
  templateStyle: 'professional' | 'casual' | 'detailed' | 'minimal';
  language: string;
  customInstructions: string;
}

const GenerateProposalDialog: React.FC<GenerateProposalDialogProps> = ({
  isOpen,
  onClose,
  query,
  proposalData,
  onGenerate
}) => {
  const [generating, setGenerating] = useState(false);
  const [generationOptions, setGenerationOptions] = useState<GenerationOptions>({
    includeItinerary: true,
    includePricing: true,
    includeTerms: true,
    includeAccommodations: true,
    templateStyle: 'professional',
    language: 'English',
    customInstructions: ''
  });

  const handleGenerate = async () => {
    setGenerating(true);
    
    try {
      // Simulate AI generation process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const generatedProposal = {
        id: `PROP_${Date.now()}`,
        queryId: query.id,
        generatedAt: new Date().toISOString(),
        options: generationOptions,
        content: {
          title: `${query.destination.country} Travel Proposal`,
          itinerary: generationOptions.includeItinerary ? generateItinerary() : null,
          pricing: generationOptions.includePricing ? generatePricingContent() : null,
          terms: generationOptions.includeTerms ? generateTermsContent() : null,
          accommodations: generationOptions.includeAccommodations ? generateAccommodationsContent() : null,
          customSections: []
        }
      };
      
      onGenerate(generatedProposal);
      
    } catch (error) {
      console.error('Error generating proposal:', error);
      toast.error('Failed to generate proposal');
    } finally {
      setGenerating(false);
    }
  };

  const generateItinerary = () => {
    const days = [];
    for (let i = 1; i <= query.tripDuration.days; i++) {
      days.push({
        day: i,
        title: `Day ${i} - ${query.destination.cities[0] || 'Destination'}`,
        activities: [
          'Morning: Sightseeing and local attractions',
          'Afternoon: Cultural experiences',
          'Evening: Leisure time and local cuisine'
        ],
        meals: ['Breakfast', 'Lunch', 'Dinner'],
        accommodation: '4-star hotel or equivalent'
      });
    }
    return { days, totalDays: query.tripDuration.days };
  };

  const generatePricingContent = () => {
    return {
      summary: 'Comprehensive pricing breakdown including all services',
      baseCost: proposalData.pricing?.baseCost || 0,
      finalPrice: proposalData.pricing?.finalPrice || 0,
      currency: proposalData.pricing?.currency || 'USD',
      breakdown: {
        accommodation: '40% of total cost',
        transportation: '25% of total cost',
        activities: '20% of total cost',
        meals: '15% of total cost'
      }
    };
  };

  const generateTermsContent = () => {
    return {
      payment: '30% advance payment required at booking',
      cancellation: 'Free cancellation up to 30 days before travel',
      validity: 'Quotation valid for 30 days',
      includes: 'Accommodation, meals as specified, transportation, guided tours',
      excludes: 'International flights, personal expenses, travel insurance'
    };
  };

  const generateAccommodationsContent = () => {
    return {
      standard: {
        category: '3-4 Star Hotels',
        description: 'Comfortable accommodation with modern amenities',
        features: ['Free WiFi', 'Breakfast included', 'Room service', 'Air conditioning']
      },
      premium: {
        category: '4-5 Star Hotels',
        description: 'Luxury accommodation with premium services',
        features: ['Spa services', 'Pool', 'Concierge', 'Premium dining']
      }
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Generate Proposal
          </DialogTitle>
          <DialogDescription>
            Configure options and generate a tailored travel proposal for the enquiry.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Query Summary */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-sm">Query Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  <span>{query.destination.cities.join(', ')}, {query.destination.country}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>{query.tripDuration.days} days / {query.tripDuration.nights} nights</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-3 w-3" />
                  <span>{query.paxDetails.adults} adults, {query.paxDetails.children} children</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-3 w-3" />
                  <span>Budget: ${query.budget.min.toLocaleString()} - ${query.budget.max.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generation Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Content Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Content Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Include Day-by-Day Itinerary</Label>
                    <input
                      type="checkbox"
                      checked={generationOptions.includeItinerary}
                      onChange={(e) => setGenerationOptions(prev => ({
                        ...prev,
                        includeItinerary: e.target.checked
                      }))}
                      className="rounded"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Include Detailed Pricing</Label>
                    <input
                      type="checkbox"
                      checked={generationOptions.includePricing}
                      onChange={(e) => setGenerationOptions(prev => ({
                        ...prev,
                        includePricing: e.target.checked
                      }))}
                      className="rounded"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Include Terms & Conditions</Label>
                    <input
                      type="checkbox"
                      checked={generationOptions.includeTerms}
                      onChange={(e) => setGenerationOptions(prev => ({
                        ...prev,
                        includeTerms: e.target.checked
                      }))}
                      className="rounded"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Include Accommodation Details</Label>
                    <input
                      type="checkbox"
                      checked={generationOptions.includeAccommodations}
                      onChange={(e) => setGenerationOptions(prev => ({
                        ...prev,
                        includeAccommodations: e.target.checked
                      }))}
                      className="rounded"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Style Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Style & Format</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">Template Style</Label>
                  <Select 
                    value={generationOptions.templateStyle}
                    onValueChange={(value: 'professional' | 'casual' | 'detailed' | 'minimal') => 
                      setGenerationOptions(prev => ({ ...prev, templateStyle: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual & Friendly</SelectItem>
                      <SelectItem value="detailed">Detailed & Comprehensive</SelectItem>
                      <SelectItem value="minimal">Minimal & Clean</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Language</Label>
                  <Select 
                    value={generationOptions.language}
                    onValueChange={(value) => 
                      setGenerationOptions(prev => ({ ...prev, language: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Spanish">Spanish</SelectItem>
                      <SelectItem value="French">French</SelectItem>
                      <SelectItem value="German">German</SelectItem>
                      <SelectItem value="Italian">Italian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Custom Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Custom Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label className="text-sm">Special Requirements or Notes</Label>
                <Textarea
                  placeholder="Add any specific requirements, special requests, or additional information to include in the proposal..."
                  value={generationOptions.customInstructions}
                  onChange={(e) => setGenerationOptions(prev => ({
                    ...prev,
                    customInstructions: e.target.value
                  }))}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          {Object.values(generationOptions).some(v => v === true) && (
            <Card className="bg-success/5 border-success/20">
              <CardHeader>
                <CardTitle className="text-sm text-success-foreground">Generation Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {generationOptions.includeItinerary && (
                    <div className="flex items-center gap-1">
                      <Check className="h-3 w-3 text-success" />
                      <span>Day-by-Day Itinerary</span>
                    </div>
                  )}
                  {generationOptions.includePricing && (
                    <div className="flex items-center gap-1">
                      <Check className="h-3 w-3 text-success" />
                      <span>Pricing Breakdown</span>
                    </div>
                  )}
                  {generationOptions.includeTerms && (
                    <div className="flex items-center gap-1">
                      <Check className="h-3 w-3 text-success" />
                      <span>Terms & Conditions</span>
                    </div>
                  )}
                  {generationOptions.includeAccommodations && (
                    <div className="flex items-center gap-1">
                      <Check className="h-3 w-3 text-success" />
                      <span>Accommodation Options</span>
                    </div>
                  )}
                </div>
                <Separator className="my-3" />
                <div className="text-xs text-muted-foreground">
                  Style: {generationOptions.templateStyle} • Language: {generationOptions.language}
                  {generationOptions.customInstructions && (
                    <span> • Custom instructions included</span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={generating}>
              Cancel
            </Button>
            <Button 
              onClick={handleGenerate} 
              disabled={generating || !Object.values(generationOptions).some(v => v === true)}
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate Proposal
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateProposalDialog;