import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign,
  Package,
  FileText,
  Mail,
  MessageSquare,
  Hotel
} from 'lucide-react';
import { Query } from '@/types/query';
import { formatCurrency } from '@/lib/formatters';

interface PreviewOptions {
  showBreakup: boolean;
  separateAdultChild: boolean;
  includeAccommodationOptions: boolean;
  selectedAccommodationOption: string;
  communicationMethod: 'email' | 'whatsapp';
  includeTerms: boolean;
}

interface AgentContactDetails {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  additionalNotes: string;
}

interface ProposalPreviewProps {
  query: Query;
  proposalData: any;
  previewOptions: PreviewOptions;
  agentDetails: AgentContactDetails;
}

const ProposalPreview: React.FC<ProposalPreviewProps> = ({
  query,
  proposalData,
  previewOptions,
  agentDetails
}) => {
  const formatForCommunication = () => {
    if (previewOptions.communicationMethod === 'whatsapp') {
      return 'WhatsApp format (plain text)';
    }
    return 'Email format (formatted)';
  };

  const renderPricingSection = () => {
    if (!proposalData.pricing) return null;

    const { pricing } = proposalData;

    if (previewOptions.showBreakup) {
      if (previewOptions.separateAdultChild) {
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <div className="text-sm font-medium">Adult Pricing</div>
                <div className="text-lg font-bold text-primary">
                  {formatCurrency(pricing.adultPrice / query.paxDetails.adults, pricing.currency)} per person
                </div>
                <div className="text-xs text-muted-foreground">
                  {query.paxDetails.adults} adults × {formatCurrency(pricing.adultPrice / query.paxDetails.adults, pricing.currency)} = {formatCurrency(pricing.adultPrice, pricing.currency)}
                </div>
              </div>
              
              {query.paxDetails.children > 0 && (
                <div className="p-3 bg-secondary/20 rounded-lg">
                  <div className="text-sm font-medium">Child Pricing</div>
                  <div className="text-lg font-bold text-secondary-foreground">
                    {formatCurrency(pricing.childPrice / query.paxDetails.children, pricing.currency)} per person
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {query.paxDetails.children} children × {formatCurrency(pricing.childPrice / query.paxDetails.children, pricing.currency)} = {formatCurrency(pricing.childPrice, pricing.currency)}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-accent rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Package Cost</span>
                <span className="text-xl font-bold text-accent-foreground">
                  {formatCurrency(pricing.finalPrice, pricing.currency)}
                </span>
              </div>
            </div>
          </div>
        );
      } else {
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span>Base Cost:</span>
                <span>{formatCurrency(pricing.baseCost, pricing.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>Service Charge:</span>
                <span>{formatCurrency(pricing.totalMarkup, pricing.currency)}</span>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between items-center font-semibold text-lg">
              <span>Total Cost:</span>
              <span className="text-primary">{formatCurrency(pricing.finalPrice, pricing.currency)}</span>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              Per person: {formatCurrency(pricing.perPersonPrice, pricing.currency)}
            </div>
          </div>
        );
      }
    } else {
      return (
        <div className="text-center p-6 bg-primary/10 rounded-lg">
          <div className="text-2xl font-bold text-primary">
            {formatCurrency(pricing.finalPrice, pricing.currency)}
          </div>
          <div className="text-sm text-muted-foreground">
            Total package cost for {query.paxDetails.adults + query.paxDetails.children} travelers
          </div>
          <div className="text-sm font-medium mt-1">
            Per person: {formatCurrency(pricing.perPersonPrice, pricing.currency)}
          </div>
        </div>
      );
    }
  };

  const renderAccommodationOptions = () => {
    if (!previewOptions.includeAccommodationOptions) return null;
    
    // Get real accommodation options from proposal data
    const accommodationOptions = proposalData.accommodationOptions || [
      { id: 1, type: 'Standard', name: '3-Star Hotels', cost: 1200, accommodations: [] },
      { id: 2, type: 'Premium', name: '4-Star Hotels', cost: 1800, accommodations: [] },
      { id: 3, type: 'Luxury', name: '5-Star Hotels', cost: 2500, accommodations: [] }
    ];

    const selectedOptions = previewOptions.selectedAccommodationOption === 'all' 
      ? accommodationOptions.filter(opt => opt.accommodations?.length > 0 || opt.cost > 0)
      : accommodationOptions.filter(opt => 
          opt.type.toLowerCase() === previewOptions.selectedAccommodationOption &&
          (opt.accommodations?.length > 0 || opt.cost > 0)
        );

    if (selectedOptions.length === 0) {
      return (
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Hotel className="h-4 w-4" />
            Accommodation Options
          </h4>
          <div className="p-4 border border-muted rounded-lg bg-muted/20 text-center">
            <p className="text-muted-foreground text-sm">
              No accommodation options configured. Add multiple accommodation options in the itinerary to display them here.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <h4 className="font-semibold flex items-center gap-2">
          <Hotel className="h-4 w-4" />
          Accommodation Options ({selectedOptions.length} available)
        </h4>
        <div className="grid grid-cols-1 gap-3">
          {selectedOptions.map((option) => (
            <Card key={option.id} className="p-4 border-l-4 border-l-primary/60">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="font-medium">{option.type} Package</div>
                  <div className="text-sm text-muted-foreground">{option.name}</div>
                  {option.accommodations && option.accommodations.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {option.accommodations.length} accommodations included
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary">
                    {formatCurrency(option.finalTotal || option.cost, proposalData.pricing?.currency || 'USD')}
                  </div>
                  <div className="text-xs text-muted-foreground">total package</div>
                  {(query.paxDetails.adults + query.paxDetails.children) > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatCurrency((option.finalTotal || option.cost) / (query.paxDetails.adults + query.paxDetails.children), proposalData.pricing?.currency || 'USD')} per person
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderTermsSection = () => {
    if (!previewOptions.includeTerms || !proposalData.terms) return null;

    const { terms } = proposalData;

    return (
      <div className="space-y-4">
        <h4 className="font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Terms & Conditions
        </h4>
        
        {terms.paymentTerms && (
          <div>
            <h5 className="font-medium text-sm mb-2">Payment Terms</h5>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">
              {terms.paymentTerms}
            </div>
          </div>
        )}
        
        {terms.cancellationPolicy && (
          <div>
            <h5 className="font-medium text-sm mb-2">Cancellation Policy</h5>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">
              {terms.cancellationPolicy}
            </div>
          </div>
        )}
        
        {terms.inclusions && (
          <div>
            <h5 className="font-medium text-sm mb-2">Inclusions</h5>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">
              {terms.inclusions}
            </div>
          </div>
        )}
        
        {terms.exclusions && (
          <div>
            <h5 className="font-medium text-sm mb-2">Exclusions</h5>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">
              {terms.exclusions}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Preview Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Proposal Preview</h3>
          <p className="text-sm text-muted-foreground">
            {formatForCommunication()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {previewOptions.communicationMethod === 'email' ? (
            <Badge variant="outline" className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              Email
            </Badge>
          ) : (
            <Badge variant="outline" className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              WhatsApp
            </Badge>
          )}
        </div>
      </div>

      {/* Main Proposal Content */}
      <Card>
        <CardHeader>
          <CardTitle>Travel Proposal - {query.id}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">Destination</div>
                <div className="text-sm text-muted-foreground">
                  {query.destination.cities.join(', ')}, {query.destination.country}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">Duration</div>
                <div className="text-sm text-muted-foreground">
                  {query.tripDuration.days} days / {query.tripDuration.nights} nights
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">Travelers</div>
                <div className="text-sm text-muted-foreground">
                  {query.paxDetails.adults} adults, {query.paxDetails.children} children
                </div>
              </div>
            </div>
            
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">Travel Dates</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(query.travelDates.from).toLocaleDateString()} - {new Date(query.travelDates.to).toLocaleDateString()}
                  </div>
                </div>
              </div>
          </div>

          <Separator />

          {/* Pricing Section */}
          <div>
            <h4 className="font-semibold flex items-center gap-2 mb-4">
              <DollarSign className="h-4 w-4" />
              Pricing Information
            </h4>
            {renderPricingSection()}
          </div>

          {/* Accommodation Options */}
          {previewOptions.includeAccommodationOptions && (
            <>
              <Separator />
              {renderAccommodationOptions()}
            </>
          )}

          {/* Terms & Conditions */}
          {previewOptions.includeTerms && (
            <>
              <Separator />
              {renderTermsSection()}
            </>
          )}

          {/* Agent Contact Information */}
          <Separator />
          <div>
            <h4 className="font-semibold mb-3">Contact Information</h4>
            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div><strong>Agent:</strong> {agentDetails.name}</div>
                {agentDetails.company && (
                  <div><strong>Company:</strong> {agentDetails.company}</div>
                )}
                {agentDetails.email && (
                  <div><strong>Email:</strong> {agentDetails.email}</div>
                )}
                {agentDetails.phone && (
                  <div><strong>Phone:</strong> {agentDetails.phone}</div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground pt-4 border-t">
            This proposal was generated on {new Date().toLocaleString()}
            <br />
            Proposal ID: {query.id}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProposalPreview;