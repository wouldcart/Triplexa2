
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, MapPin, DollarSign, Users, Calendar, 
  Edit3, Eye, Mail, Download, Share, MessageSquare,
  Check, X
} from 'lucide-react';

interface ProposalReviewSummaryProps {
  proposal: any;
  onEdit: (section: string) => void;
  onPreview: () => void;
  onSendEmail: () => void;
  onDownloadPDF: () => void;
  onShareLink: () => void;
  onShareWhatsApp: () => void;
  onConfirm: () => void;
  onDrop: () => void;
}

const ProposalReviewSummary: React.FC<ProposalReviewSummaryProps> = ({
  proposal,
  onEdit,
  onPreview,
  onSendEmail,
  onDownloadPDF,
  onShareLink,
  onShareWhatsApp,
  onConfirm,
  onDrop
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getCompletionStatus = () => {
    const sections = {
      itinerary: proposal.days?.length > 0,
      inclusions: proposal.inclusions?.length > 0,
      exclusions: proposal.exclusions?.length > 0,
      terms: proposal.termsConditions?.paymentTerms || proposal.termsConditions?.cancellationPolicy,
      pricing: proposal.finalTotal > 0
    };

    const completed = Object.values(sections).filter(Boolean).length;
    const total = Object.keys(sections).length;
    
    return { completed, total, sections };
  };

  const status = getCompletionStatus();
  const completionPercentage = (status.completed / status.total) * 100;

  return (
    <div className="space-y-6">
      {/* Completion Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Proposal Review Summary
            </span>
            <Badge variant={completionPercentage === 100 ? "default" : "secondary"}>
              {Math.round(completionPercentage)}% Complete
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {Object.entries(status.sections).map(([key, completed]) => (
              <div 
                key={key} 
                className={`p-3 rounded-lg border ${completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}
              >
                <div className="flex items-center gap-2">
                  {completed ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="text-sm font-medium capitalize">{key}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Proposal Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trip Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Trip Details</CardTitle>
              <Button size="sm" variant="outline" onClick={() => onEdit('itinerary')}>
                <Edit3 className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Destination:</span>
              <span>{proposal.query?.destination?.cities?.join(', ')}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-600" />
              <span className="font-medium">Duration:</span>
              <span>{proposal.days?.length || 0} days</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              <span className="font-medium">Travelers:</span>
              <span>
                {proposal.query?.paxDetails?.adults || 0} Adults, {proposal.query?.paxDetails?.children || 0} Children
              </span>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">Itinerary Highlights</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                {proposal.days?.slice(0, 3).map((day: any, index: number) => (
                  <div key={index}>• {day.title} - {day.city}</div>
                ))}
                {proposal.days?.length > 3 && (
                  <div>• ... and {proposal.days.length - 3} more days</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Pricing Summary</CardTitle>
              <Button size="sm" variant="outline" onClick={() => onEdit('pricing')}>
                <Edit3 className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium">{formatCurrency(proposal.subtotal || 0)}</span>
              </div>
              
              {proposal.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discounts:</span>
                  <span>-{formatCurrency(proposal.discountAmount)}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span>Markup:</span>
                <span>+{formatCurrency(proposal.markupAmount || 0)}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Taxes:</span>
                <span>+{formatCurrency(proposal.taxes?.total || 0)}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Final Total:</span>
                <span className="text-green-600">{formatCurrency(proposal.finalTotal || 0)}</span>
              </div>
              
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Per Person:</span>
                <span>{formatCurrency(proposal.perPersonPrice || 0)}</span>
              </div>
            </div>

            <Separator />

            <div className="text-center">
              <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-sm text-muted-foreground">
                Competitive pricing with full transparency
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inclusions & Exclusions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Inclusions</CardTitle>
              <Button size="sm" variant="outline" onClick={() => onEdit('inclusions')}>
                <Edit3 className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {proposal.inclusions?.length > 0 ? (
              <div className="space-y-2">
                {proposal.inclusions.slice(0, 4).map((inclusion: string, index: number) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{inclusion}</span>
                  </div>
                ))}
                {proposal.inclusions.length > 4 && (
                  <p className="text-sm text-muted-foreground">
                    ... and {proposal.inclusions.length - 4} more inclusions
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No inclusions added yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Exclusions</CardTitle>
              <Button size="sm" variant="outline" onClick={() => onEdit('exclusions')}>
                <Edit3 className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {proposal.exclusions?.length > 0 ? (
              <div className="space-y-2">
                {proposal.exclusions.slice(0, 4).map((exclusion: string, index: number) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <X className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>{exclusion}</span>
                  </div>
                ))}
                {proposal.exclusions.length > 4 && (
                  <p className="text-sm text-muted-foreground">
                    ... and {proposal.exclusions.length - 4} more exclusions
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No exclusions added yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Terms & Conditions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Terms & Conditions</CardTitle>
            <Button size="sm" variant="outline" onClick={() => onEdit('terms')}>
              <Edit3 className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Payment Terms</h4>
              <p className="text-muted-foreground">
                {proposal.termsConditions?.paymentTerms || 'Not specified'}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Cancellation Policy</h4>
              <p className="text-muted-foreground">
                {proposal.termsConditions?.cancellationPolicy || 'Not specified'}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Additional Terms</h4>
              <p className="text-muted-foreground">
                {proposal.termsConditions?.additionalTerms || 'Not specified'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preview & Share Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Preview & Share</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={onPreview} className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button onClick={onSendEmail} variant="outline" className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
              <Button onClick={onDownloadPDF} variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button onClick={onShareWhatsApp} variant="outline" className="w-full">
                <MessageSquare className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
              <Button onClick={onShareLink} variant="outline" className="w-full col-span-2">
                <Share className="h-4 w-4 mr-2" />
                Share Link
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Final Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Final Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                onClick={onConfirm} 
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={completionPercentage < 100}
              >
                <Check className="h-4 w-4 mr-2" />
                Confirm Proposal (Create Booking)
              </Button>
              <Button 
                onClick={onDrop} 
                variant="destructive" 
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Drop Proposal (Cancel Query)
              </Button>
              
              {completionPercentage < 100 && (
                <p className="text-sm text-muted-foreground text-center">
                  Complete all sections to confirm the proposal
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProposalReviewSummary;
