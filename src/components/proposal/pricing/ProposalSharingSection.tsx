import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Share2, Mail, Download, Copy, Eye, FileText, DollarSign, Users, Calendar, CheckCircle, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
interface ProposalSharingSectionProps {
  proposalData?: any;
  pricingBreakdown?: any;
  formatCurrency: (amount: number) => string;
  onProposalShare?: (shareData: any) => void;
}
interface AgentDisplayOptions {
  showBasePrice: boolean;
  showMarkupBreakdown: boolean;
  showPerPersonPricing: boolean;
  showAccommodationOptions: boolean;
  showServiceBreakdown: boolean;
  priceFormat: 'total' | 'per_person' | 'both';
  currency: string;
}
export const ProposalSharingSection: React.FC<ProposalSharingSectionProps> = ({
  proposalData,
  pricingBreakdown,
  formatCurrency,
  onProposalShare
}) => {
  const {
    toast
  } = useToast();
  const [shareConfig, setShareConfig] = useState<AgentDisplayOptions>({
    showBasePrice: false,
    showMarkupBreakdown: false,
    showPerPersonPricing: true,
    showAccommodationOptions: true,
    showServiceBreakdown: true,
    priceFormat: 'both',
    currency: 'USD'
  });
  const [emailConfig, setEmailConfig] = useState({
    recipientEmail: '',
    subject: '',
    message: '',
    includeAttachment: true
  });
  const handleCopyProposalLink = async () => {
    try {
      const proposalUrl = `${window.location.origin}/proposal/${proposalData?.id || 'preview'}`;
      await navigator.clipboard.writeText(proposalUrl);
      toast({
        title: "Link Copied",
        description: "Proposal link has been copied to clipboard."
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy proposal link.",
        variant: "destructive"
      });
    }
  };
  const handleEmailShare = () => {
    if (!emailConfig.recipientEmail) {
      toast({
        title: "Email Required",
        description: "Please enter a recipient email address.",
        variant: "destructive"
      });
      return;
    }
    const shareData = {
      type: 'email',
      recipient: emailConfig.recipientEmail,
      subject: emailConfig.subject || `Travel Proposal - ${proposalData?.destination?.country || 'Your Trip'}`,
      message: emailConfig.message,
      proposalData,
      pricingBreakdown,
      displayOptions: shareConfig,
      includeAttachment: emailConfig.includeAttachment
    };
    onProposalShare?.(shareData);
    toast({
      title: "Email Sent",
      description: `Proposal has been sent to ${emailConfig.recipientEmail}`
    });
  };
  const handleDownloadProposal = (format: 'pdf' | 'excel') => {
    const downloadData = {
      type: 'download',
      format,
      proposalData,
      pricingBreakdown,
      displayOptions: shareConfig
    };
    onProposalShare?.(downloadData);
    toast({
      title: "Download Started",
      description: `Proposal is being generated as ${format.toUpperCase()}`
    });
  };
  const generatePreview = () => {
    return {
      totalPrice: pricingBreakdown?.total?.finalPrice || 0,
      adultPrice: pricingBreakdown?.adults?.perPerson || 0,
      childPrice: pricingBreakdown?.children?.perPerson || 0,
      accommodationCount: proposalData?.accommodations?.length || 0,
      serviceCount: (proposalData?.days || []).reduce((count: number, day: any) => count + (day.activities?.length || 0) + (day.transport?.length || 0) + (day.meals?.length || 0), 0)
    };
  };
  const preview = generatePreview();
  return <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-green-600" />
          Share Proposal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Agent Display Options */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Agent Display Options
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="showBasePrice" className="text-sm">Show Base Price</Label>
                <Switch id="showBasePrice" checked={shareConfig.showBasePrice} onCheckedChange={checked => setShareConfig(prev => ({
                ...prev,
                showBasePrice: checked
              }))} />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="showMarkupBreakdown" className="text-sm">Show Markup Breakdown</Label>
                <Switch id="showMarkupBreakdown" checked={shareConfig.showMarkupBreakdown} onCheckedChange={checked => setShareConfig(prev => ({
                ...prev,
                showMarkupBreakdown: checked
              }))} />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="showPerPersonPricing" className="text-sm">Show Per Person Pricing</Label>
                <Switch id="showPerPersonPricing" checked={shareConfig.showPerPersonPricing} onCheckedChange={checked => setShareConfig(prev => ({
                ...prev,
                showPerPersonPricing: checked
              }))} />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="showAccommodationOptions" className="text-sm">Show Accommodation Options</Label>
                <Switch id="showAccommodationOptions" checked={shareConfig.showAccommodationOptions} onCheckedChange={checked => setShareConfig(prev => ({
                ...prev,
                showAccommodationOptions: checked
              }))} />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="showServiceBreakdown" className="text-sm">Show Service Breakdown</Label>
                <Switch id="showServiceBreakdown" checked={shareConfig.showServiceBreakdown} onCheckedChange={checked => setShareConfig(prev => ({
                ...prev,
                showServiceBreakdown: checked
              }))} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priceFormat" className="text-sm">Price Display Format</Label>
                <Select value={shareConfig.priceFormat} onValueChange={(value: 'total' | 'per_person' | 'both') => setShareConfig(prev => ({
                ...prev,
                priceFormat: value
              }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="total">Total Price Only</SelectItem>
                    <SelectItem value="per_person">Per Person Only</SelectItem>
                    <SelectItem value="both">Both Total & Per Person</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Preview Section */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Proposal Preview
          </h4>
          
          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Package Price:</span>
              <span className="font-bold text-green-600">
                {formatCurrency(preview.totalPrice)}
              </span>
            </div>
            
            {shareConfig.showPerPersonPricing && <>
                <div className="flex justify-between items-center text-sm">
                  <span>Adult (per person):</span>
                  <span>{formatCurrency(preview.adultPrice)}</span>
                </div>
                {preview.childPrice > 0 && <div className="flex justify-between items-center text-sm">
                    <span>Child (per person):</span>
                    <span>{formatCurrency(preview.childPrice)}</span>
                  </div>}
              </>}
            
            <div className="flex justify-between items-center text-sm">
              <span>Included Services:</span>
              <span>{preview.serviceCount} services</span>
            </div>
            
            {shareConfig.showAccommodationOptions && <div className="flex justify-between items-center text-sm">
                <span>Accommodation Options:</span>
                <span>{preview.accommodationCount} properties</span>
              </div>}
          </div>
        </div>

        <Separator />

        {/* Sharing Actions */}
        

        {/* Success Message */}
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">
              Proposal is ready to share with configured display options
            </span>
          </div>
        </div>
      </CardContent>
    </Card>;
};